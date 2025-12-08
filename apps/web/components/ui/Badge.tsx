"use client";

import { clsx } from "clsx";

export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export function Badge({
  variant = "default",
  size = "sm",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// Convenience components for common status badges
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "success" : "default"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const variant =
    role === "ADMIN"
      ? "error"
      : role === "MANAGER"
      ? "warning"
      : "info";

  return <Badge variant={variant}>{role}</Badge>;
}

export function CountBadge({ count }: { count: number }) {
  return (
    <Badge variant="info" size="sm">
      {count}
    </Badge>
  );
}
