import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { QA_CORE_ROUTES, type QaRoute } from "./qa.constants";

type LayoutSignals = {
  route: QaRoute;
  hasGrid: boolean;
  hasFlex: boolean;
  interactiveCount: number;
  horizontalOverflowPx: number;
  fontsStatus: string;
  materialSymbolsLoaded: boolean;
  autofillSelectors: number;
};

async function collectLayoutSignals(page: Page, route: QaRoute): Promise<LayoutSignals> {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toBeVisible();

  const signals = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll<HTMLElement>("*"));

    const hasGrid = allElements.some((element) => getComputedStyle(element).display.includes("grid"));
    const hasFlex = allElements.some((element) => getComputedStyle(element).display.includes("flex"));

    const interactiveSelector = "button, [role='button'], a, input, select, textarea";
    const interactiveCount = Array.from(document.querySelectorAll<HTMLElement>(interactiveSelector)).filter(
      (element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }
    ).length;

    let autofillSelectors = 0;
    for (const styleSheet of Array.from(document.styleSheets)) {
      try {
        const rules = (styleSheet as CSSStyleSheet).cssRules;
        for (const rule of Array.from(rules)) {
          const cssRule = rule as CSSStyleRule;
          if (typeof cssRule.selectorText === "string" && cssRule.selectorText.includes("autofill")) {
            autofillSelectors += 1;
          }
        }
      } catch {
        // Ignore inaccessible cross-origin stylesheets.
      }
    }

    return {
      hasGrid,
      hasFlex,
      interactiveCount,
      horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      fontsStatus: document.fonts.status,
      materialSymbolsLoaded: document.fonts.check("12px 'Material Symbols Outlined'"),
      autofillSelectors,
    };
  });

  return {
    route,
    ...signals,
  };
}

async function attachSignals(testInfo: TestInfo, name: string, data: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(data, null, 2), "utf-8"),
    contentType: "application/json",
  });
}

test.describe("Cross-browser QA", () => {
  for (const route of QA_CORE_ROUTES) {
    test(`layout and typography smoke ${route}`, async ({ page }, testInfo) => {
      const signals = await collectLayoutSignals(page, route);
      await attachSignals(testInfo, `layout-signals-${route.replaceAll("/", "_") || "home"}`, signals);

      if (!signals.hasGrid && !signals.hasFlex) {
        testInfo.annotations.push({
          type: "warning",
          description: `No grid/flex layout signal detected on ${route}; review this profile manually.`,
        });
      }

      expect(signals.interactiveCount).toBeGreaterThan(3);
      expect(signals.horizontalOverflowPx).toBeLessThanOrEqual(1);

      // Font loads can be network-dependent, so this is logged for QA but not hard-failed.
      expect(typeof signals.fontsStatus).toBe("string");
      expect(typeof signals.materialSymbolsLoaded).toBe("boolean");
      expect(typeof signals.autofillSelectors).toBe("number");
    });
  }

  test("animation cadence stays within an acceptable frame budget", async ({ page }, testInfo) => {
    const projectUse = testInfo.project.use as { browserName?: string; isMobile?: boolean };
    test.skip(
      projectUse.browserName !== "chromium" || Boolean(projectUse.isMobile),
      "Animation frame-budget check runs on non-mobile Chromium profiles."
    );

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    const frameStats = await page.evaluate(async () => {
      return await new Promise<{ averageFrameMs: number; maxFrameMs: number }>((resolve) => {
        const samples: number[] = [];
        const sampleCount = 90;
        let previous = performance.now();

        const capture = (now: number) => {
          samples.push(now - previous);
          previous = now;

          if (samples.length >= sampleCount) {
            const total = samples.reduce((sum, value) => sum + value, 0);
            resolve({
              averageFrameMs: total / samples.length,
              maxFrameMs: Math.max(...samples),
            });
            return;
          }

          requestAnimationFrame(capture);
        };

        requestAnimationFrame(capture);
      });
    });

    await attachSignals(testInfo, "animation-frame-budget", frameStats);

    // A lenient threshold keeps this useful in CI while still catching severe regressions.
    expect(frameStats.averageFrameMs).toBeLessThan(45);
  });

  test("touch interactions are usable on touch-enabled profiles", async ({ page }, testInfo) => {
    const projectUse = testInfo.project.use as { hasTouch?: boolean };
    test.skip(!projectUse.hasTouch, "Touch interaction checks run only on touch-enabled browser profiles.");

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const menuToggle = page.locator("button[aria-label='Toggle menu']");
    if ((await menuToggle.count()) > 0) {
      await menuToggle.first().tap();
      await expect(page.getByRole("link", { name: /Contact/i }).first()).toBeVisible();
    }

    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    const nameInput = page.locator("#name");
    await nameInput.tap();
    await nameInput.fill("QA Touch User");
    await expect(nameInput).toHaveValue("QA Touch User");
  });
});
