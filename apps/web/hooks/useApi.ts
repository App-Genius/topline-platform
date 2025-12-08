"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

// Generic hook for API calls with loading/error state
interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApiCall<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// Dashboard data hook
export function useDashboard(days = 30) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.organizations.getDashboard(days);
    },
    [isAuthenticated, days]
  );
}

// Daily entries stats hook
export function useDailyStats(days = 30, locationId?: string) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.dailyEntries.getStats(days, locationId);
    },
    [isAuthenticated, days, locationId]
  );
}

// Behaviors list hook
export function useBehaviors() {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      const result = await api.behaviors.list();
      return result.data;
    },
    [isAuthenticated]
  );
}

// Behavior logs hook
export function useBehaviorLogs(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  behaviorId?: string;
  verified?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.behaviorLogs.list({ page: 1, limit: 50, ...params });
    },
    [isAuthenticated, JSON.stringify(params)]
  );
}

// Pending verifications hook
export function usePendingVerifications() {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.behaviorLogs.getPending();
    },
    [isAuthenticated]
  );
}

// Users list hook
export function useUsers(params?: {
  page?: number;
  limit?: number;
  roleId?: string;
  isActive?: boolean;
  search?: string;
}) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.users.list({ page: 1, limit: 50, ...params });
    },
    [isAuthenticated, JSON.stringify(params)]
  );
}

// User stats hook
export function useUserStats(userId: string, days = 30) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated || !userId) return null;
      return api.users.getStats(userId, days);
    },
    [isAuthenticated, userId, days]
  );
}

// Organization hook
export function useOrganization() {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.organizations.getCurrent();
    },
    [isAuthenticated]
  );
}

// Locations hook
export function useLocations() {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.organizations.getLocations();
    },
    [isAuthenticated]
  );
}

// Benchmarks hook
export function useBenchmarks() {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.organizations.getBenchmarks();
    },
    [isAuthenticated]
  );
}

// Log behavior mutation
export function useLogBehavior() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logBehavior = useCallback(async (behaviorId: string, metadata?: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.behaviorLogs.create({ behaviorId, metadata });
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to log behavior';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { logBehavior, isLoading, error };
}

// Verify behavior log mutation
export function useVerifyBehavior() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyBehavior = useCallback(async (logId: string, verified: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.behaviorLogs.verify(logId, verified);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to verify behavior';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { verifyBehavior, isLoading, error };
}

// Roles list hook
export function useRoles(params?: { page?: number; limit?: number }) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.roles.list({ page: 1, limit: 100, ...params });
    },
    [isAuthenticated, JSON.stringify(params)]
  );
}

// Create role mutation
export function useCreateRole() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRole = useCallback(async (data: {
    name: string;
    permissions: string[];
    type?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.roles.create({
        name: data.name,
        permissions: data.permissions,
        type: (data.type || 'CUSTOM') as 'ADMIN' | 'MANAGER' | 'SERVER' | 'HOST' | 'BARTENDER' | 'BUSSER' | 'PURCHASER' | 'CHEF' | 'ACCOUNTANT' | 'FACILITIES' | 'CUSTOM',
      });
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create role';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createRole, isLoading, error };
}

// Update role mutation
export function useUpdateRole() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRole = useCallback(async (id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.roles.update(id, data);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update role';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateRole, isLoading, error };
}

// Delete role mutation
export function useDeleteRole() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteRole = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.roles.delete(id);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete role';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteRole, isLoading, error };
}

// Create user mutation
export function useCreateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(async (data: {
    email: string;
    name: string;
    roleId: string;
    pin?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.users.create({
        email: data.email,
        name: data.name,
        roleId: data.roleId,
        password: data.pin || 'temp123!',
      });
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create user';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createUser, isLoading, error };
}

// Update user mutation
export function useUpdateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = useCallback(async (id: string, data: {
    name?: string;
    email?: string;
    roleId?: string;
    isActive?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.users.update(id, data);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update user';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateUser, isLoading, error };
}

// Deactivate user mutation
export function useDeactivateUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivateUser = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.users.deactivate(id);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to deactivate user';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deactivateUser, isLoading, error };
}

// Create behavior mutation
export function useCreateBehavior() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBehavior = useCallback(async (data: {
    name: string;
    description?: string;
    points: number;
    frequency?: string;
    roleIds?: string[];
    targetPerDay?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.behaviors.create({
        name: data.name,
        description: data.description,
        points: data.points,
        targetPerDay: data.targetPerDay ?? 5,
        roleIds: data.roleIds,
      });
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create behavior';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createBehavior, isLoading, error };
}

// Update behavior mutation
export function useUpdateBehavior() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBehavior = useCallback(async (id: string, data: {
    name?: string;
    description?: string;
    points?: number;
    frequency?: string;
    isActive?: boolean;
    roleIds?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.behaviors.update(id, data);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update behavior';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateBehavior, isLoading, error };
}

// Delete behavior mutation
export function useDeleteBehavior() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBehavior = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.behaviors.delete(id);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete behavior';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { deleteBehavior, isLoading, error };
}

// Behavior stats hook
export function useBehaviorStats(behaviorId: string, days = 30) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated || !behaviorId) return null;
      return api.behaviors.getStats(behaviorId, days);
    },
    [isAuthenticated, behaviorId, days]
  );
}

// Daily entries hook
export function useDailyEntries(params?: {
  page?: number;
  limit?: number;
  locationId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { isAuthenticated } = useAuth();

  return useApiCall(
    async () => {
      if (!isAuthenticated) return null;
      return api.dailyEntries.list({ page: 1, limit: 50, ...params });
    },
    [isAuthenticated, JSON.stringify(params)]
  );
}

// Upsert daily entry mutation
export function useUpsertDailyEntry() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertEntry = useCallback(async (data: {
    date: string | Date;
    locationId: string;
    totalRevenue?: number;
    totalCovers?: number;
    notes?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.dailyEntries.upsert({
        locationId: data.locationId,
        date: data.date instanceof Date ? data.date : new Date(data.date),
        totalRevenue: data.totalRevenue ?? 0,
        totalCovers: data.totalCovers ?? 0,
        notes: data.notes,
      });
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save daily entry';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { upsertEntry, isLoading, error };
}

// Update organization mutation
export function useUpdateOrganization() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrganization = useCallback(async (data: {
    name?: string;
    settings?: Record<string, unknown>;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.organizations.update(data);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update organization';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateOrganization, isLoading, error };
}

// Create location mutation
export function useCreateLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLocation = useCallback(async (data: { name: string; address?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.organizations.createLocation(data);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create location';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { createLocation, isLoading, error };
}

// Upsert benchmark mutation
export function useUpsertBenchmark() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upsertBenchmark = useCallback(async (data: {
    year: number;
    totalRevenue: number;
    daysOpen: number;
    baselineAvgCheck?: number;
    baselineRating?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.organizations.upsertBenchmark({
        year: data.year,
        totalRevenue: data.totalRevenue,
        daysOpen: data.daysOpen,
        baselineAvgCheck: data.baselineAvgCheck,
        baselineRating: data.baselineRating ?? 4.0,
      });
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save benchmark';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { upsertBenchmark, isLoading, error };
}
