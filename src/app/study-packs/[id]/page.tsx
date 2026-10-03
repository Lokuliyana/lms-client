"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { studyPackService, IStudyPack, ICustomVideo, IStudyMaterial } from "@/services/studyPackService";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import { Button } from "@/components/ui/button";
import {
  Video,
  FileText,
  PlayCircle,
  Download,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function StudyPackDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pack, setPack] = useState<IStudyPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState<{
    type: "recording" | "video";
    item: any;
  } | null>(null);

  const isStaff = user && ["teacher", "moderator", "admin"].includes(user.role || "");

  useEffect(() => {
    if (!id || id === "undefined") return;
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await studyPackService.getStudyPackById(id as string);
      if (res.success && res.data) {
        setPack(res.data);
        // Default active media to first recording or first video
        if (res.data.recordings && res.data.recordings.length > 0) {
          setActiveMedia({ type: "recording", item: res.data.recordings[0] });
        } else if (res.data.custom_videos && res.data.custom_videos.length > 0) {
          setActiveMedia({ type: "video", item: res.data.custom_videos[0] });
        }
      } else {
        router.replace("/study-packs");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load study pack details");
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
      : url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto py-12">
          <SectionLoader />
        </div>
      </div>
    );
  }

  if (!pack) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Navigation Back */}
        <SectionHeader
          icon={Video}
          title={
            <div className="flex items-center gap-3">
              <Link href="/study-packs">
                <Button variant="ghost" size="sm" className="rounded-xl p-2 h-auto text-slate-500 hover:text-slate-900">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <EditableContent
                configKey={`pack_title_${pack._id}`}
                initialValue={pack.title}
                as="span"
              />
            </div>
          }
          description={
            <EditableContent
              configKey={`pack_desc_${pack._id}`}
              initialValue={pack.description || "Digital study collection with past class recordings, videos, and PDF notes."}
              as="span"
            />
          }
          actions={
            <div className="flex items-center gap-2">
              {isStaff && (
                <Link href={`/admin/study-packs?edit=${pack._id}`}>
                  <Button variant="outline" className="flex items-center gap-2 rounded-xl text-xs font-semibold">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Study Pack</span>
                  </Button>
                </Link>
              )}
              {pack.class_id?._id && (
                <Link href={`/classes/${pack.class_id._id}`}>
                  <Button variant="secondary" className="text-xs font-semibold rounded-xl">
                    View Class ({pack.class_id.title || "Class Details"})
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        {/* Main Interactive Stage & Playlist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Active Video / Recording Player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-800 shadow-lg">
              {activeMedia ? (
                activeMedia.type === "video" ? (
                  activeMedia.item.url?.includes("youtube") || activeMedia.item.url?.includes("youtu.be") ? (
                    <iframe
                      src={getYouTubeEmbedUrl(activeMedia.item.url) || activeMedia.item.url}
                      title={activeMedia.item.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={activeMedia.item.url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  // Class Recording player
                  activeMedia.item.video_url || activeMedia.item.driveUrl ? (
                    <iframe
                      src={activeMedia.item.video_url || activeMedia.item.driveUrl}
                      title={activeMedia.item.title}
                      className="w-full h-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <div className="text-center p-8 text-slate-400">
                      <PlayCircle className="w-12 h-12 mx-auto mb-2 text-indigo-400" />
                      <p className="font-semibold text-white">Live Classroom Lecture Recording</p>
                      <p className="text-xs mt-1">Recording is processed and securely streamed.</p>
                    </div>
                  )
                )
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Select a recording or video from the bundle playlist to start watching.</p>
                </div>
              )}
            </div>

            {/* Currently Playing Info */}
            {activeMedia && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                    Now Playing • {activeMedia.type === "recording" ? "Classroom Lecture" : "Topic Video"}
                  </span>
                  <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeMedia.item.title}
                  </h2>
                  {activeMedia.item.session_date && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Recorded on {new Date(activeMedia.item.session_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Bundle Playlist & Materials */}
          <div className="space-y-6">
            {/* Past Recordings Playlist */}
            {pack.recordings && pack.recordings.length > 0 && (
              <CardSection title="Past Class Recordings" icon={PlayCircle}>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {pack.recordings.map((rec: any, idx: number) => {
                    const isActive = activeMedia?.type === "recording" && activeMedia.item._id === rec._id;
                    return (
                      <button
                        key={rec._id || idx}
                        onClick={() => setActiveMedia({ type: "recording", item: rec })}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                          isActive
                            ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <PlayCircle className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-slate-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{rec.title}</p>
                          {rec.session_date && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(rec.session_date).toLocaleDateString()} {rec.batch_name ? `• ${rec.batch_name}` : ""}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardSection>
            )}

            {/* Custom Videos Playlist */}
            {pack.custom_videos && pack.custom_videos.length > 0 && (
              <CardSection title="Video Breakdown Lessons" icon={Video}>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {pack.custom_videos.map((vid: ICustomVideo, idx: number) => {
                    const isActive = activeMedia?.type === "video" && activeMedia.item.url === vid.url;
                    return (
                      <button
                        key={vid._id || idx}
                        onClick={() => setActiveMedia({ type: "video", item: vid })}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                          isActive
                            ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Video className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-purple-600" : "text-slate-400"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{vid.title}</p>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                            {vid.provider || "Video"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardSection>
            )}

            {/* PDF Materials */}
            {pack.materials && pack.materials.length > 0 && (
              <CardSection title="Downloadable PDF Materials" icon={FileText}>
                <div className="space-y-2">
                  {pack.materials.map((mat: IStudyMaterial, idx: number) => (
                    <div
                      key={mat._id || idx}
                      className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                            {mat.title}
                          </p>
                          {mat.size_bytes ? (
                            <span className="text-[10px] text-slate-400">
                              {(mat.size_bytes / (1024 * 1024)).toFixed(1)} MB • PDF Document
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">PDF Document</span>
                          )}
                        </div>
                      </div>

                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0"
                      >
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg">
                          <Download className="w-3.5 h-3.5 mr-1" />
                          <span>View</span>
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
