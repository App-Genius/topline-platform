"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  BrainCircuit,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import {
  useInsights,
  useRefreshInsights,
  type TrainingRecommendation,
  type CostRecommendation,
  type PerformanceInsight,
} from "@/hooks/queries";
import { LoadingSpinner, ErrorAlert, Button } from "@/components/ui";

export default function InsightsPage() {
  const [activeSection, setActiveSection] = useState<
    "training" | "costs" | "performance"
  >("training");

  // Use React Query hooks for data fetching
  const { data: insights, isLoading, error } = useInsights();
  const refreshMutation = useRefreshInsights();

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  // Loading state
  if (isLoading && !insights) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner label="Loading insights..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <ErrorAlert message={error.message || "Failed to load insights"} />
      </div>
    );
  }

  // Use data from hook or empty defaults
  const {
    lastUpdated = new Date().toLocaleString(),
    summary = { overallHealth: 0, opportunities: 0, actions: 0 },
    trainingRecommendations = [],
    costRecommendations = [],
    performanceInsights = [],
    suggestedTrainingTopic = null,
  } = insights || {};

  return (
    <div className="p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <BrainCircuit className="text-purple-600" />
            AI Insights & Recommendations
          </h1>
          <p className="text-slate-500 mt-1">
            Smart recommendations based on your performance data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Updated: {lastUpdated}
          </div>
          <Button
            onClick={handleRefresh}
            isLoading={refreshMutation.isPending}
            leftIcon={<RefreshCw className="w-5 h-5" />}
            className="bg-purple-600 hover:bg-purple-500"
          >
            {refreshMutation.isPending ? "Analyzing..." : "Refresh Insights"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Sparkles className="w-8 h-8 opacity-80" />
            <span className="text-5xl font-bold">
              {summary.overallHealth}
            </span>
          </div>
          <p className="text-purple-100 text-sm font-medium">
            Overall Health Score
          </p>
          <p className="text-purple-200 text-xs mt-1">
            Based on KPIs, behaviors, and budget
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Lightbulb className="w-8 h-8 text-amber-500" />
            <span className="text-5xl font-bold text-slate-900">
              {summary.opportunities}
            </span>
          </div>
          <p className="text-slate-600 text-sm font-medium">
            Improvement Opportunities
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Areas where you can grow
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-emerald-500" />
            <span className="text-5xl font-bold text-slate-900">
              {summary.actions}
            </span>
          </div>
          <p className="text-slate-600 text-sm font-medium">
            Recommended Actions
          </p>
          <p className="text-slate-400 text-xs mt-1">
            High-impact next steps
          </p>
        </div>
      </div>

      {/* Today's Training Topic Suggestion */}
      {suggestedTrainingTopic && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-emerald-900">
                  Suggested Training Topic for Today
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded">
                  AI PICK
                </span>
              </div>
              <p className="text-emerald-800 font-medium mb-2">
                {suggestedTrainingTopic.title}
              </p>
              <p className="text-emerald-700 text-sm mb-4">
                {suggestedTrainingTopic.description}
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                  Expected Impact:{" "}
                  <span className="font-semibold">
                    {suggestedTrainingTopic.expectedImpact}
                  </span>
                </div>
                <a
                  href="/manager/briefing"
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Add to Today&apos;s Briefing
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6" role="tablist" aria-label="Insight categories">
        {[
          { id: "training", label: "Training Gaps", icon: BookOpen },
          { id: "costs", label: "Cost Optimization", icon: DollarSign },
          { id: "performance", label: "Performance Trends", icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeSection === tab.id}
            aria-controls={`${tab.id}-panel`}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={clsx(
              "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
              activeSection === tab.id
                ? "bg-purple-100 text-purple-700"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Training Recommendations */}
      {activeSection === "training" && (
        <div
          id="training-panel"
          role="tabpanel"
          aria-labelledby="training"
          className="space-y-4"
        >
          {trainingRecommendations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-600">
                No training gaps identified. Your team is performing well!
              </p>
            </div>
          ) : (
            trainingRecommendations.map((rec: TrainingRecommendation) => (
              <div
                key={rec.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={clsx(
                          "px-2 py-1 rounded text-xs font-bold uppercase border",
                          getPriorityColor(rec.priority)
                        )}
                      >
                        {rec.priority} priority
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {rec.title}
                      </h3>
                    </div>
                    <p className="text-slate-600 mb-4">{rec.reason}</p>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-slate-500">Related Behavior:</span>
                        <span className="font-medium text-slate-700">
                          {rec.relatedBehavior}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-500">Potential Impact:</span>
                        <span className="font-medium text-emerald-600">
                          {rec.impact}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 text-center">
                    <div className="w-20 h-20 relative" role="progressbar" aria-valuenow={rec.behaviorCompletion} aria-valuemin={0} aria-valuemax={100}>
                      <svg className="w-20 h-20 transform -rotate-90" aria-hidden="true">
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          fill="none"
                          stroke={
                            rec.behaviorCompletion >= rec.targetCompletion
                              ? "#10b981"
                              : "#f59e0b"
                          }
                          strokeWidth="6"
                          strokeDasharray={`${
                            (rec.behaviorCompletion / 100) * 220
                          } 220`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-900">
                          {rec.behaviorCompletion}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Target: {rec.targetCompletion}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cost Recommendations */}
      {activeSection === "costs" && (
        <div
          id="costs-panel"
          role="tabpanel"
          aria-labelledby="costs"
          className="space-y-4"
        >
          {costRecommendations.map((rec: CostRecommendation) => (
            <div
              key={rec.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-xl">
                  {getStatusIcon(rec.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {rec.category}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "px-3 py-1 rounded-full text-sm font-medium",
                          rec.status === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {rec.variance > 0 ? "+" : ""}
                        {rec.variance}% variance
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-4">{rec.insight}</p>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Recommended Actions:
                    </p>
                    <ul className="space-y-2">
                      {rec.actions.map((action, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold mt-0.5">
                            {index + 1}
                          </div>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-slate-500">Potential Savings:</span>
                    <span className="font-semibold text-emerald-600">
                      {rec.potentialSavings}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-900">Total Potential Savings</h4>
            </div>
            <p className="text-3xl font-bold text-purple-700">
              ${costRecommendations.reduce((total, rec) => {
                const match = rec.potentialSavings.match(/\$?([\d,]+)/);
                return total + (match ? parseInt(match[1].replace(/,/g, "")) : 0);
              }, 0).toLocaleString()}/month
            </p>
            <p className="text-sm text-purple-600 mt-1">
              By implementing all cost optimization recommendations
            </p>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {activeSection === "performance" && (
        <div
          id="performance-panel"
          role="tabpanel"
          aria-labelledby="performance"
          className="space-y-4"
        >
          {performanceInsights.map((insight: PerformanceInsight, index: number) => (
            <div
              key={index}
              className={clsx(
                "rounded-xl p-6 border",
                insight.type === "success"
                  ? "bg-emerald-50 border-emerald-200"
                  : insight.type === "warning"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={clsx(
                      "p-2 rounded-lg",
                      insight.type === "success"
                        ? "bg-emerald-100"
                        : insight.type === "warning"
                        ? "bg-amber-100"
                        : "bg-blue-100"
                    )}
                  >
                    {insight.type === "success" ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : insight.type === "warning" ? (
                      <TrendingDown className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={clsx(
                        "font-semibold mb-1",
                        insight.type === "success"
                          ? "text-emerald-900"
                          : insight.type === "warning"
                          ? "text-amber-900"
                          : "text-blue-900"
                      )}
                    >
                      {insight.title}
                    </h3>
                    <p
                      className={clsx(
                        "text-sm",
                        insight.type === "success"
                          ? "text-emerald-700"
                          : insight.type === "warning"
                          ? "text-amber-700"
                          : "text-blue-700"
                      )}
                    >
                      {insight.description}
                    </p>
                  </div>
                </div>
                <div
                  className={clsx(
                    "px-4 py-2 rounded-lg font-bold text-lg",
                    insight.type === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : insight.type === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  {insight.metric}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
