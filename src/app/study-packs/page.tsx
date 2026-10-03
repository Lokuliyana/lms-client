"use client";

import { useEffect, useState } from "react";
import { studyPackService, IStudyPack } from "@/services/studyPackService";
import { useAuth } from "@/hooks/useAuth";
import { useTaxonomy } from "@/context/CustomizationContext";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

export default function StudyPacksCatalogPage() {
  const { user } = useAuth();
  const { subjects, grades } = useTaxonomy();
  const [studyPacks, setStudyPacks] = useState<IStudyPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  const isStaff = user && ["teacher", "moderator", "admin"].includes(user.role || "");

  useEffect(() => {
    fetchStudyPacks();
  }, [selectedGrade, selectedSubject]);

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

        {/* Home Delivery Notice Banner */}
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Looking for printed tute packs or physical books?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Study packs here are digital multimedia collections. For printed materials delivered via courier, visit the Physical Store.
              </p>
            </div>
          </div>
          <Link href="/store" className="shrink-0">
            <Button size="sm" variant="secondary" className="flex items-center gap-1.5 text-xs font-semibold rounded-xl">
              <span>Go to Physical Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs md:text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 outline-none"
            >
              <option value="all">All Grades</option>
              {grades.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs md:text-sm font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 outline-none"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search study packs..."
              className="pl-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
            >
            </Input>
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
                const recordingCount = pack.recordings?.length || 0;
                const videoCount = pack.custom_videos?.length || 0;
                const materialCount = pack.materials?.length || 0;

                return (
                  <div
                    key={pack._id}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
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

                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {pack.grade?.name && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-xs shadow-xs">
                              {pack.grade.name}
                            </span>
                          )}
                          {pack.subject?.name && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-600/95 text-white backdrop-blur-xs shadow-xs">
                              {pack.subject.name}
                            </span>
                          )}
                        </div>

                        {pack.price === 0 && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Free Access
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        {pack.class_id?.title && (
                          <span className="text-[11px] font-semibold text-primary block truncate">
                            Class: {pack.class_id.title}
                          </span>
                        )}

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

                      <Link href={`/study-packs/${pack._id}`}>
                        <Button className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-xs px-4 py-2">
                          <span>View Pack</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardSection>
      </div>
    </div>
  );
}
