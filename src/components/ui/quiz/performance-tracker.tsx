"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/dev/card";
import { Button } from "@/components/dev/button";
import { Badge } from "@/components/dev/badge";
import { Input } from "@/components/dev/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/dev/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dev/dropdown-menu";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Target,
  Award,
  ChevronDown,
  Eye,
  Star,
  Zap,
  Activity,
  Calculator,
  Atom,
  BookOpen,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { SectionHeader } from "@/components/reusable/section-header";
import { getTeacherUserPerformance } from "@/services/quizService";
import type {
  PerformanceTrackerProps,
  QuizAttempt,
  UserPerformanceComparison,
} from "@/types/quiz";
import { siteConfig, pagesConfig } from "@/lib/site-config";
import EditableContent from "@/components/admin/editable-content";

/* ============================
 * Helpers
 * ============================ */

/** Derive percent if API didn't send one. */
function derivePercent(a: QuizAttempt): number {
  // If totalQuestions exists and score looks like raw-correct-count:
  if (typeof a.totalQuestions === "number" && a.totalQuestions > 0) {
    const raw = Number(a.score) || 0;
    return clampPct((raw / a.totalQuestions) * 100);
  }
  // If score already looks like a percent (<= 100), use it:
  if (a.score <= 100) return clampPct(a.score);
  // Fallback clamp:
  return clampPct(a.score);
}

const clampPct = (n: number) =>
  Math.max(0, Math.min(100, Math.round(n)));

const mins = (secOrMin?: number) =>
  `${Math.round(Number(secOrMin) || 0)}m`;

const subjectBadge = (subject?: string) =>
  (subject || "").toLowerCase() === "math"
    ? "bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-full"
    : "bg-purple-50 text-purple-700 border-purple-200 px-3 py-1 rounded-full";

const dateKey = (d: Date | string) => format(new Date(d), "yyyy-MM-dd");

/* ============================
 * Sub-Component: TeacherPerformanceView
 * ============================ */

const TeacherStatCard = ({
  title,
  data,
  isHighlight = false,
}: {
  title: string;
  data: any;
  isHighlight?: boolean;
}) => (
  <div
    className={`p-6 rounded-xl border ${
      isHighlight ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100"
    } shadow-sm`}
  >
    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
      {title}
    </h3>
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <span className="text-3xl font-bold text-slate-900">
          {data.avg_percent}%
        </span>
        <span className="text-xs text-slate-500 mb-1">Avg Score</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Max: {data.max_percent}%</span>
        <span className="text-slate-400">{data.count} Quizzes</span>
      </div>
    </div>
  </div>
);

const TeacherPerformanceView = ({ userId }: { userId: string }) => {
  const [stats, setStats] = useState<UserPerformanceComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getTeacherUserPerformance(userId);
        setStats(data);
      } catch (err) {
        setError("Failed to load performance data");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">
        Loading performance metrics...
      </div>
    );
  if (error)
    return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          <EditableContent
            configKey="pages.performance.header.analysisTitle"
            initialValue={pagesConfig.performance.header.analysisTitle}
          />
        </h2>
        <div className="text-sm text-slate-500">
          Grade:{" "}
          <span className="font-medium text-slate-900">
            {stats.meta.grade || "N/A"}
          </span>{" "}
          • Classes:{" "}
          <span className="font-medium text-slate-900">
            {stats.meta.enrolled_classes_count}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Student's Own Stats - Highlighted */}
        <TeacherStatCard title="Student" data={stats.user} isHighlight />

        {/* Comparisons */}
        <TeacherStatCard title="Class Average" data={stats.class} />
        <TeacherStatCard title="Grade Average" data={stats.grade} />
        <TeacherStatCard title="Global Average" data={stats.global} />
      </div>
      {/* Optional: Simple Insight Text */}
      <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 border border-slate-100">
        This student is performing
        <span
          className={
            stats.user.avg_percent >= stats.class.avg_percent
              ? "text-green-600 font-bold mx-1"
              : "text-red-600 font-bold mx-1"
          }
        >
          {Math.abs(stats.user.avg_percent - stats.class.avg_percent).toFixed(
            1
          )}
          %
          {stats.user.avg_percent >= stats.class.avg_percent
            ? " above "
            : " below "}
        </span>
        the class average.
      </div>
    </div>
  );
};

/* ============================
 * Component
 * ============================ */

export default function PerformanceTracker({
  userRole = "student",
  currentStudentId,
  data,
  loading = false,
  onFiltersChange,
  classes = [],
}: PerformanceTrackerProps) {
  const isAdmin = ["admin", "teacher", "moderator"].includes(userRole);

  const [activeTab, setActiveTab] = useState(
    isAdmin ? "overview" : "dashboard"
  );
  const [selectedFilters, setSelectedFilters] = useState({
    student: !isAdmin ? currentStudentId ?? "me" : "all",
    subject: "all",
    timeRange: "30d",
    classId: "all",
    month: "",
    paperTitle: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Trigger onFiltersChange when filters change (for server-side fetching)
  useEffect(() => {
    if (onFiltersChange && isAdmin) {
      onFiltersChange({
        classId: selectedFilters.classId === "all" ? undefined : selectedFilters.classId,
        subject: selectedFilters.subject === "all" ? undefined : selectedFilters.subject,
        month: selectedFilters.month || undefined,
      });
    }
  }, [selectedFilters.classId, selectedFilters.subject, selectedFilters.month, onFiltersChange, isAdmin]);

  /* ===== Normalize attempts =====
     - subject "Unknown" (or missing) -> "Math"
     - score becomes PERCENT:
       prefer attempt.percent; else derive from score/totalQuestions.
  */
  const attempts = useMemo<QuizAttempt[]>(
    () =>
      (Array.isArray(data) ? data : []).map((a) => {
        const subjectNorm =
          !a.subject || a.subject === "Unknown" ? "Math" : a.subject;
        const providedPercent =
          typeof (a as any).percent === "number"
            ? clampPct((a as any).percent)
            : null;
        const percent = providedPercent ?? derivePercent(a);

        return {
          ...a,
          subject: subjectNorm,
          score: percent, // from here on, .score is percent
        };
      }),
    [data]
  );

  /* ===== Filters ===== */
  const filteredAttempts = useMemo(() => {
    let list = attempts;

    if (!isAdmin) {
      list = list.filter((a) => a.studentId === currentStudentId);
    } else if (selectedFilters.student !== "all") {
      list = list.filter((a) => a.studentId === selectedFilters.student);
    }

    if (selectedFilters.subject !== "all") {
      list = list.filter(
        (a) => (a.subject || "").toLowerCase() === selectedFilters.subject.toLowerCase()
      );
    }

    if (selectedFilters.paperTitle !== "all") {
      list = list.filter((a) => a.paperTitle === selectedFilters.paperTitle);
    }

    if (selectedFilters.timeRange !== "all") {
      const now = Date.now();
      const windowDays =
        { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[
          selectedFilters.timeRange as "7d" | "30d" | "90d" | "1y"
        ] ?? 30;
      const cutoff = now - windowDays * 86400000;
      list = list.filter((a) => new Date(a.date).getTime() >= cutoff);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) =>
        (a.paperTitle || "").toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [attempts, isAdmin, currentStudentId, selectedFilters, searchQuery]);

  /* ===== Stats (percent-based) ===== */
  const stats = useMemo(() => {
    if (filteredAttempts.length === 0) {
      return {
        averageScore: 0,
        totalAttempts: 0,
        averageTime: 0,
        improvement: 0,
        streak: 0,
        topSubject: "N/A",
        efficiency: 0,
        consistency: 0,
      };
    }

    const totalPct = filteredAttempts.reduce((s, a) => s + a.score, 0);
    const totalTime = filteredAttempts.reduce(
      (s, a) => s + (Number(a.timeSpent) || 0),
      0
    );

    const averageScore = totalPct / filteredAttempts.length;
    const averageTime = totalTime / filteredAttempts.length;

    // Improvement: last 3 vs earlier
    const recent = filteredAttempts.slice(-3);
    const older = filteredAttempts.slice(0, -3);
    const avg = (arr: QuizAttempt[]) =>
      arr.length ? arr.reduce((s, a) => s + a.score, 0) / arr.length : 0;
    const improvement = avg(recent) - avg(older);

    // Streak: consecutive >= 80% (from latest backwards)
    let streak = 0;
    for (let i = filteredAttempts.length - 1; i >= 0; i--) {
      if (filteredAttempts[i].score >= 80) streak++;
      else break;
    }

    // Top subject by average %
    const bySub: Record<string, number[]> = {};
    filteredAttempts.forEach((a) => {
      const sub = a.subject || "Other";
      bySub[sub] ||= [];
      bySub[sub].push(a.score);
    });
    const topSubject =
      Object.entries(bySub).reduce(
        (best, [sub, arr]) => {
          const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
          return mean > best.mean ? { sub, mean } : best;
        },
        { sub: "N/A", mean: 0 }
      ).sub || "N/A";

    // Efficiency: % per minute (assumes minutes)
    const efficiency = averageTime > 0 ? averageScore / averageTime : 0;

    // Consistency: inverse stdev
    const variance =
      filteredAttempts.reduce((s, a) => s + Math.pow(a.score - averageScore, 2), 0) /
      filteredAttempts.length;
    const consistency = Math.max(0, 100 - Math.sqrt(variance));

    return {
      averageScore: Math.round(averageScore),
      totalAttempts: filteredAttempts.length,
      averageTime: Math.round(averageTime),
      improvement: Math.round(improvement),
      streak,
      topSubject,
      efficiency: Math.round(efficiency * 10) / 10,
      consistency: Math.round(consistency),
    };
  }, [filteredAttempts]);

  /* ===== Chart data (percent based) ===== */
  const chartData = useMemo(() => {
    const grouped: Record<string, { date: Date; math: number[]; science: number[]; other: number[] }> =
      {};
    filteredAttempts.forEach((a) => {
      const key = dateKey(a.date);
      grouped[key] ||= { date: new Date(a.date), math: [], science: [], other: [] };
      const sub = (a.subject || "").toLowerCase();
      if (sub === "math") grouped[key].math.push(a.score);
      else if (sub === "science") grouped[key].science.push(a.score);
      else grouped[key].other.push(a.score);
    });

    return Object.values(grouped)
      .map(({ date, math, science, other }) => ({
        date: format(date, "MMM dd"),
        fullDate: date,
        math: math.length ? Math.round(math.reduce((s, v) => s + v, 0) / math.length) : null,
        science: science.length
          ? Math.round(science.reduce((s, v) => s + v, 0) / science.length)
          : null,
        other: other.length ? Math.round(other.reduce((s, v) => s + v, 0) / other.length) : null,
      }))
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  }, [filteredAttempts]);

  /* ===== Unique papers (for filter) ===== */
  const uniquePapers = useMemo(() => {
    const papers = new Set<string>();
    attempts.forEach((a) => {
      if (a.paperTitle) papers.add(a.paperTitle);
    });
    return Array.from(papers).sort();
  }, [attempts]);

  /* ===== Unique students (for admin filter) ===== */
  const uniqueStudents = useMemo(() => {
    const map = new Map<string, string>();
    attempts.forEach((a) => map.set(a.studentId, a.studentName || a.studentId));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [attempts]);

  /* ===== Student Stats (for Students tab) ===== */
  const studentStats = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        attempts: number;
        totalScore: number;
        totalTime: number;
        lastDate: Date;
      }
    >();

    filteredAttempts.forEach((a) => {
      const current = map.get(a.studentId) || {
        id: a.studentId,
        name: a.studentName || "Unknown",
        attempts: 0,
        totalScore: 0,
        totalTime: 0,
        lastDate: new Date(0),
      };

      current.attempts += 1;
      current.totalScore += a.score;
      current.totalTime += Number(a.timeSpent) || 0;
      const aDate = new Date(a.date);
      if (aDate > current.lastDate) current.lastDate = aDate;

      map.set(a.studentId, current);
    });

    return Array.from(map.values())
      .map((s) => ({
        ...s,
        averageScore: Math.round(s.totalScore / s.attempts),
        averageTime: Math.round(s.totalTime / s.attempts),
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [filteredAttempts]);

  /* ===== Paper Stats (Admin) ===== */
  const paperStats = useMemo(() => {
    const map = new Map<string, { title: string; totalScore: number; attempts: number }>();
    filteredAttempts.forEach((a) => {
      const current = map.get(a.paperTitle) || { title: a.paperTitle, totalScore: 0, attempts: 0 };
      current.totalScore += a.score;
      current.attempts += 1;
      map.set(a.paperTitle, current);
    });
    return Array.from(map.values())
      .map((p) => ({ ...p, average: Math.round(p.totalScore / p.attempts) }))
      .sort((a, b) => a.average - b.average); // Lowest first
  }, [filteredAttempts]);

  /* ===== Small UI helpers ===== */
  const FilterButton = ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
  }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white/80"
        >
          {label}: {options.find((o) => o.value === value)?.label || value}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: number;
    color: string; // e.g. "text-blue-600"
  }) => (
    <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className="flex items-center space-x-2">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              {typeof trend === "number" && (
                <div
                  className={`flex items-center ${
                    trend >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium ml-1">
                    {Math.abs(trend)}%
                  </span>
                </div>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div
            className={`p-3 rounded-2xl ${color
              .replace("text-", "bg-")
              .replace("600", "100")}`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 sm:space-y-7">
        {/* Header */}
        <SectionHeader
          title={
            <EditableContent
              configKey="pages.performance.header.title"
              initialValue={pagesConfig.performance.header.title}
            />
          }
          description={
            <EditableContent
              configKey={
                isAdmin
                  ? "pages.performance.header.descriptionAdmin"
                  : "pages.performance.header.descriptionStudent"
              }
              initialValue={
                isAdmin
                  ? pagesConfig.performance.header.descriptionAdmin
                  : pagesConfig.performance.header.descriptionStudent
              }
            />
          }
          icon={pagesConfig.performance.header.icon}
        />

        {/* Filters */}
        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search quiz papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-slate-200 bg-white/80 focus:bg-white transition-all rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {isAdmin && (
              <FilterButton
                label="Student"
                value={selectedFilters.student}
                options={[
                  { value: "all", label: "All Students" },
                  ...uniqueStudents.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
                onChange={(v) =>
                  setSelectedFilters((prev) => ({ ...prev, student: v }))
                }
              />
            )}

            <FilterButton
              label="Subject"
              value={selectedFilters.subject}
              options={[
                { value: "all", label: "All Subjects" },
                { value: "Math", label: "Mathematics" },
                { value: "Science", label: "Science" },
              ]}
              onChange={(v) =>
                setSelectedFilters((prev) => ({ ...prev, subject: v }))
              }
            />

            <FilterButton
              label="Paper"
              value={selectedFilters.paperTitle}
              options={[
                { value: "all", label: "All Papers" },
                ...uniquePapers.map((p) => ({ value: p, label: p })),
              ]}
              onChange={(v) =>
                setSelectedFilters((prev) => ({ ...prev, paperTitle: v }))
              }
            />

            <FilterButton
              label="Period"
              value={selectedFilters.timeRange}
              options={[
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
                { value: "90d", label: "Last 3 months" },
                { value: "1y", label: "Last year" },
                { value: "all", label: "All Time" },
              ]}
              onChange={(v) =>
                setSelectedFilters((prev) => ({ ...prev, timeRange: v }))
              }
            />

            {isAdmin && (
              <>
                <FilterButton
                  label="Class"
                  value={selectedFilters.classId}
                  options={[
                    { value: "all", label: "All Classes" },
                    ...(classes || []).map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  ]}
                  onChange={(v) =>
                    setSelectedFilters((prev) => ({ ...prev, classId: v }))
                  }
                />
                <div className="relative">
                  <Input
                    type="month"
                    className="h-9 w-auto min-w-[140px] border-slate-200 bg-white/80 rounded-lg text-sm"
                    value={selectedFilters.month}
                    onChange={(e) =>
                      setSelectedFilters((prev) => ({ ...prev, month: e.target.value }))
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="flex w-full max-w-2xl mx-auto bg-white/60 backdrop-blur-md p-1 rounded-xl shadow-sm border border-white/20">
            <TabsTrigger
              value={isAdmin ? "overview" : "dashboard"}
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
            >
              {isAdmin ? "Overview" : "Dashboard"}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="students" 
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
              >
                Students
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="analytics" 
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="records" 
              className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
            >
              Records
            </TabsTrigger>
          </TabsList>

          {/* Dashboard/Overview */}
          <TabsContent
            value={isAdmin ? "overview" : "dashboard"}
            className="space-y-6"
          >
            {/* Teacher View: Specific Student Analysis */
            isAdmin &&
            selectedFilters.student !== "all" &&
            selectedFilters.student !== "me" ? (
              <TeacherPerformanceView userId={selectedFilters.student} />
            ) : (
              /* Default Overview (Aggregate or Student Personal) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Average Score"
                  value={`${stats.averageScore}%`}
                  subtitle={`${stats.totalAttempts} attempts`}
                  icon={Target}
                  trend={stats.improvement}
                  color="text-blue-600"
                />
                <StatCard
                  title="Current Streak"
                  value={stats.streak}
                  subtitle="consecutive 80%+ scores"
                  icon={Award}
                  color="text-purple-600"
                />
                <StatCard
                  title="Efficiency"
                  value={stats.efficiency}
                  subtitle="score per minute"
                  icon={Zap}
                  color="text-green-600"
                />
                <StatCard
                  title="Consistency"
                  value={`${stats.consistency}%`}
                  subtitle="performance stability"
                  icon={Activity}
                  color="text-orange-600"
                />
              </div>
            )}

            {/* Trend chart */}
            <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-slate-800">
                    <EditableContent
                      configKey="pages.performance.sections.trend"
                      initialValue={pagesConfig.performance.sections.trend}
                    />
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-full shadow-sm"
                  >
                    {stats.totalAttempts} attempts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        strokeOpacity={0.6}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={12}
                        fontWeight={500}
                        tick={{ fill: "#64748b" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#64748b"
                        fontSize={12}
                        fontWeight={500}
                        tick={{ fill: "#64748b" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          border: "none",
                          borderRadius: "16px",
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                          padding: "16px",
                        }}
                        labelStyle={{ color: "#1e293b", fontWeight: 600 }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={50}
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: "20px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="math"
                        name="Mathematics"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        dot={{
                          r: 6,
                          stroke: "#ffffff",
                          strokeWidth: 3,
                          fill: "#3b82f6",
                          filter:
                            "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))",
                        }}
                        activeDot={{
                          r: 8,
                          stroke: "#ffffff",
                          strokeWidth: 3,
                          fill: "#3b82f6",
                          filter:
                            "drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))",
                        }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="science"
                        name="Science"
                        stroke="#8b5cf6"
                        strokeWidth={4}
                        dot={{
                          r: 6,
                          stroke: "#ffffff",
                          strokeWidth: 3,
                          fill: "#8b5cf6",
                          filter:
                            "drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))",
                        }}
                        activeDot={{
                          r: 8,
                          stroke: "#ffffff",
                          strokeWidth: 3,
                          fill: "#8b5cf6",
                          filter:
                            "drop-shadow(0 4px 8px rgba(139, 92, 246, 0.4))",
                        }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students (Admin Only) */}
          {isAdmin && (
            <TabsContent value="students" className="space-y-6">
              <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    <EditableContent
                      configKey="pages.performance.sections.students"
                      initialValue={pagesConfig.performance.sections.students}
                    />
                  </CardTitle>
                  <Badge variant="outline" className="px-4 py-2 rounded-full bg-white text-slate-700 border-slate-200 shadow-sm">
                    {studentStats.length} students
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                        <tr>
                          <th className="p-4">Student</th>
                          <th className="p-4">Attempts</th>
                          <th className="p-4">Avg Score</th>
                          <th className="p-4">Avg Time</th>
                          <th className="p-4">Last Active</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {studentStats.map((s) => (
                          <tr
                            key={s.id}
                            className="hover:bg-slate-50/80 transition-colors duration-200"
                          >
                            <td className="p-4 font-medium text-slate-900">
                              {s.name}
                            </td>
                            <td className="p-4 text-slate-600">
                              {s.attempts}
                            </td>
                            <td className="p-4">
                              <Badge 
                                className={`font-bold border shadow-sm ${
                                  s.averageScore >= 90 ? "bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50" :
                                  s.averageScore >= 75 ? "bg-white text-blue-600 border-blue-200 hover:bg-blue-50" :
                                  s.averageScore >= 50 ? "bg-white text-amber-600 border-amber-200 hover:bg-amber-50" :
                                  "bg-white text-rose-600 border-rose-200 hover:bg-rose-50"
                                }`}
                              >
                                {s.averageScore}%
                              </Badge>
                            </td>
                            <td className="p-4 text-slate-600">
                              {mins(s.averageTime)}
                            </td>
                            <td className="p-4 text-slate-600 whitespace-nowrap">
                              {format(s.lastDate, "MMM dd, yyyy")}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedFilters((prev) => ({
                                    ...prev,
                                    student: s.id,
                                  }));
                                  setActiveTab("overview");
                                }}
                              >
                                <Activity className="w-4 h-4 mr-1" />
                                Analyze
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!studentStats.length && !loading && (
                    <div className="text-center py-16 text-slate-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">
                        No students found matching the current filters.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            {isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Paper Performance (Hardest First) */}
                <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">
                      <EditableContent
                        configKey="pages.performance.sections.difficulty"
                        initialValue={pagesConfig.performance.sections.difficulty}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={paperStats.slice(0, 8)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis 
                            dataKey="title" 
                            type="category" 
                            width={150} 
                            tick={{ fontSize: 11, fill: "#64748b" }} 
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="average" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Students */}
                <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">
                      Top Performing Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentStats.slice(0, 5).map((s, i) => (
                        <div key={s.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-slate-100">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              i === 0 ? "bg-yellow-100 text-yellow-700" :
                              i === 1 ? "bg-slate-100 text-slate-700" :
                              i === 2 ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-600"
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.attempts} attempts</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-green-600">{s.averageScore}%</span>
                          </div>
                        </div>
                      ))}
                      {studentStats.length === 0 && (
                        <p className="text-center text-slate-500 py-4">No student data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Performance */}
              <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">
                    Subject Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(
                          filteredAttempts.reduce((acc, a) => {
                            const k = a.subject || "Other";
                            acc[k] ||= [];
                            acc[k].push(a.score);
                            return acc;
                          }, {} as Record<string, number[]>)
                        ).map(([subject, arr]) => ({
                          subject,
                          average: Math.round(
                            arr.reduce((s, v) => s + v, 0) / arr.length
                          ),
                          attempts: arr.length,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="subject"
                          stroke="#64748b"
                          fontSize={12}
                          fontWeight={500}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#64748b"
                          fontSize={12}
                          fontWeight={500}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.98)",
                            border: "none",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar dataKey="average" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Time vs Performance */}
              <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">
                    Time vs Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData.map((d) => ({
                          ...d,
                          efficiency:
                            typeof d.math === "number"
                              ? d.math / 20
                              : typeof d.science === "number"
                              ? d.science / 20
                              : typeof d.other === "number"
                              ? d.other / 20
                              : 0,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.98)",
                            border: "none",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: "#10b981", r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Distribution */}
            <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">
                  Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Excellent (90-100%)",
                            value: filteredAttempts.filter((a) => a.score >= 90)
                              .length,
                            fill: "#10b981",
                          },
                          {
                            name: "Good (80-89%)",
                            value: filteredAttempts.filter(
                              (a) => a.score >= 80 && a.score < 90
                            ).length,
                            fill: "#3b82f6",
                          },
                          {
                            name: "Average (70-79%)",
                            value: filteredAttempts.filter(
                              (a) => a.score >= 70 && a.score < 80
                            ).length,
                            fill: "#f59e0b",
                          },
                          {
                            name: "Below Average (<70%)",
                            value: filteredAttempts.filter((a) => a.score < 70)
                              .length,
                            fill: "#ef4444",
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) =>
                          `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { fill: "#10b981" },
                          { fill: "#3b82f6" },
                          { fill: "#f59e0b" },
                          { fill: "#ef4444" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Records */}
          <TabsContent value="records" className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/60 border-0 shadow-xl shadow-slate-200/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold text-slate-800">
                  Detailed Records
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="px-4 py-2 rounded-full bg-white text-slate-700 border-slate-200 shadow-sm">
                    {filteredAttempts.length} records
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-4">Date</th>
                        {isAdmin && <th className="p-4">Student</th>}
                        <th className="p-4">Subject</th>
                        <th className="p-4">Paper</th>
                        <th className="p-4">Score</th>
                        <th className="p-4">Time</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAttempts.map((a) => (
                        <tr
                          key={a.id}
                          className="hover:bg-slate-50/80 transition-colors duration-200"
                        >
                          <td className="p-4 text-slate-600 whitespace-nowrap">
                            {format(new Date(a.date), "MMM dd, yyyy")}
                          </td>
                          {isAdmin && (
                            <td className="p-4 font-medium text-slate-900">
                              {a.studentName}
                            </td>
                          )}
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={subjectBadge(a.subject)}
                            >
                              {(a.subject || "").toLowerCase() === "math" ? (
                                <Calculator className="w-3 h-3 mr-1" />
                              ) : (
                                <Atom className="w-3 h-3 mr-1" />
                              )}
                              {a.subject || "—"}
                            </Badge>
                          </td>
                          <td className="p-4 text-slate-900 font-medium max-w-[200px] truncate" title={a.paperTitle}>
                            {a.paperTitle}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`font-bold ${
                                  a.score >= 90
                                    ? "text-green-600"
                                    : a.score >= 80
                                    ? "text-blue-600"
                                    : a.score >= 70
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {Math.round(a.score)}%
                              </span>
                              {a.score >= 90 && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-600">
                            {mins(a.timeSpent)}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                window.location.href = `/quizzes/review/${a.id}`;
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {!filteredAttempts.length && !loading && (
                    <div className="text-center py-16 text-slate-500 bg-white">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">
                        No records found matching the current filters.
                      </p>
                      <p className="text-sm">
                        Try adjusting your search criteria or time range.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
