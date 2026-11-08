// src/app/quizzes/[id]/take/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  X,
  Send,
  ArrowLeft,
  RotateCcw,
  Sliders,
  Hash,
  MoveRight,
  Layers,
  Sparkles,
  ShieldAlert,
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
import { MathRenderer } from "@/components/ui/math-renderer";
import QuizReview from "@/app/quizzes/review/quizReview";

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

  // Client Integrity Telemetry State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [blurDurationMs, setBlurDurationMs] = useState(0);
  const blurStartTimeRef = useRef<number | null>(null);
  const isBlurredRef = useRef(false);

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
          tolerance: q.tolerance,
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

  // Client Integrity Telemetry Tracking (Visibility Change & Window Blur/Focus with Debounced Latch)
  useEffect(() => {
    if (loading || showResults || isSubmitting) return;

    const onBlurEvent = () => {
      if (!isBlurredRef.current) {
        isBlurredRef.current = true;
        blurStartTimeRef.current = Date.now();
        setTabSwitches((prev) => prev + 1);
      }
    };

    const onFocusEvent = () => {
      if (isBlurredRef.current) {
        isBlurredRef.current = false;
        if (blurStartTimeRef.current !== null) {
          const duration = Date.now() - blurStartTimeRef.current;
          setBlurDurationMs((prev) => prev + duration);
          blurStartTimeRef.current = null;
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onBlurEvent();
      } else {
        onFocusEvent();
      }
    };

    const handleWindowBlur = () => {
      onBlurEvent();
    };

    const handleWindowFocus = () => {
      onFocusEvent();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loading, showResults, isSubmitting]);

  // Submit Handler with Client Integrity Telemetry & Payload Normalization
  const handleFinalSubmit = useCallback(async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);
    try {
      // Finalize any ongoing blur duration
      let currentBlurMs = blurDurationMs;
      if (blurStartTimeRef.current !== null) {
        currentBlurMs += Date.now() - blurStartTimeRef.current;
        blurStartTimeRef.current = null;
      }

      const formatted = selectedAnswers.map((ans, i) => {
        let answerVal = ans;
        // In drag-and-drop, convert null/undefined unmatched items to empty string so backend primitive array parsing retains full scoring
        if (questions[i]?.type === "drag-drop" && Array.isArray(ans)) {
          answerVal = ans.map((v) => (v === null || v === undefined ? "" : v));
        }
        return {
          question_id: String(questions[i]?._id || questions[i]?.id),
          answer: answerVal,
        };
      });

      const { submission } = await submitQuiz({
        quizId: String(quizId),
        answers: formatted,
        time_spent: timeSpent,
        telemetry: {
          tabSwitches,
          blurDurationMs: currentBlurMs,
        },
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
  }, [selectedAnswers, questions, quizId, timeSpent, tabSwitches, blurDurationMs]);

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

  // Toggle multiple-select answer choice
  const handleToggleMultiSelect = useCallback((idx: number) => {
    setSelectedAnswers((prev) => {
      const currentList: number[] = Array.isArray(prev[currentQuestion])
        ? [...prev[currentQuestion]]
        : [];
      const existingPos = currentList.indexOf(idx);
      if (existingPos === -1) {
        currentList.push(idx);
      } else {
        currentList.splice(existingPos, 1);
      }
      currentList.sort((a, b) => a - b);
      const copy = [...prev];
      copy[currentQuestion] = currentList;
      return copy;
    });
  }, [currentQuestion]);

  // Drag-and-drop matching pair selection
  const handleSetDragDropPair = useCallback((itemIdx: number, matchIdx: number | null) => {
    setSelectedAnswers((prev) => {
      const q = questions[currentQuestion];
      const itemsCount = q?.dragItems?.items?.length || 0;
      const currentPairs: (number | null)[] = Array.isArray(prev[currentQuestion])
        ? [...prev[currentQuestion]]
        : new Array(itemsCount).fill(null);

      // If matchIdx is already assigned to another item, unassign it to ensure unique pairs
      if (matchIdx !== null) {
        for (let i = 0; i < currentPairs.length; i++) {
          if (i !== itemIdx && currentPairs[i] === matchIdx) {
            currentPairs[i] = null;
          }
        }
      }

      currentPairs[itemIdx] = matchIdx;
      const copy = [...prev];
      copy[currentQuestion] = currentPairs;
      return copy;
    });
  }, [currentQuestion, questions]);

  const handleToggleFlag = useCallback(() => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion]: !prev[currentQuestion],
    }));
  }, [currentQuestion]);

  // Keyboard Shortcuts (1-5 / A-E for MCQ options, Arrows for nav, F for flag)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const q = questions[currentQuestion];
      if (!q) return;

      const key = e.key.toUpperCase();

      if (key === "F") {
        e.preventDefault();
        handleToggleFlag();
        return;
      }

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

  const isAnswered = useCallback(
    (idx: number) => {
      const val = selectedAnswers[idx];
      if (val === null || val === undefined || val === "") return false;
      const q = questions[idx];
      if (q?.type === "multiple-select") {
        return Array.isArray(val) && val.length > 0;
      }
      if (q?.type === "drag-drop") {
        return Array.isArray(val) && val.some((v) => v !== null && v !== undefined && v !== "");
      }
      return true;
    },
    [questions, selectedAnswers]
  );

  const answeredCount = useMemo(
    () => questions.filter((_, idx) => isAnswered(idx)).length,
    [questions, isAnswered]
  );

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isSubmitting) return <CalculatingLoader />;
  if (loading || !quiz) return <DetailLoader />;

  // -------------------------------------------------------------
  // RESULTS VIEW (Pedagogical UI Review)
  // -------------------------------------------------------------
  if (showResults && review) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-16">
        <div className="max-w-4xl mx-auto pt-6 px-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/quizzes")}
            className="text-xs h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Quiz Catalog
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowResults(false);
              setCurrentQuestion(0);
              setSelectedAnswers(new Array(questions.length).fill(null));
              setFlaggedQuestions({});
              setTimeSpent(0);
              setTabSwitches(0);
              setBlurDurationMs(0);
              if (quiz.time_limit_sec) setRemainingSeconds(quiz.time_limit_sec);
            }}
            className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Retake Assessment
          </Button>
        </div>

        <QuizReview
          questions={review.questions || questions}
          userAnswers={selectedAnswers}
          score={review.score ?? 0}
          maxScore={review.maxScore || quiz.total_marks || questions.length}
          percent={
            typeof review.percent === "number"
              ? review.percent
              : questions.length > 0
              ? (review.score / questions.length) * 100
              : 0
          }
          timeSpent={timeSpent}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // FOCUS ARENA RUNNER VIEW
  // -------------------------------------------------------------
  const isTimeUrgent = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] dark:bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* 1. TOP FOCUS ARENA BAR (Minimal Header: 52px) */}
      <header className="h-13 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: Exit + Assessment Name */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitModal(true)}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 text-xs h-8 px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Exit
          </Button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-xs">
              {quiz.title}
            </span>
            {isPractice && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                Practice Mode
              </span>
            )}
          </div>
        </div>

        {/* Center: Countdown Timer & Integrity Cue */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-colors ${
              isTimeUrgent
                ? "bg-rose-100 text-rose-700 border border-rose-300 animate-pulse"
                : remainingSeconds !== null
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {remainingSeconds !== null
                ? formatSeconds(remainingSeconds)
                : formatSeconds(timeSpent)}
            </span>
          </div>

          {tabSwitches > 0 && (
            <span
              className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              title="Client integrity monitoring active"
            >
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              Focus Logged
            </span>
          )}
        </div>

        {/* Right: Flag Toggle + Finish Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFlag}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              flaggedQuestions[currentQuestion]
                ? "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300 font-semibold"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
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
            <kbd className="hidden md:inline text-[9px] px-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-400 font-mono">
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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-white dark:bg-slate-900">
        {/* LEFT COLUMN: Question Stimulus + KaTeX + Media Figure (Sticky & Scrollable) */}
        <section className="flex flex-col border-r border-slate-200/90 dark:border-slate-800 h-full overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {/* Question Metadata Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-100 dark:border-indigo-800">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px] capitalize">
                {activeQuestion?.type?.replace("-", " ") || "MCQ"}
              </span>
            </div>

            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {activeQuestion?.marks || 1} {activeQuestion?.marks === 1 ? "Mark" : "Marks"}
            </span>
          </div>

          {/* Question Body Text with KaTeX Formula Rendering */}
          <div className="space-y-4">
            <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
              <MathRenderer content={activeQuestion?.question} />
            </div>

            {/* Governing Mathematical Formula */}
            {activeQuestion?.formula && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                  Reference Formula
                </span>
                <MathRenderer content={activeQuestion.formula} block />
              </div>
            )}
          </div>

          {/* Question Media Figure (Zoomable) */}
          {activeQuestion?.image && (
            <div className="relative group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 overflow-hidden shadow-xs">
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

          {/* Keyboard Helper Hint */}
          <div className="mt-auto pt-6 text-[11px] text-slate-400 hidden md:flex items-center gap-3">
            <span>Shortcuts:</span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded font-mono">1-4</kbd> /{" "}
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded font-mono">A-D</kbd> select
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded font-mono">←</kbd>
              <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded font-mono">→</kbd> navigate
            </span>
          </div>
        </section>

        {/* RIGHT COLUMN: Interaction Controls Arena (6 Archetypes) */}
        <section className="flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-950 overflow-y-auto p-4 sm:p-8 justify-between scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activeQuestion?.type === "multiple-select"
                  ? "Select All That Apply"
                  : activeQuestion?.type === "drag-drop"
                  ? "Match Pairs"
                  : activeQuestion?.type === "slider"
                  ? "Adjust Slider"
                  : activeQuestion?.type === "numeric"
                  ? "Numerical Input"
                  : "Select Your Answer"}
              </span>

              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isAnswered(currentQuestion) ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Response Saved
                  </span>
                ) : (
                  "Pending input"
                )}
              </span>
            </div>

            {/* 1. MCQ ARCHETYPE */}
            {activeQuestion?.type === "mcq" && (
              <div className="space-y-2.5 sm:space-y-3">
                {activeQuestion.options?.map((optionText, idx) => {
                  const isSelected = selectedAnswers[currentQuestion] === idx;
                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`group flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                        }`}
                      >
                        {letter}
                      </span>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <MathRenderer
                          content={optionText}
                          className={isSelected ? "text-indigo-950 dark:text-indigo-100 font-semibold" : "text-slate-800 dark:text-slate-200"}
                        />
                      </div>

                      <div className="pt-1">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
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

            {/* 2. MULTIPLE-SELECT ARCHETYPE (Multi-Checkbox with selection count) */}
            {activeQuestion?.type === "multiple-select" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Multiple selections permitted
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800">
                    {Array.isArray(selectedAnswers[currentQuestion])
                      ? selectedAnswers[currentQuestion].length
                      : 0}{" "}
                    Selected
                  </span>
                </div>

                <div className="space-y-2.5">
                  {activeQuestion.options?.map((optionText, idx) => {
                    const currentSelectedList: number[] = Array.isArray(
                      selectedAnswers[currentQuestion]
                    )
                      ? selectedAnswers[currentQuestion]
                      : [];
                    const isChecked = currentSelectedList.includes(idx);
                    const letter = String.fromCharCode(65 + idx);

                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleMultiSelect(idx)}
                        className={`group flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {/* Checkbox Box */}
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <span className="text-xs font-mono font-bold text-slate-400 shrink-0 mt-0.5">
                          {letter}.
                        </span>

                        <div className="flex-1 min-w-0">
                          <MathRenderer
                            content={optionText}
                            className={isChecked ? "text-indigo-950 dark:text-indigo-100 font-semibold" : "text-slate-800 dark:text-slate-200"}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SLIDER ARCHETYPE (Smooth interactive slider with step & range tooltips) */}
            {activeQuestion?.type === "slider" && (() => {
              const minVal = activeQuestion.sliderRange?.min ?? 0;
              const maxVal = activeQuestion.sliderRange?.max ?? 100;
              const stepVal = activeQuestion.sliderRange?.step ?? 1;
              const isSet =
                selectedAnswers[currentQuestion] !== null &&
                selectedAnswers[currentQuestion] !== undefined;
              const currentVal = isSet ? Number(selectedAnswers[currentQuestion]) : minVal;

              return (
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Target Value
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Value:</span>
                      <span className="text-lg font-bold font-mono text-indigo-700 dark:text-indigo-300">
                        {isSet ? currentVal : "Unset"}
                      </span>
                    </div>
                  </div>

                  {/* Range Slider Container with Visual Fill */}
                  <div className="space-y-3 pt-2">
                    <div className="relative py-2">
                      <input
                        type="range"
                        min={minVal}
                        max={maxVal}
                        step={stepVal}
                        value={currentVal}
                        onChange={(e) => handleAnswerSelect(Number(e.target.value))}
                        className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                      <span>Min: {minVal}</span>
                      <span>Mid: {Math.round((minVal + maxVal) / 2)}</span>
                      <span>Max: {maxVal}</span>
                    </div>
                  </div>

                  {/* Micro Stepper Buttons & Selection Actions */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAnswerSelect(Math.max(minVal, currentVal - stepVal))
                        }
                        disabled={currentVal <= minVal}
                        className="text-xs h-8 px-3"
                      >
                        - {stepVal}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAnswerSelect(Math.min(maxVal, currentVal + stepVal))
                        }
                        disabled={currentVal >= maxVal}
                        className="text-xs h-8 px-3"
                      >
                        + {stepVal}
                      </Button>
                    </div>

                    {!isSet ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAnswerSelect(currentVal)}
                        className="text-xs h-8 px-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold cursor-pointer"
                      >
                        Confirm {currentVal}
                      </Button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAnswerSelect(null)}
                        className="text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        Reset Selection
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 4. NUMERIC ARCHETYPE (Precision STEM numerical input) */}
            {activeQuestion?.type === "numeric" && (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      STEM Numerical Precision Entry
                    </span>
                  </div>

                  {activeQuestion.tolerance !== undefined && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      Tolerance: ±{activeQuestion.tolerance}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 3.14159 or -42"
                      value={selectedAnswers[currentQuestion] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleAnswerSelect(val === "" ? null : val);
                      }}
                      className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />

                    {selectedAnswers[currentQuestion] !== null &&
                      selectedAnswers[currentQuestion] !== undefined && (
                        <button
                          type="button"
                          onClick={() => handleAnswerSelect(null)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title="Clear input"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal">
                    Accepts exact integers, floating point values, or standard scientific decimals.
                  </p>
                </div>
              </div>
            )}

            {/* 5. DRAG-DROP ARCHETYPE (Interactive Matching Pairs) */}
            {activeQuestion?.type === "drag-drop" && (() => {
              const items = activeQuestion.dragItems?.items || [];
              const matches = activeQuestion.dragItems?.matches || [];
              const currentPairs: (number | null)[] = Array.isArray(
                selectedAnswers[currentQuestion]
              )
                ? selectedAnswers[currentQuestion]
                : new Array(items.length).fill(null);

              const pairedCount = currentPairs.filter(
                (v) => v !== null && v !== undefined
              ).length;

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Pair Corresponding Items
                      </span>
                    </div>

                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800">
                      {pairedCount} of {items.length} Matched
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((itemLabel, itemIdx) => {
                      const selectedMatchIdx = currentPairs[itemIdx];

                      return (
                        <div
                          key={itemIdx}
                          className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                              Item {itemIdx + 1}
                            </span>
                            {selectedMatchIdx !== null && selectedMatchIdx !== undefined && (
                              <button
                                type="button"
                                onClick={() => handleSetDragDropPair(itemIdx, null)}
                                className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                Disconnect
                              </button>
                            )}
                          </div>

                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            <MathRenderer content={itemLabel} />
                          </div>

                          <div className="pt-1 flex items-center gap-2">
                            <MoveRight className="w-4 h-4 text-slate-400 shrink-0" />
                            <select
                              value={
                                selectedMatchIdx !== null && selectedMatchIdx !== undefined
                                  ? selectedMatchIdx
                                  : ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                handleSetDragDropPair(
                                  itemIdx,
                                  val === "" ? null : Number(val)
                                );
                              }}
                              className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="">— Select Target Match —</option>
                              {matches.map((m, mIdx) => (
                                <option key={mIdx} value={mIdx}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 6. FILL-BLANK ARCHETYPE (STEM Input) */}
            {activeQuestion?.type === "fill-blank" && (
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                  Textual / Symbolic Response
                </span>
                <input
                  type="text"
                  placeholder="Type your response here..."
                  value={selectedAnswers[currentQuestion] || ""}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-400">
                  Case-insensitive exact matching applied upon submission.
                </p>
              </div>
            )}

            {/* 7. TRUE / FALSE ARCHETYPE */}
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
                      className={`p-6 rounded-2xl border text-center font-bold text-base transition-all ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
              disabled={currentQuestion === 0}
              className="text-xs h-9 px-4 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
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
      <footer className="h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-20 pb-[max(0rem,env(safe-area-inset-bottom))]">
        {/* Left: Progress Summary */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="text-slate-600 dark:text-slate-400">
              Answered: <strong className="text-slate-900 dark:text-slate-200">{answeredCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-600 dark:text-slate-400">
              Flagged:{" "}
              <strong className="text-slate-900 dark:text-slate-200">
                {Object.values(flaggedQuestions).filter(Boolean).length}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-600 dark:text-slate-400">
              Remaining:{" "}
              <strong className="text-slate-900 dark:text-slate-200">{questions.length - answeredCount}</strong>
            </span>
          </div>
        </div>

        {/* Center: Scrollable Palette Numbers */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 w-full sm:w-auto max-w-full sm:max-w-md lg:max-w-xl scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {questions.map((_, idx) => {
            const isCurrent = idx === currentQuestion;
            const answered = isAnswered(idx);
            const flagged = flaggedQuestions[idx];

            let stateClass = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700";
            if (flagged) {
              stateClass = "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-400 font-bold";
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
          <span className="text-xs text-slate-500 dark:text-slate-400">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Finish and Submit Assessment?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are about to submit your responses for evaluation.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900 dark:text-white">{questions.length}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Answered:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Unanswered:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-100 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Exit Assessment?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your current progress may be lost.</p>
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
