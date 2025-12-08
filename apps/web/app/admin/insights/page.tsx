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
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ArrowUpRight,
  Clock,
} from "lucide-react";

// Mock AI-generated insights
const MOCK_INSIGHTS = {
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
      reason:
        "Suggestive selling behavior is 23% below target. Staff are missing wine pairing opportunities.",
      impact: "Could increase average check by $8-12 per table",
      relatedBehavior: "Suggest Wine Pairing",
      behaviorCompletion: 42,
      targetCompletion: 65,
    },
    {
      id: "2",
      priority: "medium",
      title: "Dessert Menu Knowledge",
      reason:
        "Dessert suggestions dropped 15% this month. Team may need refresher on new menu items.",
      impact: "Dessert sales typically add $6-10 to check",
      relatedBehavior: "Offer Dessert Menu",
      behaviorCompletion: 58,
      targetCompletion: 75,
    },
    {
      id: "3",
      priority: "low",
      title: "VIP Guest Recognition",
      reason:
        "VIP recognition is at 89%, but there's room for improvement to hit excellence.",
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
      insight:
        "Food costs are trending 5.2% over budget. Supplier pricing increased this month.",
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
      insight:
        "Overtime hours exceeded projections by 18%. Weekend dinner shifts most affected.",
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
      insight:
        "Utility costs up 8%, mostly seasonal. Some savings possible with efficiency.",
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
      description:
        "Revenue is 3.3% above target this month. Behavior logging is strongly correlated with this success.",
      metric: "+$14,850",
    },
    {
      type: "info",
      title: "Behavior Adoption Improving",
      description:
        "Overall behavior adoption increased from 62% to 71% over the past 30 days.",
      metric: "+9%",
    },
    {
      type: "warning",
      title: "Evening Shift Underperforming",
      description:
        "Dinner service average check is 8% below baseline. Consider targeted coaching.",
      metric: "-$4.20/check",
    },
  ],
  suggestedTrainingTopic: {
    title: "Suggestive Selling: Wine Pairings",
    description:
      "Based on current performance data, focusing on wine pairing suggestions would have the highest impact on your average check.",
    tips: [
      "Lead with taste profiles, not price points",
      "Suggest pairings with every entree order",
      "Mention limited availability for premium wines",
    ],
    expectedImpact: "+$2,400/week in wine sales",
  },
};

export default function InsightsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "training" | "costs" | "performance"
  >("training");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRefreshing(false);
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
            Updated: {MOCK_INSIGHTS.lastUpdated}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            <RefreshCw
              className={clsx("w-5 h-5", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "Analyzing..." : "Refresh Insights"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Sparkles className="w-8 h-8 opacity-80" />
            <span className="text-5xl font-bold">
              {MOCK_INSIGHTS.summary.overallHealth}
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
              {MOCK_INSIGHTS.summary.opportunities}
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
              {MOCK_INSIGHTS.summary.actions}
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
              {MOCK_INSIGHTS.suggestedTrainingTopic.title}
            </p>
            <p className="text-emerald-700 text-sm mb-4">
              {MOCK_INSIGHTS.suggestedTrainingTopic.description}
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
                Expected Impact:{" "}
                <span className="font-semibold">
                  {MOCK_INSIGHTS.suggestedTrainingTopic.expectedImpact}
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

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "training", label: "Training Gaps", icon: BookOpen },
          { id: "costs", label: "Cost Optimization", icon: DollarSign },
          { id: "performance", label: "Performance Trends", icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
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
        <div className="space-y-4">
          {MOCK_INSIGHTS.trainingRecommendations.map((rec) => (
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
                  <div className="w-20 h-20 relative">
                    <svg className="w-20 h-20 transform -rotate-90">
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
          ))}
        </div>
      )}

      {/* Cost Recommendations */}
      {activeSection === "costs" && (
        <div className="space-y-4">
          {MOCK_INSIGHTS.costRecommendations.map((rec) => (
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
            <p className="text-3xl font-bold text-purple-700">$6,400/month</p>
            <p className="text-sm text-purple-600 mt-1">
              By implementing all cost optimization recommendations
            </p>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {activeSection === "performance" && (
        <div className="space-y-4">
          {MOCK_INSIGHTS.performanceInsights.map((insight, index) => (
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
