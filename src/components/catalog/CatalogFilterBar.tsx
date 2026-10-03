"use client";

import * as React from "react";
import { useState } from "react";
import { ChevronDown, Filter, GraduationCap, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dev/dropdown-menu";
import { Button } from "@/components/dev/button";
import { FilterBottomSheet } from "./FilterBottomSheet";
import { cn } from "@/lib/utils";

export interface CatalogFilterBarProps {
  searchQuery?: string;
  onSearchQueryChange?: (val: string) => void;
  searchPlaceholder?: string;
  viewFilter?: string;
  onViewFilterChange?: (val: string) => void;
  viewOptions?: { value: string; label: string }[];
  viewLabel?: React.ReactNode;
  gradeFilter: string;
  onGradeFilterChange: (val: string) => void;
  gradeOptions: { value: string; label: string }[];
  gradeLabel?: React.ReactNode;
  subjectFilter: string;
  onSubjectFilterChange: (val: string) => void;
  subjectOptions: { value: string; label: string }[];
  subjectLabel?: React.ReactNode;
  quickGradeOptions?: { value: string; label: string }[];
  onClearAll?: () => void;
  sheetTitle?: string;
}

export function CatalogFilterBar({
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder = "Search catalog...",
  viewFilter,
  onViewFilterChange,
  viewOptions,
  viewLabel = "View",
  gradeFilter,
  onGradeFilterChange,
  gradeOptions,
  gradeLabel = "Grade",
  subjectFilter,
  onSubjectFilterChange,
  subjectOptions,
  subjectLabel = "Subject",
  quickGradeOptions,
  onClearAll,
  sheetTitle = "Filter Catalog",
}: CatalogFilterBarProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const activeFiltersCount =
    (viewFilter && viewFilter !== "all" ? 1 : 0) +
    (gradeFilter && gradeFilter !== "all" ? 1 : 0) +
    (subjectFilter && subjectFilter !== "all" ? 1 : 0);

  return (
    <div
      className="rounded-2xl p-2 sm:p-2.5 space-y-2 sm:space-y-0 transition-all duration-300"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 8px 24px -4px rgba(0,0,0,0.05), 0 2px 8px -2px rgba(0,0,0,0.02), inset 0 1px 1px rgba(255,255,255,0.95)',
      }}
    >
      {/* Mobile Top Bar: Optional Search + Filter Sheet Trigger */}
      <div className="flex sm:hidden items-center gap-2 w-full">
        {onSearchQueryChange && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery || ""}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => setMobileSheetOpen(true)}
          className={cn(
            "h-9 px-3 rounded-xl border flex items-center gap-1.5 shrink-0 text-xs font-semibold shadow-2xs",
            activeFiltersCount > 0
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-white text-slate-700 border-slate-200"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Unified Filter Bar: Left Grade Pills & Right Subject/View Dropdowns */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left Side: Sleek Grade Selection Pills (or search input if provided) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-slate-200 flex-1 min-w-0">
          {quickGradeOptions && quickGradeOptions.length > 0 ? (
            <div className="flex items-center gap-1.5 shrink-0 py-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                Grade:
              </span>
              {quickGradeOptions.map((opt) => {
                const isSelected =
                  gradeFilter === opt.value ||
                  (opt.value !== "all" &&
                    gradeFilter.replace(/^grade\s*/i, "").toLowerCase() ===
                      opt.value.replace(/^grade\s*/i, "").toLowerCase());
                return (
                  <button
                    key={opt.value}
                    onClick={() => onGradeFilterChange(opt.value)}
                    type="button"
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all duration-200 border",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 scale-[1.02]"
                        : "bg-[#FAF9F5] hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-black/5 shadow-2xs"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Fallback Grade Dropdown only when quickGradeOptions are not passed */
            <div className="hidden sm:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8.5 border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium rounded-xl shadow-2xs"
                  >
                    {gradeLabel}:{" "}
                    {gradeOptions.find(
                      (opt) =>
                        opt.value === gradeFilter ||
                        (opt.value !== "all" &&
                          opt.value.replace(/^grade\s*/i, "").toLowerCase() ===
                            gradeFilter.replace(/^grade\s*/i, "").toLowerCase())
                    )?.label || gradeFilter}
                    <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto rounded-xl shadow-lg">
                  {gradeOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => onGradeFilterChange(option.value)}
                      className="text-xs"
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Right Side: Subject Dropdown, View Dropdown, Reset Action */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Subject Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8.5 border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium rounded-xl shadow-2xs",
                  subjectFilter !== "all" && "border-primary/50 text-primary font-semibold bg-primary/5"
                )}
              >
                {subjectLabel}: {subjectOptions.find((opt) => opt.value === subjectFilter)?.label || subjectFilter}
                <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-64 overflow-y-auto rounded-xl shadow-lg">
              {subjectOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSubjectFilterChange(option.value)}
                  className="text-xs"
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Filter (e.g. All Classes / Enrolled Only) */}
          {viewOptions && viewOptions.length > 0 && onViewFilterChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8.5 border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium rounded-xl shadow-2xs",
                    viewFilter && viewFilter !== "all" && "border-primary/50 text-primary font-semibold bg-primary/5"
                  )}
                >
                  {viewLabel}: {viewOptions.find((opt) => opt.value === viewFilter)?.label || viewFilter}
                  <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                {viewOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onViewFilterChange(option.value)}
                    className="text-xs"
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear / Reset Filters */}
          {activeFiltersCount > 0 && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-8.5 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet Filter */}
      <FilterBottomSheet
        open={mobileSheetOpen}
        onOpenChange={setMobileSheetOpen}
        viewFilter={viewFilter}
        onViewFilterChange={onViewFilterChange}
        viewOptions={viewOptions}
        gradeFilter={gradeFilter}
        onGradeFilterChange={onGradeFilterChange}
        gradeOptions={gradeOptions}
        subjectFilter={subjectFilter}
        onSubjectFilterChange={onSubjectFilterChange}
        subjectOptions={subjectOptions}
        onClearAll={onClearAll}
        title={sheetTitle}
      />
    </div>
  );
}
