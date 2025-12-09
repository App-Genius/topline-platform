"use client";

import { useState, useEffect } from "react";
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
  CheckCircle,
} from "lucide-react";
import {
  useSettings,
  useUpdateSettings,
  type SettingsData,
  type ScoreboardMetric,
} from "@/hooks/queries";
import { LoadingSpinner, ErrorAlert, Button } from "@/components/ui";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "organization" | "scoreboard" | "notifications"
  >("scoreboard");
  const [localSettings, setLocalSettings] = useState<SettingsData | null>(null);

  // Use React Query hooks
  const { data: settings, isLoading, error } = useSettings();
  const updateMutation = useUpdateSettings();

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  const handleSave = () => {
    if (!localSettings) return;
    updateMutation.mutate(localSettings);
  };

  const toggleMetric = (metricId: string) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      scoreboard: {
        ...localSettings.scoreboard,
        metrics: localSettings.scoreboard.metrics.map((m) =>
          m.id === metricId ? { ...m, enabled: !m.enabled } : m
        ),
      },
    });
  };

  // Loading state
  if (isLoading && !settings) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner label="Loading settings..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <ErrorAlert message={error.message || "Failed to load settings"} />
      </div>
    );
  }

  // Use local settings or fall back to fetched settings
  const displaySettings = localSettings || settings;
  if (!displaySettings) return null;

  const tabs = [
    { id: "organization" as const, label: "Organization", icon: Building },
    { id: "scoreboard" as const, label: "Scoreboard", icon: Monitor },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
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
        <Button
          onClick={handleSave}
          isLoading={updateMutation.isPending}
          leftIcon={
            updateMutation.isSuccess ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )
          }
          className={clsx(
            updateMutation.isSuccess && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
          )}
        >
          {updateMutation.isSuccess ? "Saved!" : updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Error from save */}
      {updateMutation.error && (
        <div className="mb-6">
          <ErrorAlert message={updateMutation.error.message || "Failed to save settings"} />
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <nav className="w-64 flex-shrink-0" aria-label="Settings navigation">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
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
        </nav>

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
                  <label htmlFor="org-name" className="block text-sm font-medium text-slate-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    value={displaySettings.organization.name}
                    onChange={(e) =>
                      setLocalSettings({
                        ...displaySettings,
                        organization: {
                          ...displaySettings.organization,
                          name: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="org-industry" className="block text-sm font-medium text-slate-700 mb-2">
                    Industry
                  </label>
                  <select
                    id="org-industry"
                    value={displaySettings.organization.industry}
                    onChange={(e) =>
                      setLocalSettings({
                        ...displaySettings,
                        organization: {
                          ...displaySettings.organization,
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
                    {displaySettings.scoreboard.metrics.filter((m) => m.enabled).length}{" "}
                    visible
                  </div>
                </div>

                <div className="space-y-3" role="list" aria-label="Scoreboard metrics">
                  {displaySettings.scoreboard.metrics.map((metric: ScoreboardMetric) => (
                    <div
                      key={metric.id}
                      role="listitem"
                      className={clsx(
                        "p-4 rounded-lg border transition-all",
                        metric.enabled
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" aria-hidden="true" />
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
                          type="button"
                          onClick={() => toggleMetric(metric.id)}
                          aria-pressed={metric.enabled}
                          aria-label={`${metric.enabled ? "Hide" : "Show"} ${metric.name}`}
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
                      type="button"
                      role="switch"
                      aria-checked={displaySettings.scoreboard.showLeaderboard}
                      onClick={() =>
                        setLocalSettings({
                          ...displaySettings,
                          scoreboard: {
                            ...displaySettings.scoreboard,
                            showLeaderboard: !displaySettings.scoreboard.showLeaderboard,
                          },
                        })
                      }
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        displaySettings.scoreboard.showLeaderboard
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                          displaySettings.scoreboard.showLeaderboard
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
                      type="button"
                      role="switch"
                      aria-checked={displaySettings.scoreboard.anonymizeNames}
                      onClick={() =>
                        setLocalSettings({
                          ...displaySettings,
                          scoreboard: {
                            ...displaySettings.scoreboard,
                            anonymizeNames: !displaySettings.scoreboard.anonymizeNames,
                          },
                        })
                      }
                      className={clsx(
                        "w-12 h-6 rounded-full transition-colors relative",
                        displaySettings.scoreboard.anonymizeNames
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                          displaySettings.scoreboard.anonymizeNames
                            ? "translate-x-6"
                            : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>

                  <div>
                    <label htmlFor="refresh-interval" className="block text-sm font-medium text-slate-700 mb-2">
                      Refresh Interval
                    </label>
                    <select
                      id="refresh-interval"
                      value={displaySettings.scoreboard.refreshInterval}
                      onChange={(e) =>
                        setLocalSettings({
                          ...displaySettings,
                          scoreboard: {
                            ...displaySettings.scoreboard,
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

                  <fieldset>
                    <legend className="block text-sm font-medium text-slate-700 mb-2">
                      Theme
                    </legend>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...displaySettings,
                            scoreboard: { ...displaySettings.scoreboard, theme: "dark" },
                          })
                        }
                        aria-pressed={displaySettings.scoreboard.theme === "dark"}
                        className={clsx(
                          "flex-1 p-4 rounded-lg border-2 transition-all",
                          displaySettings.scoreboard.theme === "dark"
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
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...displaySettings,
                            scoreboard: { ...displaySettings.scoreboard, theme: "light" },
                          })
                        }
                        aria-pressed={displaySettings.scoreboard.theme === "light"}
                        className={clsx(
                          "flex-1 p-4 rounded-lg border-2 transition-all",
                          displaySettings.scoreboard.theme === "light"
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
                  </fieldset>
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
                  rel="noopener noreferrer"
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
                    type="button"
                    role="switch"
                    aria-checked={displaySettings.notifications.emailAlerts}
                    onClick={() =>
                      setLocalSettings({
                        ...displaySettings,
                        notifications: {
                          ...displaySettings.notifications,
                          emailAlerts: !displaySettings.notifications.emailAlerts,
                        },
                      })
                    }
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      displaySettings.notifications.emailAlerts
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                        displaySettings.notifications.emailAlerts
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
                    type="button"
                    role="switch"
                    aria-checked={displaySettings.notifications.budgetWarnings}
                    onClick={() =>
                      setLocalSettings({
                        ...displaySettings,
                        notifications: {
                          ...displaySettings.notifications,
                          budgetWarnings: !displaySettings.notifications.budgetWarnings,
                        },
                      })
                    }
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      displaySettings.notifications.budgetWarnings
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                        displaySettings.notifications.budgetWarnings
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
                    type="button"
                    role="switch"
                    aria-checked={displaySettings.notifications.performanceUpdates}
                    onClick={() =>
                      setLocalSettings({
                        ...displaySettings,
                        notifications: {
                          ...displaySettings.notifications,
                          performanceUpdates:
                            !displaySettings.notifications.performanceUpdates,
                        },
                      })
                    }
                    className={clsx(
                      "w-12 h-6 rounded-full transition-colors relative",
                      displaySettings.notifications.performanceUpdates
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                        displaySettings.notifications.performanceUpdates
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
