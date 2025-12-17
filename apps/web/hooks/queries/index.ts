/**
 * Query Hooks Barrel Export
 *
 * Central export point for all React Query hooks.
 * Import from '@/hooks/queries' for clean imports.
 */

// Users
export {
  useUsers,
  useUser,
  useUserStats,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  getUserMutationError,
} from "./useUsers";

// Roles
export {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  getRoleMutationError,
} from "./useRoles";

// Behaviors
export {
  useBehaviors,
  useBehavior,
  useBehaviorStats,
  useCreateBehavior,
  useUpdateBehavior,
  useDeleteBehavior,
  getBehaviorMutationError,
  // Behavior Logs
  useBehaviorLogs,
  usePendingVerifications,
  useLogBehavior,
  useVerifyBehavior,
  useBulkVerifyBehaviors,
} from "./useBehaviors";

// Dashboard
export {
  useDashboard,
  useGameState,
  useLeaderboard,
  type GameState,
  type DashboardKpis,
  type LeaderboardEntry,
  type DashboardData,
} from "./useDashboard";

// Budget
export {
  useBudget,
  useBudgetCategories,
  useBudgetTrends,
  useUpdateBudget,
  type BudgetData,
  type BudgetCategory,
  type BudgetSummary,
  type BudgetAlert,
} from "./useBudget";

// Settings
export {
  useSettings,
  useScoreboardSettings,
  useNotificationSettings,
  useUpdateSettings,
  type SettingsData,
  type ScoreboardSettings,
  type ScoreboardMetric,
  type NotificationSettings,
  type OrganizationSettings,
} from "./useSettings";

// Insights
export {
  useInsights,
  useTrainingRecommendations,
  useCostRecommendations,
  usePerformanceInsights,
  useRefreshInsights,
  type InsightsData,
  type InsightSummary,
  type TrainingRecommendation,
  type CostRecommendation,
  type PerformanceInsight,
  type TrainingTopic,
} from "./useInsights";

// Briefing
export {
  useBriefing,
  useTeamOnShift,
  useCompleteBriefing,
  useUploadAttendancePhoto,
  useBriefingHistory,
  type VIPGuest,
  type EightySixedItem,
  type UpsellItem,
  type TrainingTopic as BriefingTrainingTopic,
  type TeamMember,
  type BriefingData,
  type BriefingAttendance,
} from "./useBriefing";
