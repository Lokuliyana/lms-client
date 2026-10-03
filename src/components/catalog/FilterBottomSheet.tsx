"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/dev/sheet";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewFilter?: string;
  onViewFilterChange?: (val: string) => void;
  viewOptions?: { value: string; label: string }[];
  gradeFilter: string;
  onGradeFilterChange: (val: string) => void;
  gradeOptions: { value: string; label: string }[];
  subjectFilter: string;
  onSubjectFilterChange: (val: string) => void;
  subjectOptions: { value: string; label: string }[];
  onClearAll?: () => void;
  title?: string;
}

export function FilterBottomSheet({
  open,
  onOpenChange,
  viewFilter,
  onViewFilterChange,
  viewOptions,
  gradeFilter,
  onGradeFilterChange,
  gradeOptions,
  subjectFilter,
  onSubjectFilterChange,
  subjectOptions,
  onClearAll,
  title = "Filter Catalog",
}: FilterBottomSheetProps) {
  const activeCount =
    (viewFilter && viewFilter !== "all" ? 1 : 0) +
    (gradeFilter && gradeFilter !== "all" ? 1 : 0) +
    (subjectFilter && subjectFilter !== "all" ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[85vh] overflow-y-auto px-5 py-6 bg-white border-t border-slate-200/90 shadow-2xl space-y-6"
      >
        <SheetHeader className="text-left space-y-1 pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <SheetTitle className="text-lg font-bold text-slate-900">
                {title}
              </SheetTitle>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                  {activeCount} active
                </span>
              )}
            </div>

            {activeCount > 0 && onClearAll && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
          <SheetDescription className="text-xs text-slate-500">
            Refine classes and assessments by grade level, academic subject, or enrollment status.
          </SheetDescription>
        </SheetHeader>

        {/* View / Enrollment Filter */}
        {viewOptions && viewOptions.length > 0 && onViewFilterChange && (
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              View
            </label>
            <div className="grid grid-cols-2 gap-2">
              {viewOptions.map((opt) => {
                const isSelected = viewFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onViewFilterChange(opt.value)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Grade Filter */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Grade Level
          </label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
            {gradeOptions.map((opt) => {
              const isSelected =
                gradeFilter === opt.value ||
                (opt.value !== "all" &&
                  gradeFilter.replace(/^grade\s*/i, "").toLowerCase() ===
                    opt.value.replace(/^grade\s*/i, "").toLowerCase());
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onGradeFilterChange(opt.value)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Filter */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Subject
          </label>
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
            {subjectOptions.map((opt) => {
              const isSelected = subjectFilter.toLowerCase() === opt.value.toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSubjectFilterChange(opt.value)}
                  className={cn(
                    "px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <SheetFooter className="pt-2 sticky bottom-0 bg-white border-t border-slate-100 flex-row gap-3 pb-safe">
          <SheetClose asChild>
            <Button
              variant="primary"
              className="w-full h-11 rounded-xl text-xs font-semibold shadow-xs"
            >
              Done Filtering
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
