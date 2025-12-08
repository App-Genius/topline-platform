"use client";

import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantClasses = {
  default: "bg-white",
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
  danger: "bg-red-50 border-red-200",
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = "default",
  className,
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-emerald-600";
    if (trend.value < 0) return "text-red-600";
    return "text-slate-500";
  };

  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-200 p-6",
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className={clsx(
                "flex items-center gap-1 mt-2 text-sm font-medium",
                getTrendColor()
              )}
            >
              {getTrendIcon()}
              <span>
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-slate-400 font-normal">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Mini KPI for compact displays
export interface MiniKpiProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function MiniKpi({ label, value, icon, className }: MiniKpiProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-slate-200",
        className
      )}
    >
      {icon && <div className="text-slate-400">{icon}</div>}
      <div>
        <p className="text-xs text-slate-500 uppercase">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// KPI row for dashboards
export interface KpiRowProps {
  children: React.ReactNode;
  className?: string;
}

export function KpiRow({ children, className }: KpiRowProps) {
  return (
    <div
      className={clsx(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}
