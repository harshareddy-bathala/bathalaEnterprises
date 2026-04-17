import { expect, test, type TestInfo } from "@playwright/test";
import { QA_CORE_ROUTES, type QaRoute } from "./qa.constants";

type PerformanceSnapshot = {
  route: QaRoute;
  ttfbMs: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  ttiMs: number | null;
  tbtMs: number | null;
  cls: number;
};

async function attachJson(testInfo: TestInfo, name: string, payload: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
    contentType: "application/json",
  });
}

test.describe("Performance smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      type VitalsStore = {
        lcp: number;
        cls: number;
        tbt: number;
      };

      const store: VitalsStore = {
        lcp: 0,
        cls: 0,
        tbt: 0,
      };

      (window as Window & { __qaVitals?: VitalsStore }).__qaVitals = store;

      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.startTime > store.lcp) {
              store.lcp = entry.startTime;
            }
          }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // LCP may be unavailable in some engines.
      }

      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
            if (!shift.hadRecentInput) {
              store.cls += shift.value ?? 0;
            }
          }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });
      } catch {
        // CLS may be unavailable in some engines.
      }

      try {
        const longTaskObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (entry.duration > 50) {
              store.tbt += entry.duration - 50;
            }
          }
        });
        longTaskObserver.observe({ type: "longtask", buffered: true });
      } catch {
        // Long tasks are Chromium-specific.
      }
    });
  });

  for (const route of QA_CORE_ROUTES) {
    test(`collects Core Web Vitals signals for ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();
      await page.waitForTimeout(1_500);

      const snapshot = await page.evaluate(() => {
        const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const paintEntries = performance.getEntriesByType("paint");
        const firstContentfulPaint =
          paintEntries.find((entry) => entry.name === "first-contentful-paint")?.startTime ?? null;

        const vitals =
          (window as Window & { __qaVitals?: { lcp: number; cls: number; tbt: number } }).__qaVitals ??
          { lcp: 0, cls: 0, tbt: 0 };

        return {
          ttfbMs: navEntry ? navEntry.responseStart : null,
          fcpMs: firstContentfulPaint,
          lcpMs: vitals.lcp > 0 ? vitals.lcp : null,
          ttiMs: navEntry ? navEntry.domInteractive : null,
          tbtMs: vitals.tbt > 0 ? vitals.tbt : 0,
          cls: vitals.cls,
        };
      });

      const payload: PerformanceSnapshot = {
        route,
        ...snapshot,
      };

      await attachJson(testInfo, `performance-${route.replaceAll("/", "_") || "home"}`, payload);

      if (payload.ttfbMs !== null) {
        expect(payload.ttfbMs).toBeLessThan(3_000);
      }

      if (payload.fcpMs !== null) {
        expect(payload.fcpMs).toBeLessThan(6_000);
      }

      if (payload.lcpMs !== null) {
        expect(payload.lcpMs).toBeLessThan(8_000);
      }

      if (payload.ttiMs !== null) {
        expect(payload.ttiMs).toBeLessThan(10_000);
      }

      if (payload.tbtMs !== null) {
        expect(payload.tbtMs).toBeLessThan(1_200);
      }

      expect(payload.cls).toBeLessThan(0.3);
    });
  }
});
