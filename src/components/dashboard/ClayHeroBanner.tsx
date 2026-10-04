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
    ? "bg-gradient-to-r from-purple-50/95 via-indigo-50/70 to-blue-50/90 border-2 border-purple-200/50 text-slate-900"
    : "bg-gradient-to-r from-violet-50/95 via-purple-50/70 to-indigo-50/90 border-2 border-indigo-200/50 text-slate-900";

  return (
    <div
      className={cn(
        "relative overflow-visible rounded-3xl p-5 sm:p-7 min-h-[120px] sm:min-h-[170px] flex items-center justify-between transition-all duration-300",
        themeClass,
        className
      )}
      style={{
        boxShadow: '0 16px 40px -8px rgba(99, 102, 241, 0.12), 0 4px 14px -2px rgba(168, 85, 247, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
      }}
    >
      {/* Decorative Glow Elements */}
      <div
        className={cn(
          "absolute -top-12 -left-12 w-48 h-48 rounded-full blur-2xl pointer-events-none",
          isAdmin ? "bg-purple-300/30" : "bg-indigo-300/30"
        )}
      />
      <div
        className={cn(
          "absolute -bottom-12 right-1/4 w-40 h-40 rounded-full blur-2xl pointer-events-none",
          isAdmin ? "bg-blue-200/30" : "bg-purple-200/30"
        )}
      />

      {/* Content Column */}
      <div className="relative z-10 flex-1 pr-3 sm:pr-6 max-w-xl">
        {badge && (
          <div className="mb-1 sm:mb-2 inline-flex items-center">
            {typeof badge === "string" ? (
              <span
                className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-xs bg-white/90 text-indigo-800 border-indigo-200/80 shadow-xs"
                style={{
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                }}
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
                  className="rounded-full font-bold text-xs px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md active:scale-95 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                  }}
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
                  className="rounded-full font-bold text-xs px-5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md active:scale-95 transition-all duration-200"
                  style={{
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                  }}
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
                  className="rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border-2 border-indigo-100 text-xs px-4 shadow-xs transition-all active:scale-95"
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                  }}
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={secondaryCta.onClick}
                  className="rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border-2 border-indigo-100 text-xs px-4 shadow-xs transition-all active:scale-95"
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {secondaryCta.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>

      {/* Mascot Graphic: Breakout 3D asset with subtle bounce scale */}
      <div className="relative z-20 shrink-0 w-28 h-28 sm:w-56 sm:h-56 md:w-64 md:h-64 sm:-mr-2 md:-mr-4 -my-4 sm:-my-6 drop-shadow-2xl">
        <Image
          src={mascotSrc}
          alt="Dashboard 3D Mascot"
          fill
          sizes="(max-width: 640px) 112px, (max-width: 768px) 224px, 256px"
          className="object-contain pointer-events-none select-none transition-transform hover:scale-108 duration-300 scale-110 sm:scale-125"
          priority
        />
      </div>
    </div>
  );
}
