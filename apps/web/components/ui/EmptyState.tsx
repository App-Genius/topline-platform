"use client";

import { clsx } from "clsx";
import { Inbox, Search, FileX, Users, Target } from "lucide-react";

export interface EmptyStateProps {
  icon?: "inbox" | "search" | "file" | "users" | "target";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const iconMap = {
  inbox: Inbox,
  search: Search,
  file: FileX,
  users: Users,
  target: Target,
};

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = iconMap[icon];

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Convenience components for common empty states
export function NoDataFound({ message = "No data found" }: { message?: string }) {
  return <EmptyState icon="inbox" title={message} />;
}

export function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`No results for "${query}". Try adjusting your search.`}
      action={
        onClear && (
          <button
            onClick={onClear}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear search
          </button>
        )
      }
    />
  );
}
