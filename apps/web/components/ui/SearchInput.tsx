"use client";

import { forwardRef, useCallback } from "react";
import { clsx } from "clsx";
import { Search, X } from "lucide-react";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onClear?: () => void;
  isLoading?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, isLoading, value, className, ...props }, ref) => {
    const hasValue = value && String(value).length > 0;

    return (
      <div className={clsx("relative", className)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={ref}
          type="search"
          value={value}
          className={clsx(
            "w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 bg-white text-sm",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500",
            "disabled:bg-slate-50 disabled:text-slate-500"
          )}
          {...props}
        />
        {hasValue && onClear && !isLoading && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// Debounced search hook
export function useDebouncedSearch(delay: number = 300) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return {
    searchTerm,
    debouncedTerm,
    setSearchTerm,
    clearSearch: useCallback(() => setSearchTerm(""), []),
  };
}

// Need to import useState and useEffect for the hook
import { useState, useEffect } from "react";
