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
import { getAllQuizzesForPlay } from "@/services/quizService";
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

type SearchCategory = "all" | "classes" | "quizzes" | "pages" | "actions";

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
  const [quizList, setQuizList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");

  // Fetch classes and quizzes when command search opens
  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const loadSearchData = async () => {
      try {
        setLoadingData(true);
        const [cData, qData] = await Promise.all([
          getClasses().catch(() => []),
          getAllQuizzesForPlay().catch(() => []),
        ]);
        if (isMounted) {
          setClassList(Array.isArray(cData) ? cData : []);
          setQuizList(Array.isArray(qData) ? qData : []);
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

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const showClasses = activeCategory === "all" || activeCategory === "classes";
  const showQuizzes = activeCategory === "all" || activeCategory === "quizzes";
  const showPages = activeCategory === "all" || activeCategory === "pages";
  const showActions = (activeCategory === "all" || activeCategory === "actions") && isTeacher && !isStudent;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search classes, subjects, quizzes, navigation..." />

      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-indigo-100/70 bg-[#FAF9F5]/80 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0",
            activeCategory === "all"
              ? "bg-indigo-600 text-white shadow-2xs [box-shadow:0_2px_8px_rgba(79,70,229,0.3)]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("classes")}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0",
            activeCategory === "classes"
              ? "bg-indigo-600 text-white shadow-2xs [box-shadow:0_2px_8px_rgba(79,70,229,0.3)]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          )}
        >
          Classes ({classList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("quizzes")}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0",
            activeCategory === "quizzes"
              ? "bg-indigo-600 text-white shadow-2xs [box-shadow:0_2px_8px_rgba(79,70,229,0.3)]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          )}
        >
          Quizzes ({quizList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveCategory("pages")}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0",
            activeCategory === "pages"
              ? "bg-indigo-600 text-white shadow-2xs [box-shadow:0_2px_8px_rgba(79,70,229,0.3)]"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
          )}
        >
          Navigation
        </button>
        {isTeacher && !isStudent && (
          <button
            type="button"
            onClick={() => setActiveCategory("actions")}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0",
              activeCategory === "actions"
                ? "bg-indigo-600 text-white shadow-2xs [box-shadow:0_2px_8px_rgba(79,70,229,0.3)]"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60"
            )}
          >
            Staff Actions
          </button>
        )}
      </div>

      <CommandList className="max-h-[420px]">
        <CommandEmpty>
          <div className="py-10 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-200/80 flex items-center justify-center text-indigo-500 shadow-md mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No matching results found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Try searching by subject name (e.g. Science, Maths), grade (e.g. Grade 10), topic, or navigation pages.
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
                  className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-2xl group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs",
                        pastel.capsuleBg,
                        pastel.capsuleBorder
                      )}
                    >
                      <IconComp className={cn("w-4 h-4", pastel.capsuleText)} />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {titleStr}
                      </span>
                      {teacherName && (
                        <span className="text-[11px] text-slate-500 truncate">
                          {teacherName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    {gr && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-indigo-900 border border-indigo-100/90 shadow-2xs">
                        {gr}
                      </span>
                    )}
                    {subj && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs",
                          pastel.badge
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pastel.dotColor)} />
                        {subj}
                      </span>
                    )}
                    {cls.monthly_fee && (
                      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold text-slate-800 bg-slate-100 border border-slate-200/80">
                        Rs. {formatLKR(cls.monthly_fee)}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors ml-1" />
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Dynamic Quiz Results */}
        {showQuizzes && quizList.length > 0 && (
          <>
            {showClasses && classList.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Quizzes & Assessment Arena">
              {quizList.slice(0, 8).map((qz) => {
                const qId = String(qz._id || qz.id || "");
                const titleStr = qz.title || "Untitled Quiz";
                const qCount = qz.questions?.length || qz.question_count || 0;
                const difficulty = (qz.difficulty || "medium").toLowerCase();

                return (
                  <CommandItem
                    key={`quiz-${qId || Math.random()}`}
                    value={`${titleStr} ${qz.subject || ""} quiz assessment exam`}
                    onSelect={() => handleSelect(qId ? `/quizzes/${qId}` : `/quizzes`)}
                    className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-2xl group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
                          {titleStr}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {qCount} {qCount === 1 ? "Question" : "Questions"}
                          {qz.subject ? ` • ${qz.subject}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs uppercase tracking-wide",
                          difficulty.includes("hard")
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : difficulty.includes("medium")
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {difficulty}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 transition-colors ml-1" />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Navigation Section */}
        {showPages && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Platform Navigation">
              <CommandItem
                value="dashboard home student portal overview"
                onSelect={() => handleSelect(isTeacher ? "/admin/dashboard" : "/dashboard")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs mr-1">
                  <Home className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-indigo-600">Dashboard</span>
                  <span className="text-[10px] text-slate-400">Personal learning hub & schedule</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600" />
              </CommandItem>

              <CommandItem
                value="classes courses catalog schedule live sessions"
                onSelect={() => handleSelect("/classes")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs mr-1">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-emerald-600">Classes & Course Catalog</span>
                  <span className="text-[10px] text-slate-400">Browse Grade 06 - A/L theory & revision</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600" />
              </CommandItem>

              <CommandItem
                value="quizzes assessment arena practice test exam"
                onSelect={() => handleSelect("/quizzes")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 shrink-0 shadow-2xs mr-1">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-amber-600">Quizzes & Assessment Arena</span>
                  <span className="text-[10px] text-slate-400">Interactive timed challenges & practice</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600" />
              </CommandItem>

              <CommandItem
                value="performance analytics grades marks leaderboard"
                onSelect={() => handleSelect("/quizzes/performance")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/70 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs mr-1">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-purple-600">Performance & Analytics</span>
                  <span className="text-[10px] text-slate-400">Score progress & rank breakdowns</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600" />
              </CommandItem>

              <CommandItem
                value="store study packs workbooks materials"
                onSelect={() => handleSelect("/store")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs mr-1">
                  <Layers className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-rose-600">Store & Study Packs</span>
                  <span className="text-[10px] text-slate-400">Printed workbooks and physical kits</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-rose-600" />
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Management Studio (Staff & Admin Only) */}
        {showActions && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Staff & Administration Studio">
              <CommandItem
                value="branding settings customization engine theme"
                onSelect={() => handleSelect("/admin/settings/branding")}
                className="group py-2.5 px-3 rounded-2xl bg-indigo-50/50 hover:bg-indigo-50/90"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0 shadow-2xs mr-1">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-indigo-900">Customization & Branding Engine</span>
                  <span className="text-[10px] text-indigo-600/80">Configure platform identity, logos, hero</span>
                </div>
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-200/80 text-indigo-800">
                  Admin
                </span>
              </CommandItem>

              <CommandItem
                value="students applications roster enrollments"
                onSelect={() => handleSelect("/admin/classes/applications")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs mr-1">
                  <Users className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-slate-900">Student Applications & Roster</span>
                  <span className="text-[10px] text-slate-400">Review pending admissions & students</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700" />
              </CommandItem>

              <CommandItem
                value="create class new class add course"
                onSelect={() => handleSelect("/admin/classes/add")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs mr-1">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-blue-600">Create New Class</span>
                  <span className="text-[10px] text-slate-400">Set schedule, grade, fee, and meetings</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600" />
              </CommandItem>

              <CommandItem
                value="create quiz new quiz assessment question"
                onSelect={() => handleSelect("/admin/quizzes/add")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs mr-1">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-purple-600">Create New Quiz</span>
                  <span className="text-[10px] text-slate-400">Build timed MCQs, blanks, and answers</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600" />
              </CommandItem>

              <CommandItem
                value="create recording lesson replay video"
                onSelect={() => handleSelect("/admin/recording/add")}
                className="group py-2.5 px-3 rounded-2xl"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs mr-1">
                  <Video className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-800 group-hover:text-rose-600">Upload Lesson Recording</span>
                  <span className="text-[10px] text-slate-400">Publish HD lesson replays for students</span>
                </div>
                <ArrowRight className="ml-auto w-3.5 h-3.5 text-slate-300 group-hover:text-rose-600" />
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Tactile Keyboard Navigation Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-indigo-100/70 bg-[#FAF9F5]/90 text-[11px] text-slate-500 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono shadow-2xs text-[10px] text-slate-700">↵</kbd>
            <span>open</span>
          </span>
          <span className="flex items-center gap-1 font-medium">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono shadow-2xs text-[10px] text-slate-700">↑↓</kbd>
            <span>navigate</span>
          </span>
          <span className="flex items-center gap-1 font-medium">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono shadow-2xs text-[10px] text-slate-700">esc</kbd>
            <span>close</span>
          </span>
        </div>
        <span className="text-indigo-600 font-bold hidden sm:inline">
          Nexvo Fast Search ✨
        </span>
      </div>
    </CommandDialog>
  );
}

export function CommandSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-500 rounded-full transition-all duration-200 w-56 lg:w-72 justify-between hover:text-slate-800 hover:border-indigo-200 hover:shadow-xs group active:scale-[0.98]"
      style={{
        background: "#FFFFFF",
        border: "1.5px solid rgba(99, 102, 241, 0.15)",
        boxShadow: "0 2px 8px rgba(99, 102, 241, 0.05), inset 0 1px 1px rgba(255,255,255,0.9)",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Search className="w-3 h-3" />
        </div>
        <span className="text-slate-400 group-hover:text-slate-600 transition-colors">Search platform...</span>
      </div>
      <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-[#FAF9F5] border border-indigo-100 rounded-md shadow-2xs group-hover:border-indigo-200">
        ⌘K
      </kbd>
    </button>
  );
}
