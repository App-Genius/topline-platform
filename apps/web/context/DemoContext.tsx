"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// Demo scenario types
export type DemoScenario =
  | "neutral"
  | "high_performance"
  | "low_adherence"
  | "fraud_alert"
  | "growth_opportunity";

// Mock data types matching API response shapes
export interface MockUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
}

export interface MockRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface MockBehavior {
  id: string;
  name: string;
  description: string | null;
  points: number;
  frequency: string;
  isActive: boolean;
  roles: Array<{ id: string; name: string }>;
}

export interface MockInsight {
  id: string;
  type: "opportunity" | "warning" | "achievement" | "trend";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: string;
  actionable: boolean;
  metric?: {
    current: number;
    target: number;
    unit: string;
  };
}

export interface MockBudgetItem {
  id: string;
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface MockTrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  completedBy: number;
  totalUsers: number;
  category: string;
  required: boolean;
}

export interface MockDashboardKpi {
  revenue: { current: number; target: number; trend: number };
  avgCheck: { current: number; baseline: number; trend: number };
  behaviors: { today: number; average: number };
  rating: { current: number; baseline: number };
}

export interface MockLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar: string | null;
  score: number;
}

// Demo context value interface
interface DemoContextValue {
  isDemoMode: boolean;
  scenario: DemoScenario;
  setScenario: (scenario: DemoScenario) => void;
  toggleDemoMode: () => void;

  // Mock data getters
  mockUsers: MockUser[];
  mockRoles: MockRole[];
  mockBehaviors: MockBehavior[];
  mockInsights: MockInsight[];
  mockBudget: MockBudgetItem[];
  mockTraining: MockTrainingModule[];
  mockDashboardKpis: MockDashboardKpi;
  mockLeaderboard: MockLeaderboardEntry[];

  // Demo actions for triggering scenarios
  triggerScenario: (scenario: DemoScenario) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

// Generate mock users
function generateMockUsers(scenario: DemoScenario): MockUser[] {
  const baseUsers: MockUser[] = [
    {
      id: "user-1",
      email: "sarah.johnson@demo.com",
      name: "Sarah Johnson",
      avatar: null,
      isActive: true,
      createdAt: "2024-01-15T00:00:00Z",
      role: { id: "role-1", name: "Manager", permissions: ["admin", "manage_users", "view_reports"] },
    },
    {
      id: "user-2",
      email: "mike.chen@demo.com",
      name: "Mike Chen",
      avatar: null,
      isActive: true,
      createdAt: "2024-02-01T00:00:00Z",
      role: { id: "role-2", name: "Server", permissions: ["log_behaviors", "view_own_stats"] },
    },
    {
      id: "user-3",
      email: "emily.davis@demo.com",
      name: "Emily Davis",
      avatar: null,
      isActive: true,
      createdAt: "2024-02-15T00:00:00Z",
      role: { id: "role-2", name: "Server", permissions: ["log_behaviors", "view_own_stats"] },
    },
    {
      id: "user-4",
      email: "james.wilson@demo.com",
      name: "James Wilson",
      avatar: null,
      isActive: true,
      createdAt: "2024-03-01T00:00:00Z",
      role: { id: "role-3", name: "Host", permissions: ["log_behaviors", "view_own_stats"] },
    },
    {
      id: "user-5",
      email: "lisa.martinez@demo.com",
      name: "Lisa Martinez",
      avatar: null,
      isActive: scenario !== "low_adherence",
      createdAt: "2024-03-15T00:00:00Z",
      role: { id: "role-4", name: "Bartender", permissions: ["log_behaviors", "view_own_stats"] },
    },
  ];

  return baseUsers;
}

// Generate mock roles
function generateMockRoles(): MockRole[] {
  return [
    {
      id: "role-1",
      name: "Manager",
      description: "Full administrative access",
      permissions: ["admin", "manage_users", "manage_roles", "manage_behaviors", "view_reports", "manage_settings"],
      isDefault: false,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "role-2",
      name: "Server",
      description: "Front of house service staff",
      permissions: ["log_behaviors", "view_own_stats"],
      isDefault: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "role-3",
      name: "Host",
      description: "Guest reception and seating",
      permissions: ["log_behaviors", "view_own_stats"],
      isDefault: false,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "role-4",
      name: "Bartender",
      description: "Bar service staff",
      permissions: ["log_behaviors", "view_own_stats"],
      isDefault: false,
      createdAt: "2024-01-01T00:00:00Z",
    },
  ];
}

// Generate mock behaviors
function generateMockBehaviors(): MockBehavior[] {
  return [
    {
      id: "behavior-1",
      name: "Upsell Appetizer",
      description: "Suggest an appetizer to the table",
      points: 10,
      frequency: "per_table",
      isActive: true,
      roles: [{ id: "role-2", name: "Server" }],
    },
    {
      id: "behavior-2",
      name: "Wine Pairing",
      description: "Recommend wine pairing with entree",
      points: 15,
      frequency: "per_table",
      isActive: true,
      roles: [{ id: "role-2", name: "Server" }, { id: "role-4", name: "Bartender" }],
    },
    {
      id: "behavior-3",
      name: "Dessert Suggestion",
      description: "Offer dessert menu before check",
      points: 10,
      frequency: "per_table",
      isActive: true,
      roles: [{ id: "role-2", name: "Server" }],
    },
    {
      id: "behavior-4",
      name: "Guest Name Usage",
      description: "Use guest name during service",
      points: 5,
      frequency: "per_interaction",
      isActive: true,
      roles: [{ id: "role-2", name: "Server" }, { id: "role-3", name: "Host" }],
    },
    {
      id: "behavior-5",
      name: "Cocktail Upsell",
      description: "Suggest premium spirit upgrade",
      points: 12,
      frequency: "per_drink",
      isActive: true,
      roles: [{ id: "role-4", name: "Bartender" }],
    },
  ];
}

// Generate mock insights based on scenario
function generateMockInsights(scenario: DemoScenario): MockInsight[] {
  const baseInsights: MockInsight[] = [
    {
      id: "insight-1",
      type: "opportunity",
      title: "Wine pairing uptake is 23% below target",
      description: "Training focus on wine knowledge could increase check average by $8.50",
      impact: "high",
      category: "Revenue",
      actionable: true,
      metric: { current: 27, target: 50, unit: "%" },
    },
    {
      id: "insight-2",
      type: "trend",
      title: "Saturday evening covers up 15%",
      description: "Consider adding staff to maintain service quality",
      impact: "medium",
      category: "Operations",
      actionable: true,
    },
  ];

  if (scenario === "high_performance") {
    return [
      {
        id: "insight-hp-1",
        type: "achievement",
        title: "Team exceeded revenue target by 12%",
        description: "Consistent upselling drove $4,200 above monthly goal",
        impact: "high",
        category: "Revenue",
        actionable: false,
      },
      {
        id: "insight-hp-2",
        type: "trend",
        title: "Average check up $6.80 this month",
        description: "Appetizer suggestions showing strong impact",
        impact: "high",
        category: "Revenue",
        actionable: false,
        metric: { current: 52.30, target: 48.00, unit: "$" },
      },
      ...baseInsights,
    ];
  }

  if (scenario === "low_adherence") {
    return [
      {
        id: "insight-la-1",
        type: "warning",
        title: "Behavior logging down 34% this week",
        description: "Team engagement declining - consider recognition program",
        impact: "high",
        category: "Engagement",
        actionable: true,
        metric: { current: 66, target: 100, unit: "%" },
      },
      {
        id: "insight-la-2",
        type: "warning",
        title: "3 team members haven't logged in 5+ days",
        description: "Follow up with Lisa, James, and Emily",
        impact: "medium",
        category: "Engagement",
        actionable: true,
      },
      ...baseInsights,
    ];
  }

  if (scenario === "fraud_alert") {
    return [
      {
        id: "insight-fa-1",
        type: "warning",
        title: "Unusual behavior logging pattern detected",
        description: "Mike Chen logged 47 behaviors in 2 hours - review recommended",
        impact: "high",
        category: "Compliance",
        actionable: true,
      },
      ...baseInsights,
    ];
  }

  if (scenario === "growth_opportunity") {
    return [
      {
        id: "insight-go-1",
        type: "opportunity",
        title: "Lunch service underperforming by 18%",
        description: "Targeted lunch promotions could add $3,400/month",
        impact: "high",
        category: "Revenue",
        actionable: true,
        metric: { current: 82, target: 100, unit: "%" },
      },
      {
        id: "insight-go-2",
        type: "opportunity",
        title: "Bar revenue potential untapped",
        description: "Happy hour behavior tracking could increase by 25%",
        impact: "medium",
        category: "Revenue",
        actionable: true,
      },
      ...baseInsights,
    ];
  }

  return baseInsights;
}

// Generate mock budget based on scenario
function generateMockBudget(scenario: DemoScenario): MockBudgetItem[] {
  const multiplier = scenario === "high_performance" ? 1.1 : scenario === "low_adherence" ? 0.85 : 1;

  return [
    {
      id: "budget-1",
      category: "Labor",
      budgeted: 45000,
      actual: Math.round(43500 * multiplier),
      variance: Math.round((45000 - 43500 * multiplier)),
      variancePercent: Number((((45000 - 43500 * multiplier) / 45000) * 100).toFixed(1)),
    },
    {
      id: "budget-2",
      category: "Food Cost",
      budgeted: 35000,
      actual: Math.round(33200 * multiplier),
      variance: Math.round((35000 - 33200 * multiplier)),
      variancePercent: Number((((35000 - 33200 * multiplier) / 35000) * 100).toFixed(1)),
    },
    {
      id: "budget-3",
      category: "Beverage Cost",
      budgeted: 12000,
      actual: Math.round(11800 * multiplier),
      variance: Math.round((12000 - 11800 * multiplier)),
      variancePercent: Number((((12000 - 11800 * multiplier) / 12000) * 100).toFixed(1)),
    },
    {
      id: "budget-4",
      category: "Supplies",
      budgeted: 5000,
      actual: Math.round(5200 * multiplier),
      variance: Math.round((5000 - 5200 * multiplier)),
      variancePercent: Number((((5000 - 5200 * multiplier) / 5000) * 100).toFixed(1)),
    },
    {
      id: "budget-5",
      category: "Marketing",
      budgeted: 3000,
      actual: Math.round(2800 * multiplier),
      variance: Math.round((3000 - 2800 * multiplier)),
      variancePercent: Number((((3000 - 2800 * multiplier) / 3000) * 100).toFixed(1)),
    },
  ];
}

// Generate mock training modules
function generateMockTraining(): MockTrainingModule[] {
  return [
    {
      id: "training-1",
      title: "Wine Service Excellence",
      description: "Master wine presentation, pairing suggestions, and premium upselling techniques",
      duration: "45 min",
      completedBy: 8,
      totalUsers: 12,
      category: "Product Knowledge",
      required: true,
    },
    {
      id: "training-2",
      title: "Guest Experience Fundamentals",
      description: "Core service standards and guest interaction best practices",
      duration: "30 min",
      completedBy: 12,
      totalUsers: 12,
      category: "Service",
      required: true,
    },
    {
      id: "training-3",
      title: "Upselling Techniques",
      description: "Effective strategies for increasing check average through suggestions",
      duration: "25 min",
      completedBy: 6,
      totalUsers: 12,
      category: "Sales",
      required: false,
    },
    {
      id: "training-4",
      title: "Cocktail Menu Deep Dive",
      description: "Detailed knowledge of signature cocktails and spirits",
      duration: "35 min",
      completedBy: 4,
      totalUsers: 5,
      category: "Product Knowledge",
      required: true,
    },
  ];
}

// Generate mock dashboard KPIs based on scenario
function generateMockDashboardKpis(scenario: DemoScenario): MockDashboardKpi {
  const baseKpis: MockDashboardKpi = {
    revenue: { current: 125000, target: 130000, trend: 3.2 },
    avgCheck: { current: 48.50, baseline: 45.00, trend: 7.8 },
    behaviors: { today: 47, average: 42 },
    rating: { current: 4.6, baseline: 4.4 },
  };

  if (scenario === "high_performance") {
    return {
      revenue: { current: 145000, target: 130000, trend: 11.5 },
      avgCheck: { current: 54.20, baseline: 45.00, trend: 20.4 },
      behaviors: { today: 68, average: 55 },
      rating: { current: 4.8, baseline: 4.4 },
    };
  }

  if (scenario === "low_adherence") {
    return {
      revenue: { current: 108000, target: 130000, trend: -8.2 },
      avgCheck: { current: 42.30, baseline: 45.00, trend: -6.0 },
      behaviors: { today: 23, average: 42 },
      rating: { current: 4.2, baseline: 4.4 },
    };
  }

  return baseKpis;
}

// Generate mock leaderboard
function generateMockLeaderboard(scenario: DemoScenario): MockLeaderboardEntry[] {
  const baseLeaderboard: MockLeaderboardEntry[] = [
    { rank: 1, userId: "user-2", userName: "Mike Chen", avatar: null, score: 1250 },
    { rank: 2, userId: "user-3", userName: "Emily Davis", avatar: null, score: 1180 },
    { rank: 3, userId: "user-5", userName: "Lisa Martinez", avatar: null, score: 1050 },
    { rank: 4, userId: "user-4", userName: "James Wilson", avatar: null, score: 920 },
  ];

  if (scenario === "high_performance") {
    return baseLeaderboard.map((entry) => ({
      ...entry,
      score: Math.round(entry.score * 1.3),
    }));
  }

  if (scenario === "low_adherence") {
    return baseLeaderboard.map((entry) => ({
      ...entry,
      score: Math.round(entry.score * 0.6),
    }));
  }

  return baseLeaderboard;
}

// Demo Provider component
interface DemoProviderProps {
  children: React.ReactNode;
  initialDemoMode?: boolean;
  initialScenario?: DemoScenario;
}

export function DemoProvider({
  children,
  initialDemoMode = false,
  initialScenario = "neutral",
}: DemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(initialDemoMode);
  const [scenario, setScenario] = useState<DemoScenario>(initialScenario);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => !prev);
  }, []);

  const triggerScenario = useCallback((newScenario: DemoScenario) => {
    setScenario(newScenario);
  }, []);

  // Memoized mock data based on scenario
  const mockUsers = useMemo(() => generateMockUsers(scenario), [scenario]);
  const mockRoles = useMemo(() => generateMockRoles(), []);
  const mockBehaviors = useMemo(() => generateMockBehaviors(), []);
  const mockInsights = useMemo(() => generateMockInsights(scenario), [scenario]);
  const mockBudget = useMemo(() => generateMockBudget(scenario), [scenario]);
  const mockTraining = useMemo(() => generateMockTraining(), []);
  const mockDashboardKpis = useMemo(() => generateMockDashboardKpis(scenario), [scenario]);
  const mockLeaderboard = useMemo(() => generateMockLeaderboard(scenario), [scenario]);

  const value: DemoContextValue = {
    isDemoMode,
    scenario,
    setScenario,
    toggleDemoMode,
    mockUsers,
    mockRoles,
    mockBehaviors,
    mockInsights,
    mockBudget,
    mockTraining,
    mockDashboardKpis,
    mockLeaderboard,
    triggerScenario,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

// Hook to use demo context
export function useDemo(): DemoContextValue {
  const context = useContext(DemoContext);
  if (!context) {
    // Return a non-demo default when not in provider
    return {
      isDemoMode: false,
      scenario: "neutral",
      setScenario: () => {},
      toggleDemoMode: () => {},
      mockUsers: [],
      mockRoles: [],
      mockBehaviors: [],
      mockInsights: [],
      mockBudget: [],
      mockTraining: [],
      mockDashboardKpis: {
        revenue: { current: 0, target: 0, trend: 0 },
        avgCheck: { current: 0, baseline: 0, trend: 0 },
        behaviors: { today: 0, average: 0 },
        rating: { current: 0, baseline: 0 },
      },
      mockLeaderboard: [],
      triggerScenario: () => {},
    };
  }
  return context;
}

// Helper hook to check if in demo mode
export function useIsDemoMode(): boolean {
  const { isDemoMode } = useDemo();
  return isDemoMode;
}
