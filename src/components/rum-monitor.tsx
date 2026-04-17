"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type RumMonitorProps = {
  enabled?: boolean;
  endpoint?: string;
};

type RumMetricPayload = {
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
  id?: string;
  path: string;
  source: "web-vitals";
  timestamp: string;
  userAgent?: string;
};

function getCurrentPath(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}`;
}

function sendMetric(endpoint: string, payload: RumMetricPayload): void {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon(endpoint, blob);
    if (sent) {
      return;
    }
  }

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  });
}

function ratingForMetric(name: string, value: number): "good" | "needs-improvement" | "poor" {
  if (name === "LCP") {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }

  if (name === "CLS") {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }

  if (name === "FCP") {
    if (value <= 1800) return "good";
    if (value <= 3000) return "needs-improvement";
    return "poor";
  }

  if (name === "TTFB") {
    if (value <= 800) return "good";
    if (value <= 1800) return "needs-improvement";
    return "poor";
  }

  return "good";
}

export default function RumMonitor({ enabled = true, endpoint = "/api/rum" }: RumMonitorProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routePath = useMemo(() => {
    if (!pathname) {
      return getCurrentPath();
    }

    const query = searchParams?.toString() || "";
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
      return;
    }

    const userAgent = navigator.userAgent.slice(0, 220);
    const path = routePath || getCurrentPath();
    const reportedMetricNames = new Set<string>();

    const report = (name: string, value: number): void => {
      if (!Number.isFinite(value) || value < 0 || reportedMetricNames.has(name)) {
        return;
      }

      reportedMetricNames.add(name);

      sendMetric(endpoint, {
        name,
        value,
        rating: ratingForMetric(name, value),
        path,
        source: "web-vitals",
        timestamp: new Date().toISOString(),
        userAgent,
      });
    };

    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigationEntry?.responseStart) {
      report("TTFB", navigationEntry.responseStart);
    }

    const fcpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          report("FCP", entry.startTime);
          fcpObserver.disconnect();
          break;
        }
      }
    });

    let latestLcpValue = 0;
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        latestLcpValue = Math.max(latestLcpValue, lastEntry.startTime);
      }
    });

    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value || 0;
        }
      }
    });

    const flushFinalMetrics = () => {
      if (latestLcpValue > 0) {
        report("LCP", latestLcpValue);
      }

      report("CLS", clsValue);
    };

    try {
      fcpObserver.observe({ type: "paint", buffered: true });
    } catch {
      // Paint metrics unavailable in this runtime.
    }

    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP not available.
    }

    try {
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch {
      // CLS not available.
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushFinalMetrics();
        lcpObserver.disconnect();
        clsObserver.disconnect();
      }
    };

    const handlePageHide = () => {
      flushFinalMetrics();
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      flushFinalMetrics();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
  }, [enabled, endpoint, routePath]);

  return null;
}
