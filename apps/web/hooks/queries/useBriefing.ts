"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";

// Types
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
  relatedBehavior: string;
  tips: string[];
  videoUrl?: string;
  videoDuration?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface BriefingData {
  id: string;
  date: string;
  reservations: {
    total: number;
    lunch: number;
    dinner: number;
  };
  vipGuests: VIPGuest[];
  eightySixed: EightySixedItem[];
  upsellItems: {
    food: UpsellItem[];
    beverage: UpsellItem[];
  };
  trainingTopic: TrainingTopic;
  teamOnShift: TeamMember[];
}

export interface BriefingAttendance {
  briefingId: string;
  attendeeIds: string[];
  completedAt: string;
  completedBy: string;
  photoUrl?: string;
}

// Demo data for briefing
const DEMO_BRIEFING: BriefingData = {
  id: "briefing-" + new Date().toISOString().split("T")[0],
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  reservations: {
    total: 47,
    lunch: 12,
    dinner: 35,
  },
  vipGuests: [
    {
      name: "Johnson Party",
      table: "12",
      notes: "Anniversary dinner, bring champagne",
    },
    {
      name: "Mayor Williams",
      table: "VIP 1",
      notes: "Business meeting, quiet table",
    },
    {
      name: "Regular - Smith",
      table: "8",
      notes: "Usual order: Old Fashioned",
    },
  ],
  eightySixed: [
    {
      item: "Salmon",
      reason: "Delivery delayed until tomorrow",
      alternatives: ["Branzino (similar preparation)"],
    },
    {
      item: "Chocolate Lava Cake",
      reason: "Sold out",
      alternatives: ["Tiramisu", "Crème Brûlée"],
    },
  ],
  upsellItems: {
    food: [
      {
        item: "Wagyu Ribeye",
        margin: "High",
        description: "Fresh delivery today, feature special",
      },
      {
        item: "Truffle Risotto",
        margin: "High",
        description: "Chef's recommendation",
      },
    ],
    beverage: [
      {
        item: "Reserve Cabernet 2018",
        margin: "High",
        description: "Pairs with ribeye",
      },
      {
        item: "Aperol Spritz",
        margin: "Medium",
        description: "Happy hour push",
      },
    ],
  },
  trainingTopic: {
    title: "Wine Pairing Basics",
    description:
      "Focus on suggesting wine pairings with entrees. Every table should be offered a wine suggestion.",
    relatedBehavior: "Suggest Wine Pairing",
    tips: [
      "Ask about preferences: red, white, or bubbly?",
      "Mention 2-3 options in different price ranges",
      "Describe flavor profiles, not just grape varieties",
    ],
    videoUrl: "/videos/wine-pairing-training.mp4",
    videoDuration: "2 min",
  },
  teamOnShift: [
    { id: "1", name: "Sarah Miller", role: "Server", avatar: "SM" },
    { id: "2", name: "Mike Johnson", role: "Server", avatar: "MJ" },
    { id: "3", name: "Emily Chen", role: "Server", avatar: "EC" },
    { id: "4", name: "James Wilson", role: "Bartender", avatar: "JW" },
    { id: "5", name: "Lisa Park", role: "Server", avatar: "LP" },
    { id: "6", name: "Tom Brown", role: "Host", avatar: "TB" },
  ],
};

/**
 * Hook for fetching today's briefing data
 *
 * Note: Currently returns demo data as briefing API endpoint
 * is not yet implemented (integrates with reservation/scheduling systems).
 */
export function useBriefing(date?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.briefing.byDate(date || new Date().toISOString().split("T")[0]),
    queryFn: async (): Promise<BriefingData> => {
      // TODO: Replace with actual API call when briefing endpoint is available
      // return api.briefing.get(date);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      return {
        ...DEMO_BRIEFING,
        id: `briefing-${date || new Date().toISOString().split("T")[0]}`,
        date: date
          ? new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : DEMO_BRIEFING.date,
      };
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
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 400));
      return DEMO_BRIEFING.teamOnShift;
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
      // TODO: Replace with actual API call
      // return api.briefing.complete(data);

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        briefingId: data.briefingId,
        attendeeIds: data.attendeeIds,
        completedAt: new Date().toISOString(),
        completedBy: "current-user", // Would come from auth context
        photoUrl: data.photoUrl,
      };
    },
    onSuccess: (_, variables) => {
      // Invalidate briefing queries
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
      // TODO: Replace with actual file upload API
      // const formData = new FormData();
      // formData.append('file', file);
      // return api.upload.attendanceSheet(formData);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Return mock URL
      return {
        url: `/uploads/attendance-${Date.now()}.jpg`,
      };
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
    queryFn: async (): Promise<BriefingAttendance[]> => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate mock history
      const history: BriefingAttendance[] = [];
      for (let i = 1; i <= limit; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push({
          briefingId: `briefing-${date.toISOString().split("T")[0]}`,
          attendeeIds: DEMO_BRIEFING.teamOnShift
            .slice(0, Math.floor(Math.random() * 3) + 4)
            .map((m) => m.id),
          completedAt: date.toISOString(),
          completedBy: "manager-1",
        });
      }
      return history;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Export types
export type { BriefingData as Briefing };
