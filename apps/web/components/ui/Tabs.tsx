"use client";

import { clsx } from "clsx";

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "underline" | "pills";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
}: TabsProps) {
  return (
    <div
      className={clsx(
        "flex",
        variant === "underline" && "border-b border-slate-200",
        variant === "pills" && "gap-2",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            className={clsx(
              "flex items-center gap-2 transition-colors font-medium",
              variant === "underline" && [
                "px-4 py-3 -mb-px border-b-2",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
              ],
              variant === "pills" && [
                "px-4 py-2 rounded-lg text-sm",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100",
              ]
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  "px-2 py-0.5 rounded-full text-xs",
                  isActive
                    ? "bg-blue-200 text-blue-800"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Tab panel wrapper
export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (id !== activeTab) return null;

  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className={className}
    >
      {children}
    </div>
  );
}
