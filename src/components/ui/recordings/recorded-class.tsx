"use client";

import { useEffect, useRef, useState } from "react";
import API from "@/lib/axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/dev/card";
import { Calendar, Clock, Video } from "lucide-react";
import { format } from "date-fns";
import { SecureVideoPlayer, extractYouTubeId } from "@/components/ui/secure-video-player";

type Props = {
  title?: string;
  driveFileId: string;
  uploaded_at: Date | string;
  /** true = use secure signed proxy only (default).
   *  false = allow public Drive preview fallback (only if file itself is public). */
  useServerGate?: boolean;
};

/* -------------------------- inline helper fns -------------------------- */
async function createRecordingProxyUrl(driveFileId: string): Promise<string> {
  try {
    const { data } = await API.post<{ url: string }>(
      "/recordings/proxy-ticket",
      { fileId: driveFileId }
    );
    if (!data?.url) throw new Error("No URL in proxy-ticket response");

    // Fix: If URL is relative, prepend the backend origin to bypass Vercel proxy
    // This avoids "Fast Origin Transfer" limits on Vercel.
    let finalUrl = data.url;
    if (finalUrl.startsWith("/")) {
      const origin = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, "") || "";
      if (origin) {
        finalUrl = `${origin}${finalUrl}`;
      }
    }

    return finalUrl;
  } catch (err: any) {
    // Normalize error
    const status = err?.response?.status;
    const data = err?.response?.data || {};
    const message =
      data?.message ||
      err?.message ||
      (status ? `Request failed with status ${status}` : "Request failed");
    const month_key = data?.month_key; // backend may include this
    const e = new Error(message) as any;
    e.status = status;
    if (month_key) e.month_key = month_key;
    throw e;
  }
}

function getDrivePreviewIframeSrc(driveFileId: string): string {
  return `https://drive.google.com/uc?export=preview&id=${encodeURIComponent(
    driveFileId
  )}`;
}

function prettyMonthKey(mk?: string) {
  if (!mk || !/^\d{4}-\d{2}$/.test(mk)) return null;
  const [y, m] = mk.split("-").map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1, 1);
  try {
    return format(d, "LLLL yyyy"); // e.g., "May 2025"
  } catch {
    return mk;
  }
}
/* ---------------------------------------------------------------------- */

export default function RecordedClass({
  title,
  driveFileId,
  uploaded_at,
  useServerGate = true,
}: Props) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [forbiddenInfo, setForbiddenInfo] = useState<string | null>(null);
  const aliveRef = useRef(true);

  const ytId = extractYouTubeId(driveFileId);
  const isYouTube = Boolean(ytId);

  const uploadedAtDate =
    uploaded_at instanceof Date ? uploaded_at : new Date(uploaded_at);
  const validDate = Number.isFinite(uploadedAtDate.getTime());

  useEffect(() => {
    aliveRef.current = true;
    setErr(null);
    setForbiddenInfo(null);

    // 1. YouTube link / ID: no server proxy ticket required
    if (isYouTube) {
      setVideoSrc(ytId || driveFileId);
      return;
    }

    // 2. Direct local upload or external video file (.mp4, /uploads/)
    if (
      typeof driveFileId === "string" &&
      (driveFileId.startsWith("/uploads/") ||
        (driveFileId.startsWith("http") && !driveFileId.includes("drive.google.com")))
    ) {
      setVideoSrc(driveFileId);
      return;
    }

    setVideoSrc(null);

    (async () => {
      try {
        if (useServerGate) {
          // Secure path: request a short-lived signed stream URL
          const url = await createRecordingProxyUrl(driveFileId);
          if (!aliveRef.current) return;
          setVideoSrc(url);
        } else {
          // Non-secure path: direct Google preview
          const url = getDrivePreviewIframeSrc(driveFileId);
          if (!aliveRef.current) return;
          setVideoSrc(url);
        }
      } catch (e: any) {
        const status = e?.status;
        const msg = e?.message ?? String(e);
        const monthHuman =
          prettyMonthKey(e?.month_key) ||
          (validDate ? format(uploadedAtDate, "LLLL yyyy") : null);

        // 403 = no entitlement → DO NOT fall back to public preview
        if (status === 403) {
          if (!aliveRef.current) return;
          setForbiddenInfo(
            monthHuman
              ? `You don’t have permission to view this recording for ${monthHuman}.`
              : `You don’t have permission to view this recording.`
          );
          setErr(null);
          setVideoSrc(null);
          return;
        }

        // Expired/Token errors → retry once
        const canRetry =
          useServerGate && (status === 401 || status === 410 || /expired|token|signature|ticket/i.test(msg));
        if (canRetry) {
          try {
            const url = await createRecordingProxyUrl(driveFileId);
            if (!aliveRef.current) return;
            setVideoSrc(url);
            return;
          } catch (e2: any) {
            // If retry also fails with 403, treat as forbidden
            if (e2?.status === 403) {
              const mkHuman =
                prettyMonthKey(e2?.month_key) ||
                (validDate ? format(uploadedAtDate, "LLLL yyyy") : null);
              setForbiddenInfo(
                mkHuman
                  ? `You don’t have permission to view this recording for ${mkHuman}.`
                  : `You don’t have permission to view this recording.`
              );
              setVideoSrc(null);
              return;
            }
          }
        }

        // Other errors:
        if (useServerGate) {
          // Stay secure by default: do not fall back to Drive preview automatically
          setErr(
            msg || "Secure stream unavailable. Please try again or contact support."
          );
          setVideoSrc(null);
        } else {
          // If you explicitly disabled server gate, we can fall back
          const url = getDrivePreviewIframeSrc(driveFileId);
          if (!aliveRef.current) return;
          setVideoSrc(url);
          setErr("Secure stream unavailable; using public Drive preview.");
        }
      }
    })();

    return () => {
      aliveRef.current = false;
    };
  }, [driveFileId, useServerGate, uploaded_at, isYouTube, ytId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-4xl backdrop-blur-sm bg-white/80 border-0 shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center space-x-4 mb-2">
            <Video className="w-8 h-8 text-blue-600" />
            <CardTitle className="text-3xl font-bold text-slate-800">
              {title ?? "Class Recording"}
            </CardTitle>
          </div>
          <CardDescription className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {validDate ? format(uploadedAtDate, "PPP") : "—"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {validDate ? format(uploadedAtDate, "p") : "—"}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <div
            style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
            className="relative w-full aspect-video min-h-[320px] sm:min-h-[440px] md:min-h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl"
          >
            {isYouTube ? (
              <SecureVideoPlayer
                url={ytId || driveFileId}
                title={title ?? "Class Recording"}
                badgeLabel="Classroom Recording"
                autoPlay={false}
                className="w-full h-full"
              />
            ) : !videoSrc ? (
              <div
                style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
                className="w-full h-full min-h-[320px] sm:min-h-[440px] md:min-h-[500px] grid place-items-center text-white/80 px-6 text-center"
              >
                {forbiddenInfo ? (
                  <div>
                    <p className="text-base font-semibold">{forbiddenInfo}</p>
                    <p className="text-sm text-white/70 mt-2">
                      If you believe this is a mistake, please contact your instructor/admin.
                    </p>
                  </div>
                ) : err ? (
                  <div>
                    <p className="text-base font-semibold">{err}</p>
                    <p className="text-sm text-white/70 mt-2">
                      Try refreshing the page. If the issue persists, contact support.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    <span className="text-xs text-white/70 font-medium">Loading video stream...</span>
                  </div>
                )}
              </div>
            ) : (
              <SecureVideoPlayer
                url={videoSrc}
                title={title ?? "Class Recording"}
                badgeLabel="Classroom Stream"
                autoPlay={false}
                className="w-full h-full"
              />
            )}
          </div>

          {forbiddenInfo && (
            <p className="text-xs text-rose-600 mt-3">{forbiddenInfo}</p>
          )}
          {!forbiddenInfo && err && (
            <p className="text-xs text-amber-600 mt-3">{err}</p>
          )}

          <p className="text-sm text-slate-500 mt-3">
            Having trouble? Ensure your account has the required month access for this class.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
