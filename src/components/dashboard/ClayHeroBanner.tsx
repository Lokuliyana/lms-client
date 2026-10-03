"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export interface ClayHeroBannerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  mascotSrc?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryCta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  variant?: "student" | "admin" | "default";
}

export function ClayHeroBanner({
  title,
  description,
  badge,
  mascotSrc = CLAY_ASSETS.bannerStudentSaturn,
  cta,
  secondaryCta,
  className,
  variant = "student",
}: ClayHeroBannerProps) {
  const isAdmin = variant === "admin";
  const themeClass = isAdmin
    ? "bg-[#FFF5F5] bg-gradient-to-r from-rose-50/90 via-pink-50/40 to-rose-100/60 border border-rose-200/60 text-slate-900 shadow-xs"
    : "bg-[#FFF9F2] bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-100/60 border border-amber-200/60 text-slate-900 shadow-xs";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 sm:p-7 min-h-[110px] sm:min-h-[160px] flex items-center justify-between transition-all duration-300",
        themeClass,
        className
      )}
      style={{
        boxShadow: '0 16px 40px -6px rgba(0,0,0,0.07), 0 6px 16px -3px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,0.95)',
      }}
    >
      {/* Decorative Glow */}
      <div
        className={cn(
          "absolute -top-12 -left-12 w-48 h-48 rounded-full blur-2xl pointer-events-none",
          isAdmin ? "bg-rose-200/40" : "bg-amber-200/40"
        )}
      />
      <div
        className={cn(
          "absolute -bottom-12 right-1/4 w-40 h-40 rounded-full blur-2xl pointer-events-none",
          isAdmin ? "bg-pink-200/30" : "bg-orange-200/30"
        )}
      />

      {/* Content Column */}
      <div className="relative z-10 flex-1 pr-3 sm:pr-6 max-w-xl">
        {badge && (
          <div className="mb-1 sm:mb-2 inline-flex items-center">
            {typeof badge === "string" ? (
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border backdrop-blur-xs",
                  isAdmin
                    ? "bg-rose-100/90 text-rose-800 border-rose-200/80"
                    : "bg-amber-100/90 text-amber-800 border-amber-200/80"
                )}
              >
                {badge}
              </span>
            ) : (
              badge
            )}
          </div>
        )}

        <h1 className="text-base sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug line-clamp-1 sm:line-clamp-2 text-slate-900">
          {title}
        </h1>

        {description && (
          <p className="mt-0.5 sm:mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-1 sm:line-clamp-2 max-w-lg">
            {description}
          </p>
        )}

        {(cta || secondaryCta) && (
          <div className="mt-2.5 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-2.5">
            {cta && (
              cta.href ? (
                <Button
                  size="sm"
                  asChild
                  className={cn(
                    "rounded-xl font-semibold shadow-xs text-xs px-4 py-2 transition-all active:scale-[0.98]",
                    isAdmin
                      ? "bg-primary hover:opacity-90 text-primary-foreground shadow-primary/20"
                      : "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-orange-500/20"
                  )}
                >
                  <Link href={cta.href} className="inline-flex items-center gap-1.5">
                    {cta.icon && <cta.icon className="w-3.5 h-3.5" />}
                    {cta.label}
                  </Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={cta.onClick}
                  className={cn(
                    "rounded-xl font-semibold shadow-xs text-xs px-4 py-2 transition-all active:scale-[0.98]",
                    isAdmin
                      ? "bg-primary hover:opacity-90 text-primary-foreground shadow-primary/20"
                      : "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-orange-500/20"
                  )}
                >
                  {cta.icon && <cta.icon className="w-3.5 h-3.5" />}
                  {cta.label}
                </Button>
              )
            )}

            {secondaryCta && (
              secondaryCta.href ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className={cn(
                    "rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border text-xs px-3.5 shadow-2xs transition-all",
                    isAdmin ? "border-rose-200/80" : "border-amber-200/80"
                  )}
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={secondaryCta.onClick}
                  className={cn(
                    "rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border text-xs px-3.5 shadow-2xs transition-all",
                    isAdmin ? "border-rose-200/80" : "border-amber-200/80"
                  )}
                >
                  {secondaryCta.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>

      {/* Mascot Graphic: Prominent 3D asset */}
      <div className="relative z-10 shrink-0 w-28 h-28 sm:w-56 sm:h-56 md:w-64 md:h-64 sm:-mr-2 md:-mr-4 -my-2 sm:-my-4 drop-shadow-xl">
        <Image
          src={mascotSrc}
          alt="Dashboard 3D Mascot"
          fill
          sizes="(max-width: 640px) 112px, (max-width: 768px) 224px, 256px"
          className="object-contain pointer-events-none select-none transition-transform hover:scale-105 duration-300 scale-110 sm:scale-120"
          priority
        />
      </div>
    </div>
  );
}
