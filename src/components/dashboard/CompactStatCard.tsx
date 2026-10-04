"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type CompactStatStatus = "neutral" | "emerald" | "amber" | "rose" | "blue" | "purple";

export interface CompactStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  status?: CompactStatStatus;
  badge?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  href?: string;
  onClick?: () => void;
}

const statusConfig: Record<
  CompactStatStatus,
  {
    card: string;
    iconBg: string;
    iconColor: string;
    badge: string;
  }
> = {
  neutral: {
    card: "bg-white border-slate-200/80 hover:border-slate-300 hover:-translate-y-1",
    iconBg: "bg-slate-50 text-slate-600 border border-slate-200/60 shadow-xs",
    iconColor: "text-slate-600",
    badge: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  emerald: {
    card: "bg-white border-emerald-100 hover:border-emerald-300 hover:-translate-y-1",
    iconBg: "bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  amber: {
    card: "bg-white border-amber-100 hover:border-amber-300 hover:-translate-y-1",
    iconBg: "bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs",
    iconColor: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  rose: {
    card: "bg-white border-rose-100 hover:border-rose-300 hover:-translate-y-1",
    iconBg: "bg-rose-50 text-rose-700 border border-rose-200/60 shadow-xs",
    iconColor: "text-rose-600",
    badge: "bg-rose-50 text-rose-700 border border-rose-200",
  },
  blue: {
    card: "bg-white border-blue-100 hover:border-blue-300 hover:-translate-y-1",
    iconBg: "bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs",
    iconColor: "text-blue-600",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  purple: {
    card: "bg-white border-purple-100 hover:border-purple-300 hover:-translate-y-1",
    iconBg: "bg-purple-50 text-purple-700 border border-purple-200/60 shadow-xs",
    iconColor: "text-purple-600",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
  },
};

export function CompactStatCard({
  label,
  value,
  icon: Icon,
  status = "neutral",
  badge,
  trend,
  href,
  onClick,
  className,
  ...props
}: CompactStatCardProps) {
  const styles = statusConfig[status] || statusConfig.neutral;

  const content = (
    <div
      className={cn(
        "rounded-2xl border-2 p-3.5 sm:p-4 transition-all duration-200 max-h-[130px] flex flex-col justify-between select-none active:scale-[0.98]",
        styles.card,
        className
      )}
      style={{
        boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
      }}
      onClick={onClick}
      {...props}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            {label}
          </p>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {value}
          </div>
        </div>
        {Icon && (
          <div
            className={cn(
              "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs",
              styles.iconBg
            )}
          >
            <Icon className={cn("w-4 h-4", styles.iconColor)} />
          </div>
        )}
      </div>

      {(trend || badge) && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          {trend && (
            <span
              className={cn(
                "font-semibold inline-flex items-center gap-0.5",
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
          {badge && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold border ml-auto",
                styles.badge
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
