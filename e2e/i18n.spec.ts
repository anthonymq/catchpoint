import { test, expect } from "@playwright/test";

test.describe("i18n - Internationalization", () => {
  test("should display English by default", async ({ page }) => {
    await page.goto("/");

    // Home page should show English text
    await expect(page.getByText("FISH ON!")).toBeVisible();

    // Navigate to Settings
    await page.getByRole("link", { name: "Settings" }).click();

    // Check English labels are visible
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Appearance")).toBeVisible();
    await expect(page.getByText("Language")).toBeVisible();
  });

  test("should switch to French when French is selected", async ({ page }) => {
    await page.goto("/settings");

    // Find and click the French button
    await page.getByRole("button", { name: "Français" }).click();

    // Wait for UI to update - check French labels appear
    // Settings title is "Réglages"
    await expect(page.getByRole("heading", { name: "Réglages" })).toBeVisible();
    await expect(page.getByText("Apparence")).toBeVisible();
    await expect(page.getByText("Langue")).toBeVisible();

    // Navigate to Home and verify French
    await page.getByRole("link", { name: "Accueil" }).click();

    // Quick capture button should have French text
    await expect(page.getByText("ÇA MORD !")).toBeVisible();

    // Check Log page
    await page.getByRole("link", { name: "Journal" }).click();
    await expect(page.getByText(/Journal de pêche|Aucune prise/)).toBeVisible();
  });

  test("should persist language preference across page reload", async ({
    page,
  }) => {
    await page.goto("/settings");

    // Switch to French
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByText("Apparence")).toBeVisible();

    // Reload the page
    await page.reload();

    // French should still be active
    await expect(page.getByRole("heading", { name: "Réglages" })).toBeVisible();
    await expect(page.getByText("Apparence")).toBeVisible();
  });

  test("should switch back to English", async ({ page }) => {
    await page.goto("/settings");

    // First switch to French
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByText("Apparence")).toBeVisible();

    // Now switch back to English
    await page.getByRole("button", { name: "English" }).click();

    // English labels should appear
    await expect(page.getByText("Appearance")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("should show translated navigation labels", async ({ page }) => {
    await page.goto("/settings");

    // Switch to French
    await page.getByRole("button", { name: "Français" }).click();

    // Check nav items are translated
    await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Journal" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Carte" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Stats" })).toBeVisible(); // Stats is same in FR
    await expect(page.getByRole("link", { name: "Réglages" })).toBeVisible();
  });

  test("should set html lang attribute", async ({ page }) => {
    await page.goto("/settings");

    const html = page.locator("html");

    // Switch to French
    await page.getByRole("button", { name: "Français" }).click();
    await expect(html).toHaveAttribute("lang", "fr");

    // Switch to English
    await page.getByRole("button", { name: "English" }).click();
    await expect(html).toHaveAttribute("lang", "en");
  });

  test("should show About section with translated labels", async ({ page }) => {
    await page.goto("/settings");

    // Check English About section
    await expect(page.getByText("About")).toBeVisible();
    await expect(page.getByText("Version")).toBeVisible();
    await expect(page.getByText("Open Source Licenses")).toBeVisible();
    await expect(page.getByText("Privacy Policy")).toBeVisible();

    // Switch to French
    await page.getByRole("button", { name: "Français" }).click();

    // Check French About section
    await expect(page.getByText("À propos")).toBeVisible();
    await expect(page.getByText("Licences open source")).toBeVisible();
    await expect(page.getByText("Politique de confidentialité")).toBeVisible();
  });
});
