"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClassRecordings } from "@/components/ui/class-view/class-recordings";
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
import { HiVideoCamera, HiUserGroup } from "react-icons/hi2";
import { CalendarCheck, Award, Search, Mail, Phone, Calendar, CheckCircle2, ShieldCheck, User, UserPlus, UserMinus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { getEnrolledStudents, revokeStudentAccess } from "@/services/classService";
import { getRecordingsByClass } from "@/services/recordingService";
import { Input } from "@/components/dev/input";
import { Button } from "@/components/dev/button";
import { toast } from "sonner";
import { ManualEnrollModal } from "./ManualEnrollModal";

type ClassTabsProps = {
  classData: any;
};

const getStudentDisplayName = (stu: any) => {
  if (!stu) return "Student";
  const fn = stu.first_name || stu.firstName || "";
  const ln = stu.last_name || stu.lastName || "";
  const combined = `${fn} ${ln}`.trim();
  return (
    stu.full_name ||
    stu.fullName ||
    stu.student_profile?.full_name ||
    (combined.length > 0 ? combined : null) ||
    stu.computedName ||
    stu.name ||
    stu.username ||
    stu.email?.split("@")[0] ||
    "Student"
  );
};

function labelForMonthKey(mk: string) {
  if (mk === "all") return "All Months";
  const [y, m] = String(mk).split("-").map((v) => parseInt(v, 10));
  if (!y || !m) return mk;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

// Compute current month in Asia/Colombo YYYY-MM
function getCurrentColomboMonthKey(): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
    });
    return formatter.format(new Date()).slice(0, 7);
  } catch {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
}

export function ClassTabs({ classData }: ClassTabsProps) {
  const { user } = useAuth();
  const storedUser = typeof window !== "undefined" ? authService.getStoredUser() : null;
  const activeUser = user || storedUser;
  const activeRole = String(activeUser?.role || "").toLowerCase().trim();
  const isPrivileged = Boolean(
    activeRole === "teacher" ||
    activeRole === "admin" ||
    activeRole === "moderator"
  );

  const classId = classData?._id || classData?.id;

  const isEnrolled = useMemo(() => {
    if (isPrivileged) return true;
    if (classData?.is_enrolled !== undefined) return Boolean(classData.is_enrolled);
    if (classData?.isEnrolled !== undefined) return Boolean(classData.isEnrolled);
    if (classData?.hasAccess !== undefined) return Boolean(classData.hasAccess);
    if (classData?.isPaid !== undefined) return Boolean(classData.isPaid);
    const userId = user?._id || (user as any)?.userId;
    if (userId && Array.isArray(classData?.enrolled_students)) {
      return classData.enrolled_students.some((s: any) => String(s?._id || s) === String(userId));
    }
    if (userId && Array.isArray(classData?.enrolledUsers)) {
      return classData.enrolledUsers.some((id: any) => String(id) === String(userId));
    }
    return false;
  }, [classData, isPrivileged, user]);

  const initialRecordings = Array.isArray(classData?.recordings) ? classData.recordings : [];
  const [classRecordings, setClassRecordings] = useState<any[]>(initialRecordings);

  // Fetch all recordings for class to ensure monthChoices and filteredRecordings are up to date
  useEffect(() => {
    if (!classId) return;
    if (!isPrivileged && !isEnrolled) {
      setClassRecordings([]);
      return;
    }
    let isMounted = true;
    getRecordingsByClass(classId)
      .then((recs: any) => {
        if (isMounted && Array.isArray(recs)) {
          setClassRecordings(recs);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch class recordings in tabs:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [classId, isEnrolled, isPrivileged]);

  const currentMonthKey = useMemo(() => getCurrentColomboMonthKey(), []);

  // Compute month choices
  const monthChoices = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthKey);

    if (Array.isArray(classData?.accessibleMonths)) {
      classData.accessibleMonths.forEach((m: string) => m && set.add(m));
    }
    if (Array.isArray(classData?.accessible_months)) {
      classData.accessible_months.forEach((m: string) => m && set.add(m));
    }
    classRecordings.forEach((r: any) => {
      if (r?.month_key) set.add(r.month_key);
      else if (r?.session_date) {
        try {
          const mk = new Date(r.session_date).toISOString().slice(0, 7);
          set.add(mk);
        } catch {}
      }
    });

    // Also add surrounding 3 months for easy selection
    const now = new Date();
    for (let i = -3; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      set.add(mk);
    }

    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [classData, classRecordings, currentMonthKey]);

  // Selected month state (defaults to current month e.g. "2026-10")
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [activeTab, setActiveTab] = useState<"recordings" | "students" | "attendance" | "grades">("recordings");

  // Prevent students/guests from ever accessing the students tab
  useEffect(() => {
    if (!isPrivileged && activeTab === "students") {
      setActiveTab("recordings");
    }
  }, [isPrivileged, activeTab]);

  // Registered students for the selected month (Strictly for teachers and privileged staff)
  const [monthlyStudents, setMonthlyStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [manualEnrollOpen, setManualEnrollOpen] = useState(false);

  // Filter recordings for selected month
  const filteredRecordings = useMemo(() => {
    let result = classRecordings;
    if (selectedMonth !== "all") {
      result = result.filter((rec: any) => {
        if (rec.month_key) return rec.month_key === selectedMonth;
        if (rec.session_date) {
          try {
            return new Date(rec.session_date).toISOString().slice(0, 7) === selectedMonth;
          } catch {
            return false;
          }
        }
        return false;
      });
    }
    // Sort descending by date
    return [...result].sort((a: any, b: any) => {
      const dateA = new Date(a.session_date || a.uploaded_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.session_date || b.uploaded_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [selectedMonth, classRecordings]);

  const refetchStudents = () => {
    if (!classId || !isPrivileged) return;
    setLoadingStudents(true);
    const monthParam = selectedMonth === "all" ? undefined : selectedMonth;
    getEnrolledStudents(classId, monthParam)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.data || data?.students || [];
        setMonthlyStudents(list);
      })
      .catch((err) => {
        console.error("Failed to reload enrolled students:", err);
      })
      .finally(() => {
        setLoadingStudents(false);
      });
  };

  // Fetch registered students when classId or selectedMonth changes - strictly for privileged staff
  useEffect(() => {
    if (!classId || !isPrivileged) {
      setMonthlyStudents([]);
      setLoadingStudents(false);
      return;
    }

    let isMounted = true;
    setLoadingStudents(true);

    const monthParam = selectedMonth === "all" ? undefined : selectedMonth;
    getEnrolledStudents(classId, monthParam)
      .then((data: any) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : data?.data || data?.students || [];
          setMonthlyStudents(list);
        }
      })
      .catch((err) => {
        console.error("Failed to load enrolled students:", err);
        if (isMounted) {
          // Fallback to classData static students ONLY if privileged
          const fallback = isPrivileged && Array.isArray(classData?.students) ? classData.students : [];
          setMonthlyStudents(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStudents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [classId, selectedMonth, classData, isPrivileged]);

  const handleRevokeAccess = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to revert access for ${studentName}?`)) return;
    try {
      await revokeStudentAccess(classId, studentId, selectedMonth);
      toast.success(`Access reverted for ${studentName}`);
      refetchStudents();
    } catch (err: any) {
      console.error("Failed to revoke access:", err);
      toast.error(err.response?.data?.message || "Failed to revert student access");
    }
  };

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!isPrivileged || !studentSearch.trim()) return monthlyStudents;
    const q = studentSearch.toLowerCase().trim();
    return monthlyStudents.filter((stu: any) => {
      const name = getStudentDisplayName(stu).toLowerCase();
      const email = (stu?.email || "").toLowerCase();
      const phone = (stu?.phone || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [monthlyStudents, studentSearch, isPrivileged]);

  const enrolledStudentsForAttendance = useMemo(() => {
    if (!isPrivileged) return [];
    if (monthlyStudents.length > 0) return monthlyStudents;
    if (Array.isArray(classData?.students) && classData.students.length > 0) {
      return classData.students;
    }
    if (Array.isArray(classData?.enrolled_students)) {
      return classData.enrolled_students.map((s: any) =>
        typeof s === "object" ? s : { _id: s, name: "Student" }
      );
    }
    return [];
  }, [monthlyStudents, classData, isPrivileged]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header & Month Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-slate-200 pb-3">
        {/* Modern Pill Switcher (never wraps onto multiple rows) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-none shadow-2xs max-w-full">
          <button
            onClick={() => setActiveTab("recordings")}
            className={`relative flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === "recordings" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "recordings" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white shadow-xs border border-slate-200/60 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              <HiVideoCamera className="w-4 h-4" />
              <span>Recordings</span>
              {filteredRecordings.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  {filteredRecordings.length}
                </span>
              )}
            </span>
          </button>

          {isPrivileged && (
            <button
              onClick={() => setActiveTab("students")}
              className={`relative flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 shrink-0 ${
                activeTab === "students" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {activeTab === "students" && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white shadow-xs border border-slate-200/60 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                <HiUserGroup className="w-4 h-4" />
                <span>Registered Students</span>
                {monthlyStudents.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                    {monthlyStudents.length}
                  </span>
                )}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("attendance")}
            className={`relative flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === "attendance" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "attendance" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white shadow-xs border border-slate-200/60 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              <CalendarCheck className="w-4 h-4" />
              <span>Attendance</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab("grades")}
            className={`relative flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 shrink-0 ${
              activeTab === "grades" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "grades" && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white shadow-xs border border-slate-200/60 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              <Award className="w-4 h-4" />
              <span>Exams</span>
            </span>
          </button>
        </div>

        {/* Global Month Filter for Class (Recordings & Registered Students) */}
        <div className="w-full sm:w-64 flex items-center gap-2">
          <div className="w-full">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full bg-white border-slate-200 hover:border-indigo-300 focus:ring-indigo-500/20 transition-all rounded-xl text-xs font-semibold shadow-2xs">
                <SelectValue placeholder="Filter by Month" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-64">
                <SelectItem value="all">All Months</SelectItem>
                {monthChoices.map((mk) => (
                  <SelectItem key={mk} value={mk}>
                    {labelForMonthKey(mk)} {mk === currentMonthKey ? "(Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Recordings (Filtered by selectedMonth) */}
        {activeTab === "recordings" && (
          <motion.div
            key={`recordings-${selectedMonth}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 bg-white/70 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>
                  Showing recordings for:{" "}
                  <strong className="text-slate-800">{labelForMonthKey(selectedMonth)}</strong>
                </span>
              </div>
              <span className="font-semibold text-slate-700">
                {filteredRecordings.length} {filteredRecordings.length === 1 ? "lesson" : "lessons"} available
              </span>
            </div>

            {!isEnrolled ? (
              <EmptyCard
                title="Recordings Restricted"
                message="Recordings are restricted to enrolled students. Enroll to unlock past recordings."
                illustration={CLAY_ASSETS.recordingsCinema}
                actionText="Enroll to Unlock"
                onActionClick={() => {
                  const enrollBtn = document.querySelector('[data-enroll-btn="true"]') as HTMLElement;
                  if (enrollBtn) {
                    enrollBtn.scrollIntoView({ behavior: "smooth", block: "center" });
                    enrollBtn.click();
                  } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              />
            ) : !filteredRecordings.length ? (
              <EmptyCard
                title={`No recordings for ${labelForMonthKey(selectedMonth)}`}
                message={
                  classRecordings.length > 0
                    ? `There are no video recordings recorded in ${labelForMonthKey(selectedMonth)}. Select 'All Months' to browse all lessons.`
                    : "No recordings available for this class."
                }
                illustration={CLAY_ASSETS.recordingsCinema}
                actionText={classRecordings.length > 0 ? "View All Months" : undefined}
                onActionClick={() => {
                  if (classRecordings.length > 0) {
                    setSelectedMonth("all");
                  }
                }}
              />
            ) : (
              <ClassRecordings recordings={filteredRecordings} isEnrolled={isEnrolled} />
            )}
          </motion.div>
        )}

        {/* Tab 2: Registered Students for the Month */}
        {isPrivileged && activeTab === "students" && (
          <motion.div
            key={`students-${selectedMonth}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Header info & Search Filter */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <HiUserGroup className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Students Registered for {labelForMonthKey(selectedMonth)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedMonth === "all"
                        ? "All actively enrolled students in this class."
                        : `Students holding verified monthly entitlement / enrollment for ${labelForMonthKey(selectedMonth)}.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    {monthlyStudents.length} {monthlyStudents.length === 1 ? "Student" : "Students"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setManualEnrollOpen(true)}
                    className="h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Manually Enroll</span>
                  </Button>
                </div>
              </div>

              {monthlyStudents.length > 4 && (
                <div className="relative pt-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <Input
                    value={studentSearch}
                    onChange={(e: any) => setStudentSearch(e.target.value)}
                    placeholder="Search registered students by name, email, or phone..."
                    className="pl-9 text-xs rounded-xl border-slate-200 h-9"
                  />
                </div>
              )}
            </div>

            {/* Students List */}
            {loadingStudents ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-xs font-medium">Loading registered students roster...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No Registered Students for {labelForMonthKey(selectedMonth)}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {studentSearch
                      ? "No registered students matched your search filter."
                      : "No students have registered or renewed for this month yet. Check other months or enroll students."}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setManualEnrollOpen(true)}
                    className="mt-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Manually Enroll Students
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredStudents.map((stu: any, idx: number) => {
                  const sid = stu._id || stu.id || `stu-${idx}`;
                  const fullName = getStudentDisplayName(stu);
                  const email = stu.email || "";
                  const phone = stu.phone || "";
                  const initials = fullName
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n: string) => n[0]?.toUpperCase())
                    .join("") || "S";

                  return (
                    <div
                      key={sid}
                      className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {stu.avatarUrl || stu.avatar ? (
                          <img
                            src={stu.avatarUrl || stu.avatar}
                            alt={fullName}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100 shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{fullName}</p>
                          {email && (
                            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{email}</span>
                            </p>
                          )}
                          {isPrivileged && phone && (
                            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{phone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeAccess(sid, fullName)}
                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 border border-rose-100 cursor-pointer"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Revert</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Attendance */}
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
              enrolledStudents={enrolledStudentsForAttendance}
              selectedMonth={selectedMonth}
            />
          </motion.div>
        )}

        {/* Tab 4: Grades / Exams */}
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
              enrolledStudents={enrolledStudentsForAttendance}
              selectedMonth={selectedMonth}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Student Enrollment Modal */}
      <ManualEnrollModal
        isOpen={manualEnrollOpen}
        onClose={() => setManualEnrollOpen(false)}
        classId={classId}
        className={classData?.title}
        selectedMonth={selectedMonth}
        onSuccess={refetchStudents}
      />
    </div>
  );
}

export default ClassTabs;
