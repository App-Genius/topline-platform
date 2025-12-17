"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { queryOptions } from "@/lib/query-client";
import { useAuth } from "@/context/AuthContext";
import {
  getCurrentOrganization,
  updateOrganization,
  getOrganizationSettings,
  updateOrganizationSettings,
} from "@/actions/organizations";

// Types
interface ScoreboardMetric {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface ScoreboardSettings {
  metrics: ScoreboardMetric[];
  refreshInterval: number;
  showLeaderboard: boolean;
  anonymizeNames: boolean;
  theme: "dark" | "light";
}

interface NotificationSettings {
  emailAlerts: boolean;
  budgetWarnings: boolean;
  performanceUpdates: boolean;
}

interface OrganizationSettings {
  name: string;
  industry: string;
}

interface SettingsData {
  organization: OrganizationSettings;
  scoreboard: ScoreboardSettings;
  notifications: NotificationSettings;
}

interface UpdateSettingsInput {
  organization?: Partial<OrganizationSettings>;
  scoreboard?: Partial<ScoreboardSettings>;
  notifications?: Partial<NotificationSettings>;
}

// Default settings
const DEFAULT_SETTINGS: SettingsData = {
  organization: {
    name: "Acme Restaurant Group",
    industry: "RESTAURANT",
  },
  scoreboard: {
    metrics: [
      { id: "revenue", name: "Today's Revenue", description: "Shows daily revenue vs target", enabled: true },
      { id: "behaviors", name: "Team Behaviors", description: "Total lead measures logged today", enabled: true },
      { id: "avgCheck", name: "Average Check", description: "Per-person average check amount", enabled: true },
      { id: "topPerformer", name: "Top Performer", description: "Highlights the current leader", enabled: true },
      { id: "covers", name: "Total Covers", description: "Number of guests served today", enabled: false },
      { id: "rating", name: "Customer Rating", description: "Average rating from reviews", enabled: false },
    ],
    refreshInterval: 30,
    showLeaderboard: true,
    anonymizeNames: false,
    theme: "dark",
  },
  notifications: {
    emailAlerts: true,
    budgetWarnings: true,
    performanceUpdates: false,
  },
};

/**
 * Hook for fetching all settings
 */
export function useSettings() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.settings.current(),
    queryFn: async (): Promise<SettingsData> => {
      // Try to get organization settings from Server Action
      try {
        const result = await getOrganizationSettings();
        if (result.success && result.data) {
          const { organization, settings } = result.data;
          return {
            organization: {
              name: organization.name,
              industry: organization.industry || "RESTAURANT",
            },
            scoreboard: {
              ...DEFAULT_SETTINGS.scoreboard,
              ...(settings.scoreboard || {}),
              metrics: settings.scoreboard?.metrics || DEFAULT_SETTINGS.scoreboard.metrics,
            },
            notifications: {
              ...DEFAULT_SETTINGS.notifications,
              ...(settings.notifications || {}),
            },
          };
        }
        return DEFAULT_SETTINGS;
      } catch {
        // Return defaults if action fails
        return DEFAULT_SETTINGS;
      }
    },
    enabled: isAuthenticated,
    ...queryOptions.static,
  });
}

/**
 * Hook for fetching scoreboard settings
 */
export function useScoreboardSettings() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.settings.scoreboard(),
    queryFn: async (): Promise<ScoreboardSettings> => {
      // TODO: Replace with actual API call when endpoint exists
      await new Promise((resolve) => setTimeout(resolve, 300));
      return DEFAULT_SETTINGS.scoreboard;
    },
    enabled: isAuthenticated,
    ...queryOptions.static,
  });
}

/**
 * Hook for fetching notification settings
 */
export function useNotificationSettings() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.settings.notifications(),
    queryFn: async (): Promise<NotificationSettings> => {
      // TODO: Replace with actual API call when endpoint exists
      await new Promise((resolve) => setTimeout(resolve, 200));
      return DEFAULT_SETTINGS.notifications;
    },
    enabled: isAuthenticated,
    ...queryOptions.static,
  });
}

/**
 * Hook for updating settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettingsInput): Promise<SettingsData> => {
      // Update organization name/industry if changed
      if (data.organization) {
        const result = await updateOrganization({
          name: data.organization.name,
          industry: data.organization.industry,
        });
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Update scoreboard and notification settings
      if (data.scoreboard || data.notifications) {
        const settingsResult = await updateOrganizationSettings({
          scoreboard: data.scoreboard,
          notifications: data.notifications,
        });
        if (!settingsResult.success) {
          throw new Error(settingsResult.error);
        }
      }

      // Merge with current settings
      const currentSettings = queryClient.getQueryData<SettingsData>(
        queryKeys.settings.current()
      ) || DEFAULT_SETTINGS;

      return {
        organization: { ...currentSettings.organization, ...data.organization },
        scoreboard: { ...currentSettings.scoreboard, ...data.scoreboard },
        notifications: { ...currentSettings.notifications, ...data.notifications },
      };
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.all });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<SettingsData>(
        queryKeys.settings.current()
      );

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData(queryKeys.settings.current(), {
          organization: { ...previousSettings.organization, ...data.organization },
          scoreboard: { ...previousSettings.scoreboard, ...data.scoreboard },
          notifications: { ...previousSettings.notifications, ...data.notifications },
        });
      }

      return { previousSettings };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.settings.current(), context.previousSettings);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.current() });
    },
  });
}

// Export types for use in components
export type {
  SettingsData,
  ScoreboardSettings,
  ScoreboardMetric,
  NotificationSettings,
  OrganizationSettings,
};
