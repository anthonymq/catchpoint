import { test, expect } from "@playwright/test";

test.describe("Map View", () => {
  test.beforeEach(async ({ page }) => {
    // Mock geolocation
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  });

  test("should display map page or unavailable message", async ({ page }) => {
    await page.goto("/map");

    // Map page should show either the map or unavailable message
    const mapPage = page.locator(".map-page");
    const mapUnavailable = page.locator(".map-unavailable");

    // One of these should be visible
    await expect(mapPage.or(mapUnavailable)).toBeVisible();
  });

  test("should show view mode toggle buttons", async ({ page }) => {
    await page.goto("/map");

    // If map is unavailable (no token), skip this test
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    // Check for Markers button
    const markersBtn = page.locator(
      'button[aria-pressed][title="Marker View"]',
    );
    await expect(markersBtn).toBeVisible();

    // Check for Heatmap button
    const heatmapBtn = page.locator(
      'button[aria-pressed][title="Heatmap View"]',
    );
    await expect(heatmapBtn).toBeVisible();

    // By default, markers should be active
    await expect(markersBtn).toHaveAttribute("aria-pressed", "true");
    await expect(heatmapBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("should toggle between markers and heatmap view", async ({ page }) => {
    await page.goto("/map");

    // If map is unavailable (no token), skip this test
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    const markersBtn = page.locator(
      'button[aria-pressed][title="Marker View"]',
    );
    const heatmapBtn = page.locator(
      'button[aria-pressed][title="Heatmap View"]',
    );

    // Click heatmap button
    await heatmapBtn.click();

    // Verify heatmap is now active
    await expect(heatmapBtn).toHaveAttribute("aria-pressed", "true");
    await expect(markersBtn).toHaveAttribute("aria-pressed", "false");

    // Verify button has active class
    await expect(heatmapBtn).toHaveClass(/active/);

    // Toggle back to markers
    await markersBtn.click();

    // Verify markers is active again
    await expect(markersBtn).toHaveAttribute("aria-pressed", "true");
    await expect(heatmapBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("should show filter button with badge when filters active", async ({
    page,
  }) => {
    await page.goto("/map");

    // If map is unavailable (no token), skip this test
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    // Filter button should be visible
    const filterBtn = page.locator(".btn-map-control");
    await expect(filterBtn).toBeVisible();

    // Click to open filter modal
    await filterBtn.click();

    // Filter modal should open - title is "Filters"
    await expect(page.getByRole("heading", { name: "Filters" })).toBeVisible();

    // Apply a filter - "Last 7 Days" button
    await page.getByRole("button", { name: "Last 7 Days" }).click();

    // Close modal - the apply button shows catch count like "X catches"
    await page.locator(".btn-apply").click();

    // Badge should now show filter count
    const badge = page.locator(".map-badge-count");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("1");
  });

  test("should open and close filter modal from map", async ({ page }) => {
    await page.goto("/map");

    // If map is unavailable (no token), skip this test
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    // Open filter
    const filterBtn = page.locator(".btn-map-control");
    await filterBtn.click();

    // Modal should be open (check for filter-modal class)
    const modal = page.locator(".filter-modal");
    await expect(modal).toBeVisible();

    // Close with the apply button (shows catch count)
    await page.locator(".btn-apply").click();

    // Modal should close
    await expect(modal).not.toBeVisible();
  });

  test("should show offline banner when offline", async ({ page, context }) => {
    await page.goto("/map");

    // If map is unavailable (no token), skip this test
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    // Go offline
    await context.setOffline(true);

    // Wait a moment for offline detection
    await page.waitForTimeout(200);

    // Check for offline banner
    const offlineBanner = page.locator(".map-offline-banner");
    await expect(offlineBanner).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Banner should disappear
    await page.waitForTimeout(200);
    await expect(offlineBanner).not.toBeVisible();
  });

  test("should display catches on map when data exists", async ({ page }) => {
    // First create some catches
    await page.goto("/");
    const captureBtn = page.getByLabel("Quick Catch");

    // Create catches
    for (let i = 0; i < 2; i++) {
      await captureBtn.click();
      await page.waitForTimeout(400);
    }

    // Navigate to map
    await page.getByRole("link", { name: "Map" }).click();

    // Wait for page to load
    await page.waitForTimeout(500);

    // If map is unavailable (no token), skip marker check
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      // Map page shows unavailable message
      await expect(mapUnavailable).toContainText("Map Unavailable");
      return;
    }

    // Map should be loaded
    const mapPage = page.locator(".map-page");
    await expect(mapPage).toBeVisible();

    // Check that mapbox container exists (indicates map loaded)
    const mapContainer = page.locator(".mapboxgl-map");
    await expect(mapContainer).toBeVisible();
  });

  test("should show navigation controls on map", async ({ page }) => {
    await page.goto("/map");

    // If map is unavailable (no token), skip this test
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    // Wait for map to fully load
    await page.waitForTimeout(1000);

    // Check for Mapbox navigation control
    const navControl = page.locator(".mapboxgl-ctrl-group");
    await expect(navControl.first()).toBeVisible();

    // Check for geolocate control
    const geolocateControl = page.locator(".mapboxgl-ctrl-geolocate");
    await expect(geolocateControl).toBeVisible();
  });

  test("should reset filters from map", async ({ page }) => {
    await page.goto("/map");

    // If map is unavailable (no token), skip this test
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    // Open filter and apply some filters
    const filterBtn = page.locator(".btn-map-control");
    await filterBtn.click();

    // Apply date filter
    await page.getByRole("button", { name: "Last 7 Days" }).click();
    await page.locator(".btn-apply").click();

    // Badge should show
    const badge = page.locator(".map-badge-count");
    await expect(badge).toBeVisible();

    // Open filter again and reset
    await filterBtn.click();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await page.locator(".btn-apply").click();

    // Badge should be gone
    await expect(badge).not.toBeVisible();
  });
});

// Skip WebKit for offline tests as it has unreliable offline emulation
test.describe("Map View - WebKit skipped", () => {
  test.skip(({ browserName }) => browserName === "webkit");

  test.beforeEach(async ({ page }) => {
    await page.context().grantPermissions(["geolocation"]);
    await page
      .context()
      .setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
  });

  test("should handle network errors gracefully", async ({ page, context }) => {
    // Go online first
    await page.goto("/map");

    // Skip if no token
    const mapUnavailable = page.locator(".map-unavailable");
    if (await mapUnavailable.isVisible()) {
      test.skip();
      return;
    }

    // Wait for map to load
    const mapContainer = page.locator(".mapboxgl-map");
    await expect(mapContainer).toBeVisible({ timeout: 10000 });

    // Now go offline
    await context.setOffline(true);
    await page.waitForTimeout(300);

    // The offline banner should appear
    const offlineBanner = page.locator(".map-offline-banner");
    await expect(offlineBanner).toBeVisible();

    // Map should still be visible (cached)
    await expect(mapContainer).toBeVisible();

    // Restore online state
    await context.setOffline(false);
  });
});
