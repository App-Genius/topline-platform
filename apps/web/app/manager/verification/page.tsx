"use client";

import React, { useState, useMemo } from 'react';
import { usePendingVerifications, useBulkVerifyBehaviors, useBehaviors } from '@/hooks/queries/useBehaviors';
import { useUsers } from '@/hooks/queries/useUsers';
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function VerificationPage() {
  const { data: pendingData, isLoading, error, refetch } = usePendingVerifications();
  const { data: behaviors } = useBehaviors();
  const { data: users } = useUsers();
  const bulkVerify = useBulkVerifyBehaviors();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filterBehavior, setFilterBehavior] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');

  const pendingLogs = pendingData?.data ?? [];

  // Filter logs
  const filteredLogs = useMemo(() => {
    return pendingLogs.filter((log) => {
      if (filterBehavior && log.behaviorId !== filterBehavior) return false;
      if (filterUser && log.userId !== filterUser) return false;
      return true;
    });
  }, [pendingLogs, filterBehavior, filterUser]);

  // Get unique behaviors and users from logs for filter dropdowns
  const uniqueBehaviors = useMemo(() => {
    const map = new Map<string, string>();
    pendingLogs.forEach((log) => {
      map.set(log.behaviorId, log.behavior.name);
    });
    return Array.from(map.entries());
  }, [pendingLogs]);

  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    pendingLogs.forEach((log) => {
      map.set(log.userId, log.user.name);
    });
    return Array.from(map.entries());
  }, [pendingLogs]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredLogs.map((log) => log.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleBulkVerify = async (verified: boolean) => {
    if (selectedIds.size === 0) return;

    try {
      await bulkVerify.mutateAsync({
        ids: Array.from(selectedIds),
        verified,
      });
      setSelectedIds(new Set());
      refetch();
    } catch (error) {
      console.error('Failed to bulk verify:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-slate-600">Loading pending verifications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-700 text-lg">Failed to load verifications</p>
          <p className="text-slate-500 mt-2">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/manager"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Behavior Verification</h1>
              <p className="text-sm text-slate-500">
                {pendingData?.meta?.total ?? 0} pending verifications
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-slate-600">
              <Filter size={16} />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <select
              value={filterBehavior}
              onChange={(e) => setFilterBehavior(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">All Behaviors</option>
              {uniqueBehaviors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">All Staff</option>
              {uniqueUsers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            {(filterBehavior || filterUser) && (
              <button
                onClick={() => {
                  setFilterBehavior('');
                  setFilterUser('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={selectedIds.size === filteredLogs.length ? deselectAll : selectAll}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
              >
                {selectedIds.size === filteredLogs.length && filteredLogs.length > 0 ? (
                  <>
                    <CheckSquare size={18} className="text-blue-600" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square size={18} />
                    Select All ({filteredLogs.length})
                  </>
                )}
              </button>

              {selectedIds.size > 0 && (
                <span className="text-sm text-slate-500">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkVerify(true)}
                disabled={selectedIds.size === 0 || bulkVerify.isPending}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                  selectedIds.size > 0
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                {bulkVerify.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Verify Selected
              </button>

              <button
                onClick={() => handleBulkVerify(false)}
                disabled={selectedIds.size === 0 || bulkVerify.isPending}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                  selectedIds.size > 0
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                {bulkVerify.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Reject Selected
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
            <div className="col-span-1 text-center">Select</div>
            <div className="col-span-2">Staff</div>
            <div className="col-span-3">Behavior</div>
            <div className="col-span-2">Points</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Table Body */}
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={clsx(
                    'grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors',
                    selectedIds.has(log.id) && 'bg-blue-50'
                  )}
                >
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => toggleSelect(log.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {selectedIds.has(log.id) ? (
                        <CheckSquare size={20} className="text-blue-600" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {log.user.avatar || log.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {log.user.name}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <span className="text-sm text-slate-700">{log.behavior.name}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      +{log.behavior.points} pts
                    </span>
                  </div>

                  <div className="col-span-2 text-sm text-slate-500">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        bulkVerify.mutate({ ids: [log.id], verified: true });
                      }}
                      disabled={bulkVerify.isPending}
                      className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                      title="Verify"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => {
                        bulkVerify.mutate({ ids: [log.id], verified: false });
                      }}
                      disabled={bulkVerify.isPending}
                      className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 transition-colors"
                      title="Reject"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium">All caught up!</p>
              <p className="text-slate-500 mt-1">No pending behaviors to verify.</p>
            </div>
          )}
        </div>

        {/* Pagination info */}
        {pendingData?.meta && pendingData.meta.totalPages > 1 && (
          <div className="mt-4 text-center text-sm text-slate-500">
            Showing page {pendingData.meta.page} of {pendingData.meta.totalPages}
          </div>
        )}
      </div>
    </div>
  );
}
