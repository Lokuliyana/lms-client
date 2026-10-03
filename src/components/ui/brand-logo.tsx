// src/components/ui/brand-logo.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useBranding } from "@/context/BrandingContext";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({
  className,
  showText = true,
  size = "md",
}: BrandLogoProps) {
  const { branding } = useBranding();
  const platformName = branding.platformName || "NexvoLearn";

  // Dimension mapping for heights (fixed height, auto width)
  const heights = {
    sm: "h-7",
    md: "h-8 sm:h-9",
    lg: "h-10",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 select-none focus:outline-none",
        className
      )}
    >
      <div className={cn("flex items-center shrink-0", heights[size])}>
        <img
          src="/images/brand.svg"
          alt={platformName}
          className="h-full w-auto object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors",
              textSizes[size]
            )}
          >
            {platformName}
          </span>
          <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">
            Learning Cloud
          </span>
        </div>
      )}
    </Link>
  );
}
