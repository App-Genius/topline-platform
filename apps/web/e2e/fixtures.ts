import { test as base, expect } from "@playwright/test";
import { SignJWT } from "jose";

// Session secret - must match lib/auth/session.ts
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "topline-dev-secret-change-in-production-min-32-chars"
);
const SESSION_COOKIE = "topline_session";

// Helper to create a test session token
async function createTestSessionToken(payload: {
  userId: string;
  email: string;
  orgId: string;
  roleType: string;
  permissions: string[];
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SESSION_SECRET);
}

// Mock data for tests - uses ACTUAL database IDs from AC Hotel seed
// These IDs are created by: npm run db:seed:ac-hotel
export const mockUser = {
  id: "cmjtia4ak000mp4agzwakylgo",  // Sarah Manager from AC Hotel seed
  email: "sarah@achotel.com",
  name: "Sarah Manager",
  avatar: null,
  isActive: true,
  roleId: "cmjtia41z0006p4agtcgbehjl",
  organizationId: "cmjtia41t0000p4ag1ylq1zrw",
  role: {
    id: "cmjtia41z0006p4agtcgbehjl",
    name: "Floor Manager",
    type: "MANAGER",
    permissions: ["read", "write", "manage"],
  },
  organization: {
    id: "cmjtia41t0000p4ag1ylq1zrw",
    name: "AC Hotel",
    industry: "HOSPITALITY",
  },
};

export const mockOrganization = {
  id: "cmjtia41t0000p4ag1ylq1zrw",
  name: "AC Hotel",
  industry: "HOSPITALITY",
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

/**
 * Extended test with authentication via session cookie
 *
 * NOTE: With Server Actions, data is fetched directly from the database,
 * not through HTTP endpoints. For e2e tests to work properly, you need
 * either:
 * 1. A seeded test database with matching user/org IDs
 * 2. Run tests in demo mode where hooks return mock data
 *
 * The session cookie is set correctly for authentication.
 */
export const test = base.extend<{ authenticatedPage: typeof base }>({
  page: async ({ page, context }, use) => {
    // Create a valid session token
    const sessionToken = await createTestSessionToken({
      userId: mockUser.id,
      email: mockUser.email,
      orgId: mockUser.organizationId,
      roleType: "MANAGER",
      permissions: ["read", "write", "manage"],
    });

    // Set the session cookie BEFORE any navigation
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false, // false for localhost
        sameSite: "Lax",
      },
    ]);

    await use(page);
  },
});

export { expect };
