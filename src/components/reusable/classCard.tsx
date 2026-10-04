"use client";

import Image from "next/image";
import type { FC, ReactNode } from "react";
import {
  HiAcademicCap,
  HiUserGroup,
  HiBookOpen,
  HiTrash,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import { createMeetingTicket, deleteClass as deleteClassApi } from "@/services/classService";
import { getSignedUrl } from "@/services/mediaService";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";
import { getSubjectPastelTheme, getSubjectThumbnail } from "@/constants/clayAssets";

/** Label groups unchanged */
type LabelGroup = "grade" | "subject" | "student";

interface Label {
  value: string;
  group: LabelGroup;
}

interface ClassTimeSlot {
  day: string;
  start: string;
  end: string;
}

interface ClassCardProps {
  id: string;
  classId?: number | string;
  image?: string;
  imagePath?: string;
  title: string;
  description?: string;
  labels?: Label[];
  classTime?: ClassTimeSlot[];
  classFee?: string | number;
  href: string;
  ctaLabel?: ReactNode;
  showLabelIcons?: boolean;
  className?: string;
  subject?: any;
  grade?: any;
  price?: number;
  batches?: any[];
  isEnrolled?: boolean;
  hasAccessThisMonth?: boolean;
  teacher?: any;
  teacherName?: string;
}

const iconMap: Record<LabelGroup, ReactNode> = {
  grade: <HiAcademicCap className="text-primary text-sm" />,
  subject: <HiBookOpen className="text-primary text-sm" />,
  student: <HiUserGroup className="text-primary text-sm" />,
};

// LKR formatting (comma separated; uses “Rs” prefix)
const formatLKR = (v: string | number) => {
  const num = Number(v);
  if (!isFinite(num)) return String(v);
  try {
    // en-LK shows "Rs 1,200.00". Trim decimals.
    const fmt = new Intl.NumberFormat("en-LK", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(num);
    return fmt.replace(/\u00A0/g, " "); // normalize nbsp
  } catch {
    return num.toLocaleString("en-LK");
  }
};

const MEETING_TZ = "Asia/Colombo";
const MEETING_TZ_OFFSET = "+05:30";
const MEETING_WINDOW_HOURS = 24;

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

function weekdayLowerInTZ(d: Date, tz = MEETING_TZ) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" })
    .format(d)
    .toLowerCase();
}

function ymdInTZ(d: Date, tz = MEETING_TZ) {
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

function getUpcomingSessions(
  slots: ClassTimeSlot[],
  count = 1,
  tz = MEETING_TZ
) {
  const out: { startISO: string; endISO: string }[] = [];
  if (!Array.isArray(slots) || !slots.length) return out;
  const now = new Date();
  for (let offset = 0; offset < 42 && out.length < count; offset++) {
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
      out.push({
        startISO: `${startYMD}T${s.start}:00${MEETING_TZ_OFFSET}`,
        endISO: `${endYMD}T${s.end}:00${MEETING_TZ_OFFSET}`,
      });
      if (out.length >= count) break;
    }
  }
  out.sort(
    (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
  );
  return out.slice(0, count);
}

export const ClassCard: FC<ClassCardProps> = ({
  id,
  classId,
  image,
  imagePath,
  title,
  description,
  labels = [],
  classTime,
  classFee,
  href,
  ctaLabel = "Join Now",
  showLabelIcons = true,
  className = "",
  subject,
  grade,
  price,
  batches = [],
  isEnrolled = false,
  hasAccessThisMonth = false,
  teacher,
  teacherName,
}) => {
  const normalizedLabels: Label[] = useMemo(() => {
    const rawList: Label[] = [...labels];
    if (!rawList.some((l) => l.group === "grade") && grade) {
      const gVal =
        typeof grade === "object" && grade !== null
          ? grade.name || grade.title || formatGradeName(grade)
          : String(grade);
      rawList.push({ value: gVal, group: "grade" });
    }
    if (!rawList.some((l) => l.group === "subject") && subject) {
      const sVal =
        typeof subject === "object" && subject !== null
          ? subject.name || subject.title || formatSubjectName(subject)
          : String(subject);
      rawList.push({ value: sVal, group: "subject" });
    }

    return rawList
      .map((l) => {
        if (l.group === "grade") {
          return { ...l, value: formatGradeName(l.value) };
        }
        if (l.group === "subject") {
          return { ...l, value: formatSubjectName(l.value) };
        }
        return l;
      })
      .filter((l) => Boolean(l.value) && l.value !== "Grade" && l.value !== "Subject");
  }, [labels, grade, subject]);

  const { user, loading } = useAuth();
  const router = useRouter();
  const isTeacher = (user?.role === "teacher" || user?.role === "admin");
  const isAdmin = user?.role === "admin";
  const canStartMeeting = isTeacher || isAdmin;
  const isLoggedIn = Boolean(user);
  const [deleting, setDeleting] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);

  const rawSubjectString = useMemo(() => {
    if (typeof subject === "string" && subject) return subject;
    if (typeof subject === "object" && subject !== null) {
      return subject.name || subject.title || "";
    }
    const foundLabel = normalizedLabels.find((l) => l.group === "subject")?.value;
    if (foundLabel) return foundLabel;
    return title;
  }, [subject, normalizedLabels, title]);

  const defaultThumbnail = useMemo(() => {
    return getSubjectThumbnail(rawSubjectString);
  }, [rawSubjectString]);

  const pastelTheme = useMemo(() => {
    return getSubjectPastelTheme(rawSubjectString);
  }, [rawSubjectString]);

  const displayClassId = useMemo(() => {
    if (classId !== undefined && classId !== null && String(classId).trim() !== "") {
      return String(classId).trim();
    }
    if (!id) return "";
    const clean = String(id).trim();
    if (clean.length <= 4) return clean;
    return clean.slice(-4).toUpperCase();
  }, [classId, id]);

  const displayTeacherName = useMemo(() => {
    if (teacherName) return teacherName;
    if (typeof teacher === "string" && teacher.trim()) return teacher.trim();
    if (teacher?.full_name) return teacher.full_name;
    if (teacher?.name) return teacher.name;
    return "";
  }, [teacher, teacherName]);

  // ---------- IMAGE RESOLUTION (Supabase-aware) ----------
  const [resolvedImageSrc, setResolvedImageSrc] =
    useState<string>(defaultThumbnail);

  useEffect(() => {
    let cancelled = false;
    const isHttp = (url?: string) => !!url && /^https?:\/\//i.test(url);

    const resolve = async () => {
      if (isHttp(image)) {
        if (!cancelled) setResolvedImageSrc(image as string);
        return;
      }
      if (imagePath) {
        try {
          const url = await getSignedUrl(imagePath, 60 * 60);
          if (!cancelled) setResolvedImageSrc(url);
          return;
        } catch (err) {
          console.error("[ClassCard] Failed to get signed URL:", err);
        }
      }
      if (image && !isHttp(image)) {
        if (String(image).startsWith("/")) {
          if (!cancelled) setResolvedImageSrc(image as string);
          return;
        }
        const base =
          process.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
          (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/uploads` : "http://localhost:4002/uploads");
        if (!cancelled) setResolvedImageSrc(`${base}/${image}`);
        return;
      }
      if (!cancelled) setResolvedImageSrc(defaultThumbnail);
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [image, imagePath, defaultThumbnail]);

  const [refreshNonce, setRefreshNonce] = useState(0);
  const handleImageError = async () => {
    if (imagePath) {
      try {
        const url = await getSignedUrl(imagePath, 60 * 60);
        setResolvedImageSrc(url + `#${Date.now()}`);
        setRefreshNonce((n) => n + 1);
      } catch (e) {
        console.error("[ClassCard] Refresh signed URL failed:", e);
        setResolvedImageSrc(defaultThumbnail);
      }
    } else {
      setResolvedImageSrc(defaultThumbnail);
    }
  };

  // ---------- DELETE ----------
  const handleDelete = async () => {
    if (!isTeacher || deleting) return;
    const ok = window.confirm("Are you sure you want to delete this class?");
    if (!ok) return;
    try {
      setDeleting(true);
      await deleteClassApi(id);
      router.refresh();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to delete class. Please try again.");
    } finally {
      setDeleting(false);
    }
  };


  const gradeLabel = normalizedLabels.find((l) => l.group === "grade") || null;
  const subjectLabels = normalizedLabels.filter((l) => l.group === "subject");

  const titleWithoutGrade = useMemo(() => {
    if (!gradeLabel) return title;
    return title.replace(gradeLabel.value, "").trim();
  }, [title, gradeLabel]);

  const classTimes: ClassTimeSlot[] = useMemo(() => {
    if (classTime?.length) return classTime;
    if (Array.isArray(batches)) {
      return batches.flatMap((batch) => {
        if (Array.isArray(batch.days)) {
          return batch.days.map((day: string) => ({
            day,
            start: batch.start_time || batch.start || "",
            end: batch.end_time || batch.end || "",
          }));
        }
        if (batch.day) {
          return [
            {
              day: batch.day,
              start: batch.start || batch.start_time || "",
              end: batch.end || batch.end_time || "",
            },
          ];
        }
        return [];
      });
    }
    return [];
  }, [classTime, batches]);

  const resolvedFee = classFee ?? (price ? price.toString() : undefined);
  const showNextSessionDetails =
    isAdmin || isTeacher || (isEnrolled && hasAccessThisMonth);
  const nextSession = useMemo(() => {
    const upcoming = getUpcomingSessions(classTimes, 4);
    const now = new Date();
    return upcoming.find((s) => new Date(s.endISO) > now) || null;
  }, [classTimes]);
  const isLiveNow = useMemo(() => {
    if (!nextSession || !showNextSessionDetails) return false;
    const now = new Date();
    const start = new Date(nextSession.startISO);
    const end = new Date(nextSession.endISO);
    return now >= start && now <= end;
  }, [nextSession, showNextSessionDetails]);
  const meetingWindow = useMemo(() => {
    const upcoming = getUpcomingSessions(classTimes, 2);
    const now = new Date();
    const next = upcoming.find((s) => new Date(s.endISO) > now);
    if (!next) return null;
    const start = new Date(next.startISO);
    const end = new Date(next.endISO);
    const windowStart = new Date(
      start.getTime() - MEETING_WINDOW_HOURS * 60 * 60 * 1000
    );
    return {
      isOpen: now >= windowStart && now <= end,
      startISO: next.startISO,
      endISO: next.endISO,
    };
  }, [classTimes]);

  const canShowMeetingButton =
    Boolean(meetingWindow?.isOpen) &&
    isLoggedIn &&
    (canStartMeeting || (isEnrolled && hasAccessThisMonth));

  const formatSessionDate = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: MEETING_TZ,
      weekday: "short",
      month: "short",
      day: "2-digit",
    })
      .format(d)
      .replace(/\u202f|\u00a0/g, " ");

  const formatSessionTime = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: MEETING_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
      .format(d)
      .replace(/\u202f|\u00a0/g, " ");

  const formatSessionRange = (start: Date, end: Date) =>
    `${formatSessionDate(start)} | ${formatSessionTime(start)} - ${formatSessionTime(end)}`;

  const liveSessionRange = useMemo(() => {
    if (!meetingWindow?.startISO || !meetingWindow?.endISO) return null;
    const start = new Date(meetingWindow.startISO);
    const end = new Date(meetingWindow.endISO);
    return formatSessionRange(start, end);
  }, [meetingWindow?.endISO, meetingWindow?.startISO]);

  const liveStartedLabel = useMemo(() => {
    if (!isLiveNow || !nextSession || isTeacher || isAdmin) return null;
    const now = new Date();
    const start = new Date(nextSession.startISO);
    const diff = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 60000));
    return `Started ${diff} min ago`;
  }, [isLiveNow, isTeacher, isAdmin, nextSession]);

  const nextSlotLabel = isLiveNow
    ? "Live now"
    : showNextSessionDetails
    ? "Next session"
    : "Scheduled";

  const nextSlotLine = useMemo(() => {
    if (showNextSessionDetails && nextSession) {
      if (liveStartedLabel) return liveStartedLabel;
      const start = new Date(nextSession.startISO);
      const end = new Date(nextSession.endISO);
      return formatSessionRange(start, end);
    }
    if (classTimes.length > 0) {
      const slot = classTimes[0];
      if (slot?.day && slot?.start && slot?.end) {
        return `Weekly | ${slot.day} ${slot.start} - ${slot.end}`;
      }
    }
    return "Schedule TBD";
  }, [classTimes, liveStartedLabel, nextSession, showNextSessionDetails]);

  const showLiveActionInSlot = canShowMeetingButton;
  const liveActionLabel = canStartMeeting ? "Start Live Session" : "Join Live Session";
  const liveSlotLabel = isLiveNow ? "Live now" : "Starting soon";
  const primaryCtaLabel = showLiveActionInSlot
    ? "Class time details"
    : isTeacher || isAdmin
    ? "Enter Class"
    : isEnrolled
    ? hasAccessThisMonth
      ? "Join Class"
      : "View Details"
    : ctaLabel;

  const handleMeetingClick = async () => {
    if (!canShowMeetingButton || meetingLoading) return;
    try {
      setMeetingLoading(true);
      const mode = canStartMeeting ? "start" : "join";
      const { redirect } = await createMeetingTicket(id, mode);
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
      console.error("[ClassCard] Meeting start failed:", err);
      alert("Meeting is not available yet. Please try again later.");
    } finally {
      setMeetingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full rounded-3xl overflow-hidden p-4 space-y-4" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.03)' }}>
        <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-6 w-3/4 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-4 w-1/2 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-10 w-full rounded-xl bg-slate-100 animate-pulse mt-auto" />
      </div>
    );
  }

  const isDescriptionDuplicate =
    !description ||
    description.trim().toLowerCase() === title.trim().toLowerCase() ||
    description.trim().toLowerCase() === titleWithoutGrade.trim().toLowerCase();

  const isClaySvg = Boolean(
    resolvedImageSrc?.endsWith(".svg") ||
    resolvedImageSrc?.includes("/assets/clay/") ||
    resolvedImageSrc === defaultThumbnail
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-300",
        isLiveNow && "ring-2 ring-emerald-500/50",
        className
      )}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
        border: '2px solid rgba(79, 70, 229, 0.08)',
        boxShadow: '0 4px 8px -2px rgba(67, 56, 202, 0.04), 0 16px 28px -4px rgba(99, 102, 241, 0.09), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
      }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 8px 16px -2px rgba(67, 56, 202, 0.08), 0 24px 38px -4px rgba(99, 102, 241, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.95)'; el.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 8px -2px rgba(67, 56, 202, 0.04), 0 16px 28px -4px rgba(99, 102, 241, 0.09), inset 0 1px 1px rgba(255, 255, 255, 0.95)'; el.style.transform = 'translateY(0)'; }}
    >
      {/* Image Container: Soft pastel background for 3D clay illustrations, or dark cover for real photos */}
      <div
        className={cn(
          "relative w-full aspect-[16/10] overflow-hidden transition-colors duration-300",
          isClaySvg
            ? pastelTheme.capsuleBg
            : "bg-slate-900"
        )}
      >
        <Image
          key={refreshNonce}
          src={resolvedImageSrc}
          alt={title}
          fill
          priority
          onError={handleImageError}
          className={cn(
            "transition-transform duration-500 ease-out",
            isClaySvg
              ? "object-contain p-5 group-hover:scale-105"
              : "object-cover object-center group-hover:scale-105"
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Dark Gradient Overlay ONLY for uploaded photo banners */}
        {!isClaySvg && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />
        )}

        {/* Top Badges: Left (Subject + Grade) & Right (Class ID + Fee) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between z-10 gap-2 pointer-events-none">
          {/* Left: Subject & Grade Pills */}
          <div className="flex flex-wrap items-center gap-1 max-w-[60%]">
            {subjectLabels.length > 0 ? (
              subjectLabels.map((label, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border shadow-2xs",
                    pastelTheme.badge
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pastelTheme.dotColor)} />
                  {label.value}
                </span>
              ))
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border shadow-2xs capitalize",
                  pastelTheme.badge
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", pastelTheme.dotColor)} />
                {pastelTheme.name === "default" ? "General" : pastelTheme.name}
              </span>
            )}
            {gradeLabel && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 bg-indigo-50/95 border border-indigo-200/80 shadow-2xs backdrop-blur-md">
                {gradeLabel.value}
              </span>
            )}
          </div>

          {/* Right: Class ID & Fee Pills */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1">
              {displayClassId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-800 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xs">
                  ID: {displayClassId}
                </span>
              )}
              {isEnrolled && (
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white shadow-2xs backdrop-blur-md",
                    hasAccessThisMonth ? "bg-emerald-600/90" : "bg-amber-500/90"
                  )}
                >
                  {hasAccessThisMonth ? "Active" : "Due"}
                </span>
              )}
            </div>
            {resolvedFee && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-800 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-2xs">
                Rs. {formatLKR(resolvedFee)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 gap-2.5">
        {/* Teacher Avatar & Name Badge (Screenshots 1 & 4) */}
        {displayTeacherName && (
          <div className="inline-flex items-center gap-2 -mt-0.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold shrink-0 ring-1 ring-white">
              {displayTeacherName[0]?.toUpperCase() || "T"}
            </div>
            <span className="text-xs font-semibold text-slate-600 truncate">
              {displayTeacherName}
            </span>
          </div>
        )}

        <div className="space-y-1">
          {/* Title (Rendered exactly once) */}
          <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors duration-200 line-clamp-1">
            {titleWithoutGrade}
          </h2>

          {/* Subtitle / Description - rendered with min-h for equalized alignment */}
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[2rem]">
            {!isDescriptionDuplicate ? description : ""}
          </p>
        </div>

        {/* Next Session Slot */}
        <div className="rounded-xl px-3 py-2 min-h-[52px] flex items-center" style={{ background: 'rgba(250,249,245,0.9)', border: '1px solid rgba(0,0,0,0.06)' }}>
          {showLiveActionInSlot ? (
            <div className="w-full space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{liveSlotLabel}</span>
              </div>
              <button
                type="button"
                onClick={handleMeetingClick}
                disabled={meetingLoading}
                className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex flex-col items-center leading-tight">
                  <span>{liveActionLabel}</span>
                  {liveSessionRange && (
                    <span className="text-[9px] font-medium text-white/90">
                      {liveSessionRange}
                    </span>
                  )}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider",
                  isLiveNow
                    ? "text-emerald-600"
                    : showNextSessionDetails
                    ? "text-slate-500"
                    : "text-slate-400"
                )}
              >
                {isLiveNow && (
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
                <span>{nextSlotLabel}</span>
              </div>
              <div className="text-xs font-semibold text-slate-800">
                {nextSlotLine}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-0.5 mt-auto space-y-2">
          <button
            onClick={() => router.push(href)}
            className={cn(
              "relative w-full py-2.5 px-4 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 shadow-md",
              isEnrolled
                ? hasAccessThisMonth
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white [box-shadow:0_4px_14px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white [box-shadow:0_4px_14px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                : "bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white [box-shadow:0_4px_14px_rgba(79,70,229,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]"
            )}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {primaryCtaLabel}
              <HiBookOpen className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* Teacher Actions */}
          {isTeacher && (
            <div className="grid grid-cols-[1fr,auto] gap-2">
              <button
                onClick={() => router.push(`/admin/classes/edit/${id}`)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200"
              >
                Edit Details
              </button>

              <button
                onClick={async () => {
                  await handleDelete();
                }}
                disabled={deleting}
                className={cn(
                  "px-4 py-2.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200",
                  deleting && "opacity-50 cursor-not-allowed"
                )}
                title="Delete Class"
              >
                <HiTrash className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
