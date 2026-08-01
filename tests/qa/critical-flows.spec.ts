import { expect, test } from "@playwright/test";

test.describe("Critical user flows", () => {
  test("home and property discovery flow", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    await page.goto("/properties", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    const propertyLinks = page.locator("a[href^='/properties/']");
    const propertyCount = await propertyLinks.count();

    if (propertyCount > 0) {
      await propertyLinks.first().click();
      await expect(page).toHaveURL(/\/properties\//);
      await expect(page.locator("main")).toBeVisible();
    } else {
      await expect(page.getByText(/No properties found|No properties/i)).toBeVisible();
    }
  });

  test("service listing flow", async ({ page }) => {
    await page.goto("/services", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    const serviceLinks = page.locator("a[href^='/services/']");
    const serviceCount = await serviceLinks.count();

    if (serviceCount === 0) {
      await expect(page.getByText(/No services available/i)).toBeVisible();
    } else {
      await serviceLinks.first().click();
      await expect(page.locator("main")).toBeVisible();

      const requestServiceCta = page.getByRole("link", { name: /Request This Service/i });
      await expect(requestServiceCta).toBeVisible();
      await requestServiceCta.click();

      await expect(page).toHaveURL(/\/contact\?.*query_type=services/);
      await expect(page.locator("#query_type")).toHaveValue("services");
    }
  });

  test("contact enquiry submission flow", async ({ page }) => {
    let contactRequestIntercepted = false;

    await page.route("**/api/contact", async (route) => {
      contactRequestIntercepted = true;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            message: "Inquiry submitted successfully.",
            messageId: "critical-mocked-id",
          },
          meta: {
            requestId: "critical_mock",
            timestamp: new Date().toISOString(),
          },
        }),
      });
    });

    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();

    await page.fill("#name", "QA User");
    await page.fill("#phone", "9876543210");
    await page.fill("#email", "qa@example.com");
    await page.selectOption("#query_type", "properties");
    await page.selectOption("#service_type", "Rent");
    await page.fill("#message", "Looking for a 2BHK rental in Electronic City with immediate move-in.");

    await page.getByRole("button", { name: /Send Enquiry/i }).click();

    await expect.poll(() => contactRequestIntercepted, { timeout: 15_000 }).toBe(true);
    await expect(page.locator("#name")).toHaveValue("", { timeout: 15_000 });
  });

  test("health endpoint flow", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());

    const payload = await response.json();
    expect(payload.success).toBeTruthy();
    expect(payload.data).toHaveProperty("status");
    expect(payload.data).toHaveProperty("checks");
  });
});
