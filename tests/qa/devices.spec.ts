import { expect, test, type TestInfo } from "@playwright/test";
import { QA_CORE_ROUTES, type QaRoute } from "./qa.constants";

type DeviceSnapshot = {
  route: QaRoute;
  viewport: { width: number; height: number };
  horizontalOverflowPx: number;
  imageOverflowCount: number;
  baseFontSizePx: number;
  navControlVisible: boolean;
};

type TouchTargetSummary = {
  totalTargets: number;
  tooSmallTargets: number;
  tooSmallRatio: number;
};

async function attachJson(testInfo: TestInfo, name: string, payload: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
    contentType: "application/json",
  });
}

test.describe("Device QA", () => {
  for (const route of QA_CORE_ROUTES) {
    test(`layout integrity at ${route}`, async ({ page }, testInfo) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible();

      const snapshot = await page.evaluate(() => {
        const imageOverflowCount = Array.from(document.images).filter((image) => {
          const rect = image.getBoundingClientRect();
          return rect.width > window.innerWidth + 1;
        }).length;

        const navControlVisible = Boolean(
          document.querySelector("header nav a") || document.querySelector("button[aria-label='Toggle menu']")
        );

        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
          imageOverflowCount,
          baseFontSizePx: Number.parseFloat(getComputedStyle(document.body).fontSize),
          navControlVisible,
        };
      });

      const payload: DeviceSnapshot = {
        route,
        ...snapshot,
      };

      await attachJson(testInfo, `device-layout-${route.replaceAll("/", "_") || "home"}`, payload);

      expect(payload.horizontalOverflowPx).toBeLessThanOrEqual(1);
      expect(payload.imageOverflowCount).toBeLessThanOrEqual(1);
      expect(payload.baseFontSizePx).toBeGreaterThanOrEqual(14);
      expect(payload.navControlVisible).toBeTruthy();
    });
  }

  test("touch target sizing summary", async ({ page }, testInfo) => {
    const projectUse = testInfo.project.use as { hasTouch?: boolean };
    test.skip(!projectUse.hasTouch, "Touch target checks run only on touch-enabled projects.");

    await page.goto("/contact", { waitUntil: "domcontentloaded" });

    const summary = await page.evaluate(() => {
      const minTouchSize = 44;
      const selector = "button, [role='button'], a, input, select, textarea";
      const targets = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") {
          return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      const tooSmallTargets = targets.filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < minTouchSize || rect.height < minTouchSize;
      }).length;

      const totalTargets = targets.length;
      const tooSmallRatio = totalTargets > 0 ? tooSmallTargets / totalTargets : 0;

      return { totalTargets, tooSmallTargets, tooSmallRatio };
    });

    const payload: TouchTargetSummary = summary;
    await attachJson(testInfo, "touch-target-summary", payload);

    if (payload.totalTargets === 0) {
      testInfo.annotations.push({
        type: "warning",
        description: "No visible interactive targets detected; review this profile manually.",
      });
      return;
    }

    expect(payload.tooSmallRatio).toBeLessThan(0.4);
  });

  test("navigation usability at active viewport", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const menuToggle = page.locator(
      "button[aria-label='Toggle menu'], button[aria-label*='menu' i], button[title*='menu' i]"
    );

    if ((await menuToggle.count()) > 0 && (await menuToggle.first().isVisible())) {
      await menuToggle.first().click();
      await expect(page.getByRole("link", { name: /Contact/i }).first()).toBeVisible();
      return;
    }

    const visibleNavLinks = page.locator("header nav a:visible");
    const visibleNavCount = await visibleNavLinks.count();

    if (visibleNavCount > 0) {
      expect(visibleNavCount).toBeGreaterThanOrEqual(1);
      return;
    }

    const visibleHeaderControls = await page.locator("header a:visible, header button:visible").count();
    expect(visibleHeaderControls).toBeGreaterThan(0);
  });
});
