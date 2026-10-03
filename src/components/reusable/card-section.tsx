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
      <Card className="bg-white border border-slate-200/80 shadow-xs rounded-2xl transition hover:shadow-md">
        {/* Header */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full">
              {Icon && <Icon className="w-5 h-5 text-primary" />}
              <CardTitle className="text-lg font-semibold text-foreground">
                {title}
              </CardTitle>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent ml-4 rounded" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {actions}
              {onViewAll && (
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={onViewAll}
                >
                  <span className="hidden md:inline">{viewAllLabel}</span>
                  <ArrowRight className="w-4 h-4 ml-0 md:ml-2" />
                </Button>
              )}
            </div>
          </div>
          {description && (
            <CardDescription className="mt-1 ml-[1.75rem]">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        {/* Content */}
        <CardContent className={contentClassName ? `pt-0 pb-6 ${contentClassName}` : "pt-0 pb-6 px-4 sm:px-6"}>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}