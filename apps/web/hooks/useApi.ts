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
