// components/reusable/card-section.tsx
"use client";

import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/dev/card";
import { Button } from "@/components/dev/button";
import { LucideIcon } from "lucide-react";

type CardSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  viewAllLabel?: ReactNode;
  onViewAll?: () => void;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  contentClassName?: string;
};

export function CardSection({
  title,
  description,
  icon: Icon,
  viewAllLabel = "View All",
  onViewAll,
  children,
  className,
  actions,
  contentClassName,
}: CardSectionProps) {
  return (
    <div className={`relative ${className || ""}`}>
      {/* Card Container */}
      <Card
        className="rounded-3xl transition-all duration-300 overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 10px 30px -5px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.03), inset 0 1px 1px rgba(255,255,255,0.95)',
        }}
      >
        {/* Header */}
        <CardHeader className="pb-4 pt-5 px-5 sm:px-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 w-full">
              {Icon && (
                <div className="w-8 h-8 rounded-xl bg-indigo-50/90 text-primary flex items-center justify-center shadow-xs border border-indigo-100/60 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
              )}
              <CardTitle className="text-lg font-bold text-slate-900 tracking-tight">
                {title}
              </CardTitle>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent ml-4 rounded-full" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {actions}
              {onViewAll && (
                <Button
                  variant="ghost"
                  className="text-primary hover:text-primary hover:bg-indigo-50/60 rounded-xl text-xs font-semibold flex items-center"
                  onClick={onViewAll}
                >
                  <span className="hidden md:inline">{viewAllLabel}</span>
                  <ArrowRight className="w-4 h-4 ml-0 md:ml-1.5" />
                </Button>
              )}
            </div>
          </div>
          {description && (
            <CardDescription className="mt-1 ml-[2.6rem] text-xs text-slate-500">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        {/* Content */}
        <CardContent className={contentClassName ? `pt-0 pb-6 ${contentClassName}` : "pt-0 pb-6 px-5 sm:px-7"}>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}