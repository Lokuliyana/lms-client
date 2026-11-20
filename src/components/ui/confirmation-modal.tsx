"use client";

import React, { useRef, useEffect } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import {
  AlertTriangle,
  Trash2,
  HelpCircle,
  Info,
  ShieldAlert,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmationVariant =
  | "destructive"
  | "danger"
  | "warning"
  | "info"
  | "primary"
  | "default"
  | "success";

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: "trash" | "warning" | "alert" | "info" | "shield" | "check" | "help" | React.ReactNode;
  loading?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title = "Are you sure?",
  message,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const contentBody = message ?? description;
  const isDestructive = variant === "destructive" || variant === "danger";
  const isWarning = variant === "warning";
  const isSuccess = variant === "success";

  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Icon resolver
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }

    if (icon === "trash" || (isDestructive && !icon)) {
      return <Trash2 className="w-6 h-6" />;
    }
    if (icon === "warning" || icon === "alert" || isWarning) {
      return <AlertTriangle className="w-6 h-6" />;
    }
    if (icon === "shield") {
      return <ShieldAlert className="w-6 h-6" />;
    }
    if (icon === "check" || isSuccess) {
      return <CheckCircle2 className="w-6 h-6" />;
    }
    if (icon === "info" || variant === "info") {
      return <Info className="w-6 h-6" />;
    }
    return <HelpCircle className="w-6 h-6" />;
  };

  // Badge styling
  const badgeClasses = cn(
    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
    isDestructive && "bg-rose-50 text-rose-600 border border-rose-100/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 shadow-sm shadow-rose-500/10",
    isWarning && "bg-amber-50 text-amber-600 border border-amber-100/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60 shadow-sm shadow-amber-500/10",
    isSuccess && "bg-emerald-50 text-emerald-600 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 shadow-sm shadow-emerald-500/10",
    !isDestructive && !isWarning && !isSuccess && "bg-indigo-50 text-indigo-600 border border-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60 shadow-sm shadow-indigo-500/10"
  );

  // Confirm button styling
  const confirmBtnClasses = cn(
    "relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm",
    isDestructive &&
      "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 hover:shadow-md hover:shadow-rose-600/35",
    isWarning &&
      "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25 hover:shadow-md hover:shadow-amber-600/35",
    isSuccess &&
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 hover:shadow-md hover:shadow-emerald-600/35",
    !isDestructive &&
      !isWarning &&
      !isSuccess &&
      "bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-indigo-600/25 hover:shadow-md hover:shadow-indigo-600/35"
  );

  const handleCancelClick = () => {
    if (loading) return;
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        {/* Backdrop Overlay */}
        <AlertDialogPrimitive.Overlay
          onClick={() => {
            if (!loading) handleCancelClick();
          }}
          className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-xs duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />

        {/* Modal Content */}
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={(e: any) => {
            if (!loading) {
              e.preventDefault();
              handleCancelClick();
            } else {
              e.preventDefault();
            }
          }}
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]",
            "w-[calc(100vw-2rem)] max-w-md p-6 sm:p-7 rounded-3xl",
            "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800",
            "shadow-2xl shadow-slate-900/15 dark:shadow-black/50",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "focus:outline-none select-none"
          )}
        >
          {/* Close X Button */}
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={loading}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col gap-4">
            {/* Header with Icon and Title */}
            <div className="flex items-start gap-4">
              <div className={badgeClasses}>{renderIcon()}</div>

              <div className="flex-1 pr-6 pt-0.5">
                <AlertDialogPrimitive.Title className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                  {title}
                </AlertDialogPrimitive.Title>

                {contentBody ? (
                  <AlertDialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    {contentBody}
                  </AlertDialogPrimitive.Description>
                ) : (
                  <AlertDialogPrimitive.Description className="sr-only">
                    {typeof title === "string" ? title : "Confirmation dialog"}
                  </AlertDialogPrimitive.Description>
                )}
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={handleCancelClick}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={handleConfirmClick}
                disabled={loading}
                className={confirmBtnClasses}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                <span>{confirmText}</span>
              </button>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
