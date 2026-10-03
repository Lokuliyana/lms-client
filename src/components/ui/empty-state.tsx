// src/components/ui/empty-state.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  illustration?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: ButtonProps["variant"];
    icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  compact?: boolean;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon,
      illustration,
      title,
      description,
      action,
      secondaryAction,
      compact = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 shadow-xs",
          compact ? "p-6 my-2" : "p-10 my-4 sm:p-12",
          className
        )}
        {...props}
      >
        {illustration ? (
          <div
            className={cn(
              "relative mb-4 flex items-center justify-center drop-shadow-sm transition-transform hover:scale-105 duration-300",
              compact ? "w-28 h-28" : "w-40 h-40 sm:w-48 sm:h-48"
            )}
          >
            <Image
              src={illustration}
              alt={title || "Empty state illustration"}
              fill
              sizes="(max-width: 640px) 160px, 200px"
              className="object-contain pointer-events-none select-none"
              priority
            />
          </div>
        ) : Icon ? (
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-500 mb-3.5">
            <Icon className="w-6 h-6 stroke-[1.75]" />
          </div>
        ) : null}

        <h3 className="text-base font-semibold text-slate-900 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-slate-500 max-w-sm leading-relaxed">
            {description}
          </p>
        )}

        {(action || secondaryAction || children) && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {action && (
              action.href ? (
                <Button
                  variant={action.variant || "primary"}
                  size={compact ? "sm" : "default"}
                  asChild
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
                >
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </Button>
              )
            )}
            {secondaryAction && (
              secondaryAction.href ? (
                <Button variant="outline" size={compact ? "sm" : "default"} asChild>
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size={compact ? "sm" : "default"}
                  onClick={secondaryAction.onClick}
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
EmptyState.displayName = "EmptyState";
