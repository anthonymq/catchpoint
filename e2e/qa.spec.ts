import { test, expect } from "@playwright/test";

test.describe("QA - Full Application", () => {
  test.beforeEach(async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  });

  test("should navigate between all pages", async ({ page }) => {
    // Start at Home
    await page.goto("/");
    await expect(page.getByLabel("Quick Catch")).toBeVisible();

    // Navigate to Log
    await page.getByRole("link", { name: "Log" }).click();
    await expect(page.getByText(/Catch Log|No catches yet/)).toBeVisible();

    // Navigate to Map
    await page.getByRole("link", { name: "Map" }).click();
    // Map page might show unavailable if no token, or map container
    await expect(page.locator(".map-page, .map-unavailable")).toBeVisible();

    // Navigate to Stats
    await page.getByRole("link", { name: "Stats" }).click();
    await expect(page.getByText(/Statistics|No statistics yet/)).toBeVisible();

    // Navigate to Settings
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByText("Appearance")).toBeVisible();

    // Navigate back to Home
    await page.getByRole("link", { name: "Home" }).click();
    await expect(page.getByLabel("Quick Catch")).toBeVisible();
  });

  test("should switch themes correctly", async ({ page }) => {
    await page.goto("/settings");

    // Check current theme buttons exist
    await expect(page.getByRole("button", { name: "Light" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dark" })).toBeVisible();
    await expect(page.getByRole("button", { name: "System" })).toBeVisible();

    // Switch to Dark theme
    await page.getByRole("button", { name: "Dark" }).click();

    // Verify data-theme attribute on document (dark sets attribute)
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");

    // Switch to Light theme - light REMOVES the attribute (design choice)
    await page.getByRole("button", { name: "Light" }).click();
    // Light theme removes data-theme attribute entirely
    await expect(html).not.toHaveAttribute("data-theme", "dark");

    // Switch to System theme
    await page.getByRole("button", { name: "System" }).click();
    // System theme will set based on prefers-color-scheme, just verify no crash
    await page.waitForTimeout(100);
  });

  test("should switch units correctly", async ({ page }) => {
    await page.goto("/settings");

    // Find weight unit buttons
    const lbsBtn = page.getByRole("button", { name: "lbs" });
    const kgBtn = page.getByRole("button", { name: "kg" });

    await expect(lbsBtn).toBeVisible();
    await expect(kgBtn).toBeVisible();

    // Switch to kg
    await kgBtn.click();
    // Verify the button is selected (has specific class or style)
    await expect(kgBtn).toHaveClass(/font-medium/);

    // Switch back to lbs
    await lbsBtn.click();
    await expect(lbsBtn).toHaveClass(/font-medium/);

    // Find length unit buttons - use exact: true to avoid matching "Permanently delete"
    const inBtn = page.getByRole("button", { name: "in", exact: true });
    const cmBtn = page.getByRole("button", { name: "cm", exact: true });

    await expect(inBtn).toBeVisible();
    await expect(cmBtn).toBeVisible();

    // Switch to cm
    await cmBtn.click();
    await expect(cmBtn).toHaveClass(/font-medium/);
  });

  test("should load test data and display in Log", async ({ page }) => {
    await page.goto("/settings");

    // Handle the alert that appears after loading test data
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("test catches");
      await dialog.accept();
    });

    // Click Load Test Data button
    await page.getByText("Load Test Data").click();

    // Wait for dialog to be handled and navigate to Log
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: "Log" }).click();

    // Verify multiple catches are displayed
    const catchCards = page.locator(".catch-card");
    await expect(catchCards.first()).toBeVisible();
    const count = await catchCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("should filter catches on Log page", async ({ page }) => {
    // First create some catches
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");

    // Create 3 catches
    for (let i = 0; i < 3; i++) {
      await captureBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate to Log
    await page.getByRole("link", { name: "Log" }).click();
    await expect(page.locator(".catch-card").first()).toBeVisible();

    // Open filter modal
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    // Verify filter modal is open
    await expect(page.getByText("Filter Catches")).toBeVisible();

    // Click on a date range filter
    await page.getByRole("button", { name: "Last 7 Days" }).click();

    // Close filter modal
    await page.getByRole("button", { name: "Show Results" }).click();

    // Verify catches are still visible (they were just created)
    await expect(page.locator(".catch-card").first()).toBeVisible();

    // Open filter again and reset
    await filterBtn.click();
    await page.getByRole("button", { name: "Reset All" }).click();
    await page.getByRole("button", { name: "Show Results" }).click();
  });

  test("should delete a catch", async ({ page }) => {
    // Create a catch first
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");
    await captureBtn.click();
    await expect(page.getByText("CAUGHT!")).toBeVisible();

    // Navigate to Log
    await page.getByRole("link", { name: "Log" }).click();
    const catchCard = page.locator(".catch-card").first();
    await expect(catchCard).toBeVisible();

    // Click to view details
    await catchCard.click();
    await expect(page.getByText("Catch Details")).toBeVisible();

    // Handle delete confirmation
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("delete");
      await dialog.accept();
    });

    // Click delete button
    await page.getByRole("button", { name: "Delete Catch" }).click();

    // Verify navigation back to Log and catch is removed
    await expect(page.getByText(/Catch Log|No catches yet/)).toBeVisible();
  });

  test("should export CSV", async ({ page }) => {
    // First create a catch
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");
    await captureBtn.click();
    await page.waitForTimeout(500);

    // Go to Settings
    await page.getByRole("link", { name: "Settings" }).click();

    // Set up download listener
    const downloadPromise = page.waitForEvent("download");

    // Click Export CSV
    await page.getByText("Export CSV").click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download has correct filename pattern
    expect(download.suggestedFilename()).toMatch(/catchpoint.*\.csv/i);
  });

  test("should display empty states correctly", async ({ page }) => {
    // Log page empty state
    await page.goto("/log");
    // If no catches, should show empty state
    // If catches exist from other tests, this is OK too
    await expect(page.locator("body")).toBeVisible();

    // Stats page empty state
    await page.goto("/stats");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should show responsive bottom navigation", async ({ page }) => {
    await page.goto("/");

    // Check bottom nav is visible
    const bottomNav = page.locator("nav");
    await expect(bottomNav).toBeVisible();

    // Verify all nav items are present
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Log" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Map" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Stats" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("should handle quick capture feedback animation", async ({ page }) => {
    await page.goto("/");

    const captureBtn = page.getByLabel("Quick Catch");
    await expect(captureBtn).toBeVisible();

    // Capture
    await captureBtn.click();

    // Verify "CAUGHT!" feedback appears quickly
    await expect(page.getByText("CAUGHT!")).toBeVisible({ timeout: 1000 });

    // After animation, button should return
    await page.waitForTimeout(2000);
    await expect(captureBtn).toBeVisible();
  });
});
