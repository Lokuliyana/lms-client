"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

export interface ClayEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  illustration?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: ButtonProps["variant"];
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  compact?: boolean;
  illustrationClassName?: string;
}

export const ClayEmptyState = React.forwardRef<HTMLDivElement, ClayEmptyStateProps>(
  (
    {
      className,
      illustration,
      title,
      description,
      action,
      secondaryAction,
      compact = false,
      illustrationClassName,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-8 shadow-xs transition-all",
          compact ? "p-6 my-2" : "p-10 my-4 sm:p-12",
          className
        )}
        {...props}
      >
        {illustration && (
          <div
            className={cn(
              "relative mb-5 flex items-center justify-center drop-shadow-sm transition-transform hover:scale-105 duration-300",
              compact ? "w-28 h-28" : "w-40 h-40 sm:w-48 sm:h-48",
              illustrationClassName
            )}
          >
            <Image
              src={illustration}
              alt={title || "Empty State Illustration"}
              fill
              sizes="(max-width: 640px) 160px, 200px"
              className="object-contain pointer-events-none select-none"
              priority
            />
          </div>
        )}

        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight max-w-md">
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm sm:max-w-md leading-relaxed">
            {description}
          </p>
        )}

        {(action || secondaryAction || children) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {action && (
              action.href ? (
                <Button
                  variant={action.variant || "primary"}
                  size={compact ? "sm" : "default"}
                  asChild
                  className="rounded-xl shadow-xs"
                >
                  <Link href={action.href} className="inline-flex items-center gap-2">
                    {action.icon && <action.icon className="w-4 h-4" />}
                    {action.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  variant={action.variant || "primary"}
                  size={compact ? "sm" : "default"}
                  onClick={action.onClick}
                  className="rounded-xl shadow-xs"
                >
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </Button>
              )
            )}

            {secondaryAction && (
              secondaryAction.href ? (
                <Button
                  variant="outline"
                  size={compact ? "sm" : "default"}
                  asChild
                  className="rounded-xl"
                >
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size={compact ? "sm" : "default"}
                  onClick={secondaryAction.onClick}
                  className="rounded-xl"
                >
                  {secondaryAction.label}
                </Button>
              )
            )}

            {children}
          </div>
        )}
      </div>
    );
  }
);

ClayEmptyState.displayName = "ClayEmptyState";
