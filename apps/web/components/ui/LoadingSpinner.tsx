"use client";

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading...",
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={clsx("flex items-center justify-center gap-2", className)}
      role="status"
      aria-label={label}
    >
      <Loader2
        className={clsx("animate-spin text-blue-600", sizeClasses[size])}
      />
      {label && size !== "sm" && (
        <span className="text-sm text-slate-500">{label}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Convenience component for page-level loading
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" label="Loading..." />
    </div>
  );
}
