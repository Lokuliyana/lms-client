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
  Settings,
  Paintbrush,
  Users,
  Video,
  Sparkles,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import { getClasses } from "@/services/classService";
import { getAllQuizzesForPlay } from "@/services/quizService";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";
import { useCustomization } from "@/context/CustomizationContext";

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const { user, isTeacher, isStudent } = useAuth();
  const { grades, subjects } = useCustomization();

  const [classList, setClassList] = useState<any[]>([]);
  const [quizList, setQuizList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search classes, quizzes, navigation..." />
      <CommandList className="max-h-[380px]">
        <CommandEmpty>No matching results found.</CommandEmpty>

        {/* Dynamic Class Results */}
        {classList.length > 0 && (
          <CommandGroup heading="Classes & Courses">
            {classList.slice(0, 8).map((cls) => {
              const subj = formatSubjectName(cls.subject, subjects);
              const gr = formatGradeName(cls.grade, grades);
              const titleStr = cls.title || "Untitled Class";
              return (
                <CommandItem
                  key={`class-${cls._id}`}
                  onSelect={() => handleSelect(`/classes`)}
                  className="flex items-center justify-between cursor-pointer py-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">{titleStr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {gr && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {gr}
                      </span>
                    )}
                    {subj && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                        {subj}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Dynamic Quiz Results */}
        {quizList.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quizzes & Arena">
              {quizList.slice(0, 8).map((qz) => {
                const qId = String(qz._id || qz.id || "");
                const titleStr = qz.title || "Untitled Quiz";
                const qCount = qz.questions?.length || qz.question_count || 0;
                return (
                  <CommandItem
                    key={`quiz-${qId}`}
                    onSelect={() => handleSelect(`/quizzes`)}
                    className="flex items-center justify-between cursor-pointer py-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{titleStr}</span>
                    </div>
                    {qCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 shrink-0 ml-2">
                        {qCount} {qCount === 1 ? "Question" : "Questions"}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {/* Navigation Section */}
        <CommandSeparator />
        <CommandGroup heading="Platform Navigation">
          <CommandItem onSelect={() => handleSelect(isTeacher ? "/admin/dashboard" : "/dashboard")}>
            <Home className="mr-2.5 h-4 w-4 text-slate-500" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/classes")}>
            <BookOpen className="mr-2.5 h-4 w-4 text-slate-500" />
            <span>Classes & Course Catalog</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/quizzes")}>
            <HelpCircle className="mr-2.5 h-4 w-4 text-slate-500" />
            <span>Quizzes & Assessment Arena</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/quizzes/performance")}>
            <BarChart3 className="mr-2.5 h-4 w-4 text-slate-500" />
            <span>Performance & Analytics</span>
          </CommandItem>
        </CommandGroup>

        {/* Management Studio (Staff & Admin Only) */}
        {isTeacher && !isStudent && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Management Studio (Admin / Teacher)">
              <CommandItem
                onSelect={() => handleSelect("/admin/settings/branding")}
                className="bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 font-medium"
              >
                <Sparkles className="mr-2.5 h-4 w-4 text-indigo-600" />
                <span>Customization Engine & Branding Settings</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/admin/classes/applications")}>
                <Users className="mr-2.5 h-4 w-4 text-slate-500" />
                <span>Student Roster & Applications</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/classes")}>
                <BookOpen className="mr-2.5 h-4 w-4 text-slate-500" />
                <span>Classes Directory</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/quizzes")}>
                <HelpCircle className="mr-2.5 h-4 w-4 text-slate-500" />
                <span>Quizzes Directory</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/admin/customization")}>
                <Paintbrush className="mr-2.5 h-4 w-4 text-slate-500" />
                <span>Page Content & Subject Manager</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => handleSelect("/admin/classes/add")}>
                <PlusCircle className="mr-2.5 h-4 w-4 text-indigo-600" />
                <span>Create New Class</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/admin/quizzes/add")}>
                <PlusCircle className="mr-2.5 h-4 w-4 text-indigo-600" />
                <span>Create New Quiz</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/admin/recording/add")}>
                <Video className="mr-2.5 h-4 w-4 text-indigo-600" />
                <span>Create New Recording</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function CommandSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 border border-slate-200 rounded-lg transition-all duration-150 w-56 lg:w-72 justify-between"
    >
      <div className="flex items-center gap-2">
        <Search className="w-3.5 h-3.5" />
        <span>Quick search platform...</span>
      </div>
      <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.06)]">
        ⌘K
      </kbd>
    </button>
  );
}
