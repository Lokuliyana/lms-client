// components/ClassSidebar.tsx
"use client";

import {
  HiShoppingCart,
  HiCalendar,
  HiClock,
  HiArrowRightOnRectangle,
  HiStar,
  HiCheckCircle,
  HiVideoCamera,
  HiPencilSquare,
  HiChevronDown,
  HiLockClosed,
  HiArrowPath,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dev/dialog";
import { Input } from "@/components/dev/input";
import { Label } from "@/components/dev/label";

import { useAuth } from "@/hooks/useAuth";
import { createMeetingTicket, updateClass } from "@/services/classService";
import { PaymentProofModal } from "./apply-class";
import ClassAssignments from "./class-assignments";
import { cn } from "@/lib/utils";

/* ----------------- Types ----------------- */
type Batch = { batch_name?: string; day: string; start: string; end: string; days?: string[] };
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
  const out: { startISO: string; endISO: string; batchName?: string }[] = [];
  if (!Array.isArray(batches) || !batches.length) return out;
  const now = new Date();
  for (let offset = 0; offset < 42 && out.length < count; offset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + offset);
    const wk = weekdayLowerInTZ(day, TZ);
    for (const b of batches) {
      if (!b?.start || !b?.end) continue;
      const bDays = Array.isArray(b.days) && b.days.length > 0 ? b.days : b.day ? [b.day] : [];
      if (!bDays.some((d) => String(d).toLowerCase() === wk)) continue;
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
        // Only collect future or currently active sessions
        if (new Date(endISO).getTime() > now.getTime()) {
          out.push({ startISO, endISO, batchName: b.batch_name });
        }
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

  const [quickZoomOpen, setQuickZoomOpen] = useState(false);
  const [sidebarZoomTab, setSidebarZoomTab] = useState<"weekly" | "special">("weekly");
  const [quickJoinUrl, setQuickJoinUrl] = useState(classData?.zoom_join_url || "");
  const [quickStartUrl, setQuickStartUrl] = useState(classData?.zoom_start_url || "");
  const [quickSpecial, setQuickSpecial] = useState({
    title: classData?.special_session?.title || "",
    date: classData?.special_session?.date || "",
    start: classData?.special_session?.start || "",
    end: classData?.special_session?.end || "",
    zoom_meeting_id: classData?.special_session?.zoom_meeting_id || "",
    zoom_join_url: classData?.special_session?.zoom_join_url || "",
    zoom_start_url: classData?.special_session?.zoom_start_url || "",
    is_active: Boolean(classData?.special_session?.is_active),
    description: classData?.special_session?.description || "",
  });
  const [quickSaving, setQuickSaving] = useState(false);

  const isLoggedIn = Boolean((user as any)?._id || (user as any)?.id);
  const role = String((user as any)?.role || "student").toLowerCase().trim();
  const currentUserId = String((user as any)?._id || (user as any)?.id || (user as any)?.userId || "");
  const isTeacher = role === "teacher" || role === "admin" || role === "moderator";
  const isTutor = Boolean(
    currentUserId &&
    (String(classData?.created_by) === currentUserId ||
     String(classData?.tutor?._id || classData?.tutor) === currentUserId)
  );
  const canStartMeeting = isTeacher || isTutor;

  const hasPurchasedOrAccess = Boolean(
    canStartMeeting ||
    classData?.has_access ||
    classData?.hasAccess ||
    classData?.is_enrolled ||
    classData?.isEnrolled ||
    classData?.isPaid ||
    classData?.hasAccessThisMonth ||
    classData?.thisMonthPermission ||
    (currentUserId && Array.isArray(classData?.enrolledUsers) && classData.enrolledUsers.some((id: any) => String(id) === currentUserId)) ||
    (currentUserId && Array.isArray(classData?.enrolled_students) && classData.enrolled_students.some((s: any) => String(s?._id || s) === currentUserId)) ||
    (currentUserId && Array.isArray(classData?.students) && classData.students.some((s: any) => String(s?._id || s) === currentUserId))
  );

  const thisMonthPermission = toBool(
    classData?.thisMonthPermission !== undefined
      ? classData?.thisMonthPermission
      : classData?.hasAccessThisMonth !== undefined
      ? classData?.hasAccessThisMonth
      : hasPurchasedOrAccess
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

  const batches: Batch[] = useMemo(() => {
    const raw = Array.isArray(classData?.batches) && classData.batches.length > 0
      ? classData.batches
      : Array.isArray(classData?.classTime) && classData.classTime.length > 0
      ? classData.classTime
      : [];
    return raw.flatMap((b: any) => {
      const start = b.start || b.start_time || b.startTime || "";
      const end = b.end || b.end_time || b.endTime || "";
      const batch_name = b.batch_name || b.name || "";
      if (Array.isArray(b.days) && b.days.length > 0) {
        return b.days.map((day: string) => ({ day, start, end, batch_name }));
      }
      if (b.day && start && end) {
        return [{ day: b.day, start, end, batch_name }];
      }
      return [];
    });
  }, [classData?.batches, classData?.classTime]);

  const weeklySummary = useMemo(() => buildWeeklySummary(batches), [batches]);
  const upcoming = useMemo(() => getUpcomingSessions(batches, 2), [batches]);
  const nextMeetingSession = useMemo(() => {
    const now = new Date();
    return upcoming.find((s) => new Date(s.endISO).getTime() > now.getTime()) || null;
  }, [upcoming]);

  const meetingWindow = useMemo(() => {
    if (!nextMeetingSession) return null;
    const start = new Date(nextMeetingSession.startISO);
    const end = new Date(nextMeetingSession.endISO);
    const now = new Date();
    // 30-hour window (or active session in progress) to cover next-day / 24hrs scheduled sessions
    const windowStartMs = start.getTime() - 30 * 60 * 60 * 1000;
    const isLiveNow = now.getTime() >= start.getTime() && now.getTime() <= end.getTime();
    const isOpen = now.getTime() >= windowStartMs && now.getTime() <= end.getTime();
    return {
      isOpen,
      isLiveNow,
      startISO: nextMeetingSession.startISO,
      endISO: nextMeetingSession.endISO,
      batchName: nextMeetingSession.batchName,
    };
  }, [nextMeetingSession]);

  const liveSessionFormattedRange = useMemo(() => {
    if (!nextMeetingSession?.startISO || !nextMeetingSession?.endISO) return null;
    const start = new Date(nextMeetingSession.startISO);
    const end = new Date(nextMeetingSession.endISO);
    const date = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      weekday: "short",
      month: "short",
      day: "2-digit",
    }).format(start);
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d).replace(/\u202f|\u00a0/g, " ");
    return `${date} • ${fmt(start)} – ${fmt(end)}`;
  }, [nextMeetingSession?.endISO, nextMeetingSession?.startISO]);

  const canShowMeetingButton =
    Boolean(meetingWindow?.isOpen) &&
    isLoggedIn &&
    (canStartMeeting || hasPurchasedOrAccess);

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
      const mode = canStartMeeting ? "start" : "join";
      const { redirect } = await createMeetingTicket(classData?._id, mode, "regular");
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
              const uname = urlObj.searchParams.get('uname');
              const action = redirect.includes('/s/') ? 'start' : 'join';
              if (meetingId) {
                finalUrl = `zoomus://zoom.us/${action}?confno=${meetingId}${pwd ? `&pwd=${pwd}` : ''}${zak ? `&zak=${zak}` : ''}${uname ? `&uname=${encodeURIComponent(uname)}` : ''}`;
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
      console.error("[ClassSidebar] Meeting start failed:", err);
      const msg = err?.response?.data?.message || err?.message || "Meeting is not available yet. Please try again later.";
      alert(msg);
    } finally {
      setMeetingLoading(false);
    }
  };

  const onSpecialMeetingClick = async () => {
    if (meetingLoading) return;
    try {
      setMeetingLoading(true);
      const mode = isTeacher ? "start" : "join";
      const { redirect } = await createMeetingTicket(classData?._id, mode, "special");
      if (redirect) {
        window.open(redirect, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("[ClassSidebar] Special meeting start failed:", err);
      alert("Special meeting is not available yet. Please check again later.");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleQuickZoomSave = async () => {
    try {
      setQuickSaving(true);
      await updateClass(classData._id, {
        zoom_join_url: quickJoinUrl.trim() || undefined,
        zoom_start_url: quickStartUrl.trim() || undefined,
        special_session: quickSpecial,
      });
      setQuickZoomOpen(false);
      onRefetch?.();
    } catch (err) {
      console.error("Failed to update Zoom settings:", err);
      alert("Failed to update Zoom settings.");
    } finally {
      setQuickSaving(false);
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
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isFirst ? "bg-indigo-600 text-white shadow-2xs" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {isFirst ? "Next" : weekdayShortInTZ(startDate, TZ)}
          </span>
          <span className="text-xs font-semibold text-slate-800">
            {monthDayInTZ(startDate, TZ)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-indigo-700 font-semibold text-xs shadow-2xs">
            <HiClock className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            {fmt(startDate)} – {crosses ? `${weekdayShortInTZ(endDate, TZ)} ` : ""}{fmt(endDate)}
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
      {/* Special Live Session Card (Highlight) */}
      {classData?.special_session?.is_active && (
        <Card className="rounded-xl border border-rose-300 bg-rose-50/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-rose-100/80 to-amber-100/60 border-b border-rose-200/60 py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                Special Live Session
              </CardTitle>
              {classData.special_session.date && (
                <span className="text-[11px] font-semibold text-rose-700 bg-white/80 px-2 py-0.5 rounded-full border border-rose-200">
                  {classData.special_session.date}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2.5">
            <h4 className="font-semibold text-slate-800 text-sm">
              {classData.special_session.title || "Ad-hoc Live Seminar"}
            </h4>
            {(classData.special_session.start || classData.special_session.end) && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5">
                <HiClock className="w-3.5 h-3.5 text-rose-500" />
                {classData.special_session.start || ""} - {classData.special_session.end || ""} (Colombo Time)
              </p>
            )}
            {classData.special_session.description && (
              <p className="text-xs text-slate-600 bg-white/70 p-2 rounded-lg border border-rose-100">
                {classData.special_session.description}
              </p>
            )}

            {(isTeacher || thisMonthPermission) ? (
              <Button
                className="w-full h-10 font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs text-xs mt-1"
                onClick={onSpecialMeetingClick}
                disabled={meetingLoading}
              >
                <HiVideoCamera className="w-4 h-4 mr-1.5" />
                {isTeacher ? "Start Special Session" : "Join Special Session"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full h-10 font-medium border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100 text-xs mt-1 rounded-xl gap-1.5"
                onClick={onEnrollClick}
              >
                <HiLockClosed className="w-4 h-4 mr-1.5" />
                Enroll in Class to Join Live Sessions
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Teacher / Admin Quick Zoom Updater Button */}
      {isTeacher && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuickJoinUrl(classData?.zoom_join_url || "");
              setQuickStartUrl(classData?.zoom_start_url || "");
              setQuickSpecial({
                title: classData?.special_session?.title || "",
                date: classData?.special_session?.date || "",
                start: classData?.special_session?.start || "",
                end: classData?.special_session?.end || "",
                zoom_meeting_id: classData?.special_session?.zoom_meeting_id || "",
                zoom_join_url: classData?.special_session?.zoom_join_url || "",
                zoom_start_url: classData?.special_session?.zoom_start_url || "",
                is_active: Boolean(classData?.special_session?.is_active),
                description: classData?.special_session?.description || "",
              });
              setQuickZoomOpen(true);
            }}
            className="text-xs h-8 border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg gap-1.5"
          >
            <HiPencilSquare className="w-3.5 h-3.5" />
            Quick Update Zoom & Links
          </Button>
        </div>
      )}

      {/* Regular Live Session Card (Within 24 Hours / Live Now) */}
      {meetingWindow?.isOpen && nextMeetingSession && (
        canShowMeetingButton ? (
          <Card className={`rounded-2xl overflow-hidden shadow-sm transition-all border ${
            meetingWindow.isLiveNow 
              ? "border-emerald-400 bg-gradient-to-b from-emerald-50/90 to-white" 
              : "border-indigo-200 bg-gradient-to-b from-indigo-50/70 to-white"
          }`}>
            <CardHeader className="pb-2.5 pt-3.5 px-4 border-b border-slate-100/80">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <span className="relative flex h-2.5 w-2.5">
                    {meetingWindow.isLiveNow ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    )}
                  </span>
                  {meetingWindow.isLiveNow ? "Live Session In Progress" : "Upcoming Live Session"}
                </CardTitle>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                  meetingWindow.isLiveNow 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300" 
                    : "bg-indigo-100 text-indigo-800 border-indigo-200"
                }`}>
                  {meetingWindow.isLiveNow ? "Live Now" : "Within 24h"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-3 pb-4 px-4 space-y-3">
              {nextMeetingSession.batchName && (
                <div className="text-xs font-semibold text-slate-800">
                  {nextMeetingSession.batchName}
                </div>
              )}
              {liveSessionFormattedRange && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                  <HiClock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{liveSessionFormattedRange}</span>
                </p>
              )}

              <Button
                className={`w-full h-11 font-bold text-white shadow-sm rounded-xl flex items-center justify-center gap-2 text-xs transition-all ${
                  meetingWindow.isLiveNow
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
                onClick={onMeetingClick}
                disabled={meetingLoading}
              >
                {meetingLoading ? (
                  <>
                    <HiArrowPath className="w-4 h-4 animate-spin mr-1" />
                    Connecting to Zoom...
                  </>
                ) : (
                  <>
                    <HiVideoCamera className="w-4 h-4 mr-0.5" />
                    <span>{canStartMeeting ? "Start Live Session" : "Join Live Session"}</span>
                  </>
                )}
              </Button>
              <p className="text-[10px] text-center text-slate-500">
                {canStartMeeting 
                  ? "Tutor / Host Mode: Launching will open the meeting host session."
                  : "Enrolled Student Access: Launching will connect you to live class."}
              </p>
            </CardContent>
          </Card>
        ) : !canStartMeeting ? (
          <Card className="rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/80 to-white p-4 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mt-0.5 border border-amber-200">
                <HiLockClosed className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900">
                    {meetingWindow.isLiveNow ? "Live Session In Progress" : "Live Session Scheduled"}
                  </p>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    {meetingWindow.isLiveNow ? "Live" : "24h"}
                  </span>
                </div>
                {liveSessionFormattedRange && (
                  <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                    <HiClock className="w-3 h-3 text-slate-400" />
                    {liveSessionFormattedRange}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Enroll in this class to receive instant Zoom meeting access and participate in live lectures.
                </p>
              </div>
            </div>
            <Button
              className="w-full h-10 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-xs gap-1.5"
              onClick={onEnrollClick}
            >
              <HiLockClosed className="w-4 h-4 text-amber-300" />
              Enroll in Class to Join Live Sessions
            </Button>
          </Card>
        ) : null
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
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <HiClock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Past Month Access
                </h4>
              </div>
              <span className="text-[11px] font-medium text-slate-400">Archive</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Need lecture recordings or materials from earlier months? Select a month to request access.
            </p>

            {!!oldPendingMonths.length && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Pending:
                </span>
                {oldPendingMonths.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 px-2.5 py-0.5 text-[11px] font-semibold"
                  >
                    {monthLabel(m)}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-between h-9 rounded-xl border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-xs font-semibold text-slate-700"
                  >
                    <span>{requestedMonth ? monthLabel(requestedMonth) : "Select Month"}</span>
                    <HiChevronDown className="w-3.5 h-3.5 ml-1 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-44 rounded-xl shadow-lg">
                  {listPastMonths(6).map((m) => {
                    const disabled = oldPendingMonths.includes(m.value);
                    return (
                      <DropdownMenuItem
                        key={m.value}
                        disabled={disabled}
                        onClick={() => setRequestedMonth(m.value)}
                        className="text-xs font-medium cursor-pointer"
                      >
                        {m.label}
                        {disabled && (
                          <span className="ml-auto text-[10px] font-semibold text-amber-600">
                            pending
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                className="h-9 px-4 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs shrink-0"
                onClick={() => {
                  const target =
                    requestedMonth || listPastMonths(6)[0]?.value;
                  if (target) onEnrollForMonth(target);
                }}
              >
                Enroll
              </Button>
            </div>
          </div>
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
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <HiCalendar className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Class Schedule
            </h4>
          </div>
        </div>

        {weeklySummary && (
          <p className="text-xs font-medium text-slate-600 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 leading-relaxed">
            {weeklySummary}
          </p>
        )}

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
                  <p className="text-[10px] text-slate-400 ml-1">
                    {localRangeLabel(s.startISO, s.endISO)}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2 text-center">
              No upcoming sessions. New dates coming — you can still enroll.
            </p>
          )}
        </div>

        <div className="pt-1 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">
            Times shown in GMT+5:30 ({TZ})
            {USER_TZ !== TZ && ` • Your timezone: ${USER_TZ}`}
          </p>
        </div>
      </div>

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

      {/* Quick Zoom Modal */}
      <Dialog open={quickZoomOpen} onOpenChange={setQuickZoomOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <HiVideoCamera className="w-5 h-5 text-rose-500" />
              Update Zoom & Live Session
            </DialogTitle>
          </DialogHeader>

          {/* Dedicated Tab Switcher */}
          <div className="flex border-b border-slate-200 mt-2 mb-4">
            <button
              type="button"
              onClick={() => setSidebarZoomTab("weekly")}
              className={cn(
                "flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5",
                sidebarZoomTab === "weekly"
                  ? "border-rose-600 text-rose-700"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <HiVideoCamera className="w-3.5 h-3.5" />
              <span>Weekly Zoom Link</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarZoomTab("special")}
              className={cn(
                "flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5",
                sidebarZoomTab === "special"
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <HiClock className="w-3.5 h-3.5" />
              <span>Special Live Session</span>
              {quickSpecial.is_active && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
            </button>
          </div>

          {sidebarZoomTab === "weekly" ? (
            <div className="space-y-4 pt-1 text-xs animate-in fade-in duration-150">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                Update the recurring meeting link used for normal weekly classes.
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Weekly Student Zoom Join URL</Label>
                <Input
                  placeholder="https://zoom.us/j/..."
                  value={quickJoinUrl}
                  onChange={(e) => setQuickJoinUrl(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-700">Weekly Host Start URL (Optional)</Label>
                <Input
                  placeholder="https://zoom.us/s/..."
                  value={quickStartUrl}
                  onChange={(e) => setQuickStartUrl(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <span className="font-semibold text-amber-900 block">Enable Special Session</span>
                  <span className="text-[10px] text-amber-700">Display highlighted seminar banner to students</span>
                </div>
                <input
                  type="checkbox"
                  checked={quickSpecial.is_active}
                  onChange={(e) => setQuickSpecial(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </div>

              {quickSpecial.is_active && (
                <div className="space-y-3 pt-1">
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Special Session Title</Label>
                    <Input
                      placeholder="e.g. Extra Paper Discussion"
                      value={quickSpecial.title}
                      onChange={(e) => setQuickSpecial(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Date</Label>
                      <Input
                        type="date"
                        value={quickSpecial.date}
                        onChange={(e) => setQuickSpecial(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Time</Label>
                      <Input
                        placeholder="Start - End"
                        value={quickSpecial.start}
                        onChange={(e) => setQuickSpecial(prev => ({ ...prev, start: e.target.value }))}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">Special Zoom Join URL</Label>
                    <Input
                      placeholder="https://zoom.us/j/..."
                      value={quickSpecial.zoom_join_url}
                      onChange={(e) => setQuickSpecial(prev => ({ ...prev, zoom_join_url: e.target.value }))}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setQuickZoomOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={quickSaving} onClick={handleQuickZoomSave}>
              {quickSaving ? "Saving..." : "Save Links"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ClassSidebar;
