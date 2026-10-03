"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClassRecordings } from "@/components/ui/class-view/class-recordings";
import { ClassQuizzes } from "@/components/ui/class-view/class-quizzes";
import { ClassAttendance } from "@/components/ui/class-view/class-attendance";
import { ClassGrades } from "@/components/ui/class-view/class-grades";
import { EmptyCard } from "./empty-card";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/dev/select";
import { HiVideoCamera, HiDocumentText } from "react-icons/hi2";
import { CalendarCheck, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type ClassTabsProps = {
  classData: any;
};

function labelForMonthKey(mk: string) {
  const [y, m] = String(mk).split("-").map((v) => parseInt(v, 10));
  if (!y || !m) return mk;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function ClassTabs({ classData }: ClassTabsProps) {
  const { user } = useAuth();
  const isPrivileged = !!(
    user?.role === "teacher" ||
    user?.role === "admin" ||
    user?.role === "moderator"
  );

  const recordings = Array.isArray(classData?.recordings)
    ? classData.recordings
    : [];
  const quizzes = Array.isArray(classData?.quizzes)
    ? classData.quizzes.filter((q: any) => q.is_active)
    : [];

  const accessibleMonths: string[] = Array.isArray(classData?.accessibleMonths)
    ? classData.accessibleMonths.slice().sort()
    : [];

  const monthChoices: string[] = accessibleMonths.length
    ? accessibleMonths
    : (Array.from(new Set(recordings.map((r: any) => r.month_key))) as string[]).sort();

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"recordings" | "quizzes" | "attendance" | "grades">("recordings");

  const filteredRecordings = useMemo(() => {
    let result = recordings;
    if (selectedMonth !== "all") {
      result = result.filter((rec: any) => rec.month_key === selectedMonth);
    }
    // Sort descending by date
    return result.sort((a: any, b: any) => {
      const dateA = new Date(a.session_date || a.uploaded_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.session_date || b.uploaded_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [selectedMonth, recordings]);

  const enrolledStudents = useMemo(() => {
    if (Array.isArray(classData?.students) && classData.students.length > 0) {
      return classData.students;
    }
    if (Array.isArray(classData?.enrolled_students)) {
      return classData.enrolled_students.map((s: any) =>
        typeof s === "object" ? s : { _id: s, name: "Student" }
      );
    }
    return [];
  }, [classData]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Modern Pill Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-md w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("recordings")}
            className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === "recordings" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {activeTab === "recordings" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <HiVideoCamera className="w-4 h-4" />
              Recordings
            </span>
          </button>

          <button
            onClick={() => setActiveTab("quizzes")}
            className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === "quizzes" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {activeTab === "quizzes" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <HiDocumentText className="w-4 h-4" />
              Quizzes
            </span>
          </button>

          <button
            onClick={() => setActiveTab("attendance")}
            className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === "attendance" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {activeTab === "attendance" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4" />
              Attendance
            </span>
          </button>

          <button
            onClick={() => setActiveTab("grades")}
            className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${
              activeTab === "grades" ? "text-indigo-600" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {activeTab === "grades" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Exams
            </span>
          </button>
        </div>

        {/* Month Filter (Only for Recordings) */}
        {activeTab === "recordings" && monthChoices.length > 1 && (
          <div className="w-full sm:w-64">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full bg-white border-slate-200 hover:border-indigo-300 focus:ring-indigo-500/20 transition-all rounded-xl">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                <SelectItem value="all">All months</SelectItem>
                {monthChoices.map((mk) => (
                  <SelectItem key={mk} value={mk}>
                    {labelForMonthKey(mk)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "recordings" && (
          <motion.div
            key="recordings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {!recordings.length ? (
              <EmptyCard
                title="No recordings available"
                message="Enroll or renew your monthly subscription to unlock recordings."
                illustration={CLAY_ASSETS.recordingsCinema}
                actionText="Enroll to Unlock"
                onActionClick={() => {
                  const enrollBtn = document.querySelector('[data-enroll-btn="true"]') as HTMLElement;
                  if (enrollBtn) {
                    enrollBtn.scrollIntoView({ behavior: "smooth", block: "center" });
                    enrollBtn.click();
                  }
                }}
              />
            ) : (
              <ClassRecordings recordings={filteredRecordings} classId={classData?._id} />

            )}
          </motion.div>
        )}

        {activeTab === "quizzes" && (
          <motion.div
            key="quizzes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {!quizzes.length ? (
              <EmptyCard
                title="No quizzes available"
                message="Quizzes will be added by your instructor."
                illustration={CLAY_ASSETS.emptyQuizzesZero}
              />
            ) : (
              <ClassQuizzes quizzes={quizzes} />
            )}
          </motion.div>
        )}

        {activeTab === "attendance" && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ClassAttendance
              classId={classData._id || classData.id}
              isPrivileged={isPrivileged}
              enrolledStudents={enrolledStudents}
            />
          </motion.div>
        )}

        {activeTab === "grades" && (
          <motion.div
            key="grades"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ClassGrades
              classId={classData._id || classData.id}
              isPrivileged={isPrivileged}
              enrolledStudents={enrolledStudents}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClassTabs;
