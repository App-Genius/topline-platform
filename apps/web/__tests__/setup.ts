import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { server } from "./mocks/server";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// =============================================================================
// MSW Server Setup
// =============================================================================
// Start the mock service worker server before all tests

beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
  server.close();
});

// =============================================================================
// AI Module Mocks
// =============================================================================
// These must be mocked before any code imports them to avoid OpenAI SDK
// browser initialization errors.

// Mock the openai module itself to prevent browser detection errors
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify({ success: true }) } }],
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        }),
      },
    },
  })),
}));

// Mock the AI client module
vi.mock("@/lib/ai/client", () => ({
  openrouter: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify({ success: true }) } }],
        }),
      },
    },
  },
  isConfigured: vi.fn().mockReturnValue(true),
  generateCompletion: vi.fn().mockResolvedValue("Mock AI response"),
  generateStructured: vi.fn().mockResolvedValue({ success: true }),
  generateWithRetry: vi.fn().mockImplementation(async (generator) => generator()),
  logTokenUsage: vi.fn(),
  getTokenUsage: vi.fn().mockReturnValue([]),
  getTotalTokens: vi.fn().mockReturnValue(0),
}));

// Mock behavior suggestions module
vi.mock("@/lib/ai/behavior-suggestions", () => ({
  generateBehaviorSuggestions: vi.fn().mockResolvedValue({
    behaviors: [
      {
        name: "Suggest Premium Wine",
        description: "Recommend wine pairings",
        category: "REVENUE",
        points: 10,
      },
    ],
  }),
  validateBehaviorSuggestion: vi.fn().mockReturnValue({ valid: true }),
}));

// Mock quality module
vi.mock("@/lib/ai/quality", () => ({
  evaluateBehaviorQuality: vi.fn().mockResolvedValue({
    score: 85,
    feedback: "Good suggestion",
    isValid: true,
  }),
  validateAIResponse: vi.fn().mockReturnValue(true),
}));

// =============================================================================
// Server Actions Mocks
// =============================================================================
// Mock Server Actions that hooks depend on

vi.mock("@/actions", () => ({
  // Briefing actions
  getTodaysBriefing: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: "briefing-2024-01-15",
      date: "2024-01-15",
      reservations: { total: 47, lunch: 12, dinner: 35 },
      vipGuests: [{ name: "Johnson Party", table: "12", notes: "Anniversary" }],
      eightySixed: [{ item: "Salmon", reason: "Delivery delayed", alternatives: ["Branzino"] }],
      upsellItems: {
        food: [{ item: "Wagyu Ribeye", margin: "High", description: "Feature special" }],
        beverage: [{ item: "Reserve Cabernet", margin: "High", description: "Pairs with ribeye" }],
      },
      trainingTopic: {
        id: "training-1",
        title: "Wine Pairing Basics",
        description: "Focus on wine suggestions",
        tips: ["Ask preferences", "Mention price ranges"],
      },
      teamOnShift: [
        { id: "1", name: "Sarah Miller", role: "Server", avatar: "SM" },
        { id: "2", name: "Mike Johnson", role: "Bartender", avatar: "MJ" },
      ],
    },
  }),
  completeBriefing: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: "attendance-1",
      briefingId: "briefing-2024-01-15",
      attendeeIds: ["1", "2", "3"],
      completedAt: new Date().toISOString(),
    },
  }),
  uploadAttendancePhoto: vi.fn().mockResolvedValue({
    success: true,
    data: { url: "https://example.com/photo.jpg" },
  }),
  getBriefingHistory: vi.fn().mockResolvedValue({
    success: true,
    data: { data: [], pagination: { total: 0, page: 1, limit: 10 } },
  }),
  getTeamOnShift: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "1", name: "Sarah Miller", role: "Server", avatar: "SM" },
      { id: "2", name: "Mike Johnson", role: "Bartender", avatar: "MJ" },
    ],
  }),

  // User actions
  getUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "1", name: "Sarah Miller", email: "sarah@example.com", role: "SERVER" },
      { id: "2", name: "Mike Johnson", email: "mike@example.com", role: "BARTENDER" },
    ],
  }),
  createUser: vi.fn().mockResolvedValue({
    success: true,
    data: { id: "new-user", name: "New User", email: "new@example.com" },
  }),

  // Settings actions
  getSettings: vi.fn().mockResolvedValue({
    success: true,
    data: {
      organizationName: "Demo Restaurant",
      timezone: "America/New_York",
      currency: "USD",
    },
  }),
  updateSettings: vi.fn().mockResolvedValue({
    success: true,
    data: { updated: true },
  }),

  // Budget actions
  getBudget: vi.fn().mockResolvedValue({
    success: true,
    data: {
      period: "2024-Q4",
      totalBudget: 150000,
      spent: 98500,
      remaining: 51500,
    },
  }),
  updateBudget: vi.fn().mockResolvedValue({
    success: true,
    data: { updated: true },
  }),

  // Insights actions
  getInsights: vi.fn().mockResolvedValue({
    success: true,
    data: {
      summary: {
        title: "Strong Performance",
        description: "Revenue is up 12%",
        trend: "up",
      },
      recommendations: [],
    },
  }),
  refreshInsights: vi.fn().mockResolvedValue({
    success: true,
    data: { refreshed: true },
  }),

  // Behavior actions
  getBehaviors: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "1", name: "Upsell Wine", description: "Suggest wine pairing", points: 10 },
    ],
  }),
  logBehavior: vi.fn().mockResolvedValue({
    success: true,
    data: { id: "log-1", behaviorId: "1", timestamp: new Date().toISOString() },
  }),

  // Role actions
  getRoles: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: "1", name: "Server", type: "SERVER" },
      { id: "2", name: "Manager", type: "MANAGER" },
    ],
  }),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  server.resetHandlers(); // Reset any runtime request handlers
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
