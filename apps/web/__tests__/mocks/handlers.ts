import { http, HttpResponse } from "msw";

// Mock data
export const mockUsers = [
  { id: "1", name: "Sarah Miller", email: "sarah@example.com", role: "Server", status: "active" },
  { id: "2", name: "Mike Johnson", email: "mike@example.com", role: "Bartender", status: "active" },
  { id: "3", name: "Emily Chen", email: "emily@example.com", role: "Server", status: "active" },
];

export const mockRoles = [
  { id: "1", name: "Server", description: "Front of house server", permissions: ["log_behaviors"] },
  { id: "2", name: "Bartender", description: "Bar service", permissions: ["log_behaviors"] },
  { id: "3", name: "Manager", description: "Shift manager", permissions: ["log_behaviors", "verify_logs", "view_reports"] },
];

export const mockBehaviors = [
  { id: "1", name: "Upsell Wine", description: "Suggest wine pairing", category: "upsell", target: 10 },
  { id: "2", name: "Suggest Dessert", description: "Offer dessert menu", category: "upsell", target: 8 },
  { id: "3", name: "Greet within 60s", description: "Greet table within 60 seconds", category: "service", target: 100 },
];

export const mockSettings = {
  organizationName: "Demo Restaurant",
  timezone: "America/New_York",
  currency: "USD",
  fiscalYearStart: "January",
  notifications: {
    dailySummary: true,
    weeklyReport: true,
    alertThreshold: 80,
  },
};

export const mockBudget = {
  period: "2024-Q4",
  totalBudget: 150000,
  spent: 98500,
  remaining: 51500,
  categories: [
    { name: "Labor", budgeted: 75000, spent: 52000, variance: -23000 },
    { name: "Food Cost", budgeted: 45000, spent: 31500, variance: -13500 },
    { name: "Marketing", budgeted: 15000, spent: 8000, variance: -7000 },
    { name: "Operations", budgeted: 15000, spent: 7000, variance: -8000 },
  ],
};

export const mockInsights = {
  summary: {
    title: "Strong Performance",
    description: "Revenue is up 12% compared to last month",
    trend: "up" as const,
  },
  recommendations: [
    { id: "1", title: "Focus on wine upsells", priority: "high", impact: "+$2,400/month" },
    { id: "2", title: "Improve lunch traffic", priority: "medium", impact: "+$1,800/month" },
  ],
};

export const mockBriefing = {
  id: "briefing-2024-01-15",
  date: "Monday, January 15, 2024",
  reservations: { total: 47, lunch: 12, dinner: 35 },
  vipGuests: [
    { name: "Johnson Party", table: "12", notes: "Anniversary dinner" },
  ],
  eightySixed: [
    { item: "Salmon", reason: "Delivery delayed", alternatives: ["Branzino"] },
  ],
  upsellItems: {
    food: [{ item: "Wagyu Ribeye", margin: "High" as const, description: "Feature special" }],
    beverage: [{ item: "Reserve Cabernet", margin: "High" as const, description: "Pairs with ribeye" }],
  },
  trainingTopic: {
    title: "Wine Pairing Basics",
    description: "Focus on wine suggestions",
    relatedBehavior: "Suggest Wine Pairing",
    tips: ["Ask preferences", "Mention price ranges"],
  },
  teamOnShift: [
    { id: "1", name: "Sarah Miller", role: "Server", avatar: "SM" },
    { id: "2", name: "Mike Johnson", role: "Bartender", avatar: "MJ" },
  ],
};

// API handlers
export const handlers = [
  // Users
  http.get("/api/users", () => {
    return HttpResponse.json(mockUsers);
  }),

  http.get("/api/users/:id", ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  http.post("/api/users", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "new-user-id", ...body }, { status: 201 });
  }),

  // Roles
  http.get("/api/roles", () => {
    return HttpResponse.json(mockRoles);
  }),

  // Behaviors
  http.get("/api/behaviors", () => {
    return HttpResponse.json(mockBehaviors);
  }),

  http.post("/api/behaviors/log", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "log-id", ...body, timestamp: new Date().toISOString() });
  }),

  // Settings
  http.get("/api/settings", () => {
    return HttpResponse.json(mockSettings);
  }),

  http.patch("/api/settings", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockSettings, ...body });
  }),

  // Budget
  http.get("/api/budget", () => {
    return HttpResponse.json(mockBudget);
  }),

  // Insights
  http.get("/api/insights", () => {
    return HttpResponse.json(mockInsights);
  }),

  http.post("/api/insights/refresh", () => {
    return HttpResponse.json({ ...mockInsights, refreshedAt: new Date().toISOString() });
  }),

  // Briefing
  http.get("/api/briefing", () => {
    return HttpResponse.json(mockBriefing);
  }),

  http.post("/api/briefing/complete", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      briefingId: body.briefingId,
      attendeeIds: body.attendeeIds,
      completedAt: new Date().toISOString(),
    });
  }),
];
