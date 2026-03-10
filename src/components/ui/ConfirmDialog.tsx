"use client";

import { useEffect, useRef, useCallback, useId } from "react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      // Trap focus within dialog
      if (e.key === "Tab") {
        const dialog = overlayRef.current?.querySelector("[role='document']");
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      document.addEventListener("keydown", handleKeyDown);
      // Focus cancel button on open
      requestAnimationFrame(() => cancelRef.current?.focus());
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        // Return focus to trigger
        if (triggerRef.current instanceof HTMLElement) {
          triggerRef.current.focus();
        }
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        role="document"
        className="mx-4 w-full max-w-sm border border-black bg-white p-6"
      >
        <h2
          id={titleId}
          className="text-lg font-bold text-black"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-black">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button ref={cancelRef} variant="secondary" size="sm" onClick={onCancel}>
            Annuleren
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
