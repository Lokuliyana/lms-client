// src/components/ui/stat-card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type StatStatus = "neutral" | "emerald" | "amber" | "rose" | "slate";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  status?: StatStatus;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  description?: string;
  badge?: string;
}

const statusStyles: Record<
  StatStatus,
  {
    card: string;
    iconBg: string;
    iconColor: string;
    badge: string;
  }
> = {
  neutral: {
    card: "bg-white border-slate-200 hover:border-slate-300",
    iconBg: "bg-slate-50 border-slate-200 text-slate-600",
    iconColor: "text-slate-600",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  emerald: {
    card: "bg-white border-slate-200 hover:border-emerald-200",
    iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  amber: {
    card: "bg-white border-slate-200 hover:border-amber-200",
    iconBg: "bg-amber-50 border-amber-100 text-amber-600",
    iconColor: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  rose: {
    card: "bg-white border-slate-200 hover:border-rose-200",
    iconBg: "bg-rose-50 border-rose-100 text-rose-600",
    iconColor: "text-rose-600",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  slate: {
    card: "bg-white border-slate-200 hover:border-slate-300",
    iconBg: "bg-slate-100 border-slate-200 text-slate-500",
    iconColor: "text-slate-500",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      label,
      value,
      icon: Icon,
      status = "neutral",
      trend,
      description,
      badge,
      ...props
    },
    ref
  ) => {
    const config = statusStyles[status] || statusStyles.neutral;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border p-4 shadow-sm transition-all duration-200 relative",
          config.card,
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500 tracking-wide uppercase truncate">
              {label}
            </p>
            <div className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              {value}
            </div>
          </div>
          {Icon && (
            <div
              className={cn(
                "p-2.5 rounded-xl border flex items-center justify-center shrink-0",
                config.iconBg
              )}
            >
              <Icon className={cn("w-5 h-5", config.iconColor)} />
            </div>
          )}
        </div>

        {(trend || description || badge) && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  "font-medium inline-flex items-center gap-1",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                {trend.value}
                {trend.label && (
                  <span className="text-slate-400 font-normal ml-0.5">
                    {trend.label}
                  </span>
                )}
              </span>
            )}
            {description && !trend && (
              <span className="text-slate-500 truncate">{description}</span>
            )}
            {badge && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold border ml-auto",
                  config.badge
                )}
              >
                {badge}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);
StatCard.displayName = "StatCard";
