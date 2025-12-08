"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  Settings,
  Monitor,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  Building,
  Bell,
  Palette,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ScoreboardMetric {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface SettingsState {
  organization: {
    name: string;
    industry: string;
  };
  scoreboard: {
    metrics: ScoreboardMetric[];
    refreshInterval: number;
    showLeaderboard: boolean;
    anonymizeNames: boolean;
    theme: "dark" | "light";
  };
  notifications: {
    emailAlerts: boolean;
    budgetWarnings: boolean;
    performanceUpdates: boolean;
  };
}

const DEFAULT_SETTINGS: SettingsState = {
  organization: {
    name: "Acme Restaurant Group",
    industry: "RESTAURANT",
  },
  scoreboard: {
    metrics: [
      {
        id: "revenue",
        name: "Today's Revenue",
        description: "Shows daily revenue vs target",
        enabled: true,
      },
      {
        id: "behaviors",
        name: "Team Behaviors",
        description: "Total lead measures logged today",
        enabled: true,
      },
      {
        id: "avgCheck",
        name: "Average Check",
        description: "Per-person average check amount",
        enabled: true,
      },
      {
        id: "topPerformer",
        name: "Top Performer",
        description: "Highlights the current leader",
        enabled: true,
      },
      {
        id: "covers",
        name: "Total Covers",
        description: "Number of guests served today",
        enabled: false,
      },
      {
        id: "rating",
        name: "Customer Rating",
        description: "Average rating from reviews",
        enabled: false,
      },
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<
    "organization" | "scoreboard" | "notifications"
  >("scoreboard");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleMetric = (metricId: string) => {
    setSettings((prev) => ({
      ...prev,
      scoreboard: {
        ...prev.scoreboard,
        metrics: prev.scoreboard.metrics.map((m) =>
          m.id === metricId ? { ...m, enabled: !m.enabled } : m
        ),
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: "organization", label: "Organization", icon: Building },
    { id: "scoreboard", label: "Scoreboard", icon: Monitor },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Settings className="text-emerald-600" />
            Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Configure your organization and display preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors",
            saveSuccess
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          )}
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                  activeTab === tab.id
                    ? "bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {/* Organization Tab */}
          {activeTab === "organization" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Organization Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={settings.organization.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        organization: {
                          ...settings.organization,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={settings.organization.industry}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        organization: {
                          ...settings.organization,
                          industry: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="RETAIL">Retail</option>
                    <option value="HOSPITALITY">Hospitality</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Scoreboard Tab */}
          {activeTab === "scoreboard" && (
            <div className="space-y-6">
              {/* Metrics Configuration */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Scoreboard Metrics
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Choose which metrics to display on the TV scoreboard
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Eye className="w-4 h-4" />
                    {settings.scoreboard.metrics.filter((m) => m.enabled).length}{" "}
                    visible
                  </div>
                </div>

                <div className="space-y-3">
                  {settings.scoreboard.metrics.map((metric) => (
                    <div
                      key={metric.id}
                      className={clsx(
                        "p-4 rounded-lg border transition-all",
                        metric.enabled
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                          <div>
                            <p className="font-medium text-slate-900">
                              {metric.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {metric.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleMetric(metric.id)}
                          className={clsx(
                            "p-2 rounded-lg transition-colors",
                            metric.enabled
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-500"
                          )}
                        >
                          {metric.enabled ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display Options */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">
                  Display Options
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        Show Leaderboard
                      </p>
                      <p className="text-sm text-slate-500">
                        Display staff ranking on the scoreboard
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          scoreboard: {
                            ...settings.scoreboard,
                            showLeaderboard: !settings.scoreboard.showLeaderboard,
                          },
                        })
                      }
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        settings.scoreboard.showLeaderboard
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                          settings.scoreboard.showLeaderboard
                            ? "translate-x-6"
                            : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        Anonymize Names
                      </p>
                      <p className="text-sm text-slate-500">
                        Show initials instead of full names
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          scoreboard: {
                            ...settings.scoreboard,
                            anonymizeNames: !settings.scoreboard.anonymizeNames,
                          },
                        })
                      }
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        settings.scoreboard.anonymizeNames
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                          settings.scoreboard.anonymizeNames
                            ? "translate-x-6"
                            : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Refresh Interval
                    </label>
                    <select
                      value={settings.scoreboard.refreshInterval}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          scoreboard: {
                            ...settings.scoreboard,
                            refreshInterval: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={15}>Every 15 seconds</option>
                      <option value={30}>Every 30 seconds</option>
                      <option value={60}>Every minute</option>
                      <option value={300}>Every 5 minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Theme
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            scoreboard: { ...settings.scoreboard, theme: "dark" },
                          })
                        }
                        className={clsx(
                          "flex-1 p-4 rounded-lg border-2 transition-all",
                          settings.scoreboard.theme === "dark"
                            ? "border-emerald-500 bg-slate-900"
                            : "border-slate-200 bg-slate-900"
                        )}
                      >
                        <div className="text-white text-sm font-medium">Dark</div>
                        <div className="text-slate-400 text-xs mt-1">
                          Best for TV displays
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            scoreboard: { ...settings.scoreboard, theme: "light" },
                          })
                        }
                        className={clsx(
                          "flex-1 p-4 rounded-lg border-2 transition-all",
                          settings.scoreboard.theme === "light"
                            ? "border-emerald-500 bg-white"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <div className="text-slate-900 text-sm font-medium">
                          Light
                        </div>
                        <div className="text-slate-400 text-xs mt-1">
                          For bright environments
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Link */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Preview Scoreboard
                    </p>
                    <p className="text-sm text-blue-700">
                      See how your changes look on the TV display
                    </p>
                  </div>
                </div>
                <a
                  href="/scoreboard"
                  target="_blank"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                >
                  Open Preview
                </a>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Notification Preferences
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Email Alerts</p>
                    <p className="text-sm text-slate-500">
                      Receive important updates via email
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          emailAlerts: !settings.notifications.emailAlerts,
                        },
                      })
                    }
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.notifications.emailAlerts
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                        settings.notifications.emailAlerts
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Budget Warnings</p>
                    <p className="text-sm text-slate-500">
                      Alert when categories exceed budget
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          budgetWarnings: !settings.notifications.budgetWarnings,
                        },
                      })
                    }
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.notifications.budgetWarnings
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                        settings.notifications.budgetWarnings
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      Performance Updates
                    </p>
                    <p className="text-sm text-slate-500">
                      Weekly summary of team performance
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          performanceUpdates:
                            !settings.notifications.performanceUpdates,
                        },
                      })
                    }
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      settings.notifications.performanceUpdates
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                        settings.notifications.performanceUpdates
                          ? "translate-x-6"
                          : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
