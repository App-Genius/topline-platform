"use client";

import { clsx } from "clsx";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export interface AlertProps {
  variant: "error" | "success" | "warning" | "info";
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig = {
  error: {
    bg: "bg-red-50 border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-500",
    titleColor: "text-red-800",
    textColor: "text-red-700",
  },
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-800",
    textColor: "text-emerald-700",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    titleColor: "text-amber-800",
    textColor: "text-amber-700",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    icon: Info,
    iconColor: "text-blue-500",
    titleColor: "text-blue-800",
    textColor: "text-blue-700",
  },
};

export function Alert({
  variant,
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        "rounded-lg border p-4",
        config.bg,
        className
      )}
      role="alert"
    >
      <div className="flex">
        <Icon className={clsx("w-5 h-5 flex-shrink-0", config.iconColor)} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx("text-sm font-medium", config.titleColor)}>
              {title}
            </h3>
          )}
          <div
            className={clsx(
              "text-sm",
              config.textColor,
              title && "mt-1"
            )}
          >
            {children}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={clsx(
              "ml-3 p-1 rounded hover:bg-black/5 transition-colors",
              config.iconColor
            )}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Convenience components
export function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <Alert variant="error" title="Error" onDismiss={onDismiss}>
      {message}
    </Alert>
  );
}

export function SuccessAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <Alert variant="success" title="Success" onDismiss={onDismiss}>
      {message}
    </Alert>
  );
}
