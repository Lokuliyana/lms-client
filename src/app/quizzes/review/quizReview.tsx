"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/dev/card";
import { Badge } from "@/components/dev/badge";
import {
  CheckCircle,
  XCircle,
  Trophy,
  User,
  BookCheck,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import Image from "next/image";
import { SectionHeader } from "@/components/reusable/section-header";
import DOMPurify from "dompurify";
import "react-quill-new/dist/quill.snow.css";
import { decodeHtml } from "@/lib/utils";

type QuestionType =
  | "mcq"
  | "true-false"
  | "fill-blank"
  | "multiple-select"
  | "slider"
  | "drag-drop";

type QuizQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  image?: string | null;
  options?: string[];
  correctAnswer: any;
  explanation?: string;
  formula?: string;
  dragItems?: {
    items: string[];
    matches: string[];
  };
};

const formatAnswer = (q: QuizQuestion, value: any): string => {
  if (value === null || value === undefined) return "—";

  // MCQ: single index -> label
  if (q.type === "mcq") {
    if (Array.isArray(q.options) && typeof value === "number") {
      return q.options[value] ?? String(value);
    }
    if (Array.isArray(q.options) && Array.isArray(value)) {
      return value
        .map((v) =>
          typeof v === "number" ? q.options?.[v] ?? String(v) : String(v)
        )
        .join(", ");
    }
    return String(value);
  }

  // True/False
  if (q.type === "true-false") {
    if (typeof value === "boolean") return value ? "True" : "False";
    if (value === "true" || value === "false")
      return value === "true" ? "True" : "False";
    if (Array.isArray(q.options) && typeof value === "number") {
      return q.options[value] ?? String(value);
    }
    return String(value);
  }

  // Multiple select: array of indices -> labels
  if (q.type === "multiple-select") {
    if (Array.isArray(value) && Array.isArray(q.options)) {
      return value
        .map((v) =>
          typeof v === "number" ? q.options?.[v] ?? String(v) : String(v)
        )
        .join(", ");
    }
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }

  // Drag & drop: indices -> item labels
  if (q.type === "drag-drop") {
    if (Array.isArray(value) && q.dragItems?.items) {
      return value
        .map((v) =>
          typeof v === "number" ? q.dragItems?.items?.[v] ?? String(v) : String(v)
        )
        .join(" | ");
    }
    return String(value);
  }

  // Slider
  if (q.type === "slider") {
    return String(value);
  }

  // Fill-blank or anything else
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "True" : "False";
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
  userAnswers: any[];
  score: number;
  maxScore?: number;
  percent?: number;
  timeSpent: number;
}) {
  const percentage = typeof percent === "number" && !isNaN(percent)
    ? Math.round(percent)
    : (maxScore && maxScore > 0
        ? Math.round((score / maxScore) * 100)
        : (questions.length > 0 ? Math.round((score / questions.length) * 100) : 0));

  return (
    <div className="relative bg-[#f9fafb] min-h-screen pb-20 px-4 md:px-6 space-y-10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Sparkles className="absolute top-[12%] left-[6%] w-10 h-10 text-yellow-300 opacity-30 animate-pulse-slow" />
        <Lightbulb className="absolute bottom-[10%] right-[8%] w-12 h-12 text-purple-300 opacity-30 animate-pulse-slow delay-300" />
        <Sparkles className="absolute top-[22%] right-[4%] w-8 h-8 text-pink-300 opacity-20 animate-pulse-slow delay-200" />
        <Lightbulb className="absolute bottom-[6%] left-[6%] w-10 h-10 text-blue-400 opacity-20 animate-pulse-slow delay-500" />

        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply blur-2xl opacity-20 animate-blob-1" />
        <div className="absolute top-1/3 right-1/4 w-44 h-44 bg-pink-300 rounded-full mix-blend-multiply blur-2xl opacity-20 animate-blob-2" />
        <div className="absolute bottom-[30%] left-[10%] w-36 h-36 bg-yellow-200 rounded-full mix-blend-multiply blur-2xl opacity-10 animate-blob-1" />
        <div className="absolute bottom-[15%] right-[25%] w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply blur-2xl opacity-10 animate-blob-2" />
      </div>

      <SectionHeader
        title="Quiz Completed"
        description="See what you got right, what you missed, and learn from feedback below."
        icon={Trophy}
      />

      {/* Score Summary */}
      <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 text-center px-6 py-10 space-y-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="text-6xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            {percentage}%
          </div>
          <p className="text-xl font-semibold text-slate-800">
            {score} out of {questions.length} correct
          </p>
          <p className="text-sm text-slate-500">
            Time spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
          </p>
        </div>

        <div className="text-sm text-slate-600 italic">
          {percentage === 100
            ? "🏆 Excellent work! You aced it!"
            : percentage >= 60
            ? "👏 Great job! A little more practice and you're there."
            : "📚 Keep practicing! You'll improve in no time."}
        </div>
      </Card>

      {/* Question Review */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 text-center">
          Review Your Answers
        </h2>
        <div className="grid gap-6">
          {questions.map((question, index) => {
            const userAnswer = userAnswers[index];
            const correct = question.correctAnswer;
            let isCorrect = question.isCorrect;

            return (
              <Card
                key={question.id}
                className="bg-white/80 shadow-xl rounded-2xl border border-slate-200"
              >
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <Badge
                      variant="secondary"
                      className="uppercase tracking-wide text-xs"
                    >
                      {question.type.toUpperCase()}
                    </Badge>
                    <div
                      className={`p-2 rounded-full ${
                        isCorrect ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    <div
                      className="ql-editor prose max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(decodeHtml(question.question), {
                          ADD_ATTR: ["class", "style", "data-list"],
                          ADD_TAGS: ["iframe"],
                        }),
                      }}
                    />
                  </CardTitle>
                  {question.explanation && (
                    <div className="text-slate-500 italic text-sm mt-1">
                      <div
                        className="ql-editor prose max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(decodeHtml(question.explanation), {
                            ADD_ATTR: ["class", "style", "data-list"],
                            ADD_TAGS: ["iframe"],
                          }),
                        }}
                      />
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 py-4">
                  {question.formula && (
                    <p className="font-mono text-center text-slate-800">
                      {question.formula}
                    </p>
                  )}
                  {question.image && (
                    <div className="flex justify-center">
                      <div className="relative w-full max-w-[360px] min-h-[240px] bg-white rounded-xl overflow-hidden border border-slate-200">
                        <Image
                          src={question.image}
                          alt="Diagram"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Answer Comparison UI */}
                  <div className="grid grid-cols-1 sm-grid-cols-2 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-100 p-4 rounded-xl flex items-start space-x-3 border">
                      <BookCheck className="text-green-600 mt-1" />
                      <div>
                        <p className="text-sm text-slate-500">Correct Answer</p>
                        <p className="text-base font-semibold text-green-700">
                          {formatAnswer(question, correct)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl flex items-start space-x-3 border">
                      <User className="text-blue-500 mt-1" />
                      <div>
                        <p className="text-sm text-slate-500">Your Answer</p>
                        <p
                          className={`text-base font-semibold ${
                            isCorrect ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {formatAnswer(question, userAnswer)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
