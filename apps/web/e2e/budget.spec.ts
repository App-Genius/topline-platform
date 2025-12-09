import { test, expect } from "./fixtures";

test.describe("Budget Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/budget");
  });

  test("displays budget overview", async ({ page }) => {
    // Should show budget header (h1 specifically)
    await expect(page.getByRole("heading", { name: /budget dashboard/i, level: 1 })).toBeVisible();

    // Should show budget summary cards
    await expect(page.getByText(/revenue/i).first()).toBeVisible();
    await expect(page.getByText(/expenses/i).first()).toBeVisible();
  });

  test("displays budget categories", async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Should show category breakdown section
    await expect(page.getByRole("heading", { name: /category breakdown/i })).toBeVisible();

    // Should show category items (Labor, Cost of Goods, etc.)
    await expect(page.getByText(/labor/i).first()).toBeVisible();
  });

  test("progress bars show budget status", async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Should have progress bars for categories
    const progressBars = page.getByRole("progressbar");
    const count = await progressBars.count();

    expect(count).toBeGreaterThan(0);
  });

  test("expandable sections work", async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState("networkidle");

    // Find expandable buttons (if any)
    const expandButtons = page.locator("[aria-expanded]");
    const count = await expandButtons.count();

    if (count > 0) {
      const firstButton = expandButtons.first();
      const initialState = await firstButton.getAttribute("aria-expanded");

      // Click to toggle
      await firstButton.click();

      // State should have changed
      const newState = await firstButton.getAttribute("aria-expanded");
      expect(newState).not.toBe(initialState);
    }
  });
});

test.describe("Budget Accessibility", () => {
  test("progress bars are present", async ({ page }) => {
    await page.goto("/admin/budget");
    await page.waitForLoadState("networkidle");

    const progressBars = page.getByRole("progressbar");
    const count = await progressBars.count();

    // Should have progress bars in category breakdown
    expect(count).toBeGreaterThan(0);

    // First progress bar should be visible
    if (count > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test("page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/admin/budget");

    // Should have main heading
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();

    // Should have section headings
    const headings = page.getByRole("heading");
    const count = await headings.count();
    expect(count).toBeGreaterThan(1);
  });
});
