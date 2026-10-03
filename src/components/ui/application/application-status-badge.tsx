"use client"

import { cn } from "@/lib/utils"

interface ApplicationStatusBadgeProps {
  status: "pending" | "approved" | "rejected"
  className?: string
}

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: "Pending Review",
      className: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20",
      dotClass: "bg-amber-500",
    },
    approved: {
      label: "Approved",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20",
      dotClass: "bg-emerald-500",
    },
    rejected: {
      label: "Rejected",
      className: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20",
      dotClass: "bg-rose-500",
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm ring-1 ring-inset transition-all",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </div>
  )
}
