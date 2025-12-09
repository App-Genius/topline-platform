"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component */
  fallback?: ReactNode;
  /** Keys that trigger reset when changed */
  resetKeys?: unknown[];
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when reset is triggered */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Enterprise Error Boundary Component
 *
 * Features:
 * - Catches JavaScript errors in child component tree
 * - Displays user-friendly error UI
 * - Supports reset via button or key changes
 * - Error logging hook for production monitoring
 * - Accessible error messages
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private previousResetKeys: unknown[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.previousResetKeys = props.resetKeys ?? [];
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to error tracking service
    this.props.onError?.(error, errorInfo);

    // In production, this would send to monitoring service
    if (process.env.NODE_ENV === "production") {
      console.error("[ErrorBoundary] Caught error:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset if resetKeys have changed
    if (this.state.hasError && this.props.resetKeys) {
      const hasKeysChanged = this.props.resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );

      if (hasKeysChanged) {
        this.reset();
      }
    }

    // Update previous keys
    if (prevProps.resetKeys !== this.props.resetKeys) {
      this.previousResetKeys = this.props.resetKeys ?? [];
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="min-h-[400px] flex items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Something went wrong
            </h2>

            {/* Error Description */}
            <p className="text-slate-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page or
              contact support if the problem persists.
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                  Technical Details
                </summary>
                <pre className="mt-2 p-4 bg-slate-100 rounded-lg text-xs text-slate-700 overflow-auto max-h-40">
                  <code>
                    {this.state.error.message}
                    {"\n\n"}
                    {this.state.error.stack}
                  </code>
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={this.reset}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.href = "/"}
                leftIcon={<Home className="w-4 h-4" />}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div
      className="min-h-[300px] flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-xl"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Error Loading Content
        </h3>
        <p className="text-red-700 mb-4 text-sm">
          {error.message || "An unexpected error occurred"}
        </p>
        <Button onClick={resetError} size="sm">
          Retry
        </Button>
      </div>
    </div>
  );
}
