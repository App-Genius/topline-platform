"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    { label, error, hint, leftIcon, rightIcon, className, id, ...props },
    ref
  ) => {
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className={clsx("space-y-1", className)}>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "w-full rounded-lg border bg-white px-4 py-2.5 text-sm",
              "placeholder:text-slate-400",
              "focus:outline-none focus:ring-2",
              "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-200",
              leftIcon && "pl-10",
              rightIcon && "pr-10"
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-sm text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

// Textarea variant
export interface TextAreaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

    return (
      <div className={clsx("space-y-1", className)}>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full rounded-lg border bg-white px-4 py-2.5 text-sm",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2",
            "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
            "min-h-[100px] resize-y",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-slate-200 focus:border-blue-500 focus:ring-blue-200"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
    );
  }
);

TextAreaField.displayName = "TextAreaField";
