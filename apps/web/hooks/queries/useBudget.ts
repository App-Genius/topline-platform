"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";

// Types
interface BudgetCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  budget: number;
  actual: number;
  color: string;
}

interface BudgetSummary {
  totalBudget: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
}

interface BudgetAlert {
  type: "warning" | "success" | "info";
  category: string;
  message: string;
  suggestion: string;
}

interface BudgetData {
  period: string;
  summary: BudgetSummary;
  categories: BudgetCategory[];
  alerts: BudgetAlert[];
  monthlyTrend: Array<{
    month: string;
    budget: number;
    actual: number;
  }>;
}

interface UpdateBudgetInput {
  period: string;
  categories: Array<{
    id: string;
    budget: number;
  }>;
}

// Demo data for when API is not available
const DEMO_BUDGET_DATA: BudgetData = {
  period: "December 2024",
  summary: {
    totalBudget: 285000,
    totalActual: 298500,
    variance: -13500,
    variancePercent: -4.7,
  },
  categories: [
    { id: "revenue", name: "Revenue", type: "income", budget: 450000, actual: 465000, color: "#10b981" },
    { id: "cogs", name: "Cost of Goods Sold", type: "expense", budget: 135000, actual: 142000, color: "#f59e0b" },
    { id: "labor", name: "Labor", type: "expense", budget: 90000, actual: 95500, color: "#3b82f6" },
    { id: "utilities", name: "Utilities", type: "expense", budget: 15000, actual: 16200, color: "#8b5cf6" },
    { id: "rent", name: "Rent", type: "expense", budget: 25000, actual: 25000, color: "#6366f1" },
    { id: "marketing", name: "Marketing", type: "expense", budget: 8000, actual: 7800, color: "#ec4899" },
    { id: "maintenance", name: "Maintenance", type: "expense", budget: 5000, actual: 4500, color: "#14b8a6" },
    { id: "other", name: "Other Expenses", type: "expense", budget: 7000, actual: 7500, color: "#64748b" },
  ],
  alerts: [
    {
      type: "warning",
      category: "Cost of Goods Sold",
      message: "5.2% over budget. Food costs have increased due to supplier price hikes.",
      suggestion: "Consider renegotiating with vendors or finding alternatives.",
    },
    {
      type: "warning",
      category: "Labor",
      message: "6.1% over budget. Overtime hours exceeded projections.",
      suggestion: "Review scheduling efficiency and consider cross-training.",
    },
    {
      type: "success",
      category: "Revenue",
      message: "3.3% above target! Keep up the momentum.",
      suggestion: "Analyze which behaviors contributed most to this increase.",
    },
  ],
  monthlyTrend: [
    { month: "Jul", budget: 280000, actual: 275000 },
    { month: "Aug", budget: 285000, actual: 290000 },
    { month: "Sep", budget: 282000, actual: 278000 },
    { month: "Oct", budget: 290000, actual: 295000 },
    { month: "Nov", budget: 288000, actual: 292000 },
    { month: "Dec", budget: 285000, actual: 298500 },
  ],
};

/**
 * Hook for fetching budget data
 *
 * Note: Currently returns demo data as budget API endpoint
 * is not yet implemented on the backend.
 */
export function useBudget(period?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.budget.current(period),
    queryFn: async (): Promise<BudgetData> => {
      // TODO: Replace with actual API call when endpoint is available
      // return api.budget.getCurrent(period);

      // For now, return demo data
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      return DEMO_BUDGET_DATA;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching budget categories
 */
export function useBudgetCategories() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.budget.categories(),
    queryFn: async (): Promise<BudgetCategory[]> => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 300));
      return DEMO_BUDGET_DATA.categories;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000, // 1 hour - categories rarely change
  });
}

/**
 * Hook for fetching budget trends
 */
export function useBudgetTrends(months = 6) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.budget.trends(months),
    queryFn: async () => {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 400));
      return DEMO_BUDGET_DATA.monthlyTrend;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for updating budget
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBudgetInput): Promise<BudgetData> => {
      // TODO: Replace with actual API call
      // return api.budget.update(data);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate updating budget
      const updatedCategories = DEMO_BUDGET_DATA.categories.map((cat) => {
        const update = data.categories.find((u) => u.id === cat.id);
        return update ? { ...cat, budget: update.budget } : cat;
      });

      return {
        ...DEMO_BUDGET_DATA,
        categories: updatedCategories,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
    },
  });
}

// Export types for use in components
export type { BudgetData, BudgetCategory, BudgetSummary, BudgetAlert };
