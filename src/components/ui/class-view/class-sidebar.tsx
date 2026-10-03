// components/ClassSidebar.tsx
"use client";

import {
  HiShoppingCart,
  HiCalendar,
  HiClock,
  HiArrowRightOnRectangle,
  HiStar,
  HiCheckCircle,
} from "react-icons/hi2";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/dev/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/dev/card";
import { Separator } from "@/components/dev/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dev/dropdown-menu";

import { useAuth } from "@/hooks/useAuth";
import { createMeetingTicket } from "@/services/classService";
import { PaymentProofModal } from "./apply-class";
import ClassAssignments from "./class-assignments";

/* ----------------- Types ----------------- */
type Batch = { batch_name?: string; day: string; start: string; end: string };
type ClassSidebarProps = {
  classData: any;
  onRefetch?: () => void; // ✅ allow parent to refresh data
};

/* ----------------- Helpers ----------------- */
function toBool(v: unknown) {
  if (v === true) return true;
  if (v === false) return false;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return false;
}

const TZ = "Asia/Colombo";
const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || TZ;
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function parseHHMM(timeStr?: string): { hour: number; minute: number } | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3]?.toLowerCase();
    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }
  return null;
}

function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

function minutesFromHHMM(hhmm?: string) {
  if (!hhmm) return NaN;
  const parsed = parseHHMM(hhmm);
  if (parsed) return parsed.hour * 60 + parsed.minute;
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
}
function formatTime12(hhmm?: string) {
  if (!hhmm) return "–";
  const parsed = parseHHMM(hhmm);
  if (parsed) {
    const h12 = ((parsed.hour + 11) % 12) + 1;
    const ampm = parsed.hour >= 12 ? "PM" : "AM";
    return `${h12}:${parsed.minute.toString().padStart(2, "0")} ${ampm}`;
  }
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm ?? "–";
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
function weekdayLowerInTZ(d: Date, tz = TZ) {
  if (!isValidDate(d)) return "";
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" })
    .format(d)
    .toLowerCase();
}
function weekdayShortInTZ(d: Date, tz = TZ) {
  if (!isValidDate(d)) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(d);
}
function monthDayInTZ(d: Date, tz = TZ) {
  if (!isValidDate(d)) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "short",
    day: "2-digit",
  }).format(d);
}
function ymdInTZ(d: Date, tz = TZ) {
  if (!isValidDate(d)) return "";
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
function isCrossingMidnight(start: string, end: string) {
  const s = minutesFromHHMM(start);
  const e = minutesFromHHMM(end);
  return Number.isFinite(s) && Number.isFinite(e) ? e <= s : false;
}
function formatFeeLKR(v: unknown) {
  const num =
    typeof v === "number"
      ? v
      : Number(typeof v === "string" ? v.replace(/[^\d.]/g, "") : v);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    currencyDisplay: "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function buildWeeklySummary(batches: Batch[]) {
  if (!Array.isArray(batches) || !batches.length)
    return "Schedule not available";
  const seen = new Set<string>();
  const normalized: Batch[] = [];
  for (const b of batches) {
    if (!b?.day || !b?.start || !b?.end) continue;
    const key = `${b.day.toLowerCase()}-${b.start}-${b.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ ...b, day: b.day.toLowerCase() });
  }
  normalized.sort(
    (a, b) => DAY_ORDER.indexOf(a.day as any) - DAY_ORDER.indexOf(b.day as any)
  );
  const parts: string[] = [];
  for (const b of normalized) {
    const crosses = isCrossingMidnight(b.start, b.end);
    const nextIdx = (DAY_ORDER.indexOf(b.day as any) + 1) % 7;
    const endDayShort = crosses ? DAY_SHORT[DAY_ORDER[nextIdx]] + " " : "";
    parts.push(
      `${DAY_SHORT[b.day]} ${formatTime12(
        b.start
      )} – ${endDayShort}${formatTime12(b.end)}`
    );
  }
  return parts.length ? parts.join(" · ") : "Schedule not available";
}

function getUpcomingSessions(batches: Batch[], count = 2) {
  const out: { startISO: string; endISO: string }[] = [];
  if (!Array.isArray(batches) || !batches.length) return out;
  const now = new Date();
  for (let offset = 0; offset < 42 && out.length < count; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    const wk = weekdayLowerInTZ(day, TZ);
    for (const b of batches) {
      if (!b?.day || !b?.start || !b?.end) continue;
      if (wk !== String(b.day).toLowerCase()) continue;
      const startParsed = parseHHMM(b.start);
      const endParsed = parseHHMM(b.end);
      if (!startParsed || !endParsed) continue;

      const crosses = isCrossingMidnight(b.start, b.end);
      const startYMD = ymdInTZ(day, TZ);
      if (!startYMD) continue;
      const endBase = new Date(day);
      if (crosses) endBase.setDate(endBase.getDate() + 1);
      const endYMD = ymdInTZ(endBase, TZ);
      if (!endYMD) continue;

      const startISO = `${startYMD}T${String(startParsed.hour).padStart(2, "0")}:${String(startParsed.minute).padStart(2, "0")}:00+05:30`;
      const endISO = `${endYMD}T${String(endParsed.hour).padStart(2, "0")}:${String(endParsed.minute).padStart(2, "0")}:00+05:30`;

      if (isValidDate(new Date(startISO)) && isValidDate(new Date(endISO))) {
        out.push({ startISO, endISO });
      }
      if (out.length >= count) break;
    }
  }
  out.sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
  );
  return out.slice(0, count);
}

function localRangeLabel(startISO: string, endISO: string) {
  if (USER_TZ === TZ) return "";
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (!isValidDate(s) || !isValidDate(e)) return "";
  const sLab = new Intl.DateTimeFormat("en-US", {
    timeZone: USER_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(s);
  const eLab = new Intl.DateTimeFormat("en-US", {
    timeZone: USER_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(e);
  return ` (your time: ${sLab} – ${eLab})`;
}

function monthKeyTZ(d: Date, tz = TZ) {
  const y = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
  }).format(d);
  const m = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    month: "2-digit",
  }).format(d);
  return `${y}-${m}`;
}

function listPastMonths(count = 6) {
  const arr: { value: string; label: string }[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setMonth(base.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const label = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      d
    );
    arr.push({ value, label });
  }
  return arr;
}
const isYearMonth = (v?: string | null) =>
  !!v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

/* ----------------- Small UI pieces ----------------- */
function AuthPromptModal({
  open,
  onClose,
  onLogin,
}: {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl bg-white shadow-lg border border-gray-200">
        <div className="p-5 space-y-4">
          <h3 className="text-lg font-semibold">Log in to continue</h3>
          <p className="text-sm text-gray-600">
            You need to be logged in to enroll and access class resources.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={onLogin}>
              Continue to login
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Main component ----------------- */
export function ClassSidebar({ classData, onRefetch }: ClassSidebarProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [showProof, setShowProof] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [requestedMonth, setRequestedMonth] = useState<string | undefined>(
    undefined
  );
  const [meetingLoading, setMeetingLoading] = useState(false);

  // ✅ optimistic pending months after submit (no refetch needed to show banner)
  const [optimisticPendingMonths, setOptimisticPendingMonths] = useState<string[]>([]);

  const isLoggedIn = Boolean((user as any)?._id || (user as any)?.id);
  const role = (user as any)?.role || "student";
  const isTeacher = (role === "teacher" || role === "admin") ;

  const thisMonthPermission = toBool(
    classData?.thisMonthPermission !== undefined
      ? classData?.thisMonthPermission
      : classData?.hasAccessThisMonth
  );

  const currentMonth = monthKeyTZ(new Date(), TZ);

  // Pending by month from API
  const pendingMonthsFromApi: string[] = useMemo(() => {
    if (Array.isArray(classData?.pendingMonths))
      return classData.pendingMonths.filter(isYearMonth);
    if (Array.isArray(classData?.pendingApplications))
      return classData.pendingApplications
        .map((a: any) => a?.requested_month)
        .filter(isYearMonth);
    return [];
  }, [classData]);

  // ✅ if backend only gives hasApplied=true, treat current month as pending
  const hasAppliedThisMonth =
    toBool(classData?.hasApplied) && !pendingMonthsFromApi.includes(currentMonth);

  // ✅ final effective pending list
  const effectivePendingMonths: string[] = useMemo(() => {
    const set = new Set<string>([
      ...pendingMonthsFromApi,
      ...optimisticPendingMonths,
      ...(hasAppliedThisMonth ? [currentMonth] : []),
    ]);
    return Array.from(set);
  }, [
    pendingMonthsFromApi,
    optimisticPendingMonths,
    hasAppliedThisMonth,
    currentMonth,
  ]);

  const hasPendingThisMonth = effectivePendingMonths.includes(currentMonth);
  const oldPendingMonths = effectivePendingMonths.filter((m) => m !== currentMonth);

  const accessibleMonths: string[] = Array.isArray(classData?.accessibleMonths)
    ? classData.accessibleMonths
    : [];
  const hasAnyAccess = accessibleMonths.length > 0;

  const batches: Batch[] = Array.isArray(classData?.batches)
    ? classData.batches
    : [];
  const weeklySummary = useMemo(() => buildWeeklySummary(batches), [batches]);
  const upcoming = useMemo(() => getUpcomingSessions(batches, 2), [batches]);
  const nextMeetingSession = useMemo(() => {
    const now = new Date();
    return upcoming.find((s) => new Date(s.endISO) > now);
  }, [upcoming]);
  const meetingWindow = useMemo(() => {
    if (!nextMeetingSession) return null;
    const start = new Date(nextMeetingSession.startISO);
    const end = new Date(nextMeetingSession.endISO);
    const windowStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();
    return {
      isOpen: now >= windowStart && now <= end,
      startISO: nextMeetingSession.startISO,
      endISO: nextMeetingSession.endISO,
    };
  }, [nextMeetingSession]);

  const meetingStamp = useMemo(() => {
    if (!nextMeetingSession?.startISO) return null;
    const start = new Date(nextMeetingSession.startISO);
    const date = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      month: "short",
      day: "2-digit",
    })
      .format(start)
      .toUpperCase();
    const time = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
      .format(start)
      .replace(/\u202f|\u00a0/g, " ")
      .replace(/\bAM\b/, "A.M")
      .replace(/\bPM\b/, "P.M");
    return `${date} - ${time}`;
  }, [nextMeetingSession?.startISO]);
  const canShowMeetingButton =
    Boolean(meetingWindow?.isOpen) &&
    isLoggedIn &&
    (isTeacher || thisMonthPermission);

  const feeDisplay = formatFeeLKR(classData?.price ?? classData?.classFee ?? 0);
  const feeNumberOnly = feeDisplay.replace(/^LKR\s*/i, "").trim();

  const onEnrollClick = () => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    setRequestedMonth(undefined);
    setShowProof(true);
  };
  const onEnrollForMonth = (ym: string) => {
    if (!isLoggedIn) {
      setShowAuth(true);
      return;
    }
    setRequestedMonth(ym);
    setShowProof(true);
  };

  const onMeetingClick = async () => {
    if (!canShowMeetingButton || meetingLoading) return;
    try {
      setMeetingLoading(true);
      const mode = isTeacher ? "start" : "join";
      const { redirect } = await createMeetingTicket(classData?._id, mode);
      if (redirect) {
        let finalUrl = redirect;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          // Try to use deep link for Zoom app on mobile
          if (redirect.includes('zoom.us/j/') || redirect.includes('zoom.us/s/')) {
            try {
              const urlObj = new URL(redirect);
              const meetingId = urlObj.pathname.split('/').pop();
              const pwd = urlObj.searchParams.get('pwd');
              const zak = urlObj.searchParams.get('zak');
              const action = redirect.includes('/s/') ? 'start' : 'join';
              if (meetingId) {
                finalUrl = `zoomus://zoom.us/${action}?confno=${meetingId}${pwd ? `&pwd=${pwd}` : ''}${zak ? `&zak=${zak}` : ''}`;
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
    } catch (err) {
      console.error("[ClassSidebar] Meeting start failed:", err);
      alert("Meeting is not available yet. Please try again later.");
    } finally {
      setMeetingLoading(false);
    }
  };

  function ScheduleRow({
    isFirst,
    startISO,
    endISO,
  }: {
    isFirst?: boolean;
    startISO: string;
    endISO: string;
  }) {
    const startDate = new Date(startISO);
    const endDate = new Date(endISO);
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return null;
    }
    const crosses =
      weekdayLowerInTZ(startDate, TZ) !== weekdayLowerInTZ(endDate, TZ);
    const fmt = (d: Date) =>
      formatTime12(
        `${d.getHours().toString().padStart(2, "0")}:${d
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
              isFirst ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {isFirst ? "Next" : weekdayShortInTZ(startDate, TZ)}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {monthDayInTZ(startDate, TZ)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-medium text-sm">
            <HiClock className="w-4 h-4 mr-1" />
            {fmt(startDate)} –{" "}
            {crosses ? `${weekdayShortInTZ(endDate, TZ)} ` : ""}
            {fmt(endDate)}
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3">
          <div className="h-6 w-32 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3">
          <div className="h-5 w-24 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-16 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  /* ---------- Visibility logic ---------- */
  const SHOW_PENDING_CARD = !isTeacher && hasPendingThisMonth;
  const SHOW_DUE_DATES_CARD = isTeacher || thisMonthPermission;
  const SHOW_RENEW_CARD =
    !isTeacher && !thisMonthPermission && !hasPendingThisMonth && hasAnyAccess;
  const SHOW_ENROLL_CARD =
    !isTeacher && !thisMonthPermission && !hasPendingThisMonth && !hasAnyAccess;

  const canSeeAssignments =
    isTeacher || thisMonthPermission || classData?.isPaid;

  const monthLabel = (ym: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      new Date(`${ym}-01T00:00:00Z`)
    );

  return (
    <div className="space-y-5">
      {canShowMeetingButton && nextMeetingSession && (
        <Card className="rounded-xl border border-emerald-200 bg-emerald-50/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Live Session
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              className="w-full h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              onClick={onMeetingClick}
              disabled={meetingLoading}
            >
              {meetingStamp || (isTeacher ? "Start Session" : "Join Session")}
            </Button>
          </CardContent>
        </Card>
      )}
      {/* Pending — ONLY for current month (big card) */}
      {SHOW_PENDING_CARD && (
        <Card className="rounded-xl border border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-amber-900">
              <span className="inline-flex items-center gap-2">
                <HiCheckCircle className="w-4 h-4" />
                Application pending approval
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900/90">
            We’re reviewing your payment for{" "}
            <strong>{monthLabel(currentMonth)}</strong>. You’ll get access as
            soon as it’s approved.
          </CardContent>
        </Card>
      )}

      {/* Renewal / Enroll */}
      {!isTeacher && (
        <>
          {SHOW_RENEW_CARD && (
            <Card className="rounded-xl border border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-blue-900">
                  Renew to access this month
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm text-blue-900/90">
                {/* ✅ persistent inline banner under the fee area */}
                {hasPendingThisMonth && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    You have submitted the payment proof for{" "}
                    <strong>{monthLabel(currentMonth)}</strong>.  
                    It will stay here until it’s approved or rejected.
                  </div>
                )}

                <p>
                  You have access to previous months. Renew to submit and view
                  this month’s items.
                </p>

                <Button
                  className="w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90"
                  onClick={onEnrollClick}
                  disabled={hasPendingThisMonth} // ✅ block re-submit while pending
                >
                  Renew for {feeDisplay}
                </Button>
              </CardContent>
            </Card>
          )}

          {SHOW_ENROLL_CARD && (
            <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
              
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600">
                    <HiCheckCircle className="w-5 h-5" />
                  </span>
                  Join this Class
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Get full access to live sessions, recordings, assignments, and study materials for this month.
                </p>

                {/* ✅ persistent inline banner under the fee area */}
                {hasPendingThisMonth && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
                    <p className="font-semibold mb-1">Application Pending</p>
                    You have submitted the payment proof for{" "}
                    <strong>{monthLabel(currentMonth)}</strong>.  
                    It will stay here until it’s approved or rejected.
                  </div>
                )}

                <Button
                  data-enroll-btn="true"
                  className="w-full h-11 text-sm font-semibold text-white shadow-xs bg-indigo-600 hover:bg-indigo-700 transition-all rounded-xl"
                  onClick={onEnrollClick}
                  disabled={hasPendingThisMonth} // ✅ block re-submit while pending
                  aria-label={isLoggedIn ? "Enroll now" : "Log in to enroll"}
                >
                  {isLoggedIn ? (
                    <>
                      Enroll Now
                      <HiArrowRightOnRectangle className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    <>
                      Log in to Enroll
                      <HiArrowRightOnRectangle className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-gray-400">
                  <span className="flex items-center gap-1">
                    <HiCheckCircle className="w-3.5 h-3.5 text-green-500" />
                    Instant Access
                  </span>
                  <span className="flex items-center gap-1">
                    <HiCheckCircle className="w-3.5 h-3.5 text-green-500" />
                    Secure Checkout
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Previous month enroll */}
          <Card className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50">
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold text-violet-900">
                Enroll for a previous month
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-violet-900/90">
              {!!oldPendingMonths.length && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-violet-900/80">
                    Pending requests:
                  </span>
                  {oldPendingMonths.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center rounded-full bg-white text-violet-800 ring-1 ring-inset ring-violet-200 px-2 py-0.5 text-[11px] font-medium"
                    >
                      {monthLabel(m)}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 justify-between h-10 rounded-lg border border-violet-200 bg-white text-sm"
                    >
                      {requestedMonth
                        ? monthLabel(requestedMonth)
                        : "Month"}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="start" className="w-40">
                    {listPastMonths(6).map((m) => {
                      const disabled = oldPendingMonths.includes(m.value);
                      return (
                        <DropdownMenuItem
                          key={m.value}
                          disabled={disabled}
                          onClick={() => setRequestedMonth(m.value)}
                        >
                          {m.label}
                          {disabled && (
                            <span className="ml-auto text-xs text-green-600">
                              ✓ pending
                            </span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  className="flex-1 h-10 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                  onClick={() => {
                    const target =
                      requestedMonth || listPastMonths(6)[0]?.value;
                    if (target) onEnrollForMonth(target);
                  }}
                >
                  Enroll
                </Button>
              </div>

              <p className="text-[11px] text-violet-900/75">
                You’ll get access to materials for the selected month.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Payment modal */}
      <PaymentProofModal
        open={showProof}
        onClose={() => setShowProof(false)}
        classId={classData?._id}
        classTitle={classData?.title}
        requestedMonth={requestedMonth}
        onSuccess={(ym) => {
          const month = ym || currentMonth;

          // optimistic pending (instant UI)
          setOptimisticPendingMonths((prev) =>
            prev.includes(month) ? prev : [month, ...prev]
          );

          // real refetch
          onRefetch?.();
        }}
      />

      {/* Guest login prompt */}
      <AuthPromptModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onLogin={() => router.push("/login")}
      />

      {/* Schedule */}
      <Card className="rounded-xl border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base font-semibold text-gray-900">
            <HiCalendar className="w-4 h-4 mr-2 text-primary" />
            Class schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-800">{weeklySummary}</div>

          <div className="space-y-2">
            {upcoming.length ? (
              upcoming.map((s, i) => (
                <div key={`${s.startISO}-${i}`} className="space-y-1">
                  <ScheduleRow
                    isFirst={i === 0}
                    startISO={s.startISO}
                    endISO={s.endISO}
                  />
                  {USER_TZ !== TZ && (
                    <p className="text-[11px] text-gray-500 ml-1">
                      {localRangeLabel(s.startISO, s.endISO)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">
                No upcoming sessions. New dates coming — you can still enroll.
              </p>
            )}
          </div>

          <Separator />
          <p className="text-[11px] text-gray-500">
            Times shown in GMT+5:30 ({TZ})
            {USER_TZ !== TZ && ` • Your timezone: ${USER_TZ}`}
          </p>
        </CardContent>
      </Card>

      {/* Assignments board */}
      {canSeeAssignments ? (
        <Card className="rounded-xl border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">
              Class assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClassAssignments ownerId={classData?._id} compact />
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border border-amber-200 bg-amber-50">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold text-amber-900">
              Assignments locked
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-900/90">
            Purchase or enroll in this class to view and submit assignments.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ClassSidebar;
