"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { HiPlay, HiCalendar, HiTrash } from "react-icons/hi2";
import { Card, CardContent } from "@/components/dev/card";
import { Button } from "@/components/dev/button";
import { Badge } from "@/components/dev/badge";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { deleteRecording, getRecordingsByClass } from "@/services/recordingService";
import { EmptyCard } from "./empty-card";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export interface RecordingDto {
  _id: string;
  class_id: string;
  title: string;
  is_expired: boolean;
  provider?: string;
  driveUrl?: string;
  driveFileId?: string;
  video_url?: string;
  playback_url?: string;
  session_date?: string | null;
  uploaded_at?: string | null;
  createdAt?: string | null;
  batch_name?: string | null;
  month_key?: string | null;
}

interface ClassRecordingsProps {
  recordings?: RecordingDto[];
  classId?: string;
}

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

function toDate(input?: string | null): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export function ClassRecordings({ recordings, classId }: ClassRecordingsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [items, setItems] = useState<RecordingDto[]>(recordings || []);

  useEffect(() => {
    if (classId) {
      getRecordingsByClass(classId)
        .then((recs: any) => {
          if (Array.isArray(recs) && recs.length > 0) {
            setItems(recs);
          } else if (recordings) {
            setItems(recordings);
          }
        })
        .catch((err) => {
          console.error("Failed to load class recordings:", err);
          if (recordings) setItems(recordings);
        });
    } else if (recordings) {
      setItems(recordings);
    }
  }, [classId, recordings]);

  const isTeacherOrAdmin =
    user && (user.role === "teacher" || user.role === "admin");


  const handleDelete = async (id: string) => {
    if (!isTeacherOrAdmin) return;

    const ok = window.confirm("Are you sure you want to delete this recording?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteRecording(id);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete recording. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!items || items.length === 0) {
    return (
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
    );
  }

  return (
    <ul className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      {items.map((r, index) => {

        const session =
          toDate(r.session_date) ??
          toDate(r.uploaded_at) ??
          toDate(r.createdAt);
        const dateLabel = session ? dateFmt.format(session) : "Not set";
        const isDeleting = deletingId === r._id;

        // Extract file ID for thumbnail
        let fileId = (r as any).driveFileId || (r as any).video_url;
        if (!fileId && (r as any).driveUrl) {
            const driveMatch = (r as any).driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (driveMatch) {
              fileId = driveMatch[1];
            } else {
              const driveMatch2 = (r as any).driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
              if (driveMatch2) fileId = driveMatch2[1];
            }

            // YouTube extraction if not Drive
            if (!fileId) {
              const ytMatch = (r as any).driveUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
              if (ytMatch) fileId = ytMatch[1];
            }
        }

        const isYouTube = fileId?.length === 11;
        const thumbnailUrl = isYouTube
          ? `https://img.youtube.com/vi/${fileId}/mqdefault.jpg`
          : fileId
          ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`
          : null;

        return (
          <li key={r._id ? `${r._id}-${index}` : `rec-${index}`}>
            <div className="group relative flex flex-col h-full bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
              {/* Admin Controls (Floating) */}
              {isTeacherOrAdmin && (
                <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   <button
                      type="button"
                      className="p-2 rounded-full bg-white/90 backdrop-blur text-slate-600 hover:text-indigo-600 shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/admin/recording/edit/${r._id}`);
                      }}
                      title="Edit"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                         <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                         <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                       </svg>
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded-full bg-white/90 backdrop-blur text-red-500 hover:text-red-600 shadow-sm border border-red-100 hover:border-red-200 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(r._id);
                      }}
                      disabled={isDeleting}
                      title="Delete"
                    >
                      {isDeleting ? "…" : <HiTrash className="w-4 h-4" />}
                    </button>
                </div>
              )}

              <Link href={`/recordings/${r._id}`} className="flex flex-col h-full">
                {/* Thumbnail Area */}
                <div className="relative w-full aspect-[16/9] bg-slate-900 overflow-hidden">
                   {/* Image */}
                   {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={r.title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                   ) : null}

                   {/* Fallback Gradient */}
                   <div className={`absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-sky-500 ${thumbnailUrl ? 'hidden' : ''}`} />

                   {/* Dark Overlay */}
                   <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300" />

                   {/* Play Button (Centered) */}
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                          <HiPlay className="w-7 h-7 text-white ml-1 drop-shadow-md" />
                      </div>
                   </div>

                   {/* Date Badge (Bottom Left) */}
                   <div className="absolute bottom-3 left-3">
                      <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm">
                        <HiCalendar className="w-3.5 h-3.5 text-white/80" />
                        {dateLabel}
                      </div>
                   </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-col flex-1 p-5">
                   {/* Batch Badge */}
                   {r.batch_name && (
                     <div className="mb-3">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                         {r.batch_name}
                       </span>
                     </div>
                   )}

                   {/* Title */}
                   <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                     {r.title}
                   </h3>

                   {/* Spacer */}
                   <div className="flex-1" />

                   {/* Footer Action */}
                   <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="text-xs font-medium text-slate-500">
                        {r.is_expired ? (
                          <span className="text-red-500 flex items-center gap-1">
                            Expired
                          </span>
                        ) : (
                          <span className="group-hover:text-indigo-600 transition-colors">
                            Available now
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center gap-1 text-sm font-semibold transition-all ${
                        r.is_expired ? "text-slate-300" : "text-indigo-600 group-hover:translate-x-1"
                      }`}>
                        {r.is_expired ? "Locked" : "Watch Now"}
                        {!r.is_expired && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.5a.75.75 0 010 1.08l-5.5 5.5a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                   </div>
                </div>
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
