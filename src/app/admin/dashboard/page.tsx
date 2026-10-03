// app/admin/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/reusable/card-section";
import { ClassCard } from "@/components/reusable/classCard";
import QuizCard from "@/components/ui/quiz/quiz-card";
import { ClayHeroBanner } from "@/components/dashboard/ClayHeroBanner";
import { CompactStatCard } from "@/components/dashboard/CompactStatCard";
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { useAuth } from "@/hooks/useAuth";

import {
  PlusCircle,
  Video,
  ClipboardCheck,
  UserPlus,
  BookOpen,
  GraduationCap,
  ListChecks,
} from "lucide-react";

import {
  HiFolderOpen,
  HiChartBar,
  HiArrowTrendingUp,
  HiPresentationChartLine,
  HiFire,
} from "react-icons/hi2";

import { getClasses } from "@/services/classService";
import { getAllQuizzesForPlay } from "@/services/quizService";

const DASHBOARD_TZ = "Asia/Colombo";
const DASHBOARD_TZ_OFFSET = "+05:30";

type ClassTimeSlot = {
  day: string;
  start: string;
  end: string;
};

type Action = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const quickActions: Action[] = [
  {
    id: "create-class",
    label: "Create class",
    href: "/admin/classes/add",
    icon: PlusCircle,
  },
  {
    id: "create-recording",
    label: "Create recording",
    href: "/admin/recording/add",
    icon: Video,
  },
  {
    id: "create-quiz",
    label: "Create quiz",
    href: "/admin/quizzes/add",
    icon: ClipboardCheck,
  },
  {
    id: "enroll-students",
    label: "Enroll students",
    href: "/admin/classes/applications",
    icon: UserPlus,
  },
  {
    id: "qa-download-assignments",
    label: "Papers Download",
    href: "/admin/classes/assignment",
    icon: HiFolderOpen,
  },
];

function minutesFromHHMM(hhmm?: string) {
  if (!hhmm) return NaN;
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
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

function getNextSessionStartISO(slots: ClassTimeSlot[], tz = DASHBOARD_TZ) {
  if (!Array.isArray(slots) || !slots.length) return null;
  const now = new Date();
  let best: string | null = null;
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
      const startISO = `${startYMD}T${s.start}:00${DASHBOARD_TZ_OFFSET}`;
      if (!best || new Date(startISO).getTime() < new Date(best).getTime()) {
        best = startISO;
      }
    }
  }
  return best;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const isModerator = user?.role === "moderator";

  const [classes, setClasses] = useState<any[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [classesRes, quizzesRes] = await Promise.all([
          getClasses(),
          getAllQuizzesForPlay(),
        ]);
        setClasses(classesRes || []);
        
        // Sort quizzes by created_at desc and take top 3
        const sortedQuizzes = (quizzesRes || [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
        setRecentQuizzes(sortedQuizzes);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }
    fetchData();
  }, []);

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
      const nextStartISO = getNextSessionStartISO(slots);
      return { classItem, nextStartISO };
    })
    .filter((entry) => Boolean(entry.nextStartISO))
    .sort(
      (a, b) =>
        new Date(a.nextStartISO as string).getTime() -
        new Date(b.nextStartISO as string).getTime()
    )
    .slice(0, 3)
    .map((entry) => entry.classItem);

  return (
    <div className="relative bg-[#f9fafb] min-h-screen pb-20 px-4 md:px-6 space-y-8">
      {/* 3D Clay Hero Banner */}
      <ClayHeroBanner
        variant="admin"
        title={isModerator ? "Moderator Station" : "Hello, Admin 👋"}
        description={
          classes.length > 0
            ? `Have a Nice Day! You have ${upcomingClasses.length} live classes scheduled to manage today.`
            : "Monitor active courses, upcoming live streams, student enrollments, and quiz challenges."
        }
        badge={isModerator ? "Moderator Desk" : "SUPERADMIN ID: 0"}
        mascotSrc={isModerator ? CLAY_ASSETS.bannerModeratorDesk : CLAY_ASSETS.bannerAdminStation}
        cta={{
          label: "Create Live Class",
          href: "/admin/classes/add",
          icon: Video,
        }}
        secondaryCta={{
          label: "Enrollments",
          href: "/admin/classes/applications",
        }}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <CompactStatCard
          label="Total Classes"
          value={classes.length}
          status="blue"
          href="/admin/classes"
        />
        <CompactStatCard
          label="Upcoming Sessions"
          value={upcomingClasses.length}
          status="emerald"
          badge="Live Roster"
        />
        <CompactStatCard
          label="Active Quizzes"
          value={recentQuizzes.length}
          status="purple"
          href="/admin/quizzes"
        />
        <CompactStatCard
          label="Platform Store"
          value="Manage"
          status="amber"
          href="/admin/store"
        />
      </div>

      {/* Quick Actions */}
      <section className="relative z-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="group flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 text-center"
            >
              <div className="p-3 rounded-full bg-gray-100 group-hover:bg-gray-200 transition">
                <action.icon className="w-6 h-6 text-gray-700" />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-gray-900">
                {action.label}
              </h4>
            </Link>
          ))}
        </div>
      </section>

      {/* 🎓 Classes & Scheduled Sessions Layout (Screenshots 1 & 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: My Classes */}
        <div className="lg:col-span-8">
          <CardSection
            title="My Classes"
            description="Active course modules, curriculum taxonomies, and enrollments."
            icon={BookOpen}
            viewAllLabel="Manage Classes"
            onViewAll={() => router.push("/admin/classes")}
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
        </div>

        {/* Right Column: Scheduled Classes Card with Couch Illustration (Screenshots 1 & 4) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between min-h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center border border-rose-100 shadow-2xs">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Scheduled Classes</h3>
                  <p className="text-[11px] text-slate-500">Today&apos;s Live Broadcasts</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {upcomingClasses.length} Scheduled
              </span>
            </div>

            {upcomingClasses.length > 0 ? (
              <div className="space-y-3 py-3">
                {upcomingClasses.slice(0, 2).map((classItem: any) => (
                  <div
                    key={classItem._id}
                    className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {classItem.title}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Ready
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/classes/${classItem._id}`)}
                      className="w-full h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      Start Session
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="relative w-44 h-44 drop-shadow-sm mb-2">
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
                  New sessions will display here once scheduled.
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/classes/add")}
              className="w-full mt-auto rounded-xl border-dashed border-rose-200 text-rose-600 hover:bg-rose-50/50 hover:border-rose-300 text-xs font-semibold"
            >
              + Schedule Live Class
            </Button>
          </div>
        </div>
      </div>

      {/* 🧠 Quizzes Section */}
      <CardSection
        title="All Quizzes Available"
        description="දන්න දේ හරියටම හරිද බලන්න. Quiz එකක් කරන්​න"
        icon={ListChecks}
        onViewAll={() => router.push("/quizzes")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentQuizzes.map((quiz: any) => (
            <QuizCard key={quiz._id} quiz={quiz} />
          ))}
        </div>
      </CardSection>
    </div>
  );
}
