"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  ConfirmationModal,
  ConfirmationVariant,
  ConfirmationModalProps,
} from "@/components/ui/confirmation-modal";

export interface ConfirmationOptions {
  title?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: "trash" | "warning" | "alert" | "info" | "shield" | "check" | "help" | React.ReactNode;
}

export interface ConfirmCallable {
  (
    optionsOrMessage: string | ConfirmationOptions,
    extraOptions?: Partial<ConfirmationOptions>
  ): Promise<boolean>;
  confirm(
    optionsOrMessage: string | ConfirmationOptions,
    extraOptions?: Partial<ConfirmationOptions>
  ): Promise<boolean>;
}

interface ConfirmationContextType {
  confirm(
    optionsOrMessage: string | ConfirmationOptions,
    extraOptions?: Partial<ConfirmationOptions>
  ): Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

const DESTRUCTIVE_KEYWORDS = [
  "delete",
  "remove",
  "revoke",
  "revert",
  "archive",
  "deactivate",
  "purge",
  "destroy",
  "terminate",
];

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState<ConfirmationOptions>({});
  const [isLoading, setIsLoading] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setIsOpen(false);
    setIsLoading(false);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const confirm = useCallback(
    (
      optionsOrMessage: string | ConfirmationOptions,
      extraOptions?: Partial<ConfirmationOptions>
    ): Promise<boolean> => {
      // If a previous confirmation is still pending, cancel it
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }

      let parsed: ConfirmationOptions = {};

      if (typeof optionsOrMessage === "string") {
        const text = optionsOrMessage.trim();
        const isDestructive = DESTRUCTIVE_KEYWORDS.some((kw) =>
          text.toLowerCase().includes(kw)
        );

        let defaultConfirm = "Continue";
        if (isDestructive) {
          const lower = text.toLowerCase();
          if (lower.includes("archive")) defaultConfirm = "Archive";
          else if (lower.includes("revoke")) defaultConfirm = "Revoke";
          else if (lower.includes("revert")) defaultConfirm = "Revert";
          else if (lower.includes("clear")) defaultConfirm = "Clear";
          else defaultConfirm = "Delete";
        }

        parsed = {
          title: extraOptions?.title ?? "Please Confirm",
          message: text,
          variant: extraOptions?.variant ?? (isDestructive ? "destructive" : "default"),
          confirmText: extraOptions?.confirmText ?? defaultConfirm,
          cancelText: extraOptions?.cancelText ?? "Cancel",
          ...extraOptions,
        };
      } else {
        const rawMessage = optionsOrMessage.message ?? optionsOrMessage.description;
        const msgStr = typeof rawMessage === "string" ? rawMessage : "";
        const titleStr = typeof optionsOrMessage.title === "string" ? optionsOrMessage.title : "";
        const combined = `${titleStr} ${msgStr}`.toLowerCase();
        const isDestructive = DESTRUCTIVE_KEYWORDS.some((kw) => combined.includes(kw));

        let defaultConfirm = "Confirm";
        if (isDestructive || optionsOrMessage.variant === "destructive") {
          if (combined.includes("archive")) defaultConfirm = "Archive";
          else if (combined.includes("revoke")) defaultConfirm = "Revoke";
          else if (combined.includes("revert")) defaultConfirm = "Revert";
          else if (combined.includes("clear")) defaultConfirm = "Clear";
          else defaultConfirm = "Delete";
        }

        parsed = {
          title: optionsOrMessage.title ?? "Please Confirm",
          message: rawMessage,
          description: optionsOrMessage.description,
          confirmText: optionsOrMessage.confirmText ?? defaultConfirm,
          cancelText: optionsOrMessage.cancelText ?? "Cancel",
          variant:
            optionsOrMessage.variant ?? (isDestructive ? "destructive" : "default"),
          icon: optionsOrMessage.icon,
          ...extraOptions,
        };
      }

      setModalProps(parsed);
      setIsOpen(true);
      setIsLoading(false);

      return new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
      });
    },
    []
  );

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <ConfirmationModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose(false);
        }}
        title={modalProps.title}
        message={modalProps.message ?? modalProps.description}
        confirmText={modalProps.confirmText}
        cancelText={modalProps.cancelText}
        variant={modalProps.variant}
        icon={modalProps.icon}
        loading={isLoading}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmationContext.Provider>
  );
}

export function useConfirm(): ConfirmCallable {
  const context = useContext(ConfirmationContext);

  if (!context) {
    // Graceful fallback if invoked outside provider in edge scenarios (e.g. tests or isolated components)
    console.warn(
      "useConfirm was called outside of ConfirmationProvider. Falling back to window.confirm."
    );
    const fallbackFn = async (
      optionsOrMessage: string | ConfirmationOptions
    ): Promise<boolean> => {
      const msg =
        typeof optionsOrMessage === "string"
          ? optionsOrMessage
          : typeof optionsOrMessage.message === "string"
          ? optionsOrMessage.message
          : "Are you sure you want to proceed?";
      return window.confirm(msg);
    };
    return Object.assign(fallbackFn, { confirm: fallbackFn }) as ConfirmCallable;
  }

  const fn = context.confirm;
  return Object.assign(fn, { confirm: fn }) as ConfirmCallable;
}
