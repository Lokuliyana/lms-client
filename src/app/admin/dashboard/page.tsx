// app/admin/dashboard/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/reusable/card-section";
import { ClassCard } from "@/components/reusable/classCard";
import { ClayHeroBanner } from "@/components/dashboard/ClayHeroBanner";
import { CompactStatCard } from "@/components/dashboard/CompactStatCard";
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";
import { ManualEnrollModal } from "@/components/ui/class-view/ManualEnrollModal";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { useAuth } from "@/hooks/useAuth";

import {
  PlusCircle,
  Video,
  UserPlus,
  BookOpen,
  Award,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  ShoppingBag,
  Clock,
  Calendar,
  GraduationCap,
  Globe,
  Eye,
  Edit2,
} from "lucide-react";

import { HiFolderOpen } from "react-icons/hi2";

import { getClasses, createMeetingTicket, getApplications } from "@/services/classService";
import { examService, IExam } from "@/services/examService";
import { toast } from "sonner";

const DASHBOARD_TZ = "Asia/Colombo";
const DASHBOARD_TZ_OFFSET = "+05:30";

type ClassTimeSlot = {
  day: string;
  start: string;
  end: string;
};

function minutesFromHHMM(hhmm?: string) {
  if (!hhmm) return NaN;
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
}

function formatHHMM12(hhmm?: string) {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m < 10 ? "0" + m : m} ${ampm}`;
}

function isCrossingMidnight(start: string, end: string) {
  const s = minutesFromHHMM(start);
  const e = minutesFromHHMM(end);
  return Number.isFinite(s) && Number.isFinite(e) ? e <= s : false;
}

function weekdayLowerInTZ(d: Date, tz = DASHBOARD_TZ) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" })
    .format(d)
    .toLowerCase();
}

function ymdInTZ(d: Date, tz = DASHBOARD_TZ) {
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
  }).format(d);
  const m = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "2-digit",
  }).format(d);
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz, day: "numeric" })
    .format(d)
    .padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getNextSessionDetails(slots: ClassTimeSlot[], tz = DASHBOARD_TZ) {
  if (!Array.isArray(slots) || !slots.length) return null;
  const now = new Date();
  let best: { startISO: string; endISO: string; day: string; timeRange: string } | null = null;
  for (let offset = 0; offset < 42; offset += 1) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    const wk = weekdayLowerInTZ(day, tz);
    for (const s of slots) {
      if (!s?.day || !s?.start || !s?.end) continue;
      if (wk !== String(s.day).toLowerCase()) continue;
      const crosses = isCrossingMidnight(s.start, s.end);
      const startYMD = ymdInTZ(day, tz);
      const endBase = new Date(day);
      if (crosses) endBase.setDate(endBase.getDate() + 1);
      const endYMD = ymdInTZ(endBase, tz);
      const startISO = `${startYMD}T${s.start}:00${DASHBOARD_TZ_OFFSET}`;
      const endISO = `${endYMD}T${s.end}:00${DASHBOARD_TZ_OFFSET}`;
      const timeRange = `${formatHHMM12(s.start)} - ${formatHHMM12(s.end)}`;

      const endMs = new Date(endISO).getTime();
      if (Number.isFinite(endMs) && endMs <= now.getTime()) continue;

      const entry = {
        startISO,
        endISO,
        day: s.day,
        timeRange,
      };
      if (!best || new Date(startISO).getTime() < new Date(best.startISO).getTime()) {
        best = entry;
      }
    }
  }
  return best;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";
  const isModerator = user?.role === "moderator";
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user?.name || (isTeacher ? "Teacher" : "Admin");

  const [classes, setClasses] = useState<any[]>([]);
  const [pendingAppsCount, setPendingAppsCount] = useState<number>(0);
  const [pendingExams, setPendingExams] = useState<IExam[]>([]);
  const [launchingClassId, setLaunchingClassId] = useState<string | null>(null);
  const [manualEnrollOpen, setManualEnrollOpen] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoadingDashboard(true);
        // Parallel data loading for speed
        const [classesRes, appsRes, examsRes] = await Promise.allSettled([
          getClasses(),
          getApplications({ status: "pending" }, { limit: 1 }),
          examService.getExams(),
        ]);

        if (classesRes.status === "fulfilled" && Array.isArray(classesRes.value)) {
          setClasses(classesRes.value);
        }

        if (appsRes.status === "fulfilled" && appsRes.value) {
          const total =
            (appsRes.value as any)?.total ??
            (appsRes.value as any)?.data?.length ??
            0;
          setPendingAppsCount(total);
        }

        if (examsRes.status === "fulfilled" && examsRes.value?.success) {
          const allExams: IExam[] = examsRes.value.data || [];
          const unpublished = allExams.filter((ex) => !ex.is_published);
          setPendingExams(unpublished);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoadingDashboard(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleHostMeeting = async (classId: string) => {
    if (launchingClassId) return;
    try {
      setLaunchingClassId(classId);
      const { redirect } = await createMeetingTicket(classId, "start", "regular");
      if (redirect) {
        let finalUrl = redirect;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          if (redirect.includes("zoom.us/j/") || redirect.includes("zoom.us/s/")) {
            try {
              const urlObj = new URL(redirect);
              const meetingId = urlObj.pathname.split("/").pop();
              const pwd = urlObj.searchParams.get("pwd");
              const zak = urlObj.searchParams.get("zak");
              const action = redirect.includes("/s/") ? "start" : "join";
              if (meetingId) {
                finalUrl = `zoomus://zoom.us/${action}?confno=${meetingId}${pwd ? `&pwd=${pwd}` : ""}${zak ? `&zak=${zak}` : ""}`;
              }
            } catch (e) {
              console.error("Deep link parsing failed", e);
            }
          }
          window.location.href = finalUrl;
        } else {
          const opened = window.open(finalUrl, "_blank", "noopener,noreferrer");
          if (!opened || opened.closed || typeof opened.closed === "undefined") {
            window.location.href = finalUrl;
          }
        }
      }
    } catch (err: any) {
      console.error("[Host Meeting] Failed to start live session:", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to start Zoom meeting. Please try again or open class details."
      );
    } finally {
      setLaunchingClassId(null);
    }
  };

  const upcomingClasses = classes
    .map((classItem) => {
      const slots: ClassTimeSlot[] = Array.isArray(classItem.classTime)
        ? classItem.classTime
        : Array.isArray(classItem.batches)
        ? classItem.batches.map((b: any) => ({
            day: b.day,
            start: b.start || b.start_time || "",
            end: b.end || b.end_time || "",
          }))
        : [];
      const sessionDetails = getNextSessionDetails(slots);
      return {
        classItem,
        sessionDetails,
        nextStartISO: sessionDetails?.startISO || null,
      };
    })
    .filter((entry) => Boolean(entry.nextStartISO))
    .sort(
      (a, b) =>
        new Date(a.nextStartISO as string).getTime() -
        new Date(b.nextStartISO as string).getTime()
    );

  const nextUpcoming = upcomingClasses[0] || null;

  return (
    <div className="relative bg-[#f9fafb] min-h-screen pb-20 px-4 md:px-6 space-y-7">
      {/* 3D Clay Hero Banner */}
      <ClayHeroBanner
        variant="admin"
        title={
          isModerator
            ? "Moderator Station"
            : `Hello, ${displayName} 👋`
        }
        description={
          upcomingClasses.length > 0
            ? `You have ${upcomingClasses.length} live class session(s) scheduled. ${
                pendingAppsCount > 0
                  ? `${pendingAppsCount} student application(s) awaiting review.`
                  : "All student enrollments are up to date."
              }`
            : `Welcome back to your teaching portal. ${
                pendingAppsCount > 0
                  ? `${pendingAppsCount} student application(s) awaiting review.`
                  : "Organize live streams, evaluate exam scores, and publish course materials."
              }`
        }
        badge={
          isModerator
            ? "Moderator Desk"
            : isTeacher
            ? "Teacher Desk"
            : "Superadmin Station"
        }
        mascotSrc={isModerator ? CLAY_ASSETS.bannerModeratorDesk : CLAY_ASSETS.bannerAdminStation}
        cta={
          nextUpcoming
            ? {
                label: `Launch Next Live (${nextUpcoming.classItem.title.slice(0, 18)}...)`,
                onClick: () => handleHostMeeting(nextUpcoming.classItem._id),
                icon: Video,
              }
            : {
                label: "Create Live Class",
                href: "/admin/classes/add",
                icon: PlusCircle,
              }
        }
        secondaryCta={{
          label: "Class Directory",
          href: "/admin/classes",
        }}
      />

      {/* High-Value Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <CompactStatCard
          label="Active Classes"
          value={classes.length}
          status="blue"
          href="/admin/classes"
          icon={BookOpen}
        />
        <CompactStatCard
          label="Live Broadcasts"
          value={upcomingClasses.length}
          status="emerald"
          badge={upcomingClasses.length > 0 ? "Live Ready" : "Rest Day"}
          icon={Video}
        />
        <CompactStatCard
          label="Pending Approvals"
          value={pendingAppsCount}
          status={pendingAppsCount > 0 ? "rose" : "neutral"}
          badge={pendingAppsCount > 0 ? "Action Required" : "All Clear"}
          href="/admin/classes/applications"
          icon={UserPlus}
        />
        <CompactStatCard
          label="Unrecorded Exams"
          value={pendingExams.length}
          status={pendingExams.length > 0 ? "purple" : "neutral"}
          badge={pendingExams.length > 0 ? "Enter Marks" : "Up to Date"}
          href="/admin/exams"
          icon={Award}
        />
      </div>

      {/* Actionable Alerts Strip (Pending teacher responsibilities) */}
      {(pendingAppsCount > 0 || pendingExams.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingAppsCount > 0 && (
            <div className="p-4 rounded-2xl border border-rose-200/90 bg-rose-50/60 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {pendingAppsCount} Student Enrollment Application(s)
                  </h4>
                  <p className="text-[11px] text-slate-500">Awaiting your approval or payment verification.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push("/admin/classes/applications")}
                className="h-8 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0"
              >
                Review
              </Button>
            </div>
          )}

          {pendingExams.length > 0 && (
            <div className="p-4 rounded-2xl border border-purple-200/90 bg-purple-50/60 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {pendingExams.length} Exam(s) Pending Mark Entry
                  </h4>
                  <p className="text-[11px] text-slate-500">Student scores are drafted and unpublished.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/admin/exams/${pendingExams[0]._id}/marks`)}
                className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0"
              >
                Enter Marks
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Front-Facing Website & Live Content Editor */}
      <section className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Front-Facing Website &amp; Live Content Editor
              </h3>
              <p className="text-[11px] text-slate-500">
                Preview your public website, teacher profile, and live-edit copy, banners, and images directly.
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-md transition-all">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Guest Dashboard &amp; Teacher Portal</h4>
                <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/90 px-2.5 py-0.5 rounded-full border border-purple-200/80">
                  Public Landing &amp; Marketing
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                View your dashboard as prospective students and guests see it. Toggle into Student View anytime using the top-right switch. Edit your hero text, teacher portrait, credentials, and course showcases in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              asChild
              className="h-9 px-4 rounded-xl border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-900 text-xs font-semibold"
            >
              <Link href="/dashboard?view=guest" className="flex items-center justify-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>View Guest Dashboard</span>
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
            >
              <Link href="/dashboard?view=guest&edit=true" className="flex items-center justify-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-indigo-200" />
                <span>Live Edit Website</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Streamlined Quick Actions (Unique tools without redundancy) */}
      <section className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Teacher Operations &amp; Fast Tools
          </h3>
          <span className="text-xs text-slate-400">Core workflows</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Manual Access Enrollment (Opens Modal directly) */}
          <button
            type="button"
            onClick={() => setManualEnrollOpen(true)}
            className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 text-center cursor-pointer"
          >
            <div className="p-3 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 transition">
              <UserPlus className="w-5 h-5" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-900">Manual Enrollment</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Grant Instant Student Access</p>
          </button>

          {/* 2. Record Exam Marks */}
          <Link
            href="/admin/exams"
            className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all duration-200 text-center"
          >
            <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-600 transition">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-900">Marks &amp; Exams</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Spreadsheet Mark Entry</p>
          </Link>

          {/* 3. Upload Lecture Recording */}
          <Link
            href="/admin/recording/add"
            className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 text-center"
          >
            <div className="p-3 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 transition">
              <Video className="w-5 h-5" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-900">Add Recording</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Upload Lesson Archive</p>
          </Link>

          {/* 4. Student Papers & Submissions */}
          <Link
            href="/admin/classes/assignment"
            className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 text-center"
          >
            <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 transition">
              <HiFolderOpen className="w-5 h-5" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-900">Paper Submissions</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Download Answer Scripts</p>
          </Link>

          {/* 5. Bookstore & Course Materials */}
          <Link
            href="/admin/store"
            className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all duration-200 text-center"
          >
            <div className="p-3 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="mt-2 text-xs font-bold text-slate-900">Bookstore Inventory</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Tute Packs &amp; Delivery</p>
          </Link>
        </div>
      </section>

      {/* Main Grid: Course Roster & Scheduled Live Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: My Classes & Pending Marks Priority Section */}
        <div className="lg:col-span-8 space-y-6">
          <CardSection
            title="My Classes"
            description="Active course modules, curriculum taxonomies, and enrollments."
            icon={BookOpen}
            viewAllLabel="Manage Classes"
            onViewAll={() => router.push("/admin/classes")}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/admin/classes/add")}
                className="h-8 px-2.5 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Class</span>
              </Button>
            }
          >
            {classes.length === 0 ? (
              <ClayEmptyState
                illustration={CLAY_ASSETS.emptyNoClassesToday}
                title="No Classes Created Yet"
                description="Create your first class to configure live lectures, revision sessions, and student enrollments."
                action={{
                  label: "Create Class",
                  href: "/admin/classes/add",
                  variant: "outline",
                }}
                compact
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {classes.slice(0, 3).map((classItem: any) => (
                  <ClassCard
                    id={classItem._id}
                    classId={classItem.classId}
                    key={classItem._id}
                    image={classItem.image || "/images/placeholder.jpg"}
                    title={classItem.title}
                    description={classItem.description}
                    labels={classItem.labels}
                    grade={classItem.grade}
                    subject={classItem.subject}
                    classTime={classItem.classTime}
                    classFee={classItem.classFee}
                    href={`/classes/${classItem._id}`}
                    ctaLabel="View Class"
                    teacher={classItem.teacher}
                  />
                ))}
              </div>
            )}
          </CardSection>

          {/* Pending Exams Grading Worklist */}
          {pendingExams.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Unrecorded Examination Marks</h3>
                    <p className="text-[11px] text-slate-500">Exams requiring student score evaluation</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/admin/exams")}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                >
                  View All Exams →
                </Button>
              </div>

              <div className="divide-y divide-slate-100">
                {pendingExams.slice(0, 4).map((ex) => (
                  <div
                    key={ex._id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl px-2 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{ex.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span>Max: {ex.total_marks || 100} pts</span>
                        {ex.held_date && <span>• Held {ex.held_date}</span>}
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[10px]">
                          Draft
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/admin/exams/${ex._id}/marks`)}
                      className="h-8 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 shadow-2xs"
                    >
                      Enter Marks
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scheduled Classes Card & Live Host Launch */}
        <div className="lg:col-span-4" id="live-sessions">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between min-h-[420px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center border border-rose-100 shadow-2xs">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Scheduled Classes</h3>
                  <p className="text-[11px] text-slate-500">Live Broadcasts</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                {upcomingClasses.length} Scheduled
              </span>
            </div>

            {upcomingClasses.length > 0 ? (
              <div className="space-y-3 py-3 max-h-[380px] overflow-y-auto pr-1">
                {upcomingClasses.map(({ classItem, sessionDetails }) => {
                  const isLaunching = launchingClassId === classItem._id;
                  const gradeLabel =
                    typeof classItem.grade === "object"
                      ? classItem.grade?.name
                      : classItem.grade
                      ? `Grade ${classItem.grade}`
                      : "";
                  const subjectLabel =
                    typeof classItem.subject === "object"
                      ? classItem.subject?.name
                      : classItem.subject || "";

                  return (
                    <div
                      key={classItem._id}
                      className="p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 flex flex-col gap-2.5 transition-all hover:bg-emerald-50/70"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {classItem.title}
                          </span>
                          {(gradeLabel || subjectLabel) && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {[gradeLabel, subjectLabel].filter(Boolean).join(" • ")}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Ready
                        </span>
                      </div>

                      {/* Full session time display */}
                      {sessionDetails?.timeRange && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-900 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {sessionDetails.day}: {sessionDetails.timeRange}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        <Button
                          size="sm"
                          disabled={isLaunching}
                          onClick={() => handleHostMeeting(classItem._id)}
                          className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                        >
                          {isLaunching ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              Start Live (Host)
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/classes/${classItem._id}`)}
                          className="h-8 px-2.5 text-xs font-medium border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="relative w-40 h-40 drop-shadow-sm mb-2">
                  <Image
                    src={CLAY_ASSETS.emptyNoClassesToday}
                    alt="Scheduled Classes"
                    fill
                    className="object-contain pointer-events-none select-none"
                    priority
                  />
                </div>
                <p className="text-xs font-bold text-slate-700 max-w-[200px] leading-snug">
                  You haven&apos;t any Scheduled Classes for Today
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upcoming timetable sessions will appear here automatically.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/classes")}
              className="w-full mt-3 rounded-xl border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Full Timetable &amp; Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Manual Student Enrollment Modal (Callable from Quick Actions or anywhere on Dashboard) */}
      {manualEnrollOpen && (
        <ManualEnrollModal
          isOpen={manualEnrollOpen}
          onClose={() => setManualEnrollOpen(false)}
          availableClasses={classes.map((c) => ({ _id: c._id, title: c.title }))}
          onSuccess={() => {
            toast.success("Manual enrollment completed successfully!");
          }}
        />
      )}
    </div>
  );
}
