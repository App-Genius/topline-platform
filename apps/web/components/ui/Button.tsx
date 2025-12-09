"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200 disabled:bg-blue-300",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-200 disabled:bg-slate-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200 disabled:bg-red-300",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200 disabled:text-slate-400",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg",
          "transition-colors focus:outline-none focus:ring-2",
          "disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {isLoading ? (
          <span className="sr-only">Loading</span>
        ) : null}
        <span aria-hidden={isLoading}>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

// Icon-only button variant
export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  label: string;
}

const iconSizeClasses = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = "ghost", size = "md", label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg",
          "transition-colors focus:outline-none focus:ring-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          iconSizeClasses[size],
          className
        )}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
