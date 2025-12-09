"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";

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
    queryKey: queryKeys.behaviors.list(params),
    queryFn: async () => {
      const response = await api.behaviors.list({
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        ...params,
      });
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
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
      return api.behaviors.get(id);
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
      return api.behaviors.getStats(behaviorId, days) as Promise<BehaviorStats>;
    },
    enabled: isAuthenticated && !!behaviorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating a new behavior
 */
export function useCreateBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBehaviorInput) => {
      return api.behaviors.create({
        name: data.name,
        description: data.description,
        points: data.points,
        targetPerDay: data.targetPerDay ?? 5,
        roleIds: data.roleIds,
      });
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
      return api.behaviors.update(id, data);
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
      return api.behaviors.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviors.all });
      // Also invalidate behavior logs
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorLogs.all });
    },
  });
}

/**
 * Helper to get error message from mutation
 */
export function getBehaviorMutationError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
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
  startDate?: string;
  endDate?: string;
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
    queryKey: queryKeys.behaviorLogs.list(params),
    queryFn: async () => {
      return api.behaviorLogs.list({
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        ...params,
      });
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds - logs change frequently
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
      return api.behaviorLogs.getPending();
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
      return api.behaviorLogs.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorLogs.all });
      // Also invalidate dashboard for real-time updates
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
      return api.behaviorLogs.verify(id, verified);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.behaviorLogs.all });
    },
  });
}
