"use client";

import { useState, useMemo } from "react";
import { clsx } from "clsx";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  id: string;
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: "inbox" | "search" | "file" | "users" | "target";
  onRowClick?: (row: T) => void;
  selectedRow?: T | null;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField = "id" as keyof T,
  isLoading = false,
  emptyMessage = "No data found",
  emptyIcon = "inbox",
  onRowClick,
  selectedRow,
  pagination,
  className,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find((c) => c.id === sortColumn);
    if (!column || !column.accessor) return data;

    return [...data].sort((a, b) => {
      const aVal = a[column.accessor!];
      const bVal = b[column.accessor!];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  // Pagination
  const totalPages = pagination
    ? Math.ceil(pagination.totalItems / pagination.pageSize)
    : 1;

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) {
      return <ChevronsUpDown className="w-4 h-4 text-slate-300" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner label="Loading data..." />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyMessage} />;
  }

  return (
    <div className={clsx("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={clsx(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer select-none hover:bg-slate-100"
                  )}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  <div
                    className={clsx(
                      "flex items-center gap-1",
                      column.align === "center" && "justify-center",
                      column.align === "right" && "justify-end"
                    )}
                  >
                    {column.header}
                    {column.sortable && getSortIcon(column.id)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((row, index) => {
              const key = row[keyField] as string | number;
              const isSelected =
                selectedRow &&
                selectedRow[keyField] === row[keyField];

              return (
                <tr
                  key={key ?? index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={clsx(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-slate-50",
                    isSelected && "bg-blue-50"
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={clsx(
                        "px-4 py-3 text-sm text-slate-700",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : column.accessor
                        ? String(row[column.accessor] ?? "-")
                        : "-"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.totalItems
              )}
            </span>{" "}
            of <span className="font-medium">{pagination.totalItems}</span>{" "}
            results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-slate-600">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
