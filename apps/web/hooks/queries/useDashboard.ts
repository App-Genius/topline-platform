"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";
import { getDashboard } from "@/actions";

export interface GameState {
  status: "neutral" | "winning" | "losing" | "celebrating";
  currentScore: number;
  targetScore: number;
  percentComplete: number;
  daysRemaining: number;
}

export interface DashboardKpis {
  revenue: { current: number; target: number; trend: number };
  avgCheck: { current: number; baseline: number; trend: number };
  behaviors: { today: number; average: number };
  rating: { current: number; baseline: number };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar: string | null;
  score: number;
}

export interface DashboardData {
  gameState: GameState;
  kpis: DashboardKpis;
  leaderboard: LeaderboardEntry[];
}

/**
 * Hook for fetching dashboard data including game state, KPIs, and leaderboard
 */
export function useDashboard(days: number = 30) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.dashboard.stats(days),
    queryFn: async (): Promise<DashboardData> => {
      const result = await getDashboard(days);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch dashboard data");
      }

      return result.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute - dashboard data should be relatively fresh
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook for fetching just the game state (lightweight)
 */
export function useGameState() {
  const { data, isLoading, error } = useDashboard();

  return {
    gameState: data?.gameState,
    isLoading,
    error,
  };
}

/**
 * Hook for fetching the leaderboard
 */
export function useLeaderboard(days: number = 30) {
  const { data, isLoading, error, refetch } = useDashboard(days);

  return {
    leaderboard: data?.leaderboard || [],
    isLoading,
    error,
    refetch,
  };
}
