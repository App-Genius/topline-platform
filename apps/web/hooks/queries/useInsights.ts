"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";

// Types
interface InsightSummary {
  overallHealth: number;
  opportunities: number;
  actions: number;
}

interface TrainingRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  reason: string;
  impact: string;
  relatedBehavior: string;
  behaviorCompletion: number;
  targetCompletion: number;
}

interface CostRecommendation {
  id: string;
  category: string;
  status: "warning" | "success" | "info";
  variance: number;
  insight: string;
  actions: string[];
  potentialSavings: string;
}

interface PerformanceInsight {
  type: "success" | "warning" | "info";
  title: string;
  description: string;
  metric: string;
}

interface TrainingTopic {
  title: string;
  description: string;
  tips: string[];
  expectedImpact: string;
}

interface InsightsData {
  lastUpdated: string;
  summary: InsightSummary;
  trainingRecommendations: TrainingRecommendation[];
  costRecommendations: CostRecommendation[];
  performanceInsights: PerformanceInsight[];
  suggestedTrainingTopic: TrainingTopic;
}

// Demo insights data
const DEMO_INSIGHTS: InsightsData = {
  lastUpdated: new Date().toLocaleString(),
  summary: {
    overallHealth: 72,
    opportunities: 4,
    actions: 3,
  },
  trainingRecommendations: [
    {
      id: "1",
      priority: "high",
      title: "Wine Pairing Training",
      reason: "Suggestive selling behavior is 23% below target. Staff are missing wine pairing opportunities.",
      impact: "Could increase average check by $8-12 per table",
      relatedBehavior: "Suggest Wine Pairing",
      behaviorCompletion: 42,
      targetCompletion: 65,
    },
    {
      id: "2",
      priority: "medium",
      title: "Dessert Menu Knowledge",
      reason: "Dessert suggestions dropped 15% this month. Team may need refresher on new menu items.",
      impact: "Dessert sales typically add $6-10 to check",
      relatedBehavior: "Offer Dessert Menu",
      behaviorCompletion: 58,
      targetCompletion: 75,
    },
    {
      id: "3",
      priority: "low",
      title: "VIP Guest Recognition",
      reason: "VIP recognition is at 89%, but there's room for improvement to hit excellence.",
      impact: "Improved loyalty and repeat visits",
      relatedBehavior: "Recognize VIP Guest",
      behaviorCompletion: 89,
      targetCompletion: 95,
    },
  ],
  costRecommendations: [
    {
      id: "1",
      category: "Cost of Goods Sold",
      status: "warning",
      variance: 5.2,
      insight: "Food costs are trending 5.2% over budget. Supplier pricing increased this month.",
      actions: [
        "Request quotes from 2 alternative seafood suppliers",
        "Review portion sizes on high-cost items",
        "Consider menu engineering to push higher-margin items",
      ],
      potentialSavings: "$3,200/month",
    },
    {
      id: "2",
      category: "Labor",
      status: "warning",
      variance: 6.1,
      insight: "Overtime hours exceeded projections by 18%. Weekend dinner shifts most affected.",
      actions: [
        "Cross-train servers to cover host duties during peaks",
        "Adjust scheduling to reduce overtime on Fri/Sat",
        "Review reservation pacing to smooth demand",
      ],
      potentialSavings: "$2,800/month",
    },
    {
      id: "3",
      category: "Utilities",
      status: "info",
      variance: 8.0,
      insight: "Utility costs up 8%, mostly seasonal. Some savings possible with efficiency.",
      actions: [
        "Schedule HVAC maintenance check",
        "Review equipment usage during non-peak hours",
      ],
      potentialSavings: "$400/month",
    },
  ],
  performanceInsights: [
    {
      type: "success",
      title: "Revenue Target Exceeded",
      description: "Revenue is 3.3% above target this month. Behavior logging is strongly correlated with this success.",
      metric: "+$14,850",
    },
    {
      type: "info",
      title: "Behavior Adoption Improving",
      description: "Overall behavior adoption increased from 62% to 71% over the past 30 days.",
      metric: "+9%",
    },
    {
      type: "warning",
      title: "Evening Shift Underperforming",
      description: "Dinner service average check is 8% below baseline. Consider targeted coaching.",
      metric: "-$4.20/check",
    },
  ],
  suggestedTrainingTopic: {
    title: "Suggestive Selling: Wine Pairings",
    description: "Based on current performance data, focusing on wine pairing suggestions would have the highest impact on your average check.",
    tips: [
      "Lead with taste profiles, not price points",
      "Suggest pairings with every entree order",
      "Mention limited availability for premium wines",
    ],
    expectedImpact: "+$2,400/week in wine sales",
  },
};

/**
 * Hook for fetching all insights
 *
 * Note: Currently returns demo data as insights API endpoint
 * is not yet implemented (requires AI integration).
 */
export function useInsights() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.insights.current(),
    queryFn: async (): Promise<InsightsData> => {
      // TODO: Replace with actual API call when AI insights endpoint is available
      // return api.insights.getCurrent();

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        ...DEMO_INSIGHTS,
        lastUpdated: new Date().toLocaleString(),
      };
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching training recommendations only
 */
export function useTrainingRecommendations() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.insights.training(),
    queryFn: async (): Promise<TrainingRecommendation[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return DEMO_INSIGHTS.trainingRecommendations;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching cost recommendations only
 */
export function useCostRecommendations() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.insights.costs(),
    queryFn: async (): Promise<CostRecommendation[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return DEMO_INSIGHTS.costRecommendations;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching performance insights only
 */
export function usePerformanceInsights() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.insights.performance(),
    queryFn: async (): Promise<PerformanceInsight[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return DEMO_INSIGHTS.performanceInsights;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for refreshing insights (triggers AI regeneration)
 */
export function useRefreshInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<InsightsData> => {
      // TODO: Replace with actual API call to trigger AI regeneration
      // return api.insights.refresh();

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        ...DEMO_INSIGHTS,
        lastUpdated: new Date().toLocaleString(),
        // Simulate some variation in the data
        summary: {
          ...DEMO_INSIGHTS.summary,
          overallHealth: Math.floor(Math.random() * 10) + 68, // 68-78 range
        },
      };
    },
    onSuccess: (data) => {
      // Update cache with new insights
      queryClient.setQueryData(queryKeys.insights.current(), data);
    },
  });
}

// Export types for use in components
export type {
  InsightsData,
  InsightSummary,
  TrainingRecommendation,
  CostRecommendation,
  PerformanceInsight,
  TrainingTopic,
};
