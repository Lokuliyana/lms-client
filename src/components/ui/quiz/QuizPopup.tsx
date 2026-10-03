// src/components/ui/quiz/QuizPopup.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, startTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Timer,
  BookOpen,
  Crown,
  Medal,
  Award,
  Users,
  Search,
  LineChart,
  Share2,
  Copy,
  CheckCheck,
  Trophy,
  Sparkles,
  Star,
  Play,
  X,
  Target,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/dev/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  createChallenge,
  getFriendList,
  getLeaderboard,
  getQuizByIdForPlay,
  getStudentPerformance,
} from "@/services/quizService";
import type { LucideIcon } from "lucide-react";

export type Quiz = {
  id: string;
  title: string;
  icon?: LucideIcon;
  color?: string;
  questions: number;
  difficulty?: "easy" | "medium" | "hard";
  timeLimitSec?: number;
  duration?: string;
  totalMarks?: number;
};

type Friend = {
  _id: string;
  full_name: string;
  profile?: { grade?: string; school?: string };
};

type TopRow = { name?: string; averageScore?: number; elo?: number };
type Attempt = { id: string; score: number; timeSpent: number; date: string };

export type GameQuizPopupProps = {
  quiz: Quiz;
  trigger: React.ReactNode;
  onPractice?: () => void;
  onStart?: (quizId: string, matchId?: string) => void;
  initialFriends?: Friend[];
  initialTopRows?: TopRow[];
  initialAttempts?: Attempt[];
  demo?: boolean;
  showInviteCode?: boolean;
};

const cap = (s?: string) => (s ?? "").replace(/^\w/, (c) => c.toUpperCase());
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

const toMmSs = (sec?: number) =>
  !sec || sec <= 0 ? null : `${Math.floor(sec / 60)}m ${sec % 60}s`;

const diffBadge = (d?: string) => {
  const diff = (d || "").toLowerCase();
  if (diff.includes("hard")) return "bg-rose-50 text-rose-700 border-rose-200";
  if (diff.includes("medium")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

export default function GameQuizPopup({
  quiz,
  trigger,
  onPractice,
  onStart,
  initialFriends,
  initialTopRows,
  initialAttempts,
  showInviteCode = false,
}: GameQuizPopupProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"overview" | "leaderboard" | "challenge">("overview");

  // Data
  const [friends, setFriends] = useState<Friend[]>(initialFriends ?? []);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [topRows, setTopRows] = useState<TopRow[]>(initialTopRows ?? []);
  const [topLoading, setTopLoading] = useState(false);
  const [specQuestions, setSpecQuestions] = useState<number>(quiz.questions || 0);
  const [specTimeLimitSec, setSpecTimeLimitSec] = useState<number | undefined>(quiz.timeLimitSec);
  const [maxPoints, setMaxPoints] = useState<number | null>(quiz.totalMarks ?? (quiz.questions > 0 ? quiz.questions * 5 : null));
  const [attempts, setAttempts] = useState<Attempt[]>(initialAttempts ?? []);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  // Sync state if quiz prop changes
  useEffect(() => {
    if (quiz.questions !== undefined) setSpecQuestions(quiz.questions);
    if (quiz.timeLimitSec !== undefined) setSpecTimeLimitSec(quiz.timeLimitSec);
    if (quiz.totalMarks !== undefined) setMaxPoints(quiz.totalMarks);
  }, [quiz.questions, quiz.timeLimitSec, quiz.totalMarks]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  // Load Drawer Data when Opened
  useEffect(() => {
    if (!open) return;
    let mounted = true;

    // 1. Fetch Leaderboard with 3s fallback to prevent infinite "Loading..."
    const fetchLeaderboard = async () => {
      setTopLoading(true);
      const timer = setTimeout(() => {
        if (mounted) setTopLoading(false);
      }, 3000);

      try {
        const res = await getLeaderboard({
          scope_type: "quiz",
          scope_id: quiz.id,
          window: "lifetime",
          metric: "average_score",
          limit: 10,
        });
        clearTimeout(timer);
        if (mounted) {
          setTopRows(
            (res?.results || []).map((r: any) => ({
              name: r.name,
              averageScore: r.averageScore,
              elo: r.elo,
            }))
          );
        }
      } catch {
        clearTimeout(timer);
        if (mounted) setTopRows([]);
      } finally {
        if (mounted) setTopLoading(false);
      }
    };

    // 2. Fetch Quiz specs / points
    const fetchQuizSpecs = async () => {
      try {
        const qz = await getQuizByIdForPlay(quiz.id);
        const count = qz?.question_count ?? (Array.isArray(qz?.questions) ? qz.questions.length : quiz.questions);
        const timeLimit = qz?.time_limit_sec ?? quiz.timeLimitSec;
        const pts = Array.isArray(qz?.questions) && qz.questions.length > 0
          ? qz.questions.reduce((s: number, it: any) => s + (Number(it?.marks) || 1), 0)
          : (qz?.total_marks || quiz.totalMarks || (count > 0 ? count * 5 : 25));
        if (mounted) {
          if (count !== undefined && count !== null) setSpecQuestions(Number(count) || 0);
          if (timeLimit !== undefined && timeLimit !== null) setSpecTimeLimitSec(Number(timeLimit) || 0);
          setMaxPoints(pts);
        }
      } catch {
        if (mounted) {
          setMaxPoints(quiz.totalMarks ?? (quiz.questions > 0 ? quiz.questions * 5 : 25));
        }
      }
    };

    // 3. Fetch Student's own previous attempts
    const fetchAttempts = async () => {
      setAttemptsLoading(true);
      try {
        const me = await getStudentPerformance({ userId: "" as any });
        const list: any[] = Array.isArray(me?.submissions) ? me.submissions : [];
        if (mounted) {
          setAttempts(
            list.map((it) => ({
              id: String(it.id),
              score: Number(it.score) || 0,
              timeSpent: Number(it.timeSpent) || 0,
              date: String(it.date),
            }))
          );
        }
      } catch {
        if (mounted) setAttempts([]);
      } finally {
        if (mounted) setAttemptsLoading(false);
      }
    };

    // 4. Friends list for challenge
    const fetchFriends = async () => {
      setFriendsLoading(true);
      try {
        const res = await getFriendList({ limit: 12 });
        if (mounted) setFriends(res?.results || []);
      } catch {
        if (mounted) setFriends([]);
      } finally {
        if (mounted) setFriendsLoading(false);
      }
    };

    fetchLeaderboard();
    fetchQuizSpecs();
    fetchAttempts();
    fetchFriends();

    return () => {
      mounted = false;
    };
  }, [open, quiz.id, quiz.questions, quiz.totalMarks]);

  // Calculations for Student attempts
  const { latestAttempt, bestScorePct } = useMemo(() => {
    if (!attempts.length) return { latestAttempt: null, bestScorePct: null };
    const sorted = [...attempts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const best = Math.max(...attempts.map((a) => a.score));
    const denom = quiz.questions > 0 ? quiz.questions : 1;
    return {
      latestAttempt: sorted[0],
      bestScorePct: Math.round((best / denom) * 100),
    };
  }, [attempts, quiz.questions]);

  // Navigate Actions
  const handleStartReal = () => {
    setOpen(false);
    if (onStart) {
      onStart(quiz.id);
    } else {
      router.push(`/quizzes/${quiz.id}/take`);
    }
  };

  const handleStartPractice = () => {
    setOpen(false);
    if (onPractice) {
      onPractice();
    } else {
      router.push(`/quizzes/${quiz.id}/take?mode=practice`);
    }
  };

  const handleChallengeFriend = async (f: Friend) => {
    try {
      setLoading(true);
      setError(null);
      const res = await createChallenge({
        quizId: quiz.id,
        opponentId: f._id,
      });
      if (res?.match?._id) {
        setInviteId(res.match._id);
        router.push(`/quizzes/${quiz.id}/take?challenge=${res.match._id}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to challenge user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Click Trigger */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="w-full"
      >
        {trigger}
      </div>

      {/* Centered Modal Overlay on Desktop / Slide-up Bottom Sheet on Mobile via React Portal */}
      {mounted && open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Opaque Backdrop Scrim */}
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={() => setOpen(false)}
              />

          {/* Modal / Bottom Sheet Content */}
          <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
              {/* 1. TOP HEADER: Specs & Rubric */}
              <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${diffBadge(
                          quiz.difficulty
                        )}`}
                      >
                        {cap(quiz.difficulty || "standard")}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Pre-Flight Brief</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 leading-snug tracking-tight">
                      {quiz.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Specs Strip */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/80">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Questions
                    </span>
                    <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      {specQuestions}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Time Limit
                    </span>
                    <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                      <Timer className="w-3.5 h-3.5 text-indigo-600" />
                      {specTimeLimitSec ? toMmSs(specTimeLimitSec) : quiz.duration || "Unlimited"}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Max Points
                    </span>
                    <span className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      {maxPoints !== null && maxPoints > 0 ? maxPoints : (specQuestions > 0 ? specQuestions * 5 : 25)}
                    </span>
                  </div>
                </div>
              </div>

              {/* TAB SELECTOR */}
              <div className="flex border-b border-slate-200 bg-white px-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-colors ${
                    activeTab === "overview"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Your History
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("leaderboard")}
                  className={`py-3 text-xs font-semibold border-b-2 mr-6 transition-colors ${
                    activeTab === "leaderboard"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Top Performers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("challenge")}
                  className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === "challenge"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Challenge a Peer
                </button>
              </div>

              {/* 2. DRAWER BODY */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
                {/* TAB: OVERVIEW / STUDENT PREVIOUS ATTEMPTS */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Your Prior Performance
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Personal Best
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-slate-900">
                            {bestScorePct !== null ? `${bestScorePct}%` : "—"}
                          </span>
                          {bestScorePct !== null && (
                            <span className="text-xs text-emerald-600 font-semibold">recorded</span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                        <span className="text-[11px] font-medium text-slate-500 block mb-1">
                          Total Attempts
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-slate-900">
                            {attempts.length}
                          </span>
                          <span className="text-xs text-slate-400">runs</span>
                        </div>
                      </div>
                    </div>

                    {latestAttempt && (
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                        <span className="text-slate-400 font-medium">Most Recent Run:</span>
                        <div className="flex justify-between items-center text-slate-700">
                          <span>{new Date(latestAttempt.date).toLocaleDateString()}</span>
                          <span className="font-semibold text-indigo-700">
                            Score: {latestAttempt.score} pts
                          </span>
                        </div>
                      </div>
                    )}

                    {!attempts.length && !attemptsLoading && (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                        <p className="text-xs text-slate-500">
                          You haven't attempted this assessment yet. Ready for your first attempt?
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: LEADERBOARD (Non-blocking, fixes infinite loading) */}
                {activeTab === "leaderboard" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Top Rankers
                      </h3>
                      {topLoading && (
                        <span className="text-[11px] text-slate-400 animate-pulse">Syncing...</span>
                      )}
                    </div>

                    {topLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="h-12 w-full bg-slate-100 rounded-xl animate-pulse"
                          />
                        ))}
                      </div>
                    ) : topRows.length > 0 ? (
                      <div className="space-y-2">
                        {topRows.slice(0, 5).map((row, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white"
                          >
                            <span className="w-5 text-center font-bold text-xs text-slate-400">
                              #{i + 1}
                            </span>
                            <Avatar className="h-8 w-8 ring-1 ring-slate-200">
                              <AvatarFallback className="bg-indigo-600 text-white text-xs">
                                {initials(row.name || "St")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {row.name || "Anonymous Student"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Rating: {row.elo ?? 1200} ELO
                              </p>
                            </div>
                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {typeof row.averageScore === "number"
                                ? `${Math.round(row.averageScore)}%`
                                : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-1">
                        <Trophy className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="text-xs font-medium text-slate-700">No ranked attempts yet</p>
                        <p className="text-[11px] text-slate-400">
                          Complete your attempt to claim rank #1 on the leaderboard.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: CHALLENGE A PEER */}
                {activeTab === "challenge" && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Select Opponent
                    </h3>

                    <div className="space-y-2">
                      {friends.slice(0, 5).map((f) => (
                        <div
                          key={f._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                                {initials(f.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-slate-800">
                              {f.full_name}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChallengeFriend(f)}
                            disabled={loading}
                            className="text-xs h-7 px-3"
                          >
                            Duel
                          </Button>
                        </div>
                      ))}

                      {friends.length === 0 && !friendsLoading && (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                          <p className="text-xs text-slate-500">No peers currently online.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. BOTTOM ACTIONS: STRICT BUTTON HIERARCHY */}
              <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/80 space-y-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {/* Solid Indigo Primary: Start Real Attempt */}
                <Button
                  variant="primary"
                  size="default"
                  onClick={handleStartReal}
                  className="w-full h-11 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Start Real Attempt
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>

                {/* Outline Secondary: Practice Mode */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleStartPractice}
                  className="w-full h-10 text-xs font-semibold text-slate-700 border-slate-300 bg-white hover:bg-slate-100"
                >
                  Practice Mode (Untimed & Ungraded)
                </Button>
              </div>
            </div>
        </div>,
        document.body
      )
    : null}
    </>
  );
}
