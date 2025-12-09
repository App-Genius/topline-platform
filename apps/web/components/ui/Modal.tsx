"use client";

import { useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";
import FocusTrap from "focus-trap-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  /** Optional description for screen readers */
  description?: string;
  /** ID of element containing description */
  descriptionId?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[90vw] max-h-[90vh]",
};

/**
 * Accessible Modal Component
 *
 * Features:
 * - Focus trap: keyboard focus stays within modal
 * - Screen reader announcements
 * - Escape key closes modal
 * - Focus returns to trigger element on close
 * - ARIA attributes for accessibility
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  description,
  descriptionId,
}: ModalProps) {
  // Store reference to element that triggered the modal
  const triggerRef = useRef<Element | null>(null);
  const modalId = useRef(`modal-${Math.random().toString(36).slice(2, 9)}`);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      triggerRef.current = document.activeElement;

      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      // Announce modal to screen readers
      const announcement = document.createElement("div");
      announcement.setAttribute("role", "status");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("aria-atomic", "true");
      announcement.className = "sr-only";
      announcement.textContent = `${title} dialog opened`;
      document.body.appendChild(announcement);

      // Clean up announcement after it's read
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";

      // Return focus to trigger element
      if (triggerRef.current && triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, handleEscape, title]);

  if (!isOpen) return null;

  const titleId = `${modalId.current}-title`;
  const descId = descriptionId || `${modalId.current}-description`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
        data-testid="modal-backdrop"
        aria-hidden="true"
      />

      {/* Focus Trap wraps the modal */}
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          allowOutsideClick: closeOnBackdrop,
          escapeDeactivates: closeOnEscape,
          onDeactivate: onClose,
          returnFocusOnDeactivate: true,
        }}
      >
        {/* Modal */}
        <div
          className={clsx(
            "relative w-full bg-white rounded-xl shadow-xl",
            "transform transition-all",
            "max-h-[90vh] flex flex-col",
            sizeClasses[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
        >
          {/* Screen reader only description */}
          {description && (
            <div id={descId} className="sr-only">
              {description}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2
              id={titleId}
              className="text-lg font-semibold text-slate-900"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </FocusTrap>
    </div>
  );
}
