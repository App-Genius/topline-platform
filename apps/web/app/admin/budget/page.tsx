"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart,
  BarChart3,
  Calendar,
  Edit2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from "recharts";
import { useBudget, type BudgetCategory } from "@/hooks/queries";
import { LoadingSpinner, ErrorAlert, Button } from "@/components/ui";

export default function BudgetPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("December 2024");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Use React Query hook for data fetching
  const { data: budgetData, isLoading, error } = useBudget(selectedPeriod);

  // Loading state
  if (isLoading && !budgetData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner label="Loading budget data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <ErrorAlert message={error.message || "Failed to load budget data"} />
      </div>
    );
  }

  // Use data from hook or empty defaults
  const {
    period = selectedPeriod,
    summary = { totalBudget: 0, totalActual: 0, variance: 0, variancePercent: 0 },
    categories = [],
    alerts = [],
    monthlyTrend = [],
  } = budgetData || {};

  const expenseCategories = categories.filter((c: BudgetCategory) => c.type === "expense");
  const revenueCategory = categories.find((c: BudgetCategory) => c.type === "income");

  const pieData = expenseCategories.map((cat: BudgetCategory) => ({
    name: cat.name,
    value: cat.actual,
    color: cat.color,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getVarianceColor = (variance: number, isExpense: boolean) => {
    if (isExpense) {
      return variance > 0 ? "text-red-600" : "text-emerald-600";
    }
    return variance > 0 ? "text-emerald-600" : "text-red-600";
  };

  const getVarianceBg = (variance: number, isExpense: boolean) => {
    if (isExpense) {
      return variance > 0 ? "bg-red-50" : "bg-emerald-50";
    }
    return variance > 0 ? "bg-emerald-50" : "bg-red-50";
  };

  return (
    <div className="p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <PieChart className="text-emerald-600" />
            Budget Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Track expenses and revenue against your budget
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="period-select" className="sr-only">Select period</label>
          <select
            id="period-select"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option>December 2024</option>
            <option>November 2024</option>
            <option>October 2024</option>
            <option>Q4 2024</option>
          </select>
          <Button leftIcon={<Edit2 className="w-5 h-5" />}>
            Edit Budget
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Revenue</p>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(revenueCategory?.actual || 0)}
          </p>
          <p className="text-sm text-emerald-600 mt-1">
            +3.3% vs budget
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Total Expenses</p>
            <div className="p-2 bg-amber-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.totalActual)}
          </p>
          <p className="text-sm text-red-600 mt-1">
            +{Math.abs(summary.variancePercent).toFixed(1)}% vs budget
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">Gross Profit</p>
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(
              (revenueCategory?.actual || 0) - summary.totalActual
            )}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {(
              (((revenueCategory?.actual || 0) - summary.totalActual) /
                (revenueCategory?.actual || 1)) *
              100
            ).toFixed(1)}
            % margin
          </p>
        </div>

        <div
          className={clsx(
            "rounded-xl shadow-sm border p-6",
            summary.variance < 0
              ? "bg-red-50 border-red-200"
              : "bg-emerald-50 border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className={clsx(
                "text-sm",
                summary.variance < 0
                  ? "text-red-600"
                  : "text-emerald-600"
              )}
            >
              Budget Variance
            </p>
            <div
              className={clsx(
                "p-2 rounded-lg",
                summary.variance < 0
                  ? "bg-red-100"
                  : "bg-emerald-100"
              )}
            >
              {summary.variance < 0 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              )}
            </div>
          </div>
          <p
            className={clsx(
              "text-2xl font-bold",
              summary.variance < 0 ? "text-red-700" : "text-emerald-700"
            )}
          >
            {formatCurrency(Math.abs(summary.variance))}
          </p>
          <p
            className={clsx(
              "text-sm mt-1",
              summary.variance < 0 ? "text-red-600" : "text-emerald-600"
            )}
          >
            {summary.variance < 0 ? "Over" : "Under"} budget
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Category Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget vs Actual Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Budget vs Actual Trend
            </h2>
            <div className="h-[300px]" role="img" aria-label="Budget vs Actual trend chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="budget" name="Budget" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="actual"
                    name="Actual"
                    radius={[4, 4, 0, 0]}
                  >
                    {monthlyTrend.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.actual > entry.budget ? "#ef4444" : "#10b981"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Details */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Category Breakdown
              </h2>
              <span className="text-sm text-slate-500">
                Click to expand details
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {categories.map((category: BudgetCategory) => {
                const variance = category.actual - category.budget;
                const variancePercent = (variance / category.budget) * 100;
                const isExpense = category.type === "expense";
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id}>
                    <button
                      onClick={() =>
                        setExpandedCategory(isExpanded ? null : category.id)
                      }
                      className="w-full px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                      aria-expanded={isExpanded}
                      aria-controls={`category-${category.id}-details`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {category.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              Budget: {formatCurrency(category.budget)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(category.actual)}
                            </p>
                            <p
                              className={clsx(
                                "text-sm font-medium",
                                getVarianceColor(variancePercent, isExpense)
                              )}
                            >
                              {variancePercent > 0 ? "+" : ""}
                              {variancePercent.toFixed(1)}%
                            </p>
                          </div>

                          <div
                            className={clsx(
                              "px-3 py-1 rounded-full text-xs font-medium",
                              getVarianceBg(variancePercent, isExpense),
                              getVarianceColor(variancePercent, isExpense)
                            )}
                          >
                            {formatCurrency(Math.abs(variance))}
                            {variance > 0
                              ? isExpense
                                ? " over"
                                : " above"
                              : isExpense
                              ? " under"
                              : " below"}
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={category.actual} aria-valuemax={category.budget}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (category.actual / category.budget) * 100,
                                100
                              )}%`,
                              backgroundColor:
                                variance > 0 && isExpense
                                  ? "#ef4444"
                                  : category.color,
                            }}
                          />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        id={`category-${category.id}-details`}
                        className="px-6 py-4 bg-slate-50 border-t border-slate-100"
                      >
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Daily Average</p>
                            <p className="font-semibold text-slate-900">
                              {formatCurrency(category.actual / 30)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">% of Total</p>
                            <p className="font-semibold text-slate-900">
                              {(
                                (category.actual /
                                  (category.type === "expense"
                                    ? summary.totalActual
                                    : category.actual)) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Remaining Budget</p>
                            <p
                              className={clsx(
                                "font-semibold",
                                category.budget - category.actual < 0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              )}
                            >
                              {formatCurrency(category.budget - category.actual)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Pie Chart */}
        <div className="space-y-6">
          {/* Expense Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Expense Distribution
            </h2>
            <div className="h-[200px]" role="img" aria-label="Expense distribution pie chart">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {pieData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="text-slate-600 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                Budget Alerts
              </h2>
            </div>

            <div className="divide-y divide-slate-100" role="list" aria-label="Budget alerts">
              {alerts.map((alert, index) => (
                <div key={index} className="p-4" role="listitem">
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        alert.type === "warning"
                          ? "bg-amber-100"
                          : "bg-emerald-100"
                      )}
                    >
                      {alert.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {alert.category}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-2 italic">
                        {alert.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
            <h3 className="font-medium text-slate-700 mb-3 text-sm">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                View Previous Periods
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                leftIcon={<Edit2 className="w-4 h-4" />}
              >
                Adjust Budget Targets
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                leftIcon={<BarChart3 className="w-4 h-4" />}
              >
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
