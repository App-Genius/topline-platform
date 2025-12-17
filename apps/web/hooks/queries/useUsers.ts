"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";
import {
  getUsers,
  getUser,
  getUserStats,
  createUser,
  updateUser,
  deactivateUser,
} from "@/actions/users";

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isActive: boolean;
  roleId: string;
  role: { id: string; name: string; type: string };
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
 */
export function useUsers(params?: UserListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getUsers({
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        ...params,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
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
      const result = await getUser(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
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
      const result = await getUserStats(userId, days);
      if (!result.success) throw new Error(result.error);
      return result.data as UserStats;
    },
    enabled: isAuthenticated && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for creating a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const result = await createUser({
        email: data.email,
        name: data.name,
        roleId: data.roleId,
        password: data.pin || "temp123!",
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error) => {
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
      const result = await updateUser(id, data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, { id }) => {
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
      const result = await deactivateUser(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Helper to get error message from mutation
 */
export function getUserMutationError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
