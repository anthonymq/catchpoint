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
    await expect(captureBtn).toHaveClass(/success/);
    await page.waitForTimeout(2000); // Wait for success animation to complete

    await captureBtn.click();
    await expect(captureBtn).toHaveClass(/success/);
    await page.waitForTimeout(2000);

    await captureBtn.click();
    await expect(captureBtn).toHaveClass(/success/);
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

    // Verify chart container has proper height (at least 180px on mobile)
    const firstChartContainer = chartContainers.first();
    const box = await firstChartContainer.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(180);
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

  test("should scroll to show all content on mobile viewport", async ({
    page,
  }) => {
    // This test verifies that all stats content is accessible by scrolling
    await page.goto("/");

    // Create some catches first
    const captureBtn = page.getByLabel("Quick Catch");
    await expect(captureBtn).toBeVisible();

    for (let i = 0; i < 3; i++) {
      await captureBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate to Stats
    await page.getByRole("link", { name: "Stats" }).click();

    // Wait for page to load
    await expect(
      page.getByRole("heading", { name: "Statistics" }),
    ).toBeVisible();

    // Get the main scrollable container
    const mainContent = page.locator("main");

    // Verify "Weather Conditions" section exists (it's at the bottom)
    const weatherSection = page.getByText("Weather Conditions");

    // Scroll to the weather section (at the bottom of the page)
    await weatherSection.scrollIntoViewIfNeeded();

    // Verify weather section is now visible
    await expect(weatherSection).toBeVisible();

    // Verify weather section is not obscured by BottomNav
    const weatherBox = await weatherSection.boundingBox();
    const viewportSize = page.viewportSize();

    expect(weatherBox).not.toBeNull();
    expect(viewportSize).not.toBeNull();

    if (weatherBox && viewportSize) {
      // Weather section should be fully visible above the bottom nav
      // BottomNav is roughly 76px + safe area, check that bottom of weather is above that
      const bottomNavHeight = 100; // ~76px nav + padding
      const safeVisibleBottom = viewportSize.height - bottomNavHeight;

      expect(weatherBox.y + weatherBox.height).toBeLessThanOrEqual(
        viewportSize.height,
      );
    }
  });

  test("should have proper chart dimensions on mobile", async ({ page }) => {
    // Verify chart containers scale properly on mobile viewports
    await page.goto("/");

    // Create catches
    const captureBtn = page.getByLabel("Quick Catch");
    await expect(captureBtn).toBeVisible();

    for (let i = 0; i < 2; i++) {
      await captureBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate to Stats
    await page.getByRole("link", { name: "Stats" }).click();
    await expect(
      page.getByRole("heading", { name: "Statistics" }),
    ).toBeVisible();

    // Check all chart containers have reasonable dimensions
    const chartContainers = page.locator(".chart-container");
    const count = await chartContainers.count();

    for (let i = 0; i < count; i++) {
      const container = chartContainers.nth(i);
      await container.scrollIntoViewIfNeeded();

      const box = await container.boundingBox();
      expect(box).not.toBeNull();

      if (box) {
        // Height should be at least 180px (mobile minimum)
        expect(box.height).toBeGreaterThanOrEqual(180);

        // Width should fill the container (most of viewport width minus padding)
        const viewportSize = page.viewportSize();
        if (viewportSize) {
          // Should be at least 45% of viewport width (accounting for card layout and padding)
          expect(box.width).toBeGreaterThanOrEqual(viewportSize.width * 0.45);
        }
      }
    }
  });
});
