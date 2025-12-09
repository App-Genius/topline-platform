import { test as base, expect } from "@playwright/test";

// Mock data for API responses - matches API response structure
export const mockUser = {
  id: "user-1",
  email: "manager@demo.com",
  name: "Demo Manager",
  avatar: null,
  isActive: true,
  roleId: "role-1",
  organizationId: "org-1",
  role: {
    id: "role-1",
    name: "Manager",
    type: "manager",
    permissions: ["read", "write", "manage"],
  },
  organization: {
    id: "org-1",
    name: "Demo Restaurant",
    industry: "RESTAURANT",
  },
};

export const mockOrganization = {
  id: "org-1",
  name: "Demo Restaurant",
  industry: "RESTAURANT",
};

export const mockBriefing = {
  id: "briefing-" + new Date().toISOString().split("T")[0],
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  reservations: { total: 47, lunch: 12, dinner: 35 },
  vipGuests: [
    { name: "Johnson Party", table: "12", notes: "Anniversary dinner" },
    { name: "Mayor Williams", table: "VIP 1", notes: "Business meeting" },
  ],
  eightySixed: [
    { item: "Salmon", reason: "Delivery delayed", alternatives: ["Branzino"] },
    { item: "Chocolate Lava Cake", reason: "Sold out", alternatives: ["Tiramisu"] },
  ],
  upsellItems: {
    food: [{ item: "Wagyu Ribeye", margin: "High", description: "Feature special" }],
    beverage: [{ item: "Reserve Cabernet", margin: "High", description: "Pairs with ribeye" }],
  },
  trainingTopic: {
    title: "Wine Pairing Basics",
    description: "Focus on wine suggestions",
    relatedBehavior: "Suggest Wine Pairing",
    tips: ["Ask preferences", "Mention price ranges", "Describe flavor profiles"],
    videoUrl: "/videos/training.mp4",
    videoDuration: "2 min",
  },
  teamOnShift: [
    { id: "1", name: "Sarah Miller", role: "Server", avatar: "SM" },
    { id: "2", name: "Mike Johnson", role: "Bartender", avatar: "MJ" },
    { id: "3", name: "Emily Chen", role: "Server", avatar: "EC" },
  ],
};

export const mockBudget = {
  period: "December 2024",
  summary: {
    totalBudget: 285000,
    totalActual: 298500,
    variance: -13500,
    variancePercent: -4.7,
  },
  categories: [
    { id: "revenue", name: "Revenue", type: "income", budget: 450000, actual: 465000, color: "#10b981" },
    { id: "labor", name: "Labor", type: "expense", budget: 90000, actual: 95500, color: "#3b82f6" },
  ],
  alerts: [],
  monthlyTrend: [],
};

export const mockSettings = {
  organization: { name: "Demo Restaurant", industry: "RESTAURANT" },
  scoreboard: {
    metrics: [
      { id: "revenue", name: "Today's Revenue", enabled: true },
      { id: "behaviors", name: "Team Behaviors", enabled: true },
    ],
    refreshInterval: 30,
    showLeaderboard: true,
    anonymizeNames: false,
    theme: "dark",
  },
  notifications: {
    emailAlerts: true,
    budgetWarnings: true,
    performanceUpdates: false,
  },
};

export const mockInsights = {
  lastUpdated: new Date().toLocaleString(),
  summary: { overallHealth: 72, opportunities: 4, actions: 3 },
  trainingRecommendations: [],
  costRecommendations: [],
  performanceInsights: [],
  suggestedTrainingTopic: {
    title: "Wine Pairing",
    description: "Focus on suggestions",
    tips: [],
    expectedImpact: "+$2,400/week",
  },
};

// Extended test with authentication
export const test = base.extend<{ authenticatedPage: typeof base }>({
  page: async ({ page }, use) => {
    // Set auth token in localStorage BEFORE any navigation
    await page.addInitScript(() => {
      // Set the access token that api-client.ts checks
      window.localStorage.setItem("topline_access_token", "mock-access-token");
      window.localStorage.setItem("topline_refresh_token", "mock-refresh-token");
    });

    // Mock /auth/me endpoint (called by AuthContext on mount)
    await page.route("**/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          email: "manager@demo.com",
          name: "Demo Manager",
          avatar: null,
          isActive: true,
          roleId: "role-1",
          organizationId: "org-1",
          role: {
            id: "role-1",
            name: "Manager",
            type: "manager",
            permissions: ["read", "write", "manage"],
          },
          organization: {
            id: "org-1",
            name: "Demo Restaurant",
            industry: "RESTAURANT",
          },
        }),
      });
    });

    // Mock /auth/refresh endpoint
    await page.route("**/auth/refresh", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          accessToken: "mock-access-token",
          refreshToken: "mock-refresh-token",
        }),
      });
    });

    // Mock organization API
    await page.route("**/api/organizations/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockOrganization),
      });
    });

    // Mock briefing API
    await page.route("**/api/briefing**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            briefingId: mockBriefing.id,
            attendeeIds: ["1", "2"],
            completedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockBriefing),
        });
      }
    });

    // Mock budget API
    await page.route("**/api/budget**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBudget),
      });
    });

    // Mock settings API
    await page.route("**/api/settings**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSettings),
      });
    });

    // Mock insights API
    await page.route("**/api/insights**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockInsights),
      });
    });

    // Mock users API
    await page.route("**/api/users**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([mockUser]),
      });
    });

    await use(page);
  },
});

export { expect };
