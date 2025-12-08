"use client";

import { clsx } from "clsx";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Modal } from "./Modal";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    buttonBg: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    buttonBg: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonBg: "bg-blue-600 hover:bg-blue-700",
  },
};

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      showCloseButton={false}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={clsx(
              "px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors",
              config.buttonBg
            )}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={clsx(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            config.iconBg
          )}
        >
          <Icon className={clsx("w-5 h-5", config.iconColor)} />
        </div>
        <div className="flex-1 pt-1">
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      </div>
    </Modal>
  );
}

// Convenience component for delete confirmations
export function DeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  itemName,
  isLoading,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName: string;
  isLoading?: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onConfirm={onConfirm}
      onCancel={onCancel}
      title="Delete Item"
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="danger"
      isLoading={isLoading}
    />
  );
}
