"use client";

import { useState, FormEvent } from "react";
import { clsx } from "clsx";
import { Edit2, Trash2, Check, Shield, ShieldPlus } from "lucide-react";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/hooks/queries/useRoles";
import {
  Modal,
  Button,
  IconButton,
  ErrorAlert,
  LoadingSpinner,
  EmptyState,
  FormField,
  Select,
  ConfirmDialog,
} from "@/components/ui";

interface Role {
  id: string;
  name: string;
  type: string;
  permissions: string[];
  organizationId: string;
  createdAt: Date;
}

const ROLE_TYPES = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "SERVER", label: "Server" },
  { value: "HOST", label: "Host" },
  { value: "BARTENDER", label: "Bartender" },
  { value: "BUSSER", label: "Busser" },
  { value: "PURCHASER", label: "Purchaser" },
  { value: "CHEF", label: "Chef" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "FACILITIES", label: "Facilities" },
  { value: "CUSTOM", label: "Custom" },
];

const PERMISSIONS = [
  { value: "dashboard.view", label: "View Dashboard" },
  { value: "users.manage", label: "Manage Users" },
  { value: "roles.manage", label: "Manage Roles" },
  { value: "behaviors.manage", label: "Manage Behaviors" },
  { value: "behaviors.log", label: "Log Behaviors" },
  { value: "behaviors.verify", label: "Verify Behaviors" },
  { value: "reports.view", label: "View Reports" },
  { value: "settings.manage", label: "Manage Settings" },
];

export default function RolesPage() {
  // Data hooks
  const {
    data: rolesData,
    isLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useRoles();

  // Mutation hooks
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const deleteMutation = useDeleteRole();
  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const createError = createMutation.error;
  const updateError = updateMutation.error;

  // Local state
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "CUSTOM" as string,
    permissions: [] as string[],
  });

  // Delete confirmation
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // Derived data
  const roles = (rolesData?.data ?? []) as Role[];
  const isSubmitting = isCreating || isUpdating;
  const formError = createError || updateError;

  // Role type options
  const roleTypeOptions = ROLE_TYPES.map((type) => ({
    value: type.value,
    label: type.label,
  }));

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      type: "CUSTOM",
      permissions: [],
    });
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      type: role.type,
      permissions: role.permissions,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingRole) {
        await updateMutation.mutateAsync({
          id: editingRole.id,
          data: {
            name: formData.name,
            permissions: formData.permissions,
          },
        });
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          permissions: formData.permissions,
        });
      }
      closeModal();
      refetchRoles();
    } catch {
      // Error is handled by the hook
    }
  };

  const handleDelete = async () => {
    if (!deleteRoleId) return;

    try {
      await deleteMutation.mutateAsync(deleteRoleId);
      setDeleteRoleId(null);
      refetchRoles();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  const getRoleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700",
      MANAGER: "bg-blue-100 text-blue-700",
      SERVER: "bg-emerald-100 text-emerald-700",
      HOST: "bg-pink-100 text-pink-700",
      BARTENDER: "bg-amber-100 text-amber-700",
      CHEF: "bg-orange-100 text-orange-700",
      PURCHASER: "bg-teal-100 text-teal-700",
      ACCOUNTANT: "bg-indigo-100 text-indigo-700",
      FACILITIES: "bg-slate-100 text-slate-700",
    };
    return colors[type] || "bg-slate-100 text-slate-700";
  };

  // Loading state
  if (isLoading && !rolesData) {
    return (
      <div className="p-8">
        <LoadingSpinner label="Loading roles..." />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="text-emerald-600" />
            Role Management
          </h1>
          <p className="text-slate-500 mt-1">
            Define roles and their permissions for your organization
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<ShieldPlus className="w-5 h-5" />}>
          Add Role
        </Button>
      </div>

      {/* Error Alert */}
      {(rolesError || pageError) && (
        <div className="mb-6">
          <ErrorAlert
            message={rolesError?.message || pageError || "An error occurred"}
            onDismiss={() => setPageError(null)}
          />
        </div>
      )}

      {/* Roles Grid */}
      {roles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <EmptyState
            icon="file"
            title="No roles found"
            description="Create your first role to get started"
            action={
              <Button onClick={openCreateModal} variant="secondary">
                Create your first role
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {role.name}
                  </h3>
                  <span
                    className={clsx(
                      "inline-block px-2 py-1 rounded text-xs font-medium mt-2",
                      getRoleTypeColor(role.type)
                    )}
                  >
                    {role.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    icon={<Edit2 className="w-4 h-4" />}
                    label="Edit role"
                    onClick={() => openEditModal(role)}
                  />
                  <IconButton
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Delete role"
                    variant="danger"
                    onClick={() => setDeleteRoleId(role.id)}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Permissions
                </p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.length > 0 ? (
                    role.permissions.slice(0, 4).map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                      >
                        {perm.split(".")[0]}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No permissions
                    </span>
                  )}
                  {role.permissions.length > 4 && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                      +{role.permissions.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingRole ? "Edit Role" : "Create New Role"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && <ErrorAlert message={formError.message} />}

          <FormField
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Lead Server"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role Type
            </label>
            <Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={roleTypeOptions}
            />
            <p className="mt-1 text-xs text-slate-500">
              Role type determines default behaviors and dashboard view
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map((perm) => (
                <button
                  key={perm.value}
                  type="button"
                  onClick={() => togglePermission(perm.value)}
                  className={clsx(
                    "p-3 rounded-lg text-left text-sm font-medium transition-all border",
                    formData.permissions.includes(perm.value)
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={clsx(
                        "w-4 h-4 rounded border-2 flex items-center justify-center",
                        formData.permissions.includes(perm.value)
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300"
                      )}
                    >
                      {formData.permissions.includes(perm.value) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    {perm.label}
                  </div>
                </button>
              ))}
            </div>
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
              {editingRole ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteRoleId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteRoleId(null)}
        title="Delete Role"
        message="Are you sure you want to delete this role? Users with this role will need to be reassigned."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
