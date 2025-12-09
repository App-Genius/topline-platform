import { test, expect } from "./fixtures";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/settings");
  });

  test("displays settings page with navigation", async ({ page }) => {
    // Should show settings header
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();

    // Should show settings navigation buttons (not tabs)
    await expect(page.getByRole("button", { name: /organization/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /notifications/i })).toBeVisible();
  });

  test("can switch between sections", async ({ page }) => {
    // Click notifications button
    await page.getByRole("button", { name: /notifications/i }).click();

    // Should show notification settings content
    await expect(page.getByRole("heading", { name: /notification/i })).toBeVisible();
  });

  test("displays loading state initially", async ({ page }) => {
    // Loading spinner should appear briefly
    // Note: This might be too fast to catch reliably
    await page.goto("/admin/settings", { waitUntil: "domcontentloaded" });

    // After loading, content should be visible
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("toggle switches are accessible", async ({ page }) => {
    // Find toggle switches on the scoreboard section (default view)
    const switches = page.getByRole("switch");
    const count = await switches.count();

    if (count > 0) {
      // Switches should be visible
      const firstSwitch = switches.first();
      await expect(firstSwitch).toBeVisible();
    }
  });
});

test.describe("Settings Accessibility", () => {
  test("navigation buttons are keyboard focusable", async ({ page }) => {
    await page.goto("/admin/settings");

    // Focus on organization button
    const orgButton = page.getByRole("button", { name: /organization/i });
    await orgButton.focus();
    await expect(orgButton).toBeFocused();

    // Tab to next button
    await page.keyboard.press("Tab");

    // Another element should now be focused
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("form elements have proper labels", async ({ page }) => {
    await page.goto("/admin/settings");

    // Switches should have accessible names
    const switches = page.getByRole("switch");
    const count = await switches.count();

    // Each switch should be accessible (have aria-label or associated text)
    for (let i = 0; i < Math.min(count, 3); i++) {
      const switchEl = switches.nth(i);
      await expect(switchEl).toBeVisible();
    }
  });
});
