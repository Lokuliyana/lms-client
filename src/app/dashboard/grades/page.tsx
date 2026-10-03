"use client";

import { useEffect, useState } from "react";
import { examService } from "@/services/examService";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  FileText,
  TrendingUp,
  Download,
  AlertCircle,
  BarChart2,
  LineChart as LineChartIcon,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { toast } from "sonner";
import Link from "next/link";

export default function StudentGradesPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState<"trend" | "subject">("trend");

  useEffect(() => {
    fetchMyResults();
  }, []);

  const fetchMyResults = async () => {
    try {
      setLoading(true);
      const res = await examService.getMyExamResults();
      if (res.success) {
        setResults(res.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load exam results");
    } finally {
      setLoading(false);
    }
  };

  const completedExams = results.filter((r) => r.score && !r.score.isAbsent);
  const totalMarksEarned = completedExams.reduce((acc, curr) => acc + (curr.score?.marksObtained || 0), 0);
  const totalMarksMax = completedExams.reduce((acc, curr) => acc + (curr.maxMarks || 100), 0);
  const averagePct = totalMarksMax > 0 ? Math.round((totalMarksEarned / totalMarksMax) * 100) : 0;

  // Prepare chronological trend data for Recharts
  const trendData = [...completedExams]
    .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .map((item) => ({
      name: item.examTitle?.length > 18 ? item.examTitle.substring(0, 16) + "..." : item.examTitle,
      fullName: item.examTitle,
      date: new Date(item.examDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: item.score?.percentage || 0,
      marks: `${item.score?.marksObtained || 0} / ${item.maxMarks || 100}`,
      grade: item.score?.grade || "N/A",
      className: item.class?.title || "Class Exam",
    }));

  // Group performance by class/subject
  const subjectAggregates: { [key: string]: { totalPct: number; count: number; title: string } } = {};
  completedExams.forEach((item) => {
    const classTitle = item.class?.title || "General Course";
    if (!subjectAggregates[classTitle]) {
      subjectAggregates[classTitle] = { totalPct: 0, count: 0, title: classTitle };
    }
    subjectAggregates[classTitle].totalPct += item.score?.percentage || 0;
    subjectAggregates[classTitle].count += 1;
  });

  const subjectData = Object.values(subjectAggregates).map((item) => ({
    name: item.title.length > 20 ? item.title.substring(0, 18) + "..." : item.title,
    fullName: item.title,
    avgScore: Math.round(item.totalPct / item.count),
    examsCount: item.count,
  }));

  // Grade counts
  const gradeDistribution = {
    "A+ / A": completedExams.filter((e) => ["A+", "A"].includes(e.score?.grade)).length,
    "B": completedExams.filter((e) => e.score?.grade === "B").length,
    "C": completedExams.filter((e) => e.score?.grade === "C").length,
    "S": completedExams.filter((e) => e.score?.grade === "S").length,
    "F": completedExams.filter((e) => e.score?.grade === "F").length,
    "Absent": results.filter((e) => e.score?.isAbsent).length,
  };

  const getBarColor = (pct: number) => {
    if (pct >= 75) return "#10b981"; // Emerald
    if (pct >= 65) return "#3b82f6"; // Blue
    if (pct >= 50) return "#6366f1"; // Indigo
    if (pct >= 35) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Award}
          title={
            <EditableContent
              configKey="grades_dashboard_title"
              initialValue="Academic Performance & Examination Analytics"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="grades_dashboard_desc"
              initialValue="Official published term marks, score progression curves, class comparative analytics, and teacher evaluations."
              as="span"
            />
          }
          actions={
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 hidden sm:block drop-shadow-sm">
                <Image src={CLAY_ASSETS.gradeReportTrophy} alt="Trophy" fill className="object-contain" priority />
              </div>
              <div className="px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20 text-center">
                <span className="text-[10px] uppercase font-bold text-primary block">Cumulative Average</span>
                <span className="text-xl font-extrabold text-primary">{averagePct}%</span>
              </div>
            </div>
          }
        />

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Total Examinations</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{results.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Evaluated Papers</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedExams.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Pass Percentage</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {completedExams.length > 0
                  ? Math.round(
                      (completedExams.filter((e) => (e.score?.percentage || 0) >= (e.passMarks || 40)).length /
                        completedExams.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Distinctions (A/A+)</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {gradeDistribution["A+ / A"]}
              </p>
            </div>
          </div>
        </div>

        {/* Graphical Analytics CardSection */}
        <CardSection
          title={
            <div className="flex items-center justify-between w-full">
              <EditableContent
                configKey="grades_chart_heading"
                initialValue="Graphical Examination Analytics & Trends"
                as="span"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveChartTab("trend")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeChartTab === "trend"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Timeline Curve</span>
                </button>
                <button
                  onClick={() => setActiveChartTab("subject")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activeChartTab === "subject"
                      ? "bg-primary text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Class Averages</span>
                </button>
              </div>
            </div>
          }
          icon={TrendingUp}
        >
          {loading ? (
            <div className="py-12">
              <SectionLoader />
            </div>
          ) : completedExams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No evaluated exam data available to generate charts.
            </div>
          ) : (
            <div className="space-y-6 pt-2">
              {activeChartTab === "trend" ? (
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                    <span>Performance percentage progression over time (%)</span>
                    <span className="text-[11px] font-medium text-primary">Target: 75%+ Distinction</span>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -15, bottom: 20 }}>
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          dy={8}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                                  <p className="font-bold text-sm text-indigo-300">{data.fullName}</p>
                                  <p className="text-slate-300">{data.className}</p>
                                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                                    <span>Percentage:</span>
                                    <span className="font-bold text-emerald-400">{data.score}%</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span>Marks:</span>
                                    <span className="font-medium text-slate-200">{data.marks}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span>Grade:</span>
                                    <span className="font-bold text-amber-300">{data.grade}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#scoreGradient)"
                          dot={{ r: 5, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 7, fill: "#4338ca" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                    <span>Average score across enrolled classes (%)</span>
                    <span className="text-[11px] font-medium text-slate-400">Class Comparative Breakdown</span>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectData} margin={{ top: 10, right: 20, left: -15, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          dy={8}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                                  <p className="font-bold text-indigo-300">{data.fullName}</p>
                                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
                                    <span>Class Average:</span>
                                    <span className="font-bold text-emerald-400">{data.avgScore}%</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4">
                                    <span>Total Exams:</span>
                                    <span className="font-medium text-slate-200">{data.examsCount}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="avgScore" radius={[8, 8, 0, 0]}>
                          {subjectData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.avgScore)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Grade distribution badges bar */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Grade Band Distribution:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(gradeDistribution).map(([band, count]) => (
                    <div
                      key={band}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                    >
                      <span className="text-slate-400">{band}:</span>
                      <span className="font-bold text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardSection>

        {/* Individual Exam Results List inside CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="grades_records_heading"
              initialValue="Detailed Examination Mark Sheets"
              as="span"
            />
          }
          icon={FileText}
        >
          {loading ? (
            <div className="py-12">
              <SectionLoader />
            </div>
          ) : results.length === 0 ? (
            <ClayEmptyState
              illustration={CLAY_ASSETS.emptyExamResults}
              title="No Examination Results Yet"
              description="Once your teachers evaluate your paper submissions and publish report cards, your scores, grade certificates, and feedback will appear here."
            />
          ) : (
            <div className="space-y-4 pt-2">
              {results.map((item) => {
                const score = item.score;
                const isAbsent = score?.isAbsent;
                const grade = isAbsent ? "AB" : score?.grade || "N/A";

                return (
                  <div
                    key={item._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                          {item.class?.title || "Class Exam"}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(item.examDate).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                        {item.examTitle}
                      </h3>

                      {score?.remarks && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          Teacher Feedback: "{score.remarks}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-medium">Marks</span>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                          {isAbsent ? (
                            <span className="text-red-500">Absent</span>
                          ) : (
                            <>
                              {score?.marksObtained || 0}{" "}
                              <span className="text-xs font-normal text-slate-400">
                                / {item.maxMarks}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div
                        className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold text-lg shadow-xs ${
                          isAbsent
                            ? "bg-slate-100 text-slate-500"
                            : grade === "A+" || grade === "A"
                            ? "bg-emerald-500 text-white shadow-emerald-500/20"
                            : grade === "B" || grade === "C"
                            ? "bg-blue-500 text-white shadow-blue-500/20"
                            : grade === "S"
                            ? "bg-amber-500 text-white shadow-amber-500/20"
                            : "bg-red-500 text-white shadow-red-500/20"
                        }`}
                      >
                        <span>{grade}</span>
                        {!isAbsent && (
                          <span className="text-[9px] font-medium opacity-85">
                            {score?.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardSection>
      </div>
    </div>
  );
}
