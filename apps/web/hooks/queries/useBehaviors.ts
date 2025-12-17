"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";
import {
  getBehaviors,
  getBehavior,
  getBehaviorStats,
  createBehavior,
  updateBehavior,
  deleteBehavior,
} from "@/actions/behaviors";
import {
  getBehaviorLogs,
  getPendingLogs,
  createBehaviorLog,
  verifyBehaviorLog,
} from "@/actions/behavior-logs";

// Types
interface Behavior {
  id: string;
  name: string;
  description: string | null;
  targetPerDay: number;
  points: number;
  isActive: boolean;
  organizationId: string;
  roles: Array<{ id: string; name: string }>;
  createdAt: Date;
}

interface BehaviorListParams {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

interface CreateBehaviorInput {
  name: string;
  description?: string;
  points: number;
  frequency?: string;
  roleIds?: string[];
  targetPerDay?: number;
}

interface UpdateBehaviorInput {
  name?: string;
  description?: string;
  points?: number;
  frequency?: string;
  isActive?: boolean;
  roleIds?: string[];
}

interface BehaviorStats {
  totalLogs: number;
  verifiedLogs: number;
  verificationRate: number;
  averagePerDay: number;
  topPerformers: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  dailyTrend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Hook for fetching behaviors list
 */
export function useBehaviors(params?: BehaviorListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.behaviors.list(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getBehaviors({
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        ...params,
      });
      if (!result.success) throw new Error(result.error);
      return result.data?.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook for fetching a single behavior
 */
export function useBehavior(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.behaviors.detail(id),
    queryFn: async () => {
      const result = await getBehavior(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isAuthenticated && !!id,
  });
}

/**
 * Hook for fetching behavior stats
 */
export function useBehaviorStats(behaviorId: string, days = 30) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.behaviors.stats(behaviorId, days),
    queryFn: async () => {
      const result = await getBehaviorStats(behaviorId, days);
      if (!result.success) throw new Error(result.error);
      return result.data as BehaviorStats;
    },
    enabled: isAuthenticated && !!behaviorId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating a new behavior
 */
export function useCreateBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBehaviorInput) => {
      const result = await createBehavior({
        name: data.name,
        description: data.description,
        points: data.points,
        targetPerDay: data.targetPerDay ?? 5,
        roleIds: data.roleIds,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviors.all });
    },
  });
}

/**
 * Hook for updating a behavior
 */
export function useUpdateBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBehaviorInput }) => {
      const result = await updateBehavior(id, data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviors.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviors.lists() });
    },
  });
}

/**
 * Hook for deleting a behavior
 */
export function useDeleteBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBehavior(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviors.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorLogs.all });
    },
  });
}

/**
 * Helper to get error message from mutation
 */
export function getBehaviorMutationError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

// ============================================
// BEHAVIOR LOGS HOOKS
// ============================================

interface BehaviorLog {
  id: string;
  behaviorId: string;
  userId: string;
  verified: boolean;
  verifiedAt: Date | null;
  verifiedById: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  user: { id: string; name: string };
  behavior: { id: string; name: string };
}

interface BehaviorLogListParams {
  page?: number;
  limit?: number;
  userId?: string;
  behaviorId?: string;
  verified?: boolean;
  startDate?: Date;
  endDate?: Date;
}

interface CreateBehaviorLogInput {
  behaviorId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hook for fetching behavior logs
 */
export function useBehaviorLogs(params?: BehaviorLogListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.behaviorLogs.list(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getBehaviorLogs({
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        ...params,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for fetching pending verifications
 */
export function usePendingVerifications() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.behaviorLogs.pending(),
    queryFn: async () => {
      const result = await getPendingLogs();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook for logging a behavior
 */
export function useLogBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBehaviorLogInput) => {
      const result = await createBehaviorLog(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorLogs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.dashboard() });
    },
  });
}

/**
 * Hook for verifying a behavior log
 */
export function useVerifyBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const result = await verifyBehaviorLog(id, verified);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorLogs.all });
    },
  });
}
