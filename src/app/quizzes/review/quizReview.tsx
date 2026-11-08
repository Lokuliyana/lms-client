"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/dev/card";
import { Badge } from "@/components/dev/badge";
import {
  CheckCircle2,
  Trophy,
  User,
  Sparkles,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Award,
} from "lucide-react";
import Image from "next/image";
import { SectionHeader } from "@/components/reusable/section-header";
import { MathRenderer } from "@/components/ui/math-renderer";

type QuestionType =
  | "mcq"
  | "true-false"
  | "fill-blank"
  | "multiple-select"
  | "slider"
  | "drag-drop"
  | "numeric";

type QuizQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  image?: string | null;
  options?: string[];
  correctAnswer?: any;
  correct_answer?: any;
  canonicalSolution?: string;
  explanation?: string;
  formula?: string;
  marks?: number;
  sliderRange?: { min: number; max: number; step?: number };
  dragItems?: {
    items: string[];
    matches: string[];
  };
  userAnswer?: any;
  isCorrect?: boolean;
  score?: number;
};

const formatAnswer = (q: QuizQuestion, value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "No attempt submitted";
  }

  // MCQ
  if (q.type === "mcq") {
    if (Array.isArray(q.options)) {
      if (typeof value === "number") {
        return q.options[value] ?? `Option ${value + 1}`;
      }
      if (!isNaN(Number(value)) && q.options[Number(value)] !== undefined) {
        return q.options[Number(value)];
      }
    }
    return String(value);
  }

  // True/False
  if (q.type === "true-false") {
    if (typeof value === "boolean") return value ? "True" : "False";
    if (value === "true" || value === "false") return value === "true" ? "True" : "False";
    if (Array.isArray(q.options) && typeof value === "number") {
      return q.options[value] ?? String(value);
    }
    return String(value);
  }

  // Multiple Select
  if (q.type === "multiple-select") {
    if (Array.isArray(value)) {
      if (Array.isArray(q.options)) {
        return value
          .map((v) => {
            const numIdx = typeof v === "number" ? v : !isNaN(Number(v)) ? Number(v) : null;
            if (numIdx !== null && q.options?.[numIdx] !== undefined) {
              return q.options[numIdx];
            }
            return String(v);
          })
          .join(", ");
      }
      return value.join(", ");
    }
    return String(value);
  }

  // Drag & drop
  if (q.type === "drag-drop") {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return Object.entries(value)
        .map(([k, v]) => `${k} → ${v}`)
        .join("; ");
    }
    if (Array.isArray(value) && q.dragItems?.items && q.dragItems?.matches) {
      return value
        .map((matchIdx, itemIdx) => {
          const item = q.dragItems?.items[itemIdx] ?? `Item ${itemIdx + 1}`;
          if (
            matchIdx === null ||
            matchIdx === undefined ||
            matchIdx === "" ||
            matchIdx === -1
          ) {
            return `${item} → (Unmatched)`;
          }
          const match =
            typeof matchIdx === "number"
              ? q.dragItems?.matches[matchIdx] ?? `Match ${matchIdx + 1}`
              : !isNaN(Number(matchIdx)) &&
                q.dragItems?.matches[Number(matchIdx)] !== undefined
              ? q.dragItems?.matches[Number(matchIdx)]
              : String(matchIdx);
          return `${item} → ${match}`;
        })
        .join("; ");
    }
    if (Array.isArray(value)) {
      return value
        .map((v) =>
          v === null || v === undefined || v === "" ? "(Unmatched)" : String(v)
        )
        .join(" | ");
    }
    return String(value);
  }

  // Slider or numeric
  if (q.type === "slider" || q.type === "numeric") {
    return String(value);
  }

  // Fill-blank or general fallback
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

export default function QuizReview({
  questions,
  userAnswers,
  score,
  maxScore,
  percent,
  timeSpent,
}: {
  questions: (QuizQuestion & { isCorrect?: boolean; score?: number })[];
  userAnswers?: any[];
  score: number;
  maxScore?: number;
  percent?: number;
  timeSpent: number;
}) {
  const percentage =
    typeof percent === "number" && !isNaN(percent)
      ? Math.round(percent)
      : maxScore && maxScore > 0
      ? Math.round((score / maxScore) * 100)
      : questions.length > 0
      ? Math.round((score / questions.length) * 100)
      : 0;

  // Track expanded solution drawers (default all open for rich pedagogical learning)
  const [openDrawers, setOpenDrawers] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    questions.forEach((_, idx) => {
      initial[idx] = true;
    });
    return initial;
  });

  const toggleDrawer = (idx: number) => {
    setOpenDrawers((prev) => ({
      ...prev,
      [idx]: !(prev[idx] ?? true),
    }));
  };

  // Format pacing display cleanly whether timeSpent was supplied in seconds or minutes
  const formatPacingString = (time: number) => {
    if (!time || time <= 0) return "< 1m elapsed";
    // If greater than 60, it's definitely raw seconds
    if (time >= 60) {
      const m = Math.floor(time / 60);
      const s = time % 60;
      return `${m}m ${s}s elapsed`;
    }
    // Sub-minute duration in seconds
    return `${time}s elapsed`;
  };

  return (
    <div className="relative bg-[#f8fafc] dark:bg-slate-950 min-h-screen pb-20 px-4 md:px-6 space-y-10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Sparkles className="absolute top-[12%] left-[6%] w-10 h-10 text-indigo-300 opacity-20 animate-pulse" />
        <Lightbulb className="absolute bottom-[10%] right-[8%] w-12 h-12 text-violet-300 opacity-20 animate-pulse delay-300" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-44 h-44 bg-violet-300/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <SectionHeader
        title="Assessment Synthesis & Pedagogical Review"
        description="Strengthen your mastery through verified solutions and step-by-step conceptual breakdowns."
        icon={Trophy}
      />

      {/* Constructive Performance Summary */}
      <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center px-6 py-8 max-w-3xl mx-auto space-y-5">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 mb-1">
            <Award className="w-8 h-8" />
          </div>
          <div className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {percentage}%
          </div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {score} of {maxScore ?? questions.length} Points Verified
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pacing: {formatPacingString(timeSpent)}
          </p>
        </div>

        <div className="inline-block px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium">
          {percentage >= 80
            ? "🌟 Outstanding comprehension! Your conceptual foundation is exceptionally solid."
            : percentage >= 50
            ? "💡 Solid effort! Review the verified solutions below to turn learning opportunities into mastery."
            : "🌱 Great practice opportunity! Explore each canonical solution below to elevate your understanding."}
        </div>
      </Card>

      {/* Question by Question Review */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Constructive Question Exploration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Focus on the illuminated verified solutions and key mathematical principles below.
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => {
            const userAnswer =
              userAnswers && userAnswers[index] !== undefined
                ? userAnswers[index]
                : (question as any).userAnswer;
            const correct =
              question.correctAnswer ??
              question.correct_answer ??
              question.canonicalSolution;
            const isCorrect = Boolean(question.isCorrect);
            const isDrawerOpen = openDrawers[index] ?? true;

            return (
              <Card
                key={question.id || index}
                className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
              >
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="uppercase tracking-wide text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Question {index + 1} • {question.type.replace("-", " ").toUpperCase()}
                      </Badge>
                      {question.marks !== undefined && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {question.marks} {question.marks === 1 ? "pt" : "pts"}
                        </span>
                      )}
                    </div>

                    {/* Constructive Pedagogical Status Badge (Zero punitive red boxes) */}
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Mastered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Learning Opportunity
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    <MathRenderer content={question.question} />
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Optional Diagram Media */}
                  {question.image && (
                    <div className="flex justify-center">
                      <div className="relative w-full max-w-[420px] h-52 bg-slate-50 dark:bg-slate-800/40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <Image
                          src={question.image}
                          alt={`Question ${index + 1} diagram`}
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Constructive Comparison UI: Illuminated Verified Answer & Slate Student Attempt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Student Attempt: Neutral Slate Pill */}
                    <div className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Your Recorded Attempt
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <MathRenderer content={formatAnswer(question, userAnswer)} />
                      </div>
                    </div>

                    {/* Verified Correct Answer: Emerald Card with Checkmark Badge */}
                    <div className="bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="p-0.5 rounded-full bg-emerald-600 text-white">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Verified Correct Answer
                        </span>
                      </div>
                      <div className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                        <MathRenderer content={formatAnswer(question, correct)} />
                      </div>
                    </div>
                  </div>

                  {/* Structured Canonical Solution Drawer */}
                  {(question.explanation || question.formula || question.canonicalSolution) && (
                    <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/60 to-slate-50/50 dark:from-indigo-950/20 dark:to-slate-900/40 overflow-hidden mt-2">
                      {/* Drawer Toggle Header */}
                      <button
                        type="button"
                        onClick={() => toggleDrawer(index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-semibold text-xs sm:text-sm">
                          <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>Canonical Solution & Pedagogical Breakdown</span>
                        </div>
                        <div className="text-indigo-600 dark:text-indigo-400">
                          {isDrawerOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Drawer Content */}
                      {isDrawerOpen && (
                        <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-indigo-100/60 dark:border-indigo-900/40 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                          {/* KaTeX Mathematical Formula */}
                          {question.formula && (
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                                Governing Formula / Theorem
                              </span>
                              <div className="text-center py-1">
                                <MathRenderer content={question.formula} block />
                              </div>
                            </div>
                          )}

                          {/* Canonical Step-by-Step Solution */}
                          {question.canonicalSolution && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                                Canonical Solution Workings:
                              </span>
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-slate-800">
                                <MathRenderer content={question.canonicalSolution} />
                              </div>
                            </div>
                          )}

                          {/* Pedagogical Explanation */}
                          {question.explanation && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                                Pedagogical Insights:
                              </span>
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                                <MathRenderer content={question.explanation} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
