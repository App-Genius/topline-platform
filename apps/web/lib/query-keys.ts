/**
 * Centralized Query Key Factory
 *
 * Provides type-safe, hierarchical query keys for React Query.
 * This pattern enables:
 * - Consistent cache key naming
 * - Easy cache invalidation at any level
 * - Type-safe key generation
 *
 * Usage:
 *   queryKeys.users.list()           // ['users', 'list']
 *   queryKeys.users.list({ role: 'admin' })  // ['users', 'list', { role: 'admin' }]
 *   queryKeys.users.detail('123')    // ['users', 'detail', '123']
 *   queryKeys.users.all              // ['users'] - invalidates all user queries
 */

export const queryKeys = {
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      params
        ? [...queryKeys.users.lists(), params] as const
        : queryKeys.users.lists(),
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    stats: (id: string, days?: number) =>
      [...queryKeys.users.detail(id), 'stats', days ?? 30] as const,
  },

  // Roles
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      params
        ? [...queryKeys.roles.lists(), params] as const
        : queryKeys.roles.lists(),
    details: () => [...queryKeys.roles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.roles.details(), id] as const,
  },

  // Behaviors
  behaviors: {
    all: ['behaviors'] as const,
    lists: () => [...queryKeys.behaviors.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      params
        ? [...queryKeys.behaviors.lists(), params] as const
        : queryKeys.behaviors.lists(),
    details: () => [...queryKeys.behaviors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.behaviors.details(), id] as const,
    stats: (id: string, days?: number) =>
      [...queryKeys.behaviors.detail(id), 'stats', days ?? 30] as const,
  },

  // Behavior Logs
  behaviorLogs: {
    all: ['behaviorLogs'] as const,
    lists: () => [...queryKeys.behaviorLogs.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      params
        ? [...queryKeys.behaviorLogs.lists(), params] as const
        : queryKeys.behaviorLogs.lists(),
    pending: () => [...queryKeys.behaviorLogs.all, 'pending'] as const,
  },

  // Daily Entries
  dailyEntries: {
    all: ['dailyEntries'] as const,
    lists: () => [...queryKeys.dailyEntries.all, 'list'] as const,
    list: (params?: Record<string, unknown>) =>
      params
        ? [...queryKeys.dailyEntries.lists(), params] as const
        : queryKeys.dailyEntries.lists(),
    byDate: (date: string, locationId?: string) =>
      [...queryKeys.dailyEntries.all, 'byDate', date, locationId] as const,
    stats: (days?: number, locationId?: string) =>
      [...queryKeys.dailyEntries.all, 'stats', days ?? 30, locationId] as const,
  },

  // Organization
  organization: {
    all: ['organization'] as const,
    current: () => [...queryKeys.organization.all, 'current'] as const,
    locations: () => [...queryKeys.organization.all, 'locations'] as const,
    benchmarks: () => [...queryKeys.organization.all, 'benchmarks'] as const,
    dashboard: (days?: number) =>
      [...queryKeys.organization.all, 'dashboard', days ?? 30] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    current: () => [...queryKeys.settings.all, 'current'] as const,
    scoreboard: () => [...queryKeys.settings.all, 'scoreboard'] as const,
    notifications: () => [...queryKeys.settings.all, 'notifications'] as const,
  },

  // Insights (AI-generated)
  insights: {
    all: ['insights'] as const,
    current: () => [...queryKeys.insights.all, 'current'] as const,
    training: () => [...queryKeys.insights.all, 'training'] as const,
    costs: () => [...queryKeys.insights.all, 'costs'] as const,
    performance: () => [...queryKeys.insights.all, 'performance'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (days?: number) => [...queryKeys.dashboard.all, 'stats', days ?? 30] as const,
    gameState: () => [...queryKeys.dashboard.all, 'gameState'] as const,
    leaderboard: (days?: number) =>
      [...queryKeys.dashboard.all, 'leaderboard', days ?? 30] as const,
  },

  // Budget
  budget: {
    all: ['budget'] as const,
    current: (period?: string) =>
      [...queryKeys.budget.all, 'current', period] as const,
    categories: () => [...queryKeys.budget.all, 'categories'] as const,
    trends: (months?: number) =>
      [...queryKeys.budget.all, 'trends', months ?? 6] as const,
  },

  // Briefing
  briefing: {
    all: ['briefing'] as const,
    byDate: (date: string) => [...queryKeys.briefing.all, 'date', date] as const,
    team: (date: string) => [...queryKeys.briefing.all, 'team', date] as const,
    history: (limit?: number) =>
      [...queryKeys.briefing.all, 'history', limit ?? 7] as const,
  },
} as const;

// Type helper for query keys
export type QueryKeys = typeof queryKeys;
