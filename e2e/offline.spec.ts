import { test, expect } from "@playwright/test";

test.describe("Offline Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Grant permissions and set initial location
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  });

  test("should support offline capture and sync weather when back online", async ({
    page,
    context,
    browserName,
  }) => {
    // Skip WebKit as offline emulation is flaky
    test.skip(
      browserName === "webkit",
      "Offline emulation not reliable in WebKit",
    );

    // Enable console logs
    page.on("console", (msg) => console.log(`BROWSER LOG: ${msg.text()}`));

    // Mock the weather API response (Setup BEFORE needed)
    // Use context.route to ensure we catch requests from all pages/workers
    await context.route(
      "**/*openweathermap.org/data/2.5/weather*",
      async (route) => {
        console.log("Mocking weather request: " + route.request().url());
        const json = {
          coord: { lon: -122.4194, lat: 37.7749 },
          weather: [
            { id: 800, main: "Clear", description: "clear sky", icon: "01d" },
          ],
          main: {
            temp: 25,
            feels_like: 25,
            temp_min: 25,
            temp_max: 25,
            pressure: 1013,
            humidity: 50,
          },
          wind: { speed: 5, deg: 180 },
          dt: 1600000000,
          name: "San Francisco",
        };
        await route.fulfill({ json });
      },
    );

    // 1. Start Online at Home
    await page.goto("/");

    // 2. Go Offline
    await context.setOffline(true);

    // 3. Perform Capture
    const captureBtn = page.getByLabel("Quick Catch");
    await expect(captureBtn).toBeVisible();
    await captureBtn.click();

    // Verify optimistic feedback works offline (button has success class)
    await expect(captureBtn).toHaveClass(/success/);

    // 4. Verify Catch exists in Log
    await page.getByRole("link", { name: "Log" }).click();
    const catchCard = page.locator(".catch-card").first();
    await expect(catchCard).toBeVisible();

    // 5. Check Detail View for missing weather (since we are offline)
    await catchCard.click();
    await expect(page.getByText("Catch Details")).toBeVisible();

    // We verify that the weather section is NOT present
    // The weather section contains "No weather data" or the description
    // But since weather is undefined, the entire block shouldn't render.
    // However, if the implementation renders "No weather data" inside the block if weather object exists but fields are missing, that's different.
    // Looking at the code: `const weather = catchData.weatherData;` and `{weather && ...}`
    // So if weatherData is undefined (which it is for offline capture), nothing renders.
    // Let's verify "No weather data" text is NOT visible, just to be sure we aren't seeing a default state.
    // Wait, if it renders nothing, we can't easily assert "nothing".
    // We can assert that the Cloud icon is not visible.
    const cloudIcon = page.locator("svg.lucide-cloud");
    await expect(cloudIcon).not.toBeVisible();

    // 6. Go Online to trigger sync
    console.log("Going back online...");
    const weatherResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("openweathermap") && response.status() === 200,
    );
    await context.setOffline(false);

    // Force online event just in case
    await page.evaluate(() => {
      window.dispatchEvent(new Event("online"));
    });

    // Wait for sync to happen
    await weatherResponsePromise;

    // 7. Verify Weather Sync works
    // Verify Persistence by reloading (CatchDetail fetches on mount)
    // In a real app, we might want live updates, but for now we verify DB persistence
    await page.reload();

    // Wait for the UI to update.
    await expect(page.getByText(/clear sky/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("25°")).toBeVisible();
  });
});
