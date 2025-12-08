"use client";

import { useState, FormEvent, useMemo } from "react";
import { Users, UserPlus, Edit2, Trash2 } from "lucide-react";
import {
  useUsers,
  useRoles,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
} from "@/hooks/useApi";
import {
  Modal,
  Button,
  IconButton,
  ErrorAlert,
  LoadingSpinner,
  EmptyState,
  FormField,
  Select,
  SearchInput,
  DataTable,
  ConfirmDialog,
  StatusBadge,
  RoleBadge,
  type Column,
} from "@/components/ui";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isActive: boolean;
  roleId: string;
  role: { id: string; name: string };
  createdAt: Date;
}

export default function UsersPage() {
  // Data hooks
  const [filterParams, setFilterParams] = useState<{
    roleId?: string;
    isActive?: boolean;
    search?: string;
  }>({});

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useUsers(filterParams);

  const { data: rolesData } = useRoles();

  // Mutation hooks
  const { createUser, isLoading: isCreating, error: createError } = useCreateUser();
  const { updateUser, isLoading: isUpdating, error: updateError } = useUpdateUser();
  const { deactivateUser, isLoading: isDeactivating } = useDeactivateUser();

  // Local state
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    avatar: "",
    roleId: "",
  });

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  // Derived data
  const users = usersData?.data ?? [];
  const roles = rolesData?.data ?? [];
  const isSubmitting = isCreating || isUpdating;
  const formError = createError || updateError;

  // Filter users locally by search term
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const searchLower = search.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    );
  }, [users, search]);

  // Role options for select
  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  // Handle filter changes
  const handleFilterChange = () => {
    setFilterParams({
      ...(filterRole ? { roleId: filterRole } : {}),
      ...(filterActive !== "" ? { isActive: filterActive === "true" } : {}),
      ...(search ? { search } : {}),
    });
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    handleFilterChange();
  };

  // Modal handlers
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      name: "",
      avatar: "",
      roleId: roles[0]?.id || "",
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      name: user.name,
      avatar: user.avatar || "",
      roleId: user.roleId,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  // Form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          email: formData.email,
          name: formData.name,
          roleId: formData.roleId,
        });
      } else {
        await createUser({
          email: formData.email,
          name: formData.name,
          roleId: formData.roleId,
          pin: formData.password,
        });
      }
      closeModal();
      refetchUsers();
    } catch {
      // Error is handled by the hook
    }
  };

  // Delete handler
  const handleDeactivate = async () => {
    if (!deleteUserId) return;

    try {
      await deactivateUser(deleteUserId);
      setDeleteUserId(null);
      refetchUsers();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to deactivate user");
    }
  };

  // Table columns
  const columns: Column<User>[] = [
    {
      id: "user",
      header: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
            {user.avatar ||
              user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      render: (user) => <RoleBadge role={user.role.name} />,
    },
    {
      id: "status",
      header: "Status",
      render: (user) => (
        <StatusBadge status={user.isActive ? "active" : "inactive"} />
      ),
    },
    {
      id: "createdAt",
      header: "Joined",
      accessor: "createdAt" as keyof User,
      render: (user) => (
        <span className="text-sm text-slate-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "Actions",
      align: "right" as const,
      render: (user) => (
        <div className="flex items-center justify-end gap-2">
          <IconButton
            icon={<Edit2 className="w-4 h-4" />}
            label="Edit user"
            onClick={() => openEditModal(user)}
          />
          <IconButton
            icon={<Trash2 className="w-4 h-4" />}
            label="Deactivate user"
            variant="danger"
            onClick={() => setDeleteUserId(user.id)}
          />
        </div>
      ),
    },
  ];

  // Loading state
  if (usersLoading && !usersData) {
    return (
      <div className="p-8">
        <LoadingSpinner label="Loading users..." />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="text-emerald-600" />
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your team members and their permissions
          </p>
        </div>
        <Button onClick={openCreateModal} leftIcon={<UserPlus className="w-5 h-5" />}>
          Add User
        </Button>
      </div>

      {/* Error Alert */}
      {(usersError || pageError) && (
        <div className="mb-6">
          <ErrorAlert
            message={usersError || pageError || "An error occurred"}
            onDismiss={() => setPageError(null)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search by name or email..."
            />
          </div>
          <Select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
            }}
            options={[{ value: "", label: "All Roles" }, ...roleOptions]}
            className="min-w-[150px]"
          />
          <Select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value);
            }}
            options={statusOptions}
            className="min-w-[150px]"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredUsers.length === 0 && !usersLoading ? (
          <EmptyState icon="users" title="No users found" />
        ) : (
          <DataTable
            data={filteredUsers}
            columns={columns}
            keyField="id"
            isLoading={usersLoading}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingUser ? "Edit User" : "Add New User"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <ErrorAlert message={formError} />
          )}

          <FormField
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />

          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
            required
          />

          {!editingUser && (
            <FormField
              label="PIN / Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 4 characters"
              required={!editingUser}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <Select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              options={[{ value: "", label: "Select a role" }, ...roleOptions]}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              {editingUser ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUserId}
        onConfirm={handleDeactivate}
        onCancel={() => setDeleteUserId(null)}
        title="Deactivate User"
        message="Are you sure you want to deactivate this user? They will no longer be able to log in."
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={isDeactivating}
      />
    </div>
  );
}
