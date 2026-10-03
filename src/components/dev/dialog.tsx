// components/dev/dialog.tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Root exports                                                       */
/* ------------------------------------------------------------------ */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

/* ------------------------------------------------------------------ */
/* Overlay                                                            */
/* ------------------------------------------------------------------ */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[60] bg-black/60 backdrop-blur-[1.5px]",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
      "motion-reduce:transition-none",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/* ------------------------------------------------------------------ */
/* Content                                                            */
/* ------------------------------------------------------------------ */
type ContentSize = "sm" | "md" | "lg" | "xl" | "full";
type ContentVariant = "card" | "bare";

type ContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  variant?: ContentVariant;
  size?: ContentSize;
  hideClose?: boolean;
  panelClassName?: string;
};

const sizeToWidth: Record<ContentSize, string> = {
  sm: "sm:max-w-[480px] md:max-w-[520px]",
  md: "sm:max-w-[640px] md:max-w-[720px]",
  lg: "sm:max-w-[840px] md:max-w-[920px]",
  xl: "sm:max-w-[980px] md:max-w-[1100px]",
  full: "sm:max-w-[98vw]",
};

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ContentProps
>(
  (
    {
      className,
      children,
      variant = "card",
      size = "lg",
      hideClose = false,
      panelClassName,
      ...props
    },
    ref
  ) => {
    const titleId = React.useId();
    const descId = React.useId();

    return (
      <DialogPortal>
        <DialogOverlay />

        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61]",
            "outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-top-2",
            "motion-reduce:transition-none"
          )}
          aria-labelledby={titleId}
          aria-describedby={descId}
          {...props}
        >
          {variant === "bare" ? (
            <div
              className={cn(
                "relative w-screen h-screen sm:h-auto sm:w-auto outline-none",
                className
              )}
            >
              {!hideClose && (
                <DialogPrimitive.Close
                  className="absolute right-4 top-4 z-[70] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              )}
              {children}
            </div>
          ) : (
            <div
              role="dialog"
              aria-modal="true"
              className={cn(
                "relative w-screen h-screen sm:h-auto sm:w-[96vw]",
                sizeToWidth[size],
                "bg-white border border-slate-200 rounded-none sm:rounded-2xl",
                "shadow-[0_24px_80px_-20px_rgba(2,6,23,0.35)]",
                "flex max-h-[100vh] sm:max-h-[85vh] flex-col overflow-hidden",
                "outline-none",
                panelClassName,
                className
              )}
            >
              {!hideClose && (
                <DialogPrimitive.Close
                  className="absolute right-4 top-4 z-[70] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              )}
              {children}
              <span id={titleId} hidden />
              <span id={descId} hidden />
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

/* ------------------------------------------------------------------ */
/* Header / Footer                                                    */
/* ------------------------------------------------------------------ */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-5 sm:px-6 pt-5 pb-3 border-b bg-gradient-to-r from-indigo-50 via-white to-white",
      "sticky top-0 z-10",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-5 sm:px-6 py-4 border-t bg-slate-50/60 flex flex-col sm:flex-row sm:justify-end gap-2",
      "sticky bottom-0 z-10",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/* ------------------------------------------------------------------ */
/* Title / Description                                                */
/* ------------------------------------------------------------------ */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl sm:text-2xl font-extrabold tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-600", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/* ------------------------------------------------------------------ */
/* Exports                                                            */
/* ------------------------------------------------------------------ */
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
