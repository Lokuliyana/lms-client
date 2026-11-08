"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import RecordedClass from "@/components/ui/recordings/recorded-class";
import {
  SecureVideoPlayer,
  extractYouTubeId,
} from "@/components/ui/secure-video-player";
import { getRecordingById } from "@/services/recordingService";
import { DetailLoader } from "@/components/reusable/detail-loader";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft, BookOpen, ShieldAlert } from "lucide-react";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [recording, setRecording] = useState<any | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string>("");
  const [classId, setClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getRecordingById(id);
        const recordingData =
          (data as any)?.recording || (data as any)?.data || data;
        if (recordingData?.isLocked) {
          setIsLocked(true);
          setLockMessage(
            recordingData?.message ||
              "Enroll in this class to access past recordings."
          );
          setClassId(
            recordingData?.classId ||
              recordingData?.class_id?._id ||
              recordingData?.class_id ||
              null
          );
        } else {
          setRecording(recordingData);
          setClassId(
            recordingData?.class_id?._id ||
              recordingData?.class_id ||
              null
          );
        }
      } catch (err: any) {
        console.error("Error loading recording:", err);
        const status = err?.response?.status || err?.status;
        const respData = err?.response?.data || {};
        if (status === 403 || status === 401 || respData.isLocked) {
          setIsLocked(true);
          setLockMessage(
            respData.message ||
              "Enroll in this class to access past recordings. This lesson is restricted to verified students."
          );
          setClassId(respData.classId || null);
        } else {
          setError(
            respData.message || "Recording not found or temporarily unavailable."
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <DetailLoader />;

  // Strictly Gate: If locked or unentitled, render enrollment gate card
  if (isLocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-3xl p-6 sm:p-8 text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto drop-shadow-sm">
            <Image
              src={CLAY_ASSETS.recordingsCinema}
              alt="Locked Recording"
              fill
              className="object-contain"
            />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Enrollment Gate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enroll in this class to access past recordings
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              {lockMessage ||
                "Past classroom recordings are protected and accessible only to students with an active monthly pass for this class."}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {classId ? (
              <Link href={`/classes/${classId}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-10 px-6 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Enroll in This Class</span>
                </Button>
              </Link>
            ) : (
              <Link href="/classes" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-10 px-6 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs flex items-center justify-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Classes</span>
                </Button>
              </Link>
            )}

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-10 px-5 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Recording Unavailable
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {error ?? "Recording not found."}
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/classes")}
              className="text-xs font-semibold rounded-xl"
            >
              Browse Classes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rawSource =
    recording.video_url ||
    recording.playback_url ||
    recording.driveUrl ||
    recording.driveFileId;

  if (!rawSource) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Recording video source is being processed.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="text-xs font-semibold rounded-xl"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // 1. YouTube Link / ID detection
  const ytId =
    extractYouTubeId(rawSource) || extractYouTubeId(recording.driveFileId);

  if (ytId) {
    return (
      <div className="min-h-[85vh] p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 mb-2">
                Classroom Recording
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {recording.title ?? "Class Recording"}
              </h1>
              {recording.uploaded_at && (
                <p className="text-xs text-slate-400 mt-1">
                  Recorded on {new Date(recording.uploaded_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {classId && (
              <Link href={`/classes/${classId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold rounded-xl"
                >
                  View Class
                </Button>
              </Link>
            )}
          </div>

          <SecureVideoPlayer
            url={ytId}
            title={recording.title ?? "Class Recording"}
            badgeLabel="Classroom Recording"
            autoPlay={false}
          />
        </div>
      </div>
    );
  }

  // 2. Local uploads / direct MP4
  const isLocal =
    recording.provider === "local" ||
    rawSource.startsWith("/uploads/") ||
    rawSource.includes("/uploads/");

  if (isLocal) {
    return (
      <div className="min-h-[85vh] p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 mb-2">
                Classroom Stream
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {recording.title ?? "Class Recording"}
              </h1>
            </div>
            {classId && (
              <Link href={`/classes/${classId}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold rounded-xl"
                >
                  View Class
                </Button>
              </Link>
            )}
          </div>
          <SecureVideoPlayer
            url={rawSource}
            title={recording.title ?? "Class Recording"}
            badgeLabel="Classroom Stream"
            autoPlay={false}
          />
        </div>
      </div>
    );
  }

  // 3. Fall back to proxy-ticket server gated player for Google Drive streams
  return (
    <RecordedClass
      title={recording.title}
      driveFileId={rawSource}
      uploaded_at={recording.uploaded_at ?? new Date().toISOString()}
      useServerGate={true}
    />
  );
}
