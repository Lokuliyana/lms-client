"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type SectionHeaderVariant =
  | "rose"
  | "cream"
  | "blue"
  | "purple"
  | "emerald"
  | "amber"
  | "indigo"
  | "default";

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[] | ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  illustration?: string;
  variant?: SectionHeaderVariant;
  badge?: ReactNode;
  className?: string;
}

const THEME_STYLES: Record<
  string,
  {
    container: string;
    glow1: string;
    glow2: string;
    iconBg: string;
    badge: string;
    crumb: string;
  }
> = {
  rose: {
    container:
      "bg-[#FFF5F5] bg-gradient-to-r from-rose-50/95 via-pink-50/60 to-rose-100/70 border-rose-200/80 shadow-xs",
    glow1: "bg-rose-200/40",
    glow2: "bg-pink-200/30",
    iconBg: "bg-rose-100 text-rose-700 border-rose-200",
    badge: "bg-rose-100/90 text-rose-800 border-rose-200/80",
    crumb: "text-rose-600 hover:text-rose-700",
  },
  cream: {
    container:
      "bg-[#FFF9F2] bg-gradient-to-r from-amber-50/95 via-orange-50/50 to-amber-100/70 border-amber-200/80 shadow-xs",
    glow1: "bg-amber-200/40",
    glow2: "bg-orange-200/30",
    iconBg: "bg-amber-100 text-amber-700 border-amber-200",
    badge: "bg-amber-100/90 text-amber-800 border-amber-200/80",
    crumb: "text-amber-700 hover:text-amber-800",
  },
  blue: {
    container:
      "bg-[#F0F7FF] bg-gradient-to-r from-blue-50/95 via-sky-50/50 to-blue-100/70 border-blue-200/80 shadow-xs",
    glow1: "bg-blue-200/40",
    glow2: "bg-sky-200/30",
    iconBg: "bg-blue-100 text-blue-700 border-blue-200",
    badge: "bg-blue-100/90 text-blue-800 border-blue-200/80",
    crumb: "text-blue-600 hover:text-blue-700",
  },
  purple: {
    container:
      "bg-[#FAF5FF] bg-gradient-to-r from-purple-50/95 via-violet-50/50 to-purple-100/70 border-purple-200/80 shadow-xs",
    glow1: "bg-purple-200/40",
    glow2: "bg-violet-200/30",
    iconBg: "bg-purple-100 text-purple-700 border-purple-200",
    badge: "bg-purple-100/90 text-purple-800 border-purple-200/80",
    crumb: "text-purple-600 hover:text-purple-700",
  },
  emerald: {
    container:
      "bg-[#F0FDF4] bg-gradient-to-r from-emerald-50/95 via-teal-50/50 to-emerald-100/70 border-emerald-200/80 shadow-xs",
    glow1: "bg-emerald-200/40",
    glow2: "bg-teal-200/30",
    iconBg: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badge: "bg-emerald-100/90 text-emerald-800 border-emerald-200/80",
    crumb: "text-emerald-700 hover:text-emerald-800",
  },
  amber: {
    container:
      "bg-[#FFFBEB] bg-gradient-to-r from-amber-50/95 via-yellow-50/50 to-amber-100/70 border-amber-200/80 shadow-xs",
    glow1: "bg-amber-200/40",
    glow2: "bg-yellow-200/30",
    iconBg: "bg-amber-100 text-amber-700 border-amber-200",
    badge: "bg-amber-100/90 text-amber-800 border-amber-200/80",
    crumb: "text-amber-700 hover:text-amber-800",
  },
  indigo: {
    container:
      "bg-[#EEF2FF] bg-gradient-to-r from-indigo-50/95 via-blue-50/50 to-indigo-100/70 border-indigo-200/80 shadow-xs",
    glow1: "bg-indigo-200/40",
    glow2: "bg-blue-200/30",
    iconBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
    badge: "bg-indigo-100/90 text-indigo-800 border-indigo-200/80",
    crumb: "text-indigo-600 hover:text-indigo-700",
  },
  default: {
    container:
      "bg-[#FFF5F5] bg-gradient-to-r from-rose-50/95 via-pink-50/60 to-rose-100/70 border-rose-200/80 shadow-xs",
    glow1: "bg-rose-200/40",
    glow2: "bg-pink-200/30",
    iconBg: "bg-rose-100 text-rose-700 border-rose-200",
    badge: "bg-rose-100/90 text-rose-800 border-rose-200/80",
    crumb: "text-rose-600 hover:text-rose-700",
  },
};

function resolveContextualIllustration(
  title: ReactNode,
  description?: ReactNode,
  explicitIllustration?: string,
  explicitVariant?: SectionHeaderVariant
): { illustration: string; variantKey: string } {
  if (explicitIllustration) {
    const vKey = explicitVariant && explicitVariant !== "default" ? explicitVariant : "rose";
    return { illustration: explicitIllustration, variantKey: vKey };
  }

  // Extract searchable strings from React elements or primitives
  let text = "";
  const inspectNode = (node: any) => {
    if (!node) return;
    if (typeof node === "string" || typeof node === "number") {
      text += " " + node;
    } else if (React.isValidElement(node)) {
      const p = node.props as any;
      if (p?.configKey) text += " " + p.configKey;
      if (p?.initialValue) text += " " + p.initialValue;
      if (p?.children) {
        if (Array.isArray(p.children)) p.children.forEach(inspectNode);
        else inspectNode(p.children);
      }
    }
  };
  inspectNode(title);
  inspectNode(description);
  const lower = text.toLowerCase();

  let illustration: string = CLAY_ASSETS.thumbTheoryOpenbook;
  let variantKey = explicitVariant && explicitVariant !== "default" ? explicitVariant : "rose";

  if (
    lower.includes("store") ||
    lower.includes("shop") ||
    lower.includes("bookstore") ||
    lower.includes("cart") ||
    lower.includes("product")
  ) {
    illustration = CLAY_ASSETS.storeHeroCart;
    if (!explicitVariant || explicitVariant === "default") variantKey = "amber";
  } else if (
    lower.includes("quiz") ||
    lower.includes("challenge") ||
    lower.includes("questions") ||
    lower.includes("trivia")
  ) {
    illustration = CLAY_ASSETS.thumbMathematics;
    if (!explicitVariant || explicitVariant === "default") variantKey = "purple";
  } else if (
    lower.includes("delivery") ||
    lower.includes("deliveries") ||
    lower.includes("courier") ||
    lower.includes("dispatch") ||
    lower.includes("shipping")
  ) {
    illustration = CLAY_ASSETS.dispatchCourierVan;
    if (!explicitVariant || explicitVariant === "default") variantKey = "blue";
  } else if (
    lower.includes("exam") ||
    lower.includes("grade") ||
    lower.includes("mark") ||
    lower.includes("score") ||
    lower.includes("trophy") ||
    lower.includes("results") ||
    lower.includes("review")
  ) {
    illustration = CLAY_ASSETS.gradeReportTrophy;
    if (!explicitVariant || explicitVariant === "default") variantKey = "cream";
  } else if (
    lower.includes("attendance") ||
    lower.includes("roster") ||
    lower.includes("present")
  ) {
    illustration = CLAY_ASSETS.emptyAttendanceRoster;
    if (!explicitVariant || explicitVariant === "default") variantKey = "emerald";
  } else if (
    lower.includes("profile") ||
    lower.includes("student") ||
    lower.includes("user") ||
    lower.includes("account")
  ) {
    illustration = CLAY_ASSETS.profileStudentId;
    if (!explicitVariant || explicitVariant === "default") variantKey = "blue";
  } else if (
    lower.includes("pack") ||
    lower.includes("study pack") ||
    lower.includes("material") ||
    lower.includes("tute")
  ) {
    illustration = CLAY_ASSETS.thumbPaperClass;
    if (!explicitVariant || explicitVariant === "default") variantKey = "purple";
  } else if (
    lower.includes("admin") ||
    lower.includes("console") ||
    lower.includes("station") ||
    lower.includes("control")
  ) {
    illustration = CLAY_ASSETS.bannerAdminStation;
    if (!explicitVariant || explicitVariant === "default") variantKey = "rose";
  } else if (
    lower.includes("session") ||
    lower.includes("live") ||
    lower.includes("broadcast")
  ) {
    illustration = CLAY_ASSETS.liveStageOnair;
    if (!explicitVariant || explicitVariant === "default") variantKey = "rose";
  } else if (
    lower.includes("revision")
  ) {
    illustration = CLAY_ASSETS.thumbRevisionScreen;
    if (!explicitVariant || explicitVariant === "default") variantKey = "rose";
  } else {
    illustration = CLAY_ASSETS.thumbTheoryOpenbook;
    if (!explicitVariant || explicitVariant === "default") variantKey = "rose";
  }

  return { illustration, variantKey };
}

export function SectionHeader({
  title,
  description,
  breadcrumbs,
  icon: Icon,
  actions,
  illustration: propIllustration,
  variant: propVariant,
  badge,
  className,
}: SectionHeaderProps) {
  const { illustration, variantKey } = resolveContextualIllustration(
    title,
    description,
    propIllustration,
    propVariant
  );
  const theme = THEME_STYLES[variantKey] || THEME_STYLES.rose;

  return (
    <div
      className={cn(
        "relative overflow-visible rounded-2xl sm:rounded-3xl border px-4 sm:px-6 py-3 sm:py-4 min-h-[80px] sm:min-h-[92px] flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition-all duration-300 mt-2 sm:mt-4",
        illustration ? "pr-28 sm:pr-40 md:pr-48" : "",
        theme.container,
        className
      )}
    >
      {/* Decorative Glow Elements */}
      <div
        className={cn(
          "absolute -top-12 -left-12 w-48 h-48 rounded-full blur-2xl pointer-events-none",
          theme.glow1
        )}
      />
      <div
        className={cn(
          "absolute -bottom-12 right-1/4 w-40 h-40 rounded-full blur-2xl pointer-events-none",
          theme.glow2
        )}
      />

      {/* Left side: Badge, Title, Breadcrumbs / Description */}
      <div className="relative z-10 flex items-start sm:items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
        <div className="space-y-0.5 flex-1 min-w-0">
          {badge && (
            <div className="inline-flex items-center mb-0.5">
              {typeof badge === "string" ? (
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border backdrop-blur-xs",
                    theme.badge
                  )}
                >
                  {badge}
                </span>
              ) : (
                badge
              )}
            </div>
          )}

          <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {title}
          </h1>

          {/* Breadcrumbs or Description */}
          {breadcrumbs ? (
            <nav
              aria-label="Breadcrumb"
              className="flex items-center flex-wrap gap-1.5 text-xs font-medium text-slate-500"
            >
              {Array.isArray(breadcrumbs) ? (
                breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-300">•</span>}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className={cn(
                          "transition-colors",
                          idx === breadcrumbs.length - 1
                            ? "text-slate-700 font-semibold"
                            : theme.crumb
                        )}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={
                          idx === breadcrumbs.length - 1
                            ? "text-slate-700 font-semibold"
                            : ""
                        }
                      >
                        {crumb.label}
                      </span>
                    )}
                  </React.Fragment>
                ))
              ) : (
                breadcrumbs
              )}
            </nav>
          ) : description ? (
            <div className="text-xs text-slate-600 leading-normal max-w-xl line-clamp-2">
              {description}
            </div>
          ) : null}
        </div>
      </div>

      {/* Right side: Actions (if any) */}
      {actions && (
        <div className="relative z-20 flex items-center flex-wrap gap-2 md:gap-3 shrink-0 mt-2 md:mt-0">
          {actions}
        </div>
      )}

      {/* Contextual 3D Clay Illustration — pops out above the capsule for 3D depth */}
      {illustration && (
        <div className="absolute right-0 sm:right-2 md:right-3 top-0 -translate-y-[20%] sm:-translate-y-[22%] w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-end pointer-events-none select-none z-20 drop-shadow-xl">
          <Image
            src={illustration}
            alt=""
            fill
            sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
            className="object-contain pointer-events-none select-none"
            priority
          />
        </div>
      )}
    </div>
  );
}
