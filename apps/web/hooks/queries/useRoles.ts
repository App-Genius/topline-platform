"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { queryOptions } from "@/lib/query-client";
import { useAuth } from "@/context/AuthContext";
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "@/actions/roles";

// Types
interface Role {
  id: string;
  name: string;
  type: string;
  permissions: unknown;
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
  type?: string;
  permissions?: string[];
}

/**
 * Hook for fetching roles list
 */
export function useRoles(params?: RoleListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.roles.list(params as Record<string, unknown>),
    queryFn: async () => {
      const result = await getRoles({
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isAuthenticated,
    ...queryOptions.static,
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
      const result = await getRole(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
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
      const result = await createRole({
        name: data.name,
        type: data.type || "CUSTOM",
        permissions: data.permissions,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
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
      const result = await updateRole(id, data);
      if (!result.success) throw new Error(result.error);
      return result.data;
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
      const result = await deleteRole(id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/**
 * Helper to get error message from mutation
 */
export function getRoleMutationError(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}
