"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsTrackingProps = {
  measurementId?: string;
};

export default function AnalyticsTracking({ measurementId }: AnalyticsTrackingProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId) {
      return;
    }

    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    if (!window.gtag) {
      window.gtag = (...args: unknown[]) => {
        window.dataLayer.push(args);
      };

      window.gtag("js", new Date());
      window.gtag("config", measurementId, { send_page_view: false });
    }

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    window.gtag("config", measurementId, { page_path: pagePath });
  }, [measurementId, pathname, searchParams]);

  if (!measurementId) {
    return null;
  }

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  );
}
