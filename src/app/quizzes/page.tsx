// app/quizzes/page.tsx (QuizListingPage)
"use client";

import { useEffect, useMemo, useState, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import { CatalogFilterBar } from "@/components/catalog/CatalogFilterBar";
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import QuizCard from "@/components/ui/quiz/quiz-card";
import { Button } from "@/components/dev/button";

import {
  Users,
  Clock3,
  Percent,
  Play,
  Trophy,
  UserRound,
  CheckCircle2,
  XCircle,
  Minus,
  ChevronDown,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dev/dropdown-menu";

import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useChallenges } from "@/hooks/useChallenges";
import { getAllQuizzesForPlay, type QuizForPlay } from "@/services/quizService";
import type { QuizMetadata } from "@/types/quiz";
import { siteConfig, pagesConfig } from "@/lib/site-config";
import EditableContent from "@/components/admin/editable-content";
import { useCustomization } from "@/context/CustomizationContext";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

/** Map backend quiz to UI metadata */
function toQuizMetadata(q: QuizForPlay): QuizMetadata {
  const questions = q.questions ?? [];
  const qCount = questions.length > 0 ? questions.length : (Number(q.question_count) || 0);
  const totalMarks =
    Number(q.total_marks) > 0
      ? Number(q.total_marks)
      : questions.length > 0
      ? questions.reduce((s, it: any) => s + (Number(it?.marks) || 1), 0)
      : (qCount > 0 ? qCount * 5 : 25);
  const timeLimit =
    Number(q.time_limit_sec) > 0
      ? Number(q.time_limit_sec)
      : (qCount > 0 ? qCount * 120 : 600);

  return {
    id: q._id,
    _id: q._id,
    title: q.title,
    description: q.instructions,
    subject: q.subject ?? "General",
    grade: q.grade ?? "N/A",
    difficulty: q.difficulty,
    time_limit_sec: timeLimit,
    question_count: qCount,
    total_marks: totalMarks,
    class_id: q.class_id,
    created_at: q.created_at,
    is_active: q.is_active ?? true,
    matchmaking_enabled: q.matchmaking_enabled ?? false,
    async_enabled: q.async_enabled ?? false,
    questions,
  };
}

// ---------- Filter Dropdown ----------
const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
}: {
  label: ReactNode;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="outline"
        className="h-9 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white/80"
      >
        {label}: {options.find((opt) => opt.value === value)?.label || value}
        <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-48">
      {options.map((option) => (
        <DropdownMenuItem
          key={option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

// ---------- Stat Card ----------
function StatCard({
  label,
  value,
  icon: Icon,
  onClick,
  active,
}: {
  label: ReactNode;
  value: string | number;
  icon: React.ComponentType<any>;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border bg-white/90 backdrop-blur-sm shadow-2xs px-4 py-3 flex items-center gap-3 transition-all ${
        active
          ? "ring-2 ring-indigo-500 shadow-xs border-indigo-200"
          : "hover:border-slate-300 hover:shadow-xs"
      }`}
    >
      <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="text-left min-w-0">
        <div className="text-lg sm:text-xl font-bold text-slate-900 leading-tight truncate">
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 truncate">{label}</div>
      </div>
    </button>
  );
}

type FilterKey = "pending" | "opponents" | null;

export default function QuizListingPage() {
  const router = useRouter();
  const { user, isTeacher } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [rawQuizzes, setRawQuizzes] = useState<QuizForPlay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const searchParams = useSearchParams();
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  useEffect(() => {
    const s = searchParams.get("subject");
    const g = searchParams.get("grade");
    if (s) setSubjectFilter(s);
    if (g) setGradeFilter(g);
  }, [searchParams]);

  const updateParams = (subject: string, grade: string) => {
    setSubjectFilter(subject);
    setGradeFilter(grade);
    const newParams = new URLSearchParams();
    if (subject !== "all") newParams.set("subject", subject);
    if (grade !== "all") newParams.set("grade", grade);
    router.push(`/quizzes?${newParams.toString()}`, { scroll: false });
  };

  // Fetch quizzes for everyone (guests + logged-in)
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllQuizzesForPlay();
        setRawQuizzes(data);
      } catch (err) {
        console.error("Failed to load quizzes", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { grades, subjects } = useCustomization();

  const quickGradeOptions = useMemo(() => {
    const activeGrades = (grades || []).filter((g: any) => g.is_active !== false);
    const sorted = [...activeGrades].sort((a: any, b: any) => {
      const numA = typeof a.level === "number" ? a.level : parseInt((a.name || "").replace(/\D/g, ""), 10) || 0;
      const numB = typeof b.level === "number" ? b.level : parseInt((b.name || "").replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
    return [
      { value: "all", label: "All Grades" },
      ...sorted.map((g: any) => {
        const clean = (g.name || "").replace(/^grade\s*/i, "").trim() || g.name;
        return {
          value: clean,
          label: g.name.toLowerCase().startsWith("grade") ? g.name : `Grade ${g.name}`,
        };
      }),
    ];
  }, [grades]);

  const quizzes: QuizMetadata[] = useMemo(
    () =>
      rawQuizzes.map((q) => {
        const meta = toQuizMetadata(q);
        return {
          ...meta,
          subject: formatSubjectName(q.subject, subjects),
          grade: formatGradeName(q.grade, grades),
        };
      }),
    [rawQuizzes, grades, subjects]
  );

  const allSubjects = useMemo(() => {
    const map = new Map<string, string>();
    quizzes.forEach((q) => {
      const s = formatSubjectName(q.subject, subjects);
      if (s && s !== "Subject" && s !== "General") map.set(s.toLowerCase(), s);
    });
    subjects.forEach((s) => {
      if (s.name) map.set(s.name.toLowerCase(), s.name);
    });
    return [
      { value: "all", label: "All Subjects" },
      ...Array.from(map.entries()).map(([value, label]) => ({
        value,
        label,
      })),
    ];
  }, [quizzes, subjects]);

  const allGrades = useMemo(() => {
    return quickGradeOptions;
  }, [quickGradeOptions]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      let matchSubject = true;
      if (subjectFilter !== "all") {
        const sLow = (q.subject || "").toLowerCase();
        const fLow = subjectFilter.toLowerCase();
        matchSubject =
          sLow === fLow || sLow.includes(fLow) || fLow.includes(sLow);
      }

      let matchGrade = true;
      if (gradeFilter !== "all") {
        const cleanFilter = gradeFilter.replace(/^grade\s*/i, "").trim().toLowerCase();
        const cleanQGrade = (q.grade || "").replace(/^grade\s*/i, "").trim().toLowerCase();
        matchGrade =
          cleanQGrade === cleanFilter ||
          (q.grade || "").toLowerCase() === gradeFilter.toLowerCase();
      }

      return matchSubject && matchGrade;
    });
  }, [quizzes, subjectFilter, gradeFilter]);

  // Challenges only for logged-in users
  const {
    buckets,
    stats,
    loading: chLoading,
  } = useChallenges({
    enabled: !!user?._id,
    userId: user?._id,
    pollMs: 20000,
  });

  const [active, setActive] = useState<FilterKey>(null);
  const [showH2H, setShowH2H] = useState(false);

  const filteredList = useMemo(() => {
    if (active === "pending") return buckets?.queuedIncoming ?? [];
    if (active === "opponents") return buckets?.queuedOutgoing ?? [];
    return [];
  }, [active, buckets]);

  const headToHead = useMemo(() => {
    const list = (buckets?.completed ?? []).map((m: any) => {
      const youAreP1 = m?.p1_id?._id?.toString?.() === user?._id;
      const opponent = youAreP1 ? m?.p2_id : m?.p1_id;
      const yourPct = youAreP1 ? m?.p1_score_pct : m?.p2_score_pct;
      const oppPct = youAreP1 ? m?.p2_score_pct : m?.p1_score_pct;
      const yourTime = youAreP1 ? m?.p1_time_ms : m?.p2_time_ms;
      const oppTime = youAreP1 ? m?.p2_time_ms : m?.p1_time_ms;

      let result: "W" | "L" | "T" = "T";
      if (typeof m?.winner === "string") {
        result = m.winner === user?._id ? "W" : "L";
      } else if (m?.winner?._id) {
        result = m.winner._id.toString() === user?._id ? "W" : "L";
      } else {
        if (yourPct > oppPct) result = "W";
        else if (oppPct > yourPct) result = "L";
        else if ((yourTime ?? 0) < (oppTime ?? 0)) result = "W";
        else if ((oppTime ?? 0) < (yourTime ?? 0)) result = "L";
        else result = "T";
      }

      return {
        id: m._id,
        quizTitle: m?.quiz_id?.title ?? "Untitled quiz",
        opponentName: opponent?.full_name ?? "Unknown",
        opponentEmail: opponent?.email ?? "",
        result,
        yourPct: Number(yourPct ?? 0),
        oppPct: Number(oppPct ?? 0),
        yourTime: Math.round((yourTime ?? 0) / 1000),
        oppTime: Math.round((oppTime ?? 0) / 1000),
        completedAt: m?.completed_at ? new Date(m.completed_at) : null,
      };
    });

    return list.sort(
      (a, b) =>
        (b.completedAt?.getTime?.() ?? 0) - (a.completedAt?.getTime?.() ?? 0)
    );
  }, [buckets?.completed, user?._id]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 sm:space-y-7 pb-12">
        <SectionHeader
          title={
            <EditableContent
              configKey="pages.quizzes.header.title"
              initialValue={pagesConfig.quizzes.header.title}
            />
          }
          description={
            <EditableContent
              configKey="pages.quizzes.header.description"
              initialValue={pagesConfig.quizzes.header.description}
            />
          }
          icon={pagesConfig.quizzes.header.icon}
          actions={
            isTeacher ? (
              <Button
                onClick={() => router.push("/admin/quizzes/add")}
                className="h-9 px-4 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create Quiz
              </Button>
            ) : undefined
          }
        />

        <CatalogFilterBar
          subjectFilter={subjectFilter}
          onSubjectFilterChange={(val) => updateParams(val, gradeFilter)}
          subjectOptions={allSubjects}
          subjectLabel={
            <EditableContent
              configKey="pages.quizzes.filters.subject.label"
              initialValue={pagesConfig.quizzes.filters.subject.label}
            />
          }
          gradeFilter={gradeFilter}
          onGradeFilterChange={(val) => updateParams(subjectFilter, val)}
          gradeOptions={allGrades}
          gradeLabel={
            <EditableContent
              configKey="pages.quizzes.filters.grade.label"
              initialValue={pagesConfig.quizzes.filters.grade.label}
            />
          }
          quickGradeOptions={quickGradeOptions}
          onClearAll={() => updateParams("all", "all")}
          sheetTitle="Filter Quizzes"
        />

        <CardSection
          title={
            <EditableContent
              configKey="pages.quizzes.challenges.title"
              initialValue={pagesConfig.quizzes.challenges.title}
            />
          }
          icon={pagesConfig.quizzes.challenges.icon}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label={
                <EditableContent
                  configKey="pages.quizzes.labels.pendingInvites"
                  initialValue={pagesConfig.quizzes.labels.pendingInvites}
                />
              }
              value={chLoading ? "…" : stats?.pendingInvites ?? 0}
              icon={Users}
              onClick={() =>
                setActive((prev) => (prev === "pending" ? null : "pending"))
              }
              active={active === "pending"}
            />
            <StatCard
              label={
                <EditableContent
                  configKey="pages.quizzes.labels.opponentInvites"
                  initialValue={pagesConfig.quizzes.labels.opponentInvites}
                />
              }
              value={chLoading ? "…" : stats?.opponentsInvites ?? 0}
              icon={Clock3}
              onClick={() =>
                setActive((prev) => (prev === "opponents" ? null : "opponents"))
              }
              active={active === "opponents"}
            />
            <StatCard
              label={
                <EditableContent
                  configKey="pages.quizzes.labels.winRate"
                  initialValue={pagesConfig.quizzes.labels.winRate}
                />
              }
              value={
                chLoading
                  ? "…"
                  : (stats?.wins ?? 0) + (stats?.losses ?? 0) > 0
                  ? `${stats?.winRatePct ?? 0}%`
                  : "—"
              }
              icon={Percent}
              onClick={() => setShowH2H((v) => !v)}
              active={showH2H}
            />
          </div>

          <AnimatePresence initial={false}>
            {active && (
              <motion.div
                key={active}
                initial={{ height: 0, opacity: 0, y: -6 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 240, damping: 24 }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border bg-white/80 backdrop-blur-sm shadow-sm p-4 mt-4">
                  <div className="font-semibold text-slate-900 mb-3">
                    {active === "pending" ? (
                      <EditableContent
                        configKey="pages.quizzes.labels.pendingInvitesTitle"
                        initialValue={pagesConfig.quizzes.labels.pendingInvitesTitle}
                      />
                    ) : (
                      <EditableContent
                        configKey="pages.quizzes.labels.opponentInvitesTitle"
                        initialValue={pagesConfig.quizzes.labels.opponentInvitesTitle}
                      />
                    )}
                  </div>

                  {chLoading ? (
                    <div className="space-y-2 py-2">
                      <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                      <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                    </div>
                  ) : filteredList.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      <EditableContent
                        configKey="pages.quizzes.labels.noMatches"
                        initialValue={pagesConfig.quizzes.labels.noMatches}
                      />
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {filteredList.map((m: any) => {
                        const quiz = m?.quiz_id;
                        const p1 = m?.p1_id;
                        const p2 = m?.p2_id;
                        return (
                          <li
                            key={m._id}
                            className="py-3 flex items-center justify-between"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">
                                {quiz?.title ?? "Untitled quiz"}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <UserRound className="w-3.5 h-3.5" />
                                <span className="truncate">
                                  {(p1?.full_name ?? p1) +
                                    " → " +
                                    (p2?.full_name ?? p2)}
                                </span>
                              </div>
                            </div>
                            {quiz?._id && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  router.push(`/quizzes/${quiz._id}`)
                                }
                                className="ml-3 flex items-center gap-1"
                              >
                                <Play className="w-4 h-4" />
                                <Play className="w-4 h-4" />
                                <EditableContent
                                  configKey="pages.quizzes.labels.play"
                                  initialValue={pagesConfig.quizzes.labels.play}
                                />
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showH2H && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
              >
                <div
                  className="absolute inset-0 bg-black/30"
                  onClick={() => setShowH2H(false)}
                />
                <motion.div
                  initial={{ y: 40, scale: 0.98, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: 40, scale: 0.98, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 26 }}
                  className="relative z-10 w-[95%] sm:w-[720px] max-h-[80vh] overflow-hidden rounded-2xl border bg-white shadow-2xl"
                >
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <EditableContent
                        configKey="pages.quizzes.labels.winRateHistory"
                        initialValue={pagesConfig.quizzes.labels.winRateHistory}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowH2H(false)}
                    >
                      <EditableContent
                        configKey="pages.quizzes.labels.close"
                        initialValue={pagesConfig.quizzes.labels.close}
                      />
                    </Button>
                  </div>

                  <div className="p-4 overflow-y-auto max-h-[calc(80vh-56px)]">
                    {chLoading ? (
                      <div className="space-y-2 py-2">
                        <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" />
                        <div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" />
                      </div>
                    ) : (buckets?.completed?.length ?? 0) === 0 ? (
                      <div className="text-sm text-slate-600">
                        <EditableContent
                          configKey="pages.quizzes.labels.noCompletedChallenges"
                          initialValue={pagesConfig.quizzes.labels.noCompletedChallenges}
                        />
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {/** headToHead built above */}
                        {headToHead.map((row) => (
                          <motion.li
                            key={row.id}
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="rounded-xl border bg-slate-50/60 p-3 flex items-center justify-between"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {row.quizTitle}
                              </div>
                              <div className="text-xs text-slate-600 mt-0.5">
                                vs {row.opponentName}
                                {row.completedAt
                                  ? ` • ${row.completedAt.toLocaleDateString()}`
                                  : ""}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                You {Math.round(row.yourPct)}% ({row.yourTime}s)
                                • Them {Math.round(row.oppPct)}% ({row.oppTime}
                                s)
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {row.result === "W" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-semibold">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <EditableContent
                                    configKey="pages.quizzes.labels.win"
                                    initialValue={pagesConfig.quizzes.labels.win}
                                  />
                                </span>
                              )}
                              {row.result === "L" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs font-semibold">
                                  <XCircle className="w-4 h-4" />
                                  <EditableContent
                                    configKey="pages.quizzes.labels.loss"
                                    initialValue={pagesConfig.quizzes.labels.loss}
                                  />
                                </span>
                              )}
                              {row.result === "T" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-semibold">
                                  <Minus className="w-4 h-4" />
                                  <EditableContent
                                    configKey="pages.quizzes.labels.tie"
                                    initialValue={pagesConfig.quizzes.labels.tie}
                                  />
                                </span>
                              )}
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardSection>

        <CardSection
          title={
            <EditableContent
              configKey="pages.quizzes.all.title"
              initialValue={pagesConfig.quizzes.all.title}
            />
          }
          icon={pagesConfig.quizzes.all.icon}
        >
          {loading ? (
            <SectionLoader />
          ) : filteredQuizzes.length === 0 ? (
            <ClayEmptyState
              illustration={CLAY_ASSETS.emptyQuizzesZero}
              title={pagesConfig.quizzes.labels.noQuizzes}
              description="No quizzes matching the selected criteria. Try adjusting your grade level or subject filters."
              action={
                (gradeFilter !== "all" || subjectFilter !== "all")
                  ? {
                      label: "Reset Filters",
                      onClick: () => updateParams("all", "all"),
                      variant: "outline",
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz as any} />
              ))}
            </div>
          )}
        </CardSection>
      </div>
  );
}
