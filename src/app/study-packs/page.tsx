"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { studyPackService, IStudyPack, IStudyPackOrder } from "@/services/studyPackService";
import { useAuth } from "@/hooks/useAuth";
import { useTaxonomy } from "@/context/CustomizationContext";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HybridCheckoutModal } from "@/components/study-packs/hybrid-checkout-modal";
import { cn } from "@/lib/utils";
import {
  Video,
  FileText,
  PlayCircle,
  Search,
  Package,
  Layers,
  ArrowRight,
  PlusCircle,
  GraduationCap,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function StudyPacksCatalogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subjects, grades } = useTaxonomy();
  const [studyPacks, setStudyPacks] = useState<IStudyPack[]>([]);
  const [myOrders, setMyOrders] = useState<IStudyPackOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // Checkout modal state
  const [checkoutPack, setCheckoutPack] = useState<IStudyPack | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const userRole = String(user?.role || "").toLowerCase().trim();
  const isStaff = Boolean(user && ["teacher", "moderator", "admin"].includes(userRole));

  useEffect(() => {
    fetchStudyPacks();
  }, [selectedGrade, selectedSubject]);

  useEffect(() => {
    if (user) {
      studyPackService
        .getMyOrders()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMyOrders(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load user orders:", err);
        });
    } else {
      setMyOrders([]);
    }
  }, [user]);

  const fetchStudyPacks = async () => {
    try {
      setLoading(true);
      const res = await studyPackService.getStudyPacks({
        grade: selectedGrade === "all" ? undefined : selectedGrade,
        subject: selectedSubject === "all" ? undefined : selectedSubject,
        search: search || undefined,
      });
      if (res.success) {
        setStudyPacks(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load study packs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudyPacks();
  };

  const handleUnlockPack = (pack: IStudyPack) => {
    if (!user) {
      toast.error("Please sign in to unlock and purchase study packs");
      router.push("/login");
      return;
    }
    setCheckoutPack(pack);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (purchaseData: any) => {
    setIsCheckoutOpen(false);
    fetchStudyPacks();
    if (user) {
      studyPackService
        .getMyOrders()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMyOrders(res.data);
          }
        })
        .catch((err) => console.error(err));
    }
    if (purchaseData?.digital_access_unlocked && checkoutPack) {
      router.push(`/study-packs/${checkoutPack._id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Video}
          title={
            <EditableContent
              configKey="studypacks_page_title"
              initialValue="Digital Study Packs & Video Archives"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="studypacks_page_desc"
              initialValue="Access complete digital bundles featuring past classroom lecture recordings, YouTube video breakdowns, and downloadable PDF study notes."
              as="span"
            />
          }
          actions={
            <div className="flex items-center gap-3">
              {isStaff && (
                <Link href="/admin/study-packs">
                  <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs px-4 py-2 text-sm font-medium">
                    <PlusCircle className="w-4 h-4" />
                    <span>Manage Study Packs</span>
                  </Button>
                </Link>
              )}
              <Link href="/store">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  <Package className="w-4 h-4 text-primary" />
                  <span>Physical Store (Home Delivery)</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer appearance-none"
              >
                <option value="all">All Grades</option>
                {grades.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▼
              </div>
            </div>

            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-9 pl-3 pr-8 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer appearance-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {(selectedGrade !== "all" || selectedSubject !== "all" || search) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade("all");
                  setSelectedSubject("all");
                  setSearch("");
                }}
                className="h-9 px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0"
              >
                Reset
              </button>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search study packs..."
              className="pl-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-xs"
            />
          </form>
        </div>

        {/* Catalog Content inside CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="studypacks_section_heading"
              initialValue="Featured Digital Study Bundles"
              as="span"
            />
          }
          icon={Layers}
        >
          {loading ? (
            <div className="py-12">
              <SectionLoader />
            </div>
          ) : studyPacks.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mx-auto">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                No Digital Study Packs Found
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                No study packs match your current filters. Teachers regularly upload past class recordings and learning materials here.
              </p>
              {isStaff && (
                <Link href="/admin/study-packs">
                  <Button className="mt-2 bg-primary text-white rounded-xl">
                    Create First Study Pack
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {studyPacks.map((pack) => {
                const recordingCount =
                  (pack as any).recordings_count ?? pack.recordings?.length ?? 0;
                const videoCount =
                  (pack as any).custom_videos_count ?? pack.custom_videos?.length ?? 0;
                const materialCount =
                  (pack as any).materials_count ?? pack.materials?.length ?? 0;

                const packOrder = myOrders.find((o) => {
                  const pId = (o.study_pack_id as any)?._id || o.study_pack_id;
                  return String(pId) === String(pack._id);
                });

                const isCreator = Boolean(
                  user &&
                  pack.created_by &&
                  (String((pack.created_by as any)?._id || pack.created_by) === String((user as any)?._id || (user as any)?.id))
                );

                const hasApprovedOrder = Boolean(
                  packOrder &&
                  packOrder.status !== "cancelled" &&
                  packOrder.status !== "pending" &&
                  packOrder.status !== "pending_approval" &&
                  (packOrder.status === "active" || packOrder.status === "completed") &&
                  packOrder.digital_access_granted === true
                );

                // Unlocked ONLY for staff, creator, or student with an active approved database order
                const isUnlocked = Boolean(
                  isStaff ||
                  isCreator ||
                  (Boolean(user) && hasApprovedOrder)
                );

                const isPendingVerification = Boolean(
                  !isUnlocked &&
                  packOrder &&
                  packOrder.status !== "cancelled" &&
                  (packOrder.status === "pending" || packOrder.status === "pending_approval")
                );

                return (
                  <div
                    key={pack._id}
                    onClick={() => {
                      if (isUnlocked) {
                        router.push(`/study-packs/${pack._id}`);
                      } else {
                        handleUnlockPack(pack);
                      }
                    }}
                    className={cn(
                      "group bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer",
                      isUnlocked
                        ? "border-emerald-200/90 dark:border-emerald-900/50 hover:border-emerald-400"
                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                    )}
                  >
                    <div>
                      {/* Image / Thumbnail */}
                      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {pack.thumbnail_url ? (
                          <img
                            src={pack.thumbnail_url}
                            alt={pack.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                            <Video className="w-10 h-10 mb-2 opacity-50" />
                            <span className="text-xs font-medium">Digital Study Pack</span>
                          </div>
                        )}

                        {/* Top-Right Access Badge (Clean thumbnail overlay with zero badge collisions) */}
                        <div className="absolute top-3 right-3 z-10">
                          {isUnlocked ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-600 text-white shadow-md">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              <span>Unlocked & Ready</span>
                            </div>
                          ) : isPendingVerification ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-amber-500 text-white shadow-md">
                              <Clock className="w-3.5 h-3.5 text-white" />
                              <span>Payment Under Review</span>
                            </div>
                          ) : pack.price === 0 ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-900/85 text-white border border-white/20 backdrop-blur-md shadow-md">
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                              <span>Locked • Free Access</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-slate-900/85 text-white border border-white/20 backdrop-blur-md shadow-md">
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                              <span>Locked</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        {/* Grade, Subject & Class metadata tags */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {pack.grade?.name && (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                              {pack.grade.name}
                            </span>
                          )}
                          {pack.subject?.name && (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                              {pack.subject.name}
                            </span>
                          )}
                          {pack.class_id?.title && (
                            <span className="text-[11px] font-semibold text-primary truncate">
                              • {pack.class_id.title}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {pack.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {pack.description || "Digital learning bundle including class recordings and notes."}
                        </p>

                        {/* Content Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {recordingCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                              <PlayCircle className="w-3.5 h-3.5" />
                              {recordingCount} Past {recordingCount === 1 ? "Recording" : "Recordings"}
                            </span>
                          )}
                          {videoCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/40">
                              <Video className="w-3.5 h-3.5" />
                              {videoCount} {videoCount === 1 ? "Video" : "Videos"}
                            </span>
                          )}
                          {materialCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40">
                              <FileText className="w-3.5 h-3.5" />
                              {materialCount} PDF {materialCount === 1 ? "Material" : "Materials"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer / CTA */}
                    <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/60 mt-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Access Fee</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {pack.price > 0 ? `LKR ${pack.price.toLocaleString()}` : "Free"}
                        </span>
                      </div>

                      {/* Purchased packs link inside; unpurchased trigger checkout modal */}
                      {isUnlocked ? (
                        <Link
                          href={`/study-packs/${pack._id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 shadow-xs transition-all">
                            <span>Access Study Pack</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      ) : isPendingVerification ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockPack(pack);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 shadow-xs transition-all"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Approval</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlockPack(pack);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 shadow-xs transition-all"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Unlock Now</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardSection>

        {/* Bank Slip Upload Checkout Modal */}
        {checkoutPack && (
          <HybridCheckoutModal
            pack={checkoutPack}
            isOpen={isCheckoutOpen}
            onClose={() => {
              setIsCheckoutOpen(false);
              setCheckoutPack(null);
            }}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </div>
    </div>
  );
}
