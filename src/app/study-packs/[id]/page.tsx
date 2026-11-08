"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  studyPackService,
  IStudyPack,
  ICustomVideo,
  IStudyMaterial,
  IMediaTicketData,
  IMediaTicketWatermark,
} from "@/services/studyPackService";
import { deliveryService, IDeliveryOrder } from "@/services/deliveryService";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/dev/tabs";
import { ForensicWatermarkOverlay } from "@/components/ui/forensic-watermark-overlay";
import {
  SecureVideoPlayer,
  extractYouTubeId,
  isStorageBucketUrl,
} from "@/components/ui/secure-video-player";
import { CanvasPdfShield } from "@/components/study-packs/canvas-pdf-shield";
import { DeliveryStepper } from "@/components/study-packs/delivery-stepper";
import { HybridCheckoutModal } from "@/components/study-packs/hybrid-checkout-modal";
import {
  Video,
  FileText,
  PlayCircle,
  ArrowLeft,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  Lock,
  Unlock,
  CheckCircle2,
  ShieldCheck,
  Package,
  BookOpen,
  HelpCircle,
  Clock,
  Award,
  ChevronRight,
  Eye,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";

type ActiveMediaType =
  | { type: "recording"; item: any }
  | { type: "video"; item: ICustomVideo }
  | { type: "material"; item: IStudyMaterial };

export default function StudyPackDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [pack, setPack] = useState<IStudyPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [watermark, setWatermark] = useState<IMediaTicketWatermark | null>(null);
  const [ticketData, setTicketData] = useState<IMediaTicketData | null>(null);
  const [activeMedia, setActiveMedia] = useState<ActiveMediaType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("recordings");

  // Fulfillment & Checkout
  const [deliveryOrder, setDeliveryOrder] = useState<IDeliveryOrder | null>(null);
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const isStaff = user && ["teacher", "moderator", "admin"].includes(user.role || "");

  useEffect(() => {
    if (!id || id === "undefined") return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadPackAndMediaTicket();
  }, [id, user]);

  const loadPackAndMediaTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);

      // 1. Fetch study pack basic metadata
      const packRes = await studyPackService.getStudyPackById(id as string);
      if (!packRes.success || !packRes.data) {
        toast.error("Study pack not found");
        router.replace("/study-packs");
        return;
      }

      const packData: IStudyPack = packRes.data;
      setPack(packData);

      // 2. Attempt media ticket retrieval if user is authenticated
      let accessGranted = Boolean(packData.has_access || isStaff);
      if (user) {
        try {
          const ticketRes = await studyPackService.getMediaTicket(id as string);
          if (ticketRes.success && ticketRes.data) {
            accessGranted = true;
            setTicketData(ticketRes.data);
            setWatermark(ticketRes.data.watermark);

            // Populate pack with authorized stream URLs
            if (ticketRes.data.media) {
              packData.recordings = ticketRes.data.media.recordings || packData.recordings;
              packData.custom_videos = ticketRes.data.media.custom_videos || packData.custom_videos;
              packData.materials = ticketRes.data.media.materials || packData.materials;
            }
          }
        } catch (err: any) {
          // If entitlement already granted via study pack endpoint or staff, create fallback watermark
          if (accessGranted) {
            setWatermark({
              studentId: (user._id as string) || "STU-AUTH",
              email: user.email || "student@lms.local",
              clientIp: "127.0.0.1",
              timestamp: Date.now(),
              displayText: `${user.email} • ID:${user._id} • SECURE-AUTH`,
            });
          } else {
            accessGranted = false;
            setTicketData(null);
            setWatermark(null);
          }
        }

        // Check if student has an existing order awaiting approval
        if (!accessGranted) {
          try {
            const myOrdersRes = await studyPackService.getMyOrders();
            if (myOrdersRes.success && Array.isArray(myOrdersRes.data)) {
              const pending = myOrdersRes.data.find(
                (o: any) =>
                  (o.study_pack_id?._id === id || o.study_pack_id === id) &&
                  (o.status === "pending" || o.status === "pending_approval")
              );
              setPendingOrder(pending || null);
            }
          } catch (e) {
            // non-blocking
          }
        } else {
          setPendingOrder(null);
        }
      } else {
        accessGranted = false;
        setPendingOrder(null);
      }

      setHasAccess(accessGranted);

      // 3. Preserve active media selection across refreshes or default to first available
      setActiveMedia((prev) => {
        if (prev) {
          if (prev.type === "recording" && packData.recordings) {
            const found = packData.recordings.find(
              (r: any) => (r._id || r.title) === (prev.item._id || prev.item.title)
            );
            if (found) return { type: "recording", item: found };
          } else if (prev.type === "video" && packData.custom_videos) {
            const found = packData.custom_videos.find(
              (v: any) => (v._id || v.title) === (prev.item._id || prev.item.title)
            );
            if (found) return { type: "video", item: found };
          } else if (prev.type === "material" && packData.materials) {
            const found = packData.materials.find(
              (m: any) => (m._id || m.title) === (prev.item._id || prev.item.title)
            );
            if (found) return { type: "material", item: found };
          }
        }
        if (packData.recordings && packData.recordings.length > 0) {
          return { type: "recording", item: packData.recordings[0] };
        } else if (packData.custom_videos && packData.custom_videos.length > 0) {
          return { type: "video", item: packData.custom_videos[0] };
        } else if (packData.materials && packData.materials.length > 0) {
          return { type: "material", item: packData.materials[0] };
        }
        return null;
      });

      // Default activeTab to whichever media category has content
      if (!packData.recordings || packData.recordings.length === 0) {
        if (packData.custom_videos && packData.custom_videos.length > 0) {
          setActiveTab("videos");
        } else if (packData.materials && packData.materials.length > 0) {
          setActiveTab("materials");
        }
      }

      // 4. Load deliveries
      fetchDeliveries(packData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load study pack details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async (currentPack?: IStudyPack | null) => {
    if (!user || !id) return;
    try {
      const res = await deliveryService.getMyDeliveries();
      const list: IDeliveryOrder[] = Array.isArray(res) ? res : res?.data || [];
      const packTitle = (currentPack || pack)?.title?.trim();
      const match = list.find(
        (del) =>
          del.study_pack_id === id ||
          (del.study_pack_id as any)?._id === id ||
          (packTitle ? del.items?.some((it) => it.title?.includes(packTitle)) : false)
      );
      if (match) {
        setDeliveryOrder(match);
      }
    } catch (err) {
      // deliveries are non-fatal
    }
  };

  const handlePurchaseSuccess = (purchaseData: any) => {
    if (purchaseData?.delivery) {
      setDeliveryOrder(purchaseData.delivery);
    }
    // Refresh access ticket
    loadPackAndMediaTicket();
  };

  const resolveVideoConfig = (url?: string, item?: any) => {
    const raw = url || item?.url || item?.video_url || "";
    if (!raw) return { isEmbed: false, src: "" };
    const ytId = extractYouTubeId(raw);
    if (ytId) {
      return {
        isEmbed: true,
        src: ytId,
      };
    }
    const trimmed = String(raw).trim();
    if (trimmed.includes("drive.google.com")) {
      const driveSrc = trimmed.includes("/view") ? trimmed.replace(/\/view(\?.*)?$/, "/preview") : trimmed;
      return { isEmbed: true, src: driveSrc };
    }
    if (trimmed.includes("vimeo.com")) {
      const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
      const vimeoSrc = vimeoMatch ? `https://player.vimeo.com/video/${vimeoMatch[1]}` : trimmed;
      return { isEmbed: true, src: vimeoSrc };
    }
    if (trimmed.includes("/embed/") || trimmed.includes("player.")) {
      return { isEmbed: true, src: trimmed };
    }
    return { isEmbed: false, src: trimmed };
  };

  const resolveRecordingUrl = (rec: any) => {
    if (!rec) return "";
    const candidates = [
      rec.video_url,
      rec.driveUrl,
      rec.driveFileId,
      rec.playback_url,
      rec.url,
    ];
    // 1. YouTube ID / URL extraction
    for (const cand of candidates) {
      if (typeof cand === "string" && cand.trim()) {
        const ytId = extractYouTubeId(cand);
        if (ytId) {
          return ytId;
        }
      }
    }
    // 2. Drive preview or direct video URL
    for (const cand of candidates) {
      if (typeof cand === "string" && cand.trim()) {
        const trimmed = cand.trim();
        if (trimmed.includes("drive.google.com") && trimmed.includes("/view")) {
          return trimmed.replace(/\/view(\?.*)?$/, "/preview");
        }
        if (trimmed.includes("vimeo.com")) {
          const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
          if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/uploads/")) {
          return trimmed;
        }
      }
    }
    return rec.driveFileId || rec.video_url || "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto py-12">
          <SectionLoader />
        </div>
      </div>
    );
  }

  if (!pack) return null;

  // Active curriculum playlist navigation helpers
  const currentCurriculumList =
    activeMedia?.type === "recording"
      ? pack?.recordings || []
      : activeMedia?.type === "video"
      ? pack?.custom_videos || []
      : pack?.materials || [];

  const currentItemIdx = currentCurriculumList.findIndex(
    (item: any) =>
      (item._id && activeMedia?.item?._id && item._id === activeMedia?.item?._id) ||
      (item.url && activeMedia?.item?.url && item.url === activeMedia?.item?.url) ||
      (item.title && activeMedia?.item?.title && item.title === activeMedia?.item?.title)
  );

  const hasPrevMedia = currentItemIdx > 0;
  const hasNextMedia =
    currentItemIdx >= 0 && currentItemIdx < currentCurriculumList.length - 1;

  const goToPrevMedia = () => {
    if (hasPrevMedia && activeMedia) {
      setActiveMedia({
        type: activeMedia.type,
        item: currentCurriculumList[currentItemIdx - 1],
      });
    }
  };

  const goToNextMedia = () => {
    if (hasNextMedia && activeMedia) {
      setActiveMedia({
        type: activeMedia.type,
        item: currentCurriculumList[currentItemIdx + 1],
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link
              href="/study-packs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Study Packs</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-600 dark:text-slate-400">Academy</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white font-semibold truncate max-w-xs md:max-w-md">
              {pack.title}
            </span>
          </div>
        </div>

        {/* Spacious Study Pack Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 right-0 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

          {/* Badges row */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Digital Study Pack
            </span>
            {pack.subject?.name && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                {pack.subject.name}
              </span>
            )}
            {pack.grade?.name && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                {pack.grade.name}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 text-[11px] font-bold">
              {pack.price > 0 ? `LKR ${pack.price.toLocaleString()}` : "FREE ACCESS"}
            </span>
          </div>

          {/* Title - Full width, clean typography, no squishing! */}
          <div className="relative z-10 space-y-2 max-w-5xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight w-full break-words">
              {pack.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed mt-2">
              {pack.description ||
                "Instructional Media Hub with classroom lectures, breakdown clips, forensic watermarked notes, and assessments."}
            </p>
          </div>

          {/* Action & Status Row */}
          <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Entitlement Status Badge */}
            <div className="flex items-center gap-2">
              {hasAccess ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Unlocked & Entitled (Full Media Access)</span>
                </span>
              ) : pendingOrder ? (
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold shadow-xs">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span>Payment Slip Uploaded • Teacher Approval Pending</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Requires Bank Slip Verification to Unlock</span>
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!hasAccess && !pendingOrder && (
                <Button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-10 px-5 shadow-md flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>
                    Unlock Study Pack {pack.price > 0 ? `(LKR ${pack.price.toLocaleString()})` : "Free"}
                  </span>
                </Button>
              )}

              {pendingOrder && !hasAccess && (
                <Button
                  onClick={() => setIsCheckoutOpen(true)}
                  variant="outline"
                  className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl text-xs font-semibold h-10 px-4"
                >
                  <Clock className="w-4 h-4 mr-1.5" />
                  <span>Update Payment Slip</span>
                </Button>
              )}


              {isStaff && (
                <Link href={`/admin/study-packs/${pack._id}/edit`}>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-xl text-xs font-semibold h-10 px-4"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Study Pack</span>
                  </Button>
                </Link>
              )}

              {pack.class_id?._id && (
                <Link href={`/classes/${pack.class_id._id}`}>
                  <Button variant="secondary" className="text-xs font-semibold rounded-xl h-10 px-4">
                    View Class ({pack.class_id.title || "Class Details"})
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Summary Banner for Locked / Pending Entitlement */}
        {!hasAccess && (
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              pendingOrder
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  pendingOrder
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                    : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                }`}
              >
                {pendingOrder ? <Clock className="w-5 h-5 animate-pulse" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold">
                  {pendingOrder
                    ? "Payment Slip Uploaded • Teacher Approval Pending"
                    : "Study Pack Content Protected"}
                </h3>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    pendingOrder
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-slate-300"
                  }`}
                >
                  {pendingOrder
                    ? "We have received your bank payment slip and our instructors are verifying it. Once approved, the complete lecture recordings, concept breakdown videos, and revision PDFs will automatically unlock."
                    : "This study pack contains proprietary lecture recordings, topic clips, and lecture notes. Purchase this pack or upload your bank deposit slip to gain full streaming and download access."}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsCheckoutOpen(true)}
              className={`shrink-0 rounded-xl text-xs font-bold h-10 px-5 shadow-md ${
                pendingOrder
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {pendingOrder ? (
                <>
                  <Clock className="w-4 h-4 mr-1.5" />
                  Update Payment Slip
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-1.5" />
                  Purchase / Upload Bank Slip
                </>
              )}
            </Button>
          </div>
        )}

        {/* 65% / 35% Split Stage Media Hub (Always visible; shows locked state & watermark when appropriate) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Column (65% on Desktop): Active Media Player & Watermark Stage */}
          <div className="w-full lg:w-[65%] space-y-6">
            {/* Primary Interactive Media Stage */}
            <div
              style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
              className="relative w-full aspect-video min-h-[320px] sm:min-h-[440px] md:min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-black"
            >
              {/* Material PDF Reader Stage */}
              {activeMedia?.type === "material" ? (
                <CanvasPdfShield
                  title={activeMedia.item.title}
                  pdfUrl={hasAccess ? activeMedia.item.file_url : null}
                  isLocked={!hasAccess}
                  watermark={watermark}
                  onUnlock={() => setIsCheckoutOpen(true)}
                  onClose={() => {
                    // Revert to first recording or video
                    if (pack.recordings && pack.recordings.length > 0) {
                      setActiveMedia({ type: "recording", item: pack.recordings[0] });
                      setActiveTab("recordings");
                    } else if (pack.custom_videos && pack.custom_videos.length > 0) {
                      setActiveMedia({ type: "video", item: pack.custom_videos[0] });
                      setActiveTab("videos");
                    }
                  }}
                />
              ) : activeMedia ? (
                /* Video or Recording Stage */
                <SecureVideoPlayer
                  url={
                    activeMedia.type === "video"
                      ? resolveVideoConfig(activeMedia.item.url, activeMedia.item).src
                      : resolveRecordingUrl(activeMedia.item)
                  }
                  title={activeMedia.item.title}
                  watermark={watermark}
                  isLocked={!hasAccess}
                  onUnlock={() => setIsCheckoutOpen(true)}
                  lockPrice={pack.price}
                  badgeLabel={
                    activeMedia.type === "recording"
                      ? "Classroom Lecture Stream"
                      : "Concept Breakdown Clip"
                  }
                  autoPlay={true}
                />
              ) : (
                <div
                  style={{ minHeight: "360px", aspectRatio: "16 / 9" }}
                  className="w-full aspect-video min-h-[320px] sm:min-h-[440px] md:min-h-[500px] flex items-center justify-center text-center p-8 text-slate-500"
                >
                  <div>
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-40 text-indigo-400" />
                    <p className="text-sm font-medium text-slate-300">
                      Select an item from the curriculum drawer to start learning.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Currently Playing Metadata & Enhanced Navigation Bar */}
            {activeMedia && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      Now Playing •{" "}
                      {activeMedia.type === "recording"
                        ? "Classroom Lecture"
                        : activeMedia.type === "video"
                        ? "Concept Breakdown Clip"
                        : "PDF Study Material"}
                    </span>
                    {currentItemIdx >= 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        {currentItemIdx + 1} of {currentCurriculumList.length}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {activeMedia.item.title}
                  </h2>
                  {activeMedia.item.session_date ? (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Recorded on {new Date(activeMedia.item.session_date).toLocaleDateString()}{" "}
                      {activeMedia.item.batch_name ? `• ${activeMedia.item.batch_name}` : ""}
                    </span>
                  ) : activeMedia.item.provider ? (
                    <span className="text-xs text-slate-400 block pt-0.5 capitalize">
                      Source: {activeMedia.item.provider} Stream
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Protected HD Stream</span>
                  </div>

                  {currentCurriculumList.length > 1 && (
                    <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPrevMedia}
                        disabled={!hasPrevMedia}
                        className="h-8 px-2.5 text-xs font-semibold rounded-xl"
                        title="Previous item"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextMedia}
                        disabled={!hasNextMedia}
                        className="h-8 px-2.5 text-xs font-semibold rounded-xl"
                        title="Next item"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visual Delivery Stepper (Real-time physical fulfillment status) */}
            {deliveryOrder && (
              <DeliveryStepper
                orderId={deliveryOrder.order_id}
                status={deliveryOrder.status}
                courierService={deliveryOrder.courier_service}
                trackingNumber={deliveryOrder.tracking_number}
                shippingAddress={deliveryOrder.shipping_address}
                recipientPhone={deliveryOrder.recipient_phone}
                recipientName={deliveryOrder.recipient_name}
                dispatchedAt={deliveryOrder.dispatched_at}
                deliveredAt={deliveryOrder.delivered_at}
                createdAt={deliveryOrder.created_at}
              />
            )}
          </div>

          {/* Right Column (35% on Desktop): Tabbed Curriculum Drawer */}
          <div className="w-full lg:w-[35%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation Triggers */}
              <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <TabsTrigger
                  value="recordings"
                  className="text-[11px] py-2 px-1 font-semibold rounded-lg flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Lectures</span>
                  {pack.recordings?.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {pack.recordings.length}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="videos"
                  className="text-[11px] py-2 px-1 font-semibold rounded-lg flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
                >
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Clips</span>
                  {pack.custom_videos?.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {pack.custom_videos.length}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="materials"
                  className="text-[11px] py-2 px-1 font-semibold rounded-lg flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">PDFs</span>
                  {pack.materials?.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {pack.materials.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Classroom Recordings */}
              <TabsContent value="recordings" className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {pack.recordings && pack.recordings.length > 0 ? (
                  pack.recordings.map((rec: any, idx: number) => {
                    const isActive =
                      activeMedia?.type === "recording" && activeMedia.item._id === rec._id;
                    const isLocked = !hasAccess;

                    return (
                      <button
                        key={rec._id || idx}
                        onClick={() => {
                          setActiveMedia({ type: "recording", item: rec });
                          if (isLocked) setIsCheckoutOpen(true);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                          isActive
                            ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        ) : isActive ? (
                          <div className="flex items-center gap-0.5 mt-1 shrink-0">
                            <span className="w-1 h-3 bg-indigo-600 dark:bg-indigo-400 animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-indigo-600 dark:bg-indigo-400 animate-pulse delay-100 rounded-full" />
                            <span className="w-1 h-2 bg-indigo-600 dark:bg-indigo-400 animate-pulse delay-200 rounded-full" />
                          </div>
                        ) : (
                          <PlayCircle
                            className="w-4 h-4 mt-0.5 shrink-0 text-slate-400"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium truncate">{rec.title}</p>
                            {isLocked ? (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold shrink-0">
                                Locked
                              </span>
                            ) : isActive ? (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold shrink-0 uppercase tracking-wider">
                                Playing
                              </span>
                            ) : null}
                          </div>
                          {rec.session_date && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(rec.session_date).toLocaleDateString()}{" "}
                              {rec.batch_name ? `• ${rec.batch_name}` : ""}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    No classroom lecture recordings in this study pack.
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Concept Breakdown Clips */}
              <TabsContent value="videos" className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {pack.custom_videos && pack.custom_videos.length > 0 ? (
                  pack.custom_videos.map((vid: ICustomVideo, idx: number) => {
                    const isActive =
                      activeMedia?.type === "video" && activeMedia.item.url === vid.url;
                    const isLocked = !hasAccess;

                    return (
                      <button
                        key={vid._id || idx}
                        onClick={() => {
                          setActiveMedia({ type: "video", item: vid });
                          if (isLocked) setIsCheckoutOpen(true);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                          isActive
                            ? "bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        ) : isActive ? (
                          <div className="flex items-center gap-0.5 mt-1 shrink-0">
                            <span className="w-1 h-3 bg-purple-600 dark:bg-purple-400 animate-pulse rounded-full" />
                            <span className="w-1 h-4 bg-purple-600 dark:bg-purple-400 animate-pulse delay-100 rounded-full" />
                            <span className="w-1 h-2 bg-purple-600 dark:bg-purple-400 animate-pulse delay-200 rounded-full" />
                          </div>
                        ) : (
                          <Video
                            className="w-4 h-4 mt-0.5 shrink-0 text-slate-400"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium truncate">{vid.title}</p>
                            {isLocked ? (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold shrink-0">
                                Locked
                              </span>
                            ) : isActive ? (
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold shrink-0 uppercase tracking-wider">
                                Playing
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                            {vid.provider || "Video Lesson"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    No concept breakdown clips in this pack.
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: PDF Study Materials */}
              <TabsContent value="materials" className="mt-4 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {pack.materials && pack.materials.length > 0 ? (
                  pack.materials.map((mat: IStudyMaterial, idx: number) => {
                    const isActive =
                      activeMedia?.type === "material" && activeMedia.item.title === mat.title;
                    const isLocked = !hasAccess;

                    return (
                      <div
                        key={mat._id || idx}
                        onClick={() => {
                          setActiveMedia({ type: "material", item: mat });
                          if (isLocked) setIsCheckoutOpen(true);
                        }}
                        className={`p-3 rounded-xl transition-all cursor-pointer border flex items-center justify-between gap-3 ${
                          isActive
                            ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold shadow-xs"
                            : "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 border-amber-200/60 dark:border-amber-900/40 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isLocked ? (
                            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                              {mat.title}
                            </p>
                            {mat.size_bytes ? (
                              <span className="text-[10px] text-slate-400">
                                {(mat.size_bytes / (1024 * 1024)).toFixed(1)} MB • Protected PDF Shield
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Protected PDF Document</span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          {isLocked ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCheckoutOpen(true);
                              }}
                              className="h-7 px-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg"
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Unlock
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    No PDF study materials attached to this pack.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Study Pack Overview & Details (visible when pack is locked so students can review contents & syllabus details) */}
        {!hasAccess && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Cover Image */}
              <div className="lg:col-span-5 relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner group">
                <Image
                  src={pack.thumbnail_url || CLAY_ASSETS.thumbTheoryOpenbook || "/images/placeholder.jpg"}
                  alt={pack.title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2 text-white text-xs font-semibold">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Curriculum & Inner Media Locked</span>
                  </div>
                </div>
              </div>

              {/* Right: Overview Details */}
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {pack.subject?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 text-[11px] font-bold">
                        {pack.subject.name}
                      </span>
                    )}
                    {pack.grade?.name && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 text-[11px] font-medium">
                        {pack.grade.name}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 text-[11px] font-bold">
                      {pack.price > 0 ? `LKR ${pack.price.toLocaleString()}` : "Free Pack"}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {pack.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pack.description ||
                      "Comprehensive structured syllabus bundle designed for examination mastery with guided lectures, theory breakdowns, and student revision notes."}
                  </p>
                </div>

                {/* Key Features List */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                    What is Included upon Purchase:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Curated classroom lecture recordings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>High-definition concept breakdown clips</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Downloadable PDF revision notes & tutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Forensic watermark secured document viewer</span>
                    </div>
                  </div>
                </div>

                {/* Purchase / Slip Action Button */}
                <div className="pt-3">
                  <Button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold h-12 px-8 shadow-md flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>
                      Purchase / Upload Bank Slip{" "}
                      {pack.price > 0 ? `(LKR ${pack.price.toLocaleString()})` : "Free"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hybrid Checkout & Physical Notes Fulfillment Modal */}
      {pack && (
        <HybridCheckoutModal
          pack={pack}
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}
