import { test, expect } from "@playwright/test";

test.describe("Catch Capture Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock geolocation to a specific location (San Francisco)
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  });

  test("should capture a catch, edit it, and verify details", async ({
    page,
  }) => {
    // 1. Go to Home
    await page.goto("/");

    // 2. Click Quick Capture button
    const captureBtn = page.getByLabel("Quick Catch");
    await expect(captureBtn).toBeVisible();
    await captureBtn.click();

    // 3. Verify optimistic feedback (button has success class)
    await expect(captureBtn).toHaveClass(/success/);

    // 4. Navigate to Log
    await page.getByRole("link", { name: "Log" }).click();

    // 5. Verify Catch is in list
    // Wait for the list to populate (might need a moment for indexedDB sync)
    // The first card should be visible
    const catchCard = page.locator(".catch-card").first();
    await expect(catchCard).toBeVisible();

    // Default catch has no species, so it shows "Unknown Species"
    await expect(catchCard).toContainText("Unknown Species");

    // 6. Click to Edit
    await catchCard.click();

    // 7. Edit Details
    await expect(page.getByText("Catch Details")).toBeVisible();

    // Fill Species
    const speciesInput = page.getByPlaceholder("Select or type species...");
    await speciesInput.fill("Largemouth Bass");

    // Fill Weight
    const weightInput = page.getByPlaceholder("0.00");
    await weightInput.fill("5.25");

    // 8. Save
    await page.getByRole("button", { name: "Save" }).click();

    // 9. Verify redirection back to list and updated data
    await expect(page.getByText("Catch Log")).toBeVisible();

    // Check the card again
    const updatedCard = page.locator(".catch-card").first();
    await expect(updatedCard).toContainText("Largemouth Bass");
    await expect(updatedCard).toContainText("5.25");
  });
});
