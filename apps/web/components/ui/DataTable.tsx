"use client";

import { useState, useMemo, useCallback, useRef, KeyboardEvent } from "react";
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
  /** ARIA label for the table */
  ariaLabel?: string;
}

type SortDirection = "asc" | "desc" | null;

/**
 * Accessible DataTable Component
 *
 * Features:
 * - Keyboard navigation (arrow keys, Enter, Home, End)
 * - ARIA attributes for screen readers
 * - Sort announcements
 * - Focus management
 */
export function DataTable<T extends object>({
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
  ariaLabel = "Data table",
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);
  const tableRef = useRef<HTMLTableElement>(null);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

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
      return <ChevronsUpDown className="w-4 h-4 text-slate-300" aria-hidden="true" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-600" aria-hidden="true" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-600" aria-hidden="true" />
    );
  };

  // Get ARIA sort value for column headers
  const getAriaSort = (columnId: string): "ascending" | "descending" | "none" | undefined => {
    if (sortColumn !== columnId) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableElement>) => {
      if (sortedData.length === 0) return;

      const currentIndex = focusedRowIndex;
      let newIndex = currentIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.min(currentIndex + 1, sortedData.length - 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.max(currentIndex - 1, 0);
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = sortedData.length - 1;
          break;
        case "Enter":
        case " ":
          if (onRowClick && currentIndex >= 0) {
            e.preventDefault();
            onRowClick(sortedData[currentIndex]);
          }
          return;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        setFocusedRowIndex(newIndex);
        rowRefs.current[newIndex]?.focus();
      }
    },
    [sortedData, focusedRowIndex, onRowClick]
  );

  // Handle row focus
  const handleRowFocus = useCallback((index: number) => {
    setFocusedRowIndex(index);
  }, []);

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
        <table
          ref={tableRef}
          className="w-full"
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={sortedData.length + 1}
          onKeyDown={handleKeyDown}
        >
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50" role="row">
              {columns.map((column, colIndex) => (
                <th
                  key={column.id}
                  role="columnheader"
                  scope="col"
                  aria-colindex={colIndex + 1}
                  aria-sort={column.sortable ? getAriaSort(column.id) : undefined}
                  className={clsx(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer select-none hover:bg-slate-100"
                  )}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                  onKeyDown={
                    column.sortable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSort(column.id);
                          }
                        }
                      : undefined
                  }
                  tabIndex={column.sortable ? 0 : undefined}
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
                    {column.sortable && (
                      <span className="sr-only">
                        {sortColumn === column.id
                          ? sortDirection === "asc"
                            ? ", sorted ascending"
                            : ", sorted descending"
                          : ", click to sort"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((row, rowIndex) => {
              const key = row[keyField] as string | number;
              const isSelected =
                selectedRow &&
                selectedRow[keyField] === row[keyField];
              const isFocused = focusedRowIndex === rowIndex;

              return (
                <tr
                  key={key ?? rowIndex}
                  ref={(el) => (rowRefs.current[rowIndex] = el)}
                  role="row"
                  aria-rowindex={rowIndex + 2}
                  aria-selected={isSelected || undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onFocus={() => handleRowFocus(rowIndex)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={clsx(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-slate-50 focus:outline-none focus:bg-slate-100",
                    isSelected && "bg-blue-50",
                    isFocused && onRowClick && "ring-2 ring-inset ring-blue-500"
                  )}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.id}
                      role="gridcell"
                      aria-colindex={colIndex + 1}
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
        <nav
          className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50"
          aria-label="Pagination"
        >
          <p className="text-sm text-slate-500" aria-live="polite">
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
          <div className="flex items-center gap-2" role="group" aria-label="Page navigation">
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="px-3 py-1 text-sm text-slate-600" aria-current="page">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Go to next page"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
