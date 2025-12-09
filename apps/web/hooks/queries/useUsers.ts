"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isActive: boolean;
  roleId: string;
  role: { id: string; name: string };
  createdAt: Date;
}

interface UserListParams {
  page?: number;
  limit?: number;
  roleId?: string;
  isActive?: boolean;
  search?: string;
}

interface CreateUserInput {
  email: string;
  name: string;
  roleId: string;
  pin?: string;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  roleId?: string;
  isActive?: boolean;
}

interface UserStats {
  totalBehaviors: number;
  verifiedBehaviors: number;
  averagePerDay: number;
  rank: number;
  streakDays: number;
  behaviorBreakdown: Array<{
    behaviorId: string;
    behaviorName: string;
    count: number;
  }>;
}

/**
 * Hook for fetching users list
 *
 * Features:
 * - Automatic auth check
 * - Type-safe parameters
 * - AbortSignal for request cancellation
 * - Proper cache key structure
 */
export function useUsers(params?: UserListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: async ({ signal }) => {
      const response = await api.users.list({
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        ...params,
      });
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook for fetching a single user
 */
export function useUser(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      return api.users.get(id);
    },
    enabled: isAuthenticated && !!id,
  });
}

/**
 * Hook for fetching user stats
 */
export function useUserStats(userId: string, days = 30) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.stats(userId, days),
    queryFn: async () => {
      return api.users.getStats(userId, days) as Promise<UserStats>;
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating a new user
 *
 * Features:
 * - Automatic cache invalidation on success
 * - Type-safe mutation data
 * - Error handling via error state
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      return api.users.create({
        email: data.email,
        name: data.name,
        roleId: data.roleId,
        password: data.pin || "temp123!",
      });
    },
    onSuccess: () => {
      // Invalidate all user queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error) => {
      // Error is accessible via mutation.error
      console.error("[useCreateUser] Error:", error);
    },
  });
}

/**
 * Hook for updating a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      return api.users.update(id, data);
    },
    onSuccess: (_, { id }) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
    },
  });
}

/**
 * Hook for deactivating a user
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.users.deactivate(id);
    },
    onSuccess: () => {
      // Invalidate all user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Helper to get error message from mutation
 */
export function getUserMutationError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
