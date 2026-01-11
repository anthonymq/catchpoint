import { test, expect } from "@playwright/test";

test.describe("Stats Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock geolocation to a specific location
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  });

  test("should show empty state when no catches", async ({ page }) => {
    await page.goto("/stats");

    // Should show empty state message
    await expect(page.getByText("No statistics yet")).toBeVisible();
    await expect(page.getByText("Log your first catch")).toBeVisible();
  });

  test("should display charts when catches exist", async ({ page }) => {
    // First create some catches
    await page.goto("/");

    // Click Quick Capture button 3 times to create multiple catches
    const captureBtn = page.getByLabel("Quick Catch");
    await expect(captureBtn).toBeVisible();

    await captureBtn.click();
    await expect(page.getByText("CAUGHT!")).toBeVisible();
    await page.waitForTimeout(500);

    await captureBtn.click();
    await expect(page.getByText("CAUGHT!")).toBeVisible();
    await page.waitForTimeout(500);

    await captureBtn.click();
    await expect(page.getByText("CAUGHT!")).toBeVisible();
    await page.waitForTimeout(500);

    // Navigate to Stats
    await page.getByRole("link", { name: "Stats" }).click();

    // Should NOT show empty state
    await expect(page.getByText("No statistics yet")).not.toBeVisible();

    // Should show statistics header
    await expect(
      page.getByRole("heading", { name: "Statistics" }),
    ).toBeVisible();

    // Should show total catches card
    await expect(page.getByText("Total Catches")).toBeVisible();

    // Should show chart sections
    await expect(page.getByText("Catches by Time")).toBeVisible();
    await expect(page.getByText("Species Distribution")).toBeVisible();
    await expect(page.getByText("Monthly Activity")).toBeVisible();

    // Verify chart containers exist and have proper dimensions
    const chartContainers = page.locator(".chart-container");
    const count = await chartContainers.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Check that Recharts SVG elements are rendered
    // AreaChart renders an svg
    const areaSvg = page.locator(".chart-container svg").first();
    await expect(areaSvg).toBeVisible();

    // Verify chart container has proper height
    const firstChartContainer = chartContainers.first();
    const box = await firstChartContainer.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(200);
    }
  });

  test("should display weather conditions when catches exist", async ({
    page,
  }) => {
    // Create catches to test weather conditions display
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");
    await expect(captureBtn).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await captureBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate to Stats
    await page.getByRole("link", { name: "Stats" }).click();

    // Should show weather conditions section
    await expect(page.getByText("Weather Conditions")).toBeVisible();
  });
});
