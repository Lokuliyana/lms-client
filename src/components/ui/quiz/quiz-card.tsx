// components/QuizCard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/dev/card";
import { Badge } from "@/components/dev/badge";
import { Button } from "@/components/dev/button";
import {
  Calculator,
  Atom,
  BookOpen,
  Clock,
  PlayCircle,
  PencilLine,
  Trash2,
  Trophy,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/dev/alert-dialog";

import GameQuizPopup, { type Quiz as PopupQuiz } from "./QuizPopup";
import type { QuizMetadata } from "@/types/quiz";
import { updateQuiz } from "@/services/quizService";
import DOMPurify from "dompurify";
import { decodeHtml } from "@/lib/utils";
import { CLAY_ASSETS } from "@/constants/clayAssets";

/* ========= Helpers ========= */
type QType =
  | "mcq"
  | "true-false"
  | "fill-blank"
  | "multiple-select"
  | "slider"
  | "drag-drop"
  | string;

const TYPE_TIME_SEC: Record<string, number> = {
  mcq: 40,
  "true-false": 20,
  "fill-blank": 50,
  "multiple-select": 55,
  slider: 25,
  "drag-drop": 45,
};

function estimateMinutes(questions: any[] = []) {
  if (!questions.length) return 1;
  const total =
    questions.reduce((s, q) => s + (TYPE_TIME_SEC[q?.type as QType] ?? 35), 0) || 0;
  return Math.max(1, Math.round(total / 60));
}

function typeSummary(questions: any[] = []) {
  const uniq = Array.from(new Set(questions.map((q) => String(q?.type || ""))));
  return uniq
    .filter(Boolean)
    .map((t) => t.replace("-", " "))
    .join(" • ");
}

function formatDateISO(iso?: string | Date) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function gradientByDifficulty(diff?: string) {
  const d = (diff || "").toLowerCase();
  if (d.includes("hard")) return "from-rose-600 to-orange-600";
  if (d.includes("medium")) return "from-amber-600 to-lime-600";
  return "from-blue-600 to-purple-600";
}

function getAttemptsCount(q: any): number {
  return (
    Number(q?.stats?.attempts) ||
    Number(q?.stats?.takenCount) ||
    Number(q?.attemptsCount) ||
    Number(q?.taken) ||
    0
  );
}

function bubbleColor(diff?: string) {
  const d = (diff || "").toLowerCase();
  if (d.includes("hard")) return "bg-rose-600";
  if (d.includes("medium")) return "bg-amber-600";
  return "bg-blue-600";
}

/* Pool of clay assets used as semi-transparent watermarks in quiz cards */
const CLAY_WATERMARKS = [
  CLAY_ASSETS.thumbTheoryOpenbook,
  CLAY_ASSETS.thumbMathematics,
  CLAY_ASSETS.thumbScienceStem,
  CLAY_ASSETS.thumbIctTech,
  CLAY_ASSETS.thumbPaperClass,
  CLAY_ASSETS.thumbRevisionScreen,
  CLAY_ASSETS.thumbCommerceAccounts,
  CLAY_ASSETS.gradeReportTrophy,
  CLAY_ASSETS.examPaperCreation,
  CLAY_ASSETS.liveStageOnair,
] as const;

/* ========= Component ========= */
interface QuizCardProps {
  quiz: QuizMetadata & { _id?: string }; // tolerate either id or _id
}

export default function QuizCard({ quiz }: QuizCardProps) {
  const router = useRouter();
  const { user, loading, isTeacher, hasPermission } = useAuth();
  const canManage =
    Boolean(isTeacher) ||
    Boolean(hasPermission?.("quizzes.manage"));

  const [fresh, setFresh] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!quiz?.created_at) return;
    const created = new Date(quiz.created_at).getTime();
    const tenDays = 10 * 86400000;
    setFresh(Date.now() - created <= tenDays);
  }, [quiz?.created_at]);

  const quizId = String((quiz as any)?._id ?? quiz.id ?? "");
  if (!quizId) return null;

  const subject = (quiz as any)?.subject || "General";
  const description = (quiz as any)?.description || (quiz as any)?.instructions || "";
  const questions = (quiz as any)?.questions || [];
  const qCount = questions.length > 0 ? questions.length : (Number((quiz as any)?.question_count) || 0);
  const timeLimitSec = Number((quiz as any)?.time_limit_sec) || 0;
  const minutes = timeLimitSec > 0
    ? Math.max(1, Math.round(timeLimitSec / 60))
    : (questions.length > 0 ? estimateMinutes(questions) : Math.max(1, qCount * 2));
  const totalMarks =
    Number((quiz as any)?.total_marks) ||
    Number((quiz as any)?.totalMarks) ||
    (questions.length > 0
      ? questions.reduce((s: number, q: any) => s + (Number(q?.marks) || 1), 0)
      : (qCount > 0 ? qCount * 5 : 25));
  const types = typeSummary(questions);
  const createdISO = formatDateISO((quiz as any)?.created_at);
  const inactive = (quiz as any)?.is_active === false;
  const attempts = getAttemptsCount(quiz);
  const difficultyText = (quiz as any)?.difficulty || "Easy";
  const difficulty = difficultyText.toLowerCase();

  const SubjectIcon =
    subject?.toLowerCase() === "math"
      ? Calculator
      : subject?.toLowerCase() === "science"
      ? Atom
      : BookOpen;

  const popupQuiz: PopupQuiz = {
    id: quizId,
    title: quiz.title || "Untitled Quiz",
    icon: SubjectIcon,
    color: bubbleColor((quiz as any)?.difficulty),
    questions: qCount,
    duration: timeLimitSec > 0 ? `${Math.max(1, Math.round(timeLimitSec / 60))} min` : `${minutes} min`,
    difficulty: (difficulty as any) || "easy",
    timeLimitSec: timeLimitSec > 0 ? timeLimitSec : (minutes * 60),
    totalMarks: totalMarks,
  };

  const takeQuizLabel = "Take Quiz";

  const cta =
    !user && !loading ? (
      <Button
        onClick={() => router.push(`/quizzes/${quizId}/take?guest=1`)}
        disabled={inactive}
        className={`w-full h-10 rounded-xl text-white text-xs font-semibold shadow-xs transition-colors ${
          inactive
            ? "bg-slate-200 hover:bg-slate-200 cursor-not-allowed text-slate-500"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        <PlayCircle className="w-4 h-4 mr-2" />
        {takeQuizLabel}
      </Button>
    ) : (
      <GameQuizPopup
        quiz={popupQuiz}
        onPractice={() => router.push(`/quizzes/${quizId}/take?mode=practice`)}
        onStart={() => router.push(`/quizzes/${quizId}/take`)}
        trigger={
          <Button
            disabled={inactive}
            className={`w-full h-10 rounded-xl text-white text-xs font-semibold shadow-xs transition-colors ${
              inactive
                ? "bg-slate-200 hover:bg-slate-200 cursor-not-allowed text-slate-500"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {takeQuizLabel}
          </Button>
        }
      />
    );

  const handleDeleteClick = () => {
    if (!canManage) return;
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!canManage || !quizId) return;
    try {
      setDeleting(true);
      await updateQuiz(quizId, { is_delete: true, is_active: false });
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to soft-delete quiz", err);
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card
        className="
        relative overflow-hidden rounded-2xl
        bg-white border border-slate-200/90
        shadow-xs hover:shadow-md transition-all duration-300
        flex flex-col justify-between h-auto sm:h-[285px]
      "
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            background:
              "radial-gradient(1200px 300px at 20% -10%, rgba(59,130,246,0.35), transparent 60%), radial-gradient(1000px 300px at 120% 10%, rgba(168,85,247,0.35), transparent 60%)",
          }}
        />
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradientByDifficulty(
            difficulty
          )} opacity-95`}
        />

        {/* Clay watermark — deterministic-random per quiz, purely decorative */}
        {(() => {
          const seed = quizId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const watermark = CLAY_WATERMARKS[seed % CLAY_WATERMARKS.length];
          return (
            <div
              aria-hidden
              className="absolute right-3 top-[5%] pointer-events-none select-none z-[1]"
            >
              <img
                src={watermark}
                alt=""
                className="w-36 h-36 object-contain opacity-[0.18]"
              />
            </div>
          );
        })()}



        <CardHeader className="relative z-10 pb-2 pt-4 px-5 shrink-0">
          <div className="flex items-center justify-between mb-2 gap-2">
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-indigo-200/70 bg-indigo-50/80 text-indigo-700"
            >
              <span className="inline-flex items-center gap-1">
                <SubjectIcon className="w-3.5 h-3.5" />
                {subject}
              </span>
            </Badge>

            <div className="flex items-center gap-1.5">
              {fresh && (
                <Badge className="px-2 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-700 border border-sky-200">
                  New
                </Badge>
              )}
              {inactive && (
                <Badge className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                  Inactive
                </Badge>
              )}
              <span
                className={`
                inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border
                ${
                  difficulty.includes("hard")
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : difficulty.includes("medium")
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }
              `}
              >
                {difficultyText}
              </span>
            </div>
          </div>

          <CardTitle className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
            {quiz.title}
          </CardTitle>

          <div className="text-slate-600 mt-1 text-xs leading-relaxed line-clamp-2 min-h-[2rem] [&_*]:inline [&_*]:m-0">
            {description ? (
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(decodeHtml(description)),
                }}
              />
            ) : (
              <span className="text-slate-400 italic">No description provided.</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative z-10 flex flex-col justify-between flex-1 px-5 pb-4 pt-0">
          <div>
            <div className="my-1.5 h-px w-full bg-slate-100" />

            {/* Equalized 3-Column Metadata Bar */}
            <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-xl bg-slate-50/80 border border-slate-100/90 text-center">
              <div className="flex flex-col items-center justify-center min-w-0">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Count</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {qCount} {qCount === 1 ? "Q" : "Qs"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center min-w-0 border-x border-slate-200/60">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Duration</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  ~{minutes}m
                </span>
              </div>
              <div className="flex flex-col items-center justify-center min-w-0">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Marks</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                  <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {totalMarks} pts
                </span>
              </div>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate max-w-[150px]">{types || "Assessment"}</span>
              {canManage && attempts > 0 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                  {attempts} attempts
                </span>
              ) : createdISO ? (
                <span className="opacity-75">{createdISO}</span>
              ) : null}
            </div>
          </div>

          <div className="mt-2 space-y-2 shrink-0">
            {cta}

            {canManage && (
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <Button
                  onClick={() => router.push(`/admin/quizzes/edit/${quizId}`)}
                  variant="outline"
                  className="w-full h-8 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <PencilLine className="w-3.5 h-3.5 mr-1.5" />
                  Edit Quiz
                </Button>

                <Button
                  type="button"
                  onClick={handleDeleteClick}
                  variant="outline"
                  disabled={deleting}
                  className="h-8 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 shrink-0"
                  title="Delete Quiz"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the quiz from students and mark it as deleted. You can’t
              undo this from the student side. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
              className="bg-slate-100 text-slate-800 hover:bg-slate-200"
            >
              Cancel
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
