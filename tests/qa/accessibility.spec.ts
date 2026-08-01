import AxeBuilder from "@axe-core/playwright";
import { expect, test, type TestInfo } from "@playwright/test";
import { QA_CORE_ROUTES, type QaRoute } from "./qa.constants";

type ViolationSummary = {
  id: string;
  impact: string | null;
  help: string;
  nodeCount: number;
};

async function attachJson(testInfo: TestInfo, name: string, payload: unknown): Promise<void> {
  await testInfo.attach(name, {
    body: Buffer.from(JSON.stringify(payload, null, 2), "utf-8"),
    contentType: "application/json",
  });
}

for (const route of QA_CORE_ROUTES) {
  test(`axe critical scan ${route}`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    const axeResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    const summary: ViolationSummary[] = axeResults.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? null,
      help: violation.help,
      nodeCount: violation.nodes.length,
    }));

    const criticalViolations = summary.filter((violation) => violation.impact === "critical");
    const ariaCriticalViolations = summary.filter(
      (violation) => violation.id.startsWith("aria-") && violation.impact === "critical"
    );
    const contrastViolations = summary.filter((violation) => violation.id === "color-contrast");

    await attachJson(testInfo, `axe-${route.replaceAll("/", "_") || "home"}`, {
      route,
      totalViolations: summary.length,
      criticalViolations,
      ariaCriticalViolations,
      contrastViolations,
      summary,
    });

    expect(criticalViolations).toEqual([]);
    expect(ariaCriticalViolations).toEqual([]);
  });
}

test("keyboard flow advances focus and keeps visible focus indicators", async ({ page }, testInfo) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toBeVisible();

  const focusTrail: string[] = [];

  for (let i = 0; i < 8; i += 1) {
    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) {
        return "none";
      }

      const identifier = active.id || active.getAttribute("name") || active.textContent?.trim() || active.tagName;
      return `${active.tagName.toLowerCase()}:${identifier.slice(0, 40)}`;
    });

    focusTrail.push(focused);
  }

  const focusIndicatorVisible = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) {
      return false;
    }

    const style = getComputedStyle(active);
    const hasOutline = style.outlineStyle !== "none" && style.outlineWidth !== "0px";
    const hasShadow = style.boxShadow !== "none";

    return hasOutline || hasShadow;
  });

  await attachJson(testInfo, "keyboard-focus-trail", {
    focusTrail,
    uniqueFocusTargets: Array.from(new Set(focusTrail)).length,
    focusIndicatorVisible,
  });

  expect(Array.from(new Set(focusTrail)).length).toBeGreaterThan(3);
  expect(focusIndicatorVisible).toBeTruthy();
});
