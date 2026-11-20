// src/components/ui/command-search.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/dev/command";
import {
  BookOpen,
  HelpCircle,
  BarChart3,
  Home,
  PlusCircle,
  Paintbrush,
  Users,
  Video,
  Sparkles,
  Search,
  Calculator,
  Atom,
  Laptop,
  Coins,
  Trophy,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import { getClasses } from "@/services/classService";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";
import { useCustomization } from "@/context/CustomizationContext";
import { getSubjectPastelTheme } from "@/constants/clayAssets";
import { cn } from "@/lib/utils";

const formatLKR = (v: string | number) => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? String(v) : n.toLocaleString("en-LK");
};

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchCategory = "all" | "classes" | "pages" | "actions";

function getSubjectIcon(subjectStr?: string) {
  const s = (subjectStr || "").toLowerCase();
  if (
    s.includes("math") ||
    s.includes("combined") ||
    s.includes("calculus") ||
    s.includes("algebra") ||
    s.includes("ගණිත")
  ) {
    return Calculator;
  }
  if (
    s.includes("physic") ||
    s.includes("science") ||
    s.includes("chem") ||
    s.includes("bio") ||
    s.includes("stem") ||
    s.includes("විද්‍යා") ||
    s.includes("භෞතික")
  ) {
    return Atom;
  }
  if (
    s.includes("ict") ||
    s.includes("tech") ||
    s.includes("computer") ||
    s.includes("code") ||
    s.includes("තොරතුරු")
  ) {
    return Laptop;
  }
  if (
    s.includes("commerce") ||
    s.includes("account") ||
    s.includes("business") ||
    s.includes("ව්‍යාපාර")
  ) {
    return Coins;
  }
  return BookOpen;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const { user, isTeacher, isStudent } = useAuth();
  const { grades, subjects } = useCustomization();

  const [classList, setClassList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");

  // Fetch classes when command search opens
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const loadSearchData = async () => {
      try {
        setLoadingData(true);
        const cData = await getClasses().catch(() => []);
        if (isMounted) {
          setClassList(Array.isArray(cData) ? cData : []);
        }
      } catch (err) {
        console.error("Failed to load command search data", err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };
    loadSearchData();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Listen for Cmd+K / Ctrl+K and open-command-search event
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    const handleCustomOpen = () => onOpenChange(true);

    document.addEventListener("keydown", down);
    window.addEventListener("open-command-search", handleCustomOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-command-search", handleCustomOpen);
    };
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const isAdmin = String(user?.role || "").toLowerCase().trim() === "admin";
  const isStaff = user?.role === "teacher" || user?.role === "admin" || user?.role === "moderator" || Boolean(isTeacher);
  const showClasses = activeCategory === "all" || activeCategory === "classes";
  const showPages = activeCategory === "all" || activeCategory === "pages";
  const showActions = (activeCategory === "all" || activeCategory === "actions") && isStaff && !isStudent;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search classes, subjects, navigation..." />

      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/60 overflow-x-auto no-scrollbar">
        {(
          [
            { id: "all", label: "All" },
            { id: "classes", label: `Classes (${classList.length})` },
            { id: "pages", label: "Navigation" },
            ...(isStaff && !isStudent ? [{ id: "actions", label: "Staff Actions" }] : []),
          ] as const
        ).map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as SearchCategory)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
                isActive
                  ? "bg-white text-slate-800 shadow-2xs border border-slate-200/80"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <CommandList className="max-h-[380px]">
        <CommandEmpty>
          <div className="py-10 flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">No matching results found</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
              Try searching by subject name, grade, topic, or page.
            </p>
          </div>
        </CommandEmpty>

        {/* Dynamic Class Results */}
        {showClasses && classList.length > 0 && (
          <CommandGroup heading="Classes & Course Catalog">
            {classList.slice(0, 10).map((cls) => {
              const subj = formatSubjectName(cls.subject, subjects);
              const gr = formatGradeName(cls.grade, grades);
              const titleStr = cls.title || "Untitled Class";
              const classId = cls._id || cls.id;
              const teacherName =
                cls.teacher_name ||
                cls.teacherName ||
                cls.teacher?.full_name ||
                cls.teacher?.name ||
                "";
              const pastel = getSubjectPastelTheme(subj || titleStr);
              const IconComp = getSubjectIcon(subj || titleStr);

              return (
                <CommandItem
                  key={`class-${classId || Math.random()}`}
                  value={`${titleStr} ${subj} ${gr} ${teacherName} class course`}
                  onSelect={() => handleSelect(classId ? `/classes/${classId}` : `/classes`)}
                  className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-xl group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        pastel.capsuleBg
                      )}
                    >
                      <IconComp className={cn("w-4 h-4", pastel.capsuleText)} />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900 transition-colors truncate">
                        {titleStr}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                        {gr && <span className="font-medium text-slate-600">{gr}</span>}
                        {gr && subj && <span>•</span>}
                        {subj && <span>{subj}</span>}
                        {teacherName && (
                          <>
                            <span>•</span>
                            <span>{teacherName}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    {cls.monthly_fee && (
                      <span className="text-xs font-medium text-slate-600 font-mono">
                        Rs. {formatLKR(cls.monthly_fee)}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-data-[selected=true]:text-slate-500 transition-colors" />
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Navigation Section */}
        {showPages && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Platform Navigation">
              <CommandItem
                value="dashboard home student portal overview"
                onSelect={() => handleSelect(isStaff ? "/admin/dashboard" : "/dashboard")}
                className="group py-2 px-3 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mr-1">
                  <Home className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900">Dashboard</span>
                  <span className="text-[11px] text-slate-400">Personal learning hub & schedule</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-data-[selected=true]:text-slate-500" />
              </CommandItem>

              <CommandItem
                value="classes courses catalog schedule live sessions"
                onSelect={() => handleSelect("/classes")}
                className="group py-2 px-3 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mr-1">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900">Classes & Course Catalog</span>
                  <span className="text-[11px] text-slate-400">Browse Grade 06 - A/L theory & revision</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-data-[selected=true]:text-slate-500" />
              </CommandItem>

              <CommandItem
                value="store study packs workbooks materials"
                onSelect={() => handleSelect("/store")}
                className="group py-2 px-3 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mr-1">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900">Store & Study Packs</span>
                  <span className="text-[11px] text-slate-400">Printed workbooks and physical kits</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-data-[selected=true]:text-slate-500" />
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Management Studio (Staff & Admin Only) */}
        {showActions && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Staff & Administration Studio">
              {isAdmin && (
                <CommandItem
                  value="branding settings customization engine theme"
                  onSelect={() => handleSelect("/admin/settings/branding")}
                  className="group py-2 px-3 rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mr-1">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900">Customization & Branding Engine</span>
                    <span className="text-[11px] text-slate-400">Configure platform identity, logos, hero</span>
                  </div>
                  <span className="ml-auto px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                    Admin
                  </span>
                </CommandItem>
              )}

              <CommandItem
                value="students applications roster enrollments"
                onSelect={() => handleSelect("/admin/classes/applications")}
                className="group py-2 px-3 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mr-1">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900">Student Applications & Roster</span>
                  <span className="text-[11px] text-slate-400">Review pending admissions & students</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-data-[selected=true]:text-slate-500" />
              </CommandItem>

              <CommandItem
                value="create class new class add course"
                onSelect={() => handleSelect("/admin/classes/add")}
                className="group py-2 px-3 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mr-1">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900">Create New Class</span>
                  <span className="text-[11px] text-slate-400">Set schedule, grade, fee, and meetings</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-data-[selected=true]:text-slate-500" />
              </CommandItem>

              <CommandItem
                value="create recording lesson replay video"
                onSelect={() => handleSelect("/admin/recording/add")}
                className="group py-2 px-3 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mr-1">
                  <Video className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 group-data-[selected=true]:text-slate-900">Upload Lesson Recording</span>
                  <span className="text-[11px] text-slate-400">Publish HD lesson replays for students</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-data-[selected=true]:text-slate-500" />
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Clean Keyboard Navigation Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 rounded-b-2xl">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200/80 font-mono shadow-2xs text-[10px] text-slate-600">↵</kbd>
            <span>Open</span>
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200/80 font-mono shadow-2xs text-[10px] text-slate-600">↑↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-500">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200/80 font-mono shadow-2xs text-[10px] text-slate-600">esc</kbd>
            <span>Close</span>
          </span>
        </div>
        <span className="text-slate-400 font-medium hidden sm:inline text-[11px]">
          Command Menu
        </span>
      </div>
    </CommandDialog>
  );
}

export function openCommandSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-command-search"));
  }
}

export function CommandSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 rounded-xl transition-all duration-150 w-56 lg:w-64 justify-between bg-white/90 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:text-slate-700 active:scale-[0.99]"
    >
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-400">Search platform...</span>
      </div>
      <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded shadow-2xs">
        ⌘K
      </kbd>
    </button>
  );
}
