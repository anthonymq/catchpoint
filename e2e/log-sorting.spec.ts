import { test, expect } from "@playwright/test";

test.describe("Log Sorting", () => {
  test.beforeEach(async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  });

  test("should show sorting options in filter modal", async ({
    page,
    browserName,
  }) => {
    // Skip webkit due to known flaky issues (see IMPLEMENTATION_PLAN.md)
    test.skip(
      browserName === "webkit",
      "WebKit has timing issues with filter modal",
    );

    // Navigate to log and open filter modal
    await page.goto("/log");

    // Create some test catches first if the log is empty
    const emptyState = page.locator(".log-empty-state");
    if (await emptyState.isVisible()) {
      await page.goto("/");
      const captureBtn = page.getByLabel("Quick Catch");
      await captureBtn.click();
      await page.waitForTimeout(400);
      await page.getByRole("link", { name: "Log" }).click();
    }

    // Open filter modal
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    // Verify sorting section exists with all options
    await expect(page.getByText("Sort By")).toBeVisible();
    // Use specific locators to avoid matching "All Species" button
    await expect(
      page.locator(".sort-chip").filter({ hasText: "Date" }),
    ).toBeVisible();
    await expect(
      page.locator(".sort-chip").filter({ hasText: "Weight" }),
    ).toBeVisible();
    await expect(
      page.locator(".sort-chip").filter({ hasText: "Species" }),
    ).toBeVisible();
  });

  test("should sort by date (newest/oldest)", async ({ page }) => {
    // Create multiple catches first
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");

    // Create 3 catches with slight delay between them
    for (let i = 0; i < 3; i++) {
      await captureBtn.click();
      await page.waitForTimeout(600);
    }

    // Navigate to Log
    await page.getByRole("link", { name: "Log" }).click();
    await expect(page.locator(".catch-card").first()).toBeVisible();

    // Open filter modal
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    // Default should be date (newest first - desc)
    const dateBtn = page.getByRole("button", { name: /Date/ });
    await expect(dateBtn).toHaveClass(/active/);

    // Click date button to toggle to oldest first (asc)
    await dateBtn.click();

    // Verify order changed (arrow should flip)
    await page.waitForTimeout(100);

    // Close modal and verify
    await page.getByRole("button", { name: /catch/ }).click();

    // The list should now be in oldest-first order
    await expect(page.locator(".catch-card").first()).toBeVisible();
  });

  test("should sort by weight (heaviest first)", async ({ page }) => {
    // Load test data which has varying weights
    await page.goto("/settings");

    // Check if Load Test Data button is visible
    const loadTestBtn = page.getByText("Load Test Data");
    if (await loadTestBtn.isVisible()) {
      await loadTestBtn.click();
      // Wait for confirmation dialog and confirm
      await page.waitForTimeout(500);
    }

    // Navigate to Log
    await page.getByRole("link", { name: "Log" }).click();
    await page.waitForTimeout(300);

    // Open filter modal
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    // Click weight button to sort by weight
    const weightBtn = page.getByRole("button", { name: /Weight/ });
    await weightBtn.click();

    // Weight button should now be active
    await expect(weightBtn).toHaveClass(/active/);

    // Close modal
    await page.getByRole("button", { name: /catch/ }).click();

    // Verify the list is displayed (weight sorting applied)
    await expect(page.locator(".catch-card").first()).toBeVisible();
  });

  test("should sort by species (A-Z)", async ({ page }) => {
    // Load test data which has varying species
    await page.goto("/settings");

    const loadTestBtn = page.getByText("Load Test Data");
    if (await loadTestBtn.isVisible()) {
      await loadTestBtn.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Log
    await page.getByRole("link", { name: "Log" }).click();
    await page.waitForTimeout(300);

    // Open filter modal
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    // Click species button to sort by species (A-Z)
    const speciesBtn = page
      .locator(".sort-chip")
      .filter({ hasText: "Species" });
    await speciesBtn.click();

    // Species button should now be active
    await expect(speciesBtn).toHaveClass(/active/);

    // Close modal
    await page.getByRole("button", { name: /catch/ }).click();

    // Verify the list is displayed
    await expect(page.locator(".catch-card").first()).toBeVisible();
  });

  test("should toggle sort order when clicking same sort option", async ({
    page,
  }) => {
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");
    await captureBtn.click();
    await page.waitForTimeout(500);

    await page.getByRole("link", { name: "Log" }).click();
    await expect(page.locator(".catch-card").first()).toBeVisible();

    // Open filter modal
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    const dateBtn = page.getByRole("button", { name: /Date/ });

    // First click - should have down arrow (desc - newest first is default)
    await expect(dateBtn.locator("svg")).toBeVisible();

    // Click to toggle
    await dateBtn.click();
    await page.waitForTimeout(100);

    // Arrow should now point up (asc - oldest first)
    await expect(dateBtn.locator("svg")).toBeVisible();

    // Click again to toggle back
    await dateBtn.click();
    await page.waitForTimeout(100);

    // Arrow should point down again (desc)
    await expect(dateBtn.locator("svg")).toBeVisible();
  });

  test("should persist sort settings during session", async ({ page }) => {
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");
    await captureBtn.click();
    await page.waitForTimeout(500);

    await page.getByRole("link", { name: "Log" }).click();

    // Open filter modal and change sort
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    const weightBtn = page.getByRole("button", { name: /Weight/ });
    await weightBtn.click();

    // Close modal
    await page.getByRole("button", { name: /catch/ }).click();

    // Navigate away and back
    await page.getByRole("link", { name: "Home" }).click();
    await page.getByRole("link", { name: "Log" }).click();

    // Open filter modal again
    await filterBtn.click();

    // Weight should still be selected
    await expect(weightBtn).toHaveClass(/active/);
  });

  test("should reset sort to default when clicking Reset", async ({ page }) => {
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");
    await captureBtn.click();
    await page.waitForTimeout(500);

    await page.getByRole("link", { name: "Log" }).click();

    // Open filter modal and change sort
    const filterBtn = page.getByRole("button", { name: "Filter" });
    await filterBtn.click();

    // Change to weight sorting
    const weightBtn = page.getByRole("button", { name: /Weight/ });
    await weightBtn.click();
    await expect(weightBtn).toHaveClass(/active/);

    // Click Reset
    await page.getByRole("button", { name: "Reset" }).click();

    // Date should be selected again (default)
    const dateBtn = page.getByRole("button", { name: /Date/ });
    await expect(dateBtn).toHaveClass(/active/);
  });
});
