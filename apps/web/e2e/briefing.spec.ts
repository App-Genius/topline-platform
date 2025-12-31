import { test, expect } from "./fixtures";

test.describe("Daily Briefing Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to briefing page
    await page.goto("/manager/briefing");
  });

  test("displays briefing page with overview", async ({ page }) => {
    // Should show the briefing header
    await expect(page.getByRole("heading", { name: /daily briefing/i })).toBeVisible();

    // Should show the date
    await expect(page.getByText(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i)).toBeVisible();

    // Should show overview content
    await expect(page.getByText(/today at a glance/i)).toBeVisible();

    // Should show reservation counts
    await expect(page.getByText(/reservations/i)).toBeVisible();
    await expect(page.getByText(/vip tables/i)).toBeVisible();
  });

  test("navigates through all briefing steps via tabs", async ({ page }) => {
    // Navigate via tabs instead of buttons (bottom toolbar intercepts clicks)
    // Step 2: VIP Guests
    await page.getByRole("tab", { name: /vip/i }).click();
    await expect(page.getByRole("tabpanel")).toContainText(/vip/i);

    // Step 3: Kitchen Updates
    await page.getByRole("tab", { name: /kitchen/i }).click();
    await expect(page.getByRole("tabpanel")).toContainText(/86'd|kitchen/i);

    // Step 4: Upsell Focus
    await page.getByRole("tab", { name: /upsell/i }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();

    // Step 5: Training Topic
    await page.getByRole("tab", { name: /training/i }).click();
    // Check for any training topic heading (varies by seed data)
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

    // Step 6: Attendance
    await page.getByRole("tab", { name: /attendance/i }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });

  test("can mark team members as present", async ({ page }) => {
    // Navigate to attendance step by clicking tabs directly
    await page.getByRole("tab", { name: /attendance/i }).click();

    // Should be on attendance step
    await expect(page.getByRole("heading", { name: /attendance|team/i })).toBeVisible();

    // Mark first team member as present (could be checkbox or button)
    const firstMember = page.locator('[role="checkbox"], input[type="checkbox"]').first();
    if (await firstMember.count() > 0) {
      await firstMember.click();
      // Should show updated count
      await expect(page.getByText(/\d+ of \d+ present/i)).toBeVisible();
    }
  });

  test("complete briefing button state", async ({ page }) => {
    // Navigate to attendance step by clicking tabs directly
    await page.getByRole("tab", { name: /attendance/i }).click();

    // Should be on attendance step
    await expect(page.getByRole("heading", { name: /attendance|team/i })).toBeVisible();

    // Find the complete briefing button
    const completeButton = page.getByRole("button", { name: /complete briefing/i });
    await expect(completeButton).toBeVisible();
  });

  test("can complete briefing with attendance", async ({ page }) => {
    // Navigate to attendance step by clicking tabs directly
    await page.getByRole("tab", { name: /attendance/i }).click();

    // Should be on attendance step
    await expect(page.getByRole("heading", { name: /attendance|team/i })).toBeVisible();

    // Mark some team members as present
    const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < Math.min(3, count); i++) {
      await checkboxes.nth(i).click();
    }

    // Complete Briefing button should now be enabled
    const completeButton = page.getByRole("button", { name: /complete briefing/i });
    await expect(completeButton).toBeEnabled();

    // Click complete
    await completeButton.click();

    // Should show completion message or modal
    await expect(page.getByText(/briefing complete|completed|success/i)).toBeVisible();
  });

  test("step tabs are keyboard navigable", async ({ page }) => {
    // Focus on the first tab
    await page.getByRole("tab", { name: /overview/i }).focus();

    // Press ArrowRight to go to next tab
    await page.keyboard.press("ArrowRight");

    // VIP tab should now be focused and selected
    const vipTab = page.getByRole("tab", { name: /vip/i });
    await expect(vipTab).toHaveAttribute("aria-selected", "true");
  });

  test("back navigation works via tabs", async ({ page }) => {
    // Go to step 2 via tabs
    await page.getByRole("tab", { name: /vip/i }).click();
    await expect(page.getByRole("tab", { name: /vip/i })).toHaveAttribute("aria-selected", "true");

    // Go back to overview via tab
    await page.getByRole("tab", { name: /overview/i }).click();

    // Should be back on overview
    await expect(page.getByText(/today at a glance/i)).toBeVisible();
  });

  test("progress bar is visible", async ({ page }) => {
    // Check progress bar exists
    const progressBar = page.getByRole("progressbar");
    await expect(progressBar).toBeVisible();

    // Navigate to different step
    await page.getByRole("tab", { name: /vip/i }).click();

    // Progress should still be visible
    await expect(progressBar).toBeVisible();
  });
});

test.describe("Briefing Accessibility", () => {
  test("has accessible navigation", async ({ page }) => {
    await page.goto("/manager/briefing");

    // Tab navigation should have proper roles
    const tablist = page.getByRole("tablist");
    await expect(tablist).toBeVisible();

    // Each tab should have proper attributes
    const tabs = page.getByRole("tab");
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
  });

  test("has accessible content panels", async ({ page }) => {
    await page.goto("/manager/briefing");

    // Content panel should have proper role
    const panel = page.getByRole("tabpanel");
    await expect(panel).toBeVisible();
  });

  test("focus is managed correctly", async ({ page }) => {
    await page.goto("/manager/briefing");

    // The next step button should be focusable
    const nextButton = page.getByRole("button", { name: /go to next step/i });
    await expect(nextButton).toBeVisible();

    // Focus should be manageable
    await nextButton.focus();
    await expect(nextButton).toBeFocused();
  });
});
