"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";
import {
  getTodaysBriefing,
  completeBriefing as completeBriefingAction,
  uploadAttendancePhoto as uploadAttendancePhotoAction,
  getBriefingHistory as getBriefingHistoryAction,
  getTeamOnShift as getTeamOnShiftAction,
} from "@/actions";
import type {
  BriefingData,
  BriefingAttendance,
  BriefingHistoryEntry,
  TeamMember,
} from "@/actions/briefings";

// Re-export types for consumers
export type { BriefingData, BriefingAttendance, BriefingHistoryEntry, TeamMember };

// Additional types for compatibility
export interface VIPGuest {
  name: string;
  table: string;
  notes: string;
}

export interface EightySixedItem {
  item: string;
  reason: string;
  alternatives?: string[];
}

export interface UpsellItem {
  item: string;
  margin: "High" | "Medium" | "Low";
  description: string;
}

export interface TrainingTopic {
  title: string;
  description: string;
  relatedBehavior?: string;
  tips: string[];
  videoUrl?: string;
  videoDuration?: string;
}

// Briefing type alias for backwards compatibility
export type Briefing = BriefingData;

/**
 * Hook for fetching today's briefing data
 */
export function useBriefing(date?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.briefing.byDate(date || new Date().toISOString().split("T")[0]),
    queryFn: async (): Promise<BriefingData> => {
      const result = await getTodaysBriefing(date);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch briefing");
      }

      return result.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching team members on shift
 */
export function useTeamOnShift(date?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.briefing.team(date || new Date().toISOString().split("T")[0]),
    queryFn: async (): Promise<TeamMember[]> => {
      const result = await getTeamOnShiftAction(date);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch team members");
      }

      return result.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for completing a briefing with attendance
 */
export function useCompleteBriefing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      briefingId: string;
      attendeeIds: string[];
      photoUrl?: string;
    }): Promise<BriefingAttendance> => {
      // Extract the date from briefingId (format: "briefing-YYYY-MM-DD")
      const date = data.briefingId.replace("briefing-", "");

      // Get the training topic ID from the cached briefing data
      const cachedBriefing = queryClient.getQueryData<BriefingData>(
        queryKeys.briefing.byDate(date)
      );

      const trainingTopicId = cachedBriefing?.trainingTopic?.id || "default";

      const result = await completeBriefingAction({
        date,
        trainingTopicId,
        attendeeIds: data.attendeeIds,
        photoUrl: data.photoUrl,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to complete briefing");
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate briefing queries to refresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.briefing.all,
      });
    },
  });
}

/**
 * Hook for uploading attendance sheet photo
 */
export function useUploadAttendancePhoto() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAttendancePhotoAction(formData);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to upload photo");
      }

      return result.data;
    },
  });
}

/**
 * Hook for fetching past briefings history
 */
export function useBriefingHistory(limit: number = 7) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.briefing.history(limit),
    queryFn: async (): Promise<BriefingHistoryEntry[]> => {
      const result = await getBriefingHistoryAction({ limit, days: 30 });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch briefing history");
      }

      return result.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
