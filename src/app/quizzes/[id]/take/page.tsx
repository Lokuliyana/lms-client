// src/app/quizzes/[id]/take/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "dompurify";
import { decodeHtml } from "@/lib/utils";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ZoomIn,
  X,
  Send,
  ArrowLeft,
  Sparkles,
  Award,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getQuizByIdForPlay,
  submitQuiz,
  getQuizSubmissionById,
  type QuizForPlay,
} from "@/services/quizService";
import type { Question } from "@/types/quiz";
import { CalculatingLoader } from "@/components/reusable/calculating-loader";
import { DetailLoader } from "@/components/reusable/detail-loader";

export default function AssessmentFocusArena() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPractice = searchParams.get("mode") === "practice";

  const quizId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizForPlay | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<any[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);

  // Results State
  const [review, setReview] = useState<any | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Normalize options array
  const toArrayOptions = (opts?: string[] | Record<string, string>): string[] => {
    if (!opts) return [];
    if (Array.isArray(opts)) return opts;
    const order = ["a", "b", "c", "d", "e", "f", "g"];
    if (order.some((k) => k in opts)) {
      return order.filter((k) => k in opts).map((k) => opts[k]);
    }
    return Object.values(opts);
  };

  // Fetch quiz details
  useEffect(() => {
    let mounted = true;
    if (!quizId) return;

    (async () => {
      try {
        setLoading(true);
        const data = await getQuizByIdForPlay(quizId);
        if (!mounted) return;

        setQuiz(data);

        const mapped: Question[] = (data.questions || []).map((q: any, i: number) => ({
          id: q._id || i,
          _id: q._id,
          type: q.type || "mcq",
          question: q.question,
          image: q.image ?? undefined,
          explanation: q.explanation ?? undefined,
          formula: q.formula ?? undefined,
          options: toArrayOptions(q.options),
          marks: q.marks ?? 1,
          sliderRange: q.sliderRange,
          dragItems: q.dragItems,
        }));

        setQuestions(mapped);
        setSelectedAnswers(new Array(mapped.length).fill(null));

        if (data.time_limit_sec && data.time_limit_sec > 0 && !isPractice) {
          setRemainingSeconds(data.time_limit_sec);
        }
      } catch (err) {
        console.error("Failed to load quiz in Focus Arena:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [quizId, isPractice]);

  // Submit Handler
  const handleFinalSubmit = useCallback(async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);
    try {
      const formatted = selectedAnswers.map((ans, i) => ({
        question_id: String(questions[i]?._id || questions[i]?.id),
        answer: ans,
      }));

      const { submission } = await submitQuiz({
        quizId: String(quizId),
        answers: formatted,
        time_spent: timeSpent,
      });

      const reviewed = await getQuizSubmissionById(submission._id);
      const mappedReview = (reviewed?.questions || []).map((q: any) => ({
        ...q,
        options: toArrayOptions(q.options),
      }));

      setReview({
        ...reviewed,
        questions: mappedReview,
        score: Number(reviewed?.score) || 0,
        submissionId: submission._id,
      });
      setShowResults(true);
    } catch (err) {
      console.error("Failed to submit assessment:", err);
      alert("Submission error. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAnswers, questions, quizId, timeSpent]);

  // Timers: Elapsed & Countdown
  useEffect(() => {
    if (loading || showResults || isSubmitting) return;

    const interval = setInterval(() => {
      setTimeSpent((s) => s + 1);
      setRemainingSeconds((rem) => {
        if (rem === null) return null;
        if (rem <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return rem - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, showResults, isSubmitting, handleFinalSubmit]);

  // Answer selection handler
  const handleAnswerSelect = useCallback((val: any) => {
    setSelectedAnswers((prev) => {
      const copy = [...prev];
      copy[currentQuestion] = val;
      return copy;
    });
  }, [currentQuestion]);

  const handleToggleFlag = useCallback(() => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion]: !prev[currentQuestion],
    }));
  }, [currentQuestion]);

  // Keyboard Shortcuts (1-4 / A-D for options, Arrows for nav, F for flag)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if focus is on an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const q = questions[currentQuestion];
      if (!q) return;

      const key = e.key.toUpperCase();

      // Flag Shortcut: F
      if (key === "F") {
        e.preventDefault();
        handleToggleFlag();
        return;
      }

      // Next / Previous Navigation
      if (e.key === "ArrowRight") {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((c) => c + 1);
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        if (currentQuestion > 0) {
          setCurrentQuestion((c) => c - 1);
        }
        return;
      }

      // Options shortcut for MCQ
      if (q.type === "mcq" && q.options) {
        const keyMap: Record<string, number> = {
          "1": 0,
          "2": 1,
          "3": 2,
          "4": 3,
          "5": 4,
          A: 0,
          B: 1,
          C: 2,
          D: 3,
          E: 4,
        };

        if (key in keyMap) {
          const optIdx = keyMap[key];
          if (optIdx < q.options.length) {
            e.preventDefault();
            handleAnswerSelect(optIdx);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, questions, handleAnswerSelect, handleToggleFlag]);

  const activeQuestion = questions[currentQuestion];
  const isAnswered = (idx: number) =>
    selectedAnswers[idx] !== null && selectedAnswers[idx] !== undefined;

  const answeredCount = useMemo(
    () => selectedAnswers.filter((a) => a !== null && a !== undefined).length,
    [selectedAnswers]
  );

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const renderHtml = (content?: string) => ({
    __html: DOMPurify.sanitize(decodeHtml(content || "")),
  });

  if (isSubmitting) return <CalculatingLoader />;
  if (loading || !quiz) return <DetailLoader />;

  // -------------------------------------------------------------
  // RESULTS VIEW
  // -------------------------------------------------------------
  if (showResults && review) {
    const percentage =
      questions.length > 0 ? Math.round((review.score / questions.length) * 100) : 0;
    const passed = percentage >= 50;

    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
        {/* Result Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div
            className={`inline-flex p-3 rounded-2xl ${
              passed
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-rose-50 text-rose-600 border border-rose-200"
            }`}
          >
            {passed ? <Trophy className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {passed ? "Assessment Completed!" : "Assessment Submitted"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {quiz.title} • {isPractice ? "Practice Mode" : "Ranked Solo Attempt"}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 max-w-xl mx-auto">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Score</span>
              <p className="text-xl font-bold text-slate-900">
                {review.score} / {questions.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Percentage</span>
              <p className={`text-xl font-bold ${passed ? "text-emerald-600" : "text-rose-600"}`}>
                {percentage}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Time Spent</span>
              <p className="text-xl font-bold text-slate-900">{formatSeconds(timeSpent)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Accuracy</span>
              <p className="text-xl font-bold text-slate-900">
                {questions.length > 0
                  ? `${Math.round((review.score / questions.length) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="default"
              onClick={() => router.push("/quizzes")}
              className="px-6 text-xs h-10"
            >
              Back to Quiz Catalog
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setShowResults(false);
                setCurrentQuestion(0);
                setSelectedAnswers(new Array(questions.length).fill(null));
                setFlaggedQuestions({});
                setTimeSpent(0);
                if (quiz.time_limit_sec) setRemainingSeconds(quiz.time_limit_sec);
              }}
              className="text-xs h-10"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Retake Assessment
            </Button>
          </div>
        </div>

        {/* Question by Question Review */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Detailed Question Review</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {questions.length} items
            </span>
          </h2>

          <div className="space-y-4">
            {(review.questions || questions).map((q: any, i: number) => {
              const userAns = selectedAnswers[i];
              const isCorrect = userAns === q.correctAnswer;

              return (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400">Question {i + 1}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isCorrect
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </>
                      )}
                    </span>
                  </div>

                  <div
                    className="prose prose-slate max-w-none text-sm font-medium text-slate-800"
                    dangerouslySetInnerHTML={renderHtml(q.question)}
                  />

                  {q.image && (
                    <div className="relative w-full h-48 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
                      <Image
                        src={q.image}
                        alt="Question media"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <span className="text-slate-400 block mb-0.5">Your Selected Answer</span>
                      <span className="font-semibold text-slate-800">
                        {userAns !== null && userAns !== undefined
                          ? q.options?.[userAns] || String(userAns)
                          : "Not answered"}
                      </span>
                    </div>
                    {q.correctAnswer !== undefined && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                        <span className="text-emerald-600 block mb-0.5">Correct Answer</span>
                        <span className="font-semibold text-emerald-900">
                          {q.options?.[q.correctAnswer] || String(q.correctAnswer)}
                        </span>
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950">
                      <span className="font-bold text-indigo-700 block mb-1">Explanation:</span>
                      <div dangerouslySetInnerHTML={renderHtml(q.explanation)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FOCUS ARENA RUNNER VIEW
  // -------------------------------------------------------------
  const isTimeUrgent = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col overflow-hidden select-none">
      {/* 1. TOP FOCUS ARENA BAR (Minimal Header: 52px) */}
      <header className="h-13 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: Exit + Assessment Name */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitModal(true)}
            className="text-slate-500 hover:text-slate-900 text-xs h-8 px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Exit
          </Button>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-xs">
              {quiz.title}
            </span>
            {isPractice && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Practice Mode
              </span>
            )}
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-colors ${
              isTimeUrgent
                ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                : remainingSeconds !== null
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {remainingSeconds !== null
                ? formatSeconds(remainingSeconds)
                : formatSeconds(timeSpent)}
            </span>
          </div>
        </div>

        {/* Right: Flag Toggle + Finish Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFlag}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              flaggedQuestions[currentQuestion]
                ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
            title="Press 'F' to flag for review"
          >
            <Flag
              className={`w-3.5 h-3.5 ${
                flaggedQuestions[currentQuestion]
                  ? "fill-amber-500 text-amber-500"
                  : "text-slate-400"
              }`}
            />
            <span className="hidden sm:inline">
              {flaggedQuestions[currentQuestion] ? "Flagged" : "Flag"}
            </span>
            <kbd className="hidden md:inline text-[9px] px-1 bg-slate-100 border border-slate-200 rounded text-slate-400 font-mono">
              F
            </kbd>
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="text-xs h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Finish & Submit
          </Button>
        </div>
      </header>

      {/* 2. MAIN 50/50 SPLIT WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-white">
        {/* LEFT COLUMN: Question Statement, Media & Figure (Sticky & Scrollable) */}
        <section className="flex flex-col border-r border-slate-200/90 h-full overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Question Metadata Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[11px] capitalize">
                {activeQuestion?.type || "MCQ"}
              </span>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              {activeQuestion?.marks || 1} {activeQuestion?.marks === 1 ? "Mark" : "Marks"}
            </span>
          </div>

          {/* Question Body Text */}
          <div className="space-y-3">
            <h1
              className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed tracking-normal font-sans"
              dangerouslySetInnerHTML={renderHtml(activeQuestion?.question)}
            />

            {activeQuestion?.formula && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-indigo-900">
                {activeQuestion.formula}
              </div>
            )}
          </div>

          {/* Question Media Figure (Pinned / Zoomable) */}
          {activeQuestion?.image && (
            <div className="relative group rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden shadow-xs">
              <div className="relative w-full h-64 sm:h-80">
                <Image
                  src={activeQuestion.image}
                  alt={`Question ${currentQuestion + 1} figure`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
              </div>

              {/* Click to Expand button */}
              <button
                type="button"
                onClick={() => setImageZoomOpen(true)}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/75 hover:bg-black text-white text-xs font-medium backdrop-blur-xs transition-colors shadow-md"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>Zoom Figure</span>
              </button>
            </div>
          )}

          {/* Keyboard Helper Hint (hidden on mobile) */}
          <div className="mt-auto pt-6 text-[11px] text-slate-400 hidden md:flex items-center gap-3">
            <span>Shortcuts:</span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">1-4</kbd> /{" "}
              <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">A-D</kbd> select
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">←</kbd>
              <kbd className="px-1 py-0.5 bg-slate-100 border rounded font-mono">→</kbd> navigate
            </span>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Answer Options Arena */}
        <section className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto p-4 sm:p-8 justify-between scrollbar-thin scrollbar-thumb-slate-200">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Your Answer
              </span>
              <span className="text-xs text-slate-400">
                {isAnswered(currentQuestion) ? "Answer saved" : "Unanswered"}
              </span>
            </div>

            {/* MCQ Options Rendering */}
            {activeQuestion?.type === "mcq" && (
              <div className="space-y-2.5 sm:space-y-3">
                {activeQuestion.options?.map((optionText, idx) => {
                  const isSelected = selectedAnswers[currentQuestion] === idx;
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <div
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`group flex items-start gap-3 p-3 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-800"
                      }`}
                    >
                      {/* Letter / Number Badge */}
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                        }`}
                      >
                        {letter}
                      </span>

                      {/* Option Text Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <span
                          className={`text-sm leading-relaxed block ${
                            isSelected ? "text-indigo-950 font-semibold" : "text-slate-800"
                          }`}
                        >
                          {optionText}
                        </span>
                      </div>

                      {/* Radio Dot Indicator */}
                      <div className="pt-1">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* True/False Options */}
            {activeQuestion?.type === "true-false" && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "True", value: true },
                  { label: "False", value: false },
                ].map(({ label, value }) => {
                  const isSelected = selectedAnswers[currentQuestion] === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleAnswerSelect(value)}
                      className={`p-6 rounded-xl border text-center font-bold text-base transition-all ${
                        isSelected
                          ? "bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill-in the blank */}
            {activeQuestion?.type === "fill-blank" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  value={selectedAnswers[currentQuestion] || ""}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            )}

            {/* Slider / Numeric */}
            {activeQuestion?.type === "slider" && (
              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Min: {activeQuestion.sliderRange?.min ?? 0}</span>
                  <span className="text-base font-bold text-indigo-600 font-mono">
                    {selectedAnswers[currentQuestion] ?? activeQuestion.sliderRange?.min ?? 0}
                  </span>
                  <span>Max: {activeQuestion.sliderRange?.max ?? 100}</span>
                </div>
                <input
                  type="range"
                  min={activeQuestion.sliderRange?.min ?? 0}
                  max={activeQuestion.sliderRange?.max ?? 100}
                  value={
                    selectedAnswers[currentQuestion] ?? activeQuestion.sliderRange?.min ?? 0
                  }
                  onChange={(e) => handleAnswerSelect(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
              disabled={currentQuestion === 0}
              className="text-xs h-9 px-4 text-slate-700 border-slate-300"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {currentQuestion < questions.length - 1 ? (
              <Button
                variant="primary"
                size="default"
                onClick={() => setCurrentQuestion((c) => c + 1)}
                className="text-xs h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Next Question
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="default"
                onClick={() => setShowSubmitModal(true)}
                className="text-xs h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Review & Submit
                <Send className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* 3. BOTTOM QUESTION PROGRESS PALETTE DOCK (64px) */}
      <footer className="h-16 bg-white border-t border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20 pb-[max(0rem,env(safe-area-inset-bottom))]">
        {/* Left: Progress Summary */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-slate-600">
              Answered: <strong className="text-slate-900">{answeredCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-600">
              Flagged:{" "}
              <strong className="text-slate-900">
                {Object.values(flaggedQuestions).filter(Boolean).length}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
            <span className="text-slate-600">
              Remaining:{" "}
              <strong className="text-slate-900">{questions.length - answeredCount}</strong>
            </span>
          </div>
        </div>

        {/* Center: Scrollable Palette Numbers */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 w-full sm:w-auto max-w-full sm:max-w-md lg:max-w-xl scrollbar-thin scrollbar-thumb-slate-200">
          {questions.map((_, idx) => {
            const isCurrent = idx === currentQuestion;
            const answered = isAnswered(idx);
            const flagged = flaggedQuestions[idx];

            let stateClass = "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";
            if (flagged) {
              stateClass = "bg-amber-100 text-amber-900 border-amber-400 font-bold";
            } else if (answered) {
              stateClass = "bg-indigo-600 text-white border-indigo-600 font-bold";
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentQuestion(idx)}
                className={`relative w-8 h-8 rounded-lg text-xs font-semibold shrink-0 border transition-all ${stateClass} ${
                  isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 scale-105" : ""
                }`}
                title={`Question ${idx + 1}`}
              >
                {idx + 1}
                {flagged && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Answered Progress Percentage */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {Math.round((answeredCount / (questions.length || 1)) * 100)}% Complete
          </span>
        </div>
      </footer>

      {/* 4. MODALS */}

      {/* Image Zoom Lightbox Modal */}
      {imageZoomOpen && activeQuestion?.image && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full h-[80vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setImageZoomOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={activeQuestion.image}
                alt="Enlarged figure"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Finish & Submit Confirmation Dialog */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Finish and Submit Assessment?</h3>
                <p className="text-xs text-slate-500">
                  You are about to submit your final attempt answers.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900">{questions.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Answered:</span>
                <span className="font-bold text-indigo-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Unanswered:</span>
                <span className="font-bold text-rose-600">
                  {questions.length - answeredCount}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitModal(false)}
                className="text-xs h-9 px-4"
              >
                Return to Questions
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinalSubmit}
                className="text-xs h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Exit Assessment?</h3>
                <p className="text-xs text-slate-500">Your current progress may be lost.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitModal(false)}
                className="text-xs h-9"
              >
                Resume Assessment
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => router.push("/quizzes")}
                className="text-xs h-9"
              >
                Confirm Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
