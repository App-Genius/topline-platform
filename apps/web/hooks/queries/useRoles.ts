"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { queryOptions } from "@/lib/query-client";
import { useAuth } from "@/context/AuthContext";

// Types
interface Role {
  id: string;
  name: string;
  type: string;
  permissions: string[];
  organizationId: string;
  createdAt: Date;
}

interface RoleListParams {
  page?: number;
  limit?: number;
}

interface CreateRoleInput {
  name: string;
  permissions: string[];
  type?: string;
}

interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * Hook for fetching roles list
 *
 * Roles are relatively static, so we use longer stale times
 */
export function useRoles(params?: RoleListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.roles.list(params),
    queryFn: async () => {
      return api.roles.list({
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        ...params,
      });
    },
    enabled: isAuthenticated,
    ...queryOptions.static, // Roles rarely change
  });
}

/**
 * Hook for fetching a single role
 */
export function useRole(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.roles.detail(id),
    queryFn: async () => {
      return api.roles.get(id);
    },
    enabled: isAuthenticated && !!id,
    ...queryOptions.static,
  });
}

/**
 * Hook for creating a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      return api.roles.create({
        name: data.name,
        permissions: data.permissions,
        type: (data.type || "CUSTOM") as
          | "ADMIN"
          | "MANAGER"
          | "SERVER"
          | "HOST"
          | "BARTENDER"
          | "BUSSER"
          | "PURCHASER"
          | "CHEF"
          | "ACCOUNTANT"
          | "FACILITIES"
          | "CUSTOM",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
  });
}

/**
 * Hook for updating a role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleInput }) => {
      return api.roles.update(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.lists() });
    },
  });
}

/**
 * Hook for deleting a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return api.roles.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      // Also invalidate users since they reference roles
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Helper to get error message from mutation
 */
export function getRoleMutationError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
