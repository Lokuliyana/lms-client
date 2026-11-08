"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Video,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  ExternalLink,
  Radio,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMeetingTicket } from "@/services/classService";
import { formatGradeName, formatSubjectName } from "@/lib/formatters";
import { getSubjectPastelTheme, getSubjectThumbnail } from "@/constants/clayAssets";
import { toast } from "sonner";

interface TimeSlot {
  day: string;
  start: string;
  end: string;
}

interface EnrolledClassItem {
  _id: string;
  classId?: string | number;
  id?: string;
  title: string;
  description?: string;
  image?: string;
  imagePath?: string;
  grade?: any;
  subject?: any;
  classTime?: any[];
  batches?: any[];
  special_session?: {
    title?: string;
    date?: string;
    start?: string;
    startTime?: string;
    end?: string;
    endTime?: string;
    is_active?: boolean;
    zoom_meeting_id?: string;
    zoom_join_url?: string;
  };
  hasAccessThisMonth?: boolean;
}

interface ResolvedSession {
  classId: string;
  title: string;
  image: string;
  grade?: string;
  subject?: string;
  day: string;
  startTime: string;
  endTime: string;
  startISO: string;
  endISO: string;
  isSpecial?: boolean;
}

const TZ = "Asia/Colombo";
const TZ_OFFSET = "+05:30";

function normalizeImageUri(src?: string, fallback: string = "/assets/clay/math-card.png"): string {
  if (!src || typeof src !== "string" || !src.trim()) return fallback;
  const s = src.trim();
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s;
  return `/${s}`;
}

/**
 * Robust parser supporting both 24h ("17:00") and 12h AM/PM ("05:00 PM", "8:30 AM") formats.
 */
function parseTimeParts(timeStr?: string): { hour: number; minute: number } | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3]?.toLowerCase();
  if (period === "pm" && hour < 12) hour += 12;
  if (period === "am" && hour === 12) hour = 0;
  if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
    return { hour, minute };
  }
  return null;
}

function isCrossingMidnight(startStr: string, endStr: string): boolean {
  const s = parseTimeParts(startStr);
  const e = parseTimeParts(endStr);
  if (!s || !e) return false;
  const sMinutes = s.hour * 60 + s.minute;
  const eMinutes = e.hour * 60 + e.minute;
  return eMinutes <= sMinutes;
}

function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const parsed = parseTimeParts(timeStr);
  if (!parsed) return timeStr;
  const ampm = parsed.hour >= 12 ? "PM" : "AM";
  let h = parsed.hour % 12;
  if (h === 0) h = 12;
  const m = parsed.minute.toString().padStart(2, "0");
  return `${h.toString().padStart(2, "0")}:${m} ${ampm}`;
}

/**
 * Gets current Year, Month, Day in Colombo timezone.
 */
function getColomboDate(d: Date = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(d);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "2026", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);
  return { year, month, day };
}

export function NextLiveSessionCard({
  enrolledClasses,
}: {
  enrolledClasses: EnrolledClassItem[];
}) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [isJoining, setIsJoining] = useState(false);

  // Update current time every 15 seconds to ensure live transition across 10hr threshold and session completion
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const nextSession = useMemo<ResolvedSession | null>(() => {
    if (!Array.isArray(enrolledClasses) || enrolledClasses.length === 0) {
      return null;
    }

    const upcomingSessions: ResolvedSession[] = [];
    const colomboToday = getColomboDate(now);

    enrolledClasses.forEach((cls) => {
      // Extract normalized slots from classTime or batches
      const slots: TimeSlot[] = [];

      if (Array.isArray(cls.classTime) && cls.classTime.length > 0) {
        cls.classTime.forEach((t: any) => {
          const day = t.day || "";
          const start = t.startTime || t.start || "";
          const end = t.endTime || t.end || "";
          if (day && start && end) {
            slots.push({ day, start, end });
          }
        });
      } else if (Array.isArray(cls.batches) && cls.batches.length > 0) {
        cls.batches.forEach((b: any) => {
          const start = b.start || b.start_time || "";
          const end = b.end || b.end_time || "";
          if (Array.isArray(b.days)) {
            b.days.forEach((day: string) => {
              if (day && start && end) slots.push({ day, start, end });
            });
          } else if (b.day && start && end) {
            slots.push({ day: b.day, start, end });
          }
        });
      }

      const rawClassId = cls._id || cls.id || cls.classId;
      const classIdStr = rawClassId ? String(rawClassId) : "";
      const classTitle = cls.title || "Untitled Live Class";
      const subjectName = typeof cls.subject === "string" ? cls.subject : cls.subject?.name;
      const gradeName = typeof cls.grade === "string" ? cls.grade : cls.grade?.name;
      const fallbackThumb = getSubjectThumbnail(subjectName || classTitle);
      const rawImage = (cls.image && cls.image.trim()) || (cls.imagePath && cls.imagePath.trim()) || fallbackThumb;
      const imageUri = normalizeImageUri(rawImage, fallbackThumb);

      // 1. Process ad-hoc one-off special session if active
      const spec = cls.special_session;
      if (
        spec &&
        spec.is_active !== false &&
        spec.date &&
        (spec.start || spec.startTime) &&
        (spec.end || spec.endTime)
      ) {
        const specStart = (spec.start || spec.startTime || "").trim();
        const specEnd = (spec.end || spec.endTime || "").trim();
        const parsedStart = parseTimeParts(specStart);
        const parsedEnd = parseTimeParts(specEnd);

        if (parsedStart && parsedEnd) {
          const startH = String(parsedStart.hour).padStart(2, "0");
          const startM = String(parsedStart.minute).padStart(2, "0");
          const endH = String(parsedEnd.hour).padStart(2, "0");
          const endM = String(parsedEnd.minute).padStart(2, "0");

          let specDateYMD = spec.date.trim();
          if (specDateYMD.includes("T")) {
            specDateYMD = specDateYMD.split("T")[0];
          }

          const startISO = `${specDateYMD}T${startH}:${startM}:00${TZ_OFFSET}`;
          const endISO = `${specDateYMD}T${endH}:${endM}:00${TZ_OFFSET}`;
          const endMs = new Date(endISO).getTime();

          if (Number.isFinite(endMs) && endMs >= now.getTime()) {
            upcomingSessions.push({
              classId: classIdStr,
              title: spec.title || classTitle,
              image: imageUri,
              grade: gradeName,
              subject: subjectName,
              day: specDateYMD,
              startTime: specStart,
              endTime: specEnd,
              startISO,
              endISO,
              isSpecial: true,
            });
          }
        }
      }

      // 2. Process recurring weekly timetable slots
      if (slots.length > 0) {
        // Project up to 42 calendar days ahead using deterministic Colombo calendar days
        for (let offset = 0; offset < 42; offset++) {
          // Construct UTC midnight corresponding to target Colombo day
          const targetDayUtc = new Date(
            Date.UTC(colomboToday.year, colomboToday.month - 1, colomboToday.day + offset)
          );
          const y = targetDayUtc.getUTCFullYear();
          const m = String(targetDayUtc.getUTCMonth() + 1).padStart(2, "0");
          const d = String(targetDayUtc.getUTCDate()).padStart(2, "0");
          const startYMD = `${y}-${m}-${d}`;

          const dayWk = new Intl.DateTimeFormat("en-US", {
            timeZone: "UTC",
            weekday: "long",
          })
            .format(targetDayUtc)
            .toLowerCase();

          for (const slot of slots) {
            const sDay = String(slot.day).trim().toLowerCase();
            // Match full name ("saturday") or 3-letter prefix ("sat")
            const isDayMatch =
              sDay === dayWk ||
              sDay === dayWk.slice(0, 3) ||
              dayWk.startsWith(sDay);
            if (!isDayMatch) continue;

            const parsedStart = parseTimeParts(slot.start);
            const parsedEnd = parseTimeParts(slot.end);
            if (!parsedStart || !parsedEnd) continue;

            const startH = String(parsedStart.hour).padStart(2, "0");
            const startM = String(parsedStart.minute).padStart(2, "0");
            const endH = String(parsedEnd.hour).padStart(2, "0");
            const endM = String(parsedEnd.minute).padStart(2, "0");

            const crosses = isCrossingMidnight(slot.start, slot.end);

            let endYMD = startYMD;
            if (crosses) {
              const nextDayUtc = new Date(
                Date.UTC(colomboToday.year, colomboToday.month - 1, colomboToday.day + offset + 1)
              );
              const ny = nextDayUtc.getUTCFullYear();
              const nm = String(nextDayUtc.getUTCMonth() + 1).padStart(2, "0");
              const nd = String(nextDayUtc.getUTCDate()).padStart(2, "0");
              endYMD = `${ny}-${nm}-${nd}`;
            }

            const startISO = `${startYMD}T${startH}:${startM}:00${TZ_OFFSET}`;
            const endISO = `${endYMD}T${endH}:${endM}:00${TZ_OFFSET}`;

            const endMs = new Date(endISO).getTime();

            // Requirement: that live session should visible until the scheduled time ends!
            if (Number.isFinite(endMs) && endMs >= now.getTime()) {
              upcomingSessions.push({
                classId: classIdStr,
                title: classTitle,
                image: imageUri,
                grade: gradeName,
                subject: subjectName,
                day: slot.day,
                startTime: slot.start,
                endTime: slot.end,
                startISO,
                endISO,
                isSpecial: false,
              });
            }
          }
        }
      }
    });

    if (upcomingSessions.length === 0) return null;

    // Pick earliest scheduled session
    upcomingSessions.sort(
      (a, b) => new Date(a.startISO).getTime() - new Date(b.startISO).getTime()
    );

    return upcomingSessions[0];
  }, [enrolledClasses, now]);

  if (!nextSession) {
    return null;
  }

  const startDate = new Date(nextSession.startISO);
  const endDate = new Date(nextSession.endISO);
  const nowMs = now.getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  // 10 hours in milliseconds: 10 * 60 * 60 * 1000 = 36,000,000 ms
  const tenHoursBeforeMs = startMs - 10 * 60 * 60 * 1000;

  // Requirement: button gray until 10hrs before the live session actually scheduled
  // Active window: from (startMs - 10hrs) until the scheduled session ends (endMs)
  const isLiveNow = nowMs >= startMs && nowMs <= endMs;
  const isWithin10Hours = nowMs >= tenHoursBeforeMs && nowMs <= endMs;
  const isButtonActive = isWithin10Hours;

  const msUntilStart = startMs - nowMs;
  const hoursUntilStart = Math.max(0, Math.floor(msUntilStart / (1000 * 60 * 60)));
  const minutesUntilStart = Math.max(
    0,
    Math.floor((msUntilStart % (1000 * 60 * 60)) / (1000 * 60))
  );

  const msUntilUnlock = tenHoursBeforeMs - nowMs;
  const hoursUntilUnlock = Math.max(0, Math.ceil(msUntilUnlock / (1000 * 60 * 60)));

  const handleJoinSession = async () => {
    if (!isButtonActive) return;

    try {
      setIsJoining(true);
      const { redirect } = await createMeetingTicket(
        nextSession.classId,
        "join",
        nextSession.isSpecial ? "special" : undefined
      );

      if (!redirect) {
        throw new Error("No ticket redirect URL returned by server.");
      }

      let finalUrl = redirect;
      if (finalUrl.startsWith("/")) {
        finalUrl = `${window.location.origin}${finalUrl}`;
      }
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && (redirect.includes("zoom.us/j/") || redirect.includes("zoom.us/s/"))) {
        try {
          const urlObj = new URL(redirect);
          const meetingId = urlObj.pathname.split("/").pop();
          const pwd = urlObj.searchParams.get("pwd");
          const zak = urlObj.searchParams.get("zak");
          if (meetingId) {
            finalUrl = `zoomus://zoom.us/join?confno=${meetingId}${pwd ? `&pwd=${pwd}` : ""}${zak ? `&zak=${zak}` : ""}`;
          }
        } catch (e) {
          console.error("Deep link parse failed", e);
        }
        window.location.href = finalUrl;
      } else {
        const opened = window.open(finalUrl, "_blank", "noopener,noreferrer");
        if (!opened || opened.closed || typeof opened.closed === "undefined") {
          window.location.href = finalUrl;
        }
      }
    } catch (err: any) {
      console.error("Failed to join Zoom session:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to generate meeting ticket. Please try again."
      );
    } finally {
      setIsJoining(false);
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(startDate);

  const theme = getSubjectPastelTheme(nextSession.subject);
  const imageSrc = nextSession.image || getSubjectThumbnail(nextSession.subject || nextSession.title);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-white via-indigo-50/25 to-purple-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* Decorative ambient gradient circle */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      {/* Responsive layout: class image on left side, right side has class name, time slot and button */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-6">
        {/* Left Side: Class Image */}
        <div className="relative w-full sm:w-56 md:w-64 h-48 sm:h-auto min-h-[170px] rounded-2xl overflow-hidden shrink-0 shadow-xs border border-slate-200/70 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
          <Image
            src={imageSrc}
            alt={nextSession.title}
            fill
            unoptimized={imageSrc.startsWith("http")}
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 224px, 256px"
          />

          {/* Badge Overlay on Image */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {isLiveNow ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                Live Now
              </span>
            ) : isWithin10Hours ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                <Radio className="w-3 h-3 animate-pulse" />
                Starting Soon
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold uppercase tracking-wider shadow-xs">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Next Session
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Class Name, Time Slot, and the Button */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            {/* Subject & Grade Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3 h-3" />
                Next Available Live Session
              </span>

              {nextSession.subject && (
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}
                >
                  {formatSubjectName(nextSession.subject)}
                </span>
              )}

              {nextSession.grade && (
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {formatGradeName(nextSession.grade)}
                </span>
              )}
            </div>

            {/* Class Title / Name */}
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              <Link
                href={`/classes/${nextSession.classId}`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {nextSession.title}
              </Link>
            </h3>

            {/* Time Slot Display */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  {formatTime12h(nextSession.startTime)} – {formatTime12h(nextSession.endTime)}
                </span>
                <span className="text-[10px] font-normal text-slate-400 ml-1">
                  (Asia/Colombo)
                </span>
              </div>
            </div>

            {/* Status & Countdown Helper */}
            <div className="text-xs pt-0.5">
              {isLiveNow ? (
                <p className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Live session is underway! Click below to enter the Zoom lecture.
                </p>
              ) : isWithin10Hours ? (
                <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                  Starting in {hoursUntilStart > 0 ? `${hoursUntilStart}h ` : ""}
                  {minutesUntilStart}m • Zoom join ticket is active and ready.
                </p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Join button unlocks 10 hours before the scheduled time
                  {hoursUntilUnlock > 0 ? ` (in approx. ${hoursUntilUnlock} hrs)` : ""}.
                </p>
              )}
            </div>
          </div>

          {/* Action Row: The Button */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleJoinSession}
              disabled={!isButtonActive || isJoining}
              className={`rounded-xl text-xs sm:text-sm font-bold h-11 px-6 shadow-sm transition-all flex items-center gap-2 ${
                isButtonActive
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 cursor-pointer ring-4 ring-indigo-500/10 active:scale-98"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300/70 dark:border-slate-700 cursor-not-allowed opacity-80"
              }`}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Zoom...</span>
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  <span>
                    {isLiveNow
                      ? "Join Live Class Now"
                      : isButtonActive
                      ? "Join Zoom Session"
                      : "Live Session (Unlocks 10h before)"}
                  </span>
                </>
              )}
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold h-11 px-4 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Link href={`/classes/${nextSession.classId}`}>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                View Class Page
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NextLiveSessionCard;
