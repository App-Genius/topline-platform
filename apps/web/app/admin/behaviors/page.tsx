"use client";

import { useState, FormEvent, useMemo } from "react";
import { clsx } from "clsx";
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  Target,
  Zap,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  useBehaviors,
  useRoles,
  useCreateBehavior,
  useUpdateBehavior,
  useDeleteBehavior,
} from "@/hooks/useApi";
import {
  Modal,
  Button,
  IconButton,
  ErrorAlert,
  LoadingSpinner,
  EmptyState,
  FormField,
  TextAreaField,
  DataTable,
  ConfirmDialog,
  StatusBadge,
  KpiCard,
  KpiRow,
  type Column,
} from "@/components/ui";

interface Behavior {
  id: string;
  name: string;
  description: string | null;
  targetPerDay: number;
  points: number;
  isActive: boolean;
  organizationId: string;
  roles: Array<{ id: string; name: string }>;
  createdAt: Date;
}

interface Role {
  id: string;
  name: string;
}

export default function BehaviorsPage() {
  // Data hooks
  const {
    data: behaviorsData,
    isLoading: behaviorsLoading,
    error: behaviorsError,
    refetch: refetchBehaviors,
  } = useBehaviors();

  const { data: rolesData } = useRoles();

  // Mutation hooks
  const { createBehavior, isLoading: isCreating, error: createError } = useCreateBehavior();
  const { updateBehavior, isLoading: isUpdating, error: updateError } = useUpdateBehavior();
  const { deleteBehavior, isLoading: isDeleting } = useDeleteBehavior();

  // Local state
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState<Behavior | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetPerDay: 5,
    points: 1,
    roleIds: [] as string[],
  });

  // Delete confirmation
  const [deleteBehaviorId, setDeleteBehaviorId] = useState<string | null>(null);

  // Derived data
  const behaviors = (behaviorsData ?? []) as Behavior[];
  const roles = (rolesData?.data ?? []) as Role[];
  const isSubmitting = isCreating || isUpdating;
  const formError = createError || updateError;

  // Filter behaviors
  const filteredBehaviors = useMemo(() => {
    if (showInactive) return behaviors;
    return behaviors.filter((b) => b.isActive);
  }, [behaviors, showInactive]);

  const activeBehaviors = behaviors.filter((b) => b.isActive);

  // Stats
  const totalDailyTarget = activeBehaviors.reduce((sum, b) => sum + b.targetPerDay, 0);
  const totalPointsPerDay = activeBehaviors.reduce(
    (sum, b) => sum + b.targetPerDay * b.points,
    0
  );

  const openCreateModal = () => {
    setEditingBehavior(null);
    setFormData({
      name: "",
      description: "",
      targetPerDay: 5,
      points: 1,
      roleIds: [],
    });
    setShowModal(true);
  };

  const openEditModal = (behavior: Behavior) => {
    setEditingBehavior(behavior);
    setFormData({
      name: behavior.name,
      description: behavior.description || "",
      targetPerDay: behavior.targetPerDay,
      points: behavior.points,
      roleIds: behavior.roles.map((r) => r.id),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBehavior(null);
  };

  const toggleRole = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingBehavior) {
        await updateBehavior(editingBehavior.id, {
          name: formData.name,
          description: formData.description || undefined,
          points: formData.points,
          roleIds: formData.roleIds,
        });
      } else {
        await createBehavior({
          name: formData.name,
          description: formData.description || undefined,
          points: formData.points,
          frequency: "daily",
          roleIds: formData.roleIds,
        });
      }
      closeModal();
      refetchBehaviors();
    } catch {
      // Error is handled by the hook
    }
  };

  const handleDelete = async () => {
    if (!deleteBehaviorId) return;

    try {
      await deleteBehavior(deleteBehaviorId);
      setDeleteBehaviorId(null);
      refetchBehaviors();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete behavior");
    }
  };

  // Table columns
  const columns: Column<Behavior>[] = [
    {
      id: "name",
      header: "Behavior",
      render: (behavior) => (
        <div>
          <p className="font-medium text-slate-900">{behavior.name}</p>
          {behavior.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-1">
              {behavior.description}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "roles",
      header: "Roles",
      render: (behavior) => (
        <div className="flex flex-wrap gap-1">
          {behavior.roles.length > 0 ? (
            behavior.roles.slice(0, 3).map((role) => (
              <span
                key={role.id}
                className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
              >
                {role.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">All roles</span>
          )}
          {behavior.roles.length > 3 && (
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
              +{behavior.roles.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "targetPerDay",
      header: "Target/Day",
      align: "center" as const,
      render: (behavior) => (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-semibold">
          {behavior.targetPerDay}
        </span>
      ),
    },
    {
      id: "points",
      header: "Points",
      align: "center" as const,
      render: (behavior) => (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-semibold">
          {behavior.points}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center" as const,
      render: (behavior) => (
        <StatusBadge status={behavior.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right" as const,
      render: (behavior) => (
        <div className="flex items-center justify-end gap-2">
          <IconButton
            icon={<Edit2 className="w-4 h-4" />}
            label="Edit behavior"
            onClick={() => openEditModal(behavior)}
          />
          <IconButton
            icon={<Trash2 className="w-4 h-4" />}
            label="Delete behavior"
            variant="danger"
            onClick={() => setDeleteBehaviorId(behavior.id)}
          />
        </div>
      ),
    },
  ];

  // Loading state
  if (behaviorsLoading && !behaviorsData) {
    return (
      <div className="p-8">
        <LoadingSpinner label="Loading behaviors..." />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Target className="text-emerald-600" />
            Behavior Management
          </h1>
          <p className="text-slate-500 mt-1">
            Define the lead measures that drive your business outcomes
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<Plus className="w-5 h-5" />}>
          Add Behavior
        </Button>
      </div>

      {/* Error Alert */}
      {(behaviorsError || pageError) && (
        <div className="mb-6">
          <ErrorAlert
            message={behaviorsError || pageError || "An error occurred"}
            onDismiss={() => setPageError(null)}
          />
        </div>
      )}

      {/* Stats Cards */}
      <KpiRow className="mb-6">
        <KpiCard
          title="Active Behaviors"
          value={activeBehaviors.length}
          icon={<Zap className="w-6 h-6" />}
          variant="success"
        />
        <KpiCard
          title="Total Daily Target"
          value={totalDailyTarget}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <KpiCard
          title="Total Points/Day"
          value={totalPointsPerDay}
          icon={<BarChart3 className="w-6 h-6" />}
        />
      </KpiRow>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Show inactive behaviors
        </label>
      </div>

      {/* Behaviors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredBehaviors.length === 0 ? (
          <EmptyState
            icon="target"
            title="No behaviors found"
            description="Create your first behavior to get started"
            action={
              <Button onClick={openCreateModal} variant="secondary">
                Create your first behavior
              </Button>
            }
          />
        ) : (
          <DataTable
            data={filteredBehaviors}
            columns={columns}
            keyField="id"
            isLoading={behaviorsLoading}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingBehavior ? "Edit Behavior" : "Create New Behavior"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && <ErrorAlert message={formError} />}

          <FormField
            label="Behavior Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Suggest Wine Pairing"
            required
          />

          <TextAreaField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe when and how this behavior should be performed"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Target Per Day"
              type="number"
              value={formData.targetPerDay.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetPerDay: parseInt(e.target.value) || 0,
                })
              }
              hint="Expected completions per staff per day"
            />
            <FormField
              label="Points"
              type="number"
              value={formData.points.toString()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  points: parseInt(e.target.value) || 1,
                })
              }
              hint="Points earned per completion"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Assign to Roles (optional)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={clsx(
                    "p-3 rounded-lg text-left text-sm font-medium transition-all border",
                    formData.roleIds.includes(role.id)
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={clsx(
                        "w-4 h-4 rounded border-2 flex items-center justify-center",
                        formData.roleIds.includes(role.id)
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300"
                      )}
                    >
                      {formData.roleIds.includes(role.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    {role.name}
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Leave empty to make available to all roles
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {editingBehavior ? "Update Behavior" : "Create Behavior"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteBehaviorId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteBehaviorId(null)}
        title="Delete Behavior"
        message="Are you sure you want to delete this behavior? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
