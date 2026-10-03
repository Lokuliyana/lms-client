"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { studyPackService, IStudyPack, ICustomVideo, IStudyMaterial } from "@/services/studyPackService";
import { getClasses } from "@/services/classService";
import { useTaxonomy } from "@/context/CustomizationContext";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  PlayCircle,
  Video,
  FileText,
  Check,
  X,
  Search,
  ExternalLink,
  PlusCircle,
  ArrowRight,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminStudyPacksPage() {
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const { user } = useAuth();
  const { subjects, grades } = useTaxonomy();

  const [studyPacks, setStudyPacks] = useState<IStudyPack[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [price, setPrice] = useState(0);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Past recordings fetched for the selected class
  const [availableRecordings, setAvailableRecordings] = useState<any[]>([]);
  const [selectedRecordingIds, setSelectedRecordingIds] = useState<string[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(false);

  // Custom videos & materials
  const [customVideos, setCustomVideos] = useState<ICustomVideo[]>([]);
  const [materials, setMaterials] = useState<IStudyMaterial[]>([]);

  // Search filter
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (editParam && studyPacks.length > 0) {
      const pack = studyPacks.find((p) => p._id === editParam);
      if (pack) {
        handleOpenEdit(pack);
      }
    }
  }, [editParam, studyPacks]);

  // When class changes in form, automatically load its recordings
  useEffect(() => {
    if (selectedClass) {
      loadClassRecordings(selectedClass);
    } else {
      setAvailableRecordings([]);
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [packsRes, classesRes] = await Promise.all([
        studyPackService.getStudyPacks(),
        getClasses(),
      ]);

      if (packsRes.success) setStudyPacks(packsRes.data);
      if (Array.isArray(classesRes)) {
        setClassesList(classesRes);
      } else if ((classesRes as any)?.data) {
        setClassesList((classesRes as any).data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load study packs");
    } finally {
      setLoading(false);
    }
  };

  const loadClassRecordings = async (classId: string) => {
    try {
      setLoadingRecordings(true);
      const res = await studyPackService.getClassRecordings(classId);
      if (res.success) {
        setAvailableRecordings(res.data || []);
      }
    } catch {
      toast.error("Could not fetch past recordings for this class");
    } finally {
      setLoadingRecordings(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSelectedGrade("");
    setSelectedClass("");
    setSelectedSubject("");
    setPrice(0);
    setThumbnailUrl("");
    setIsPublished(true);
    setSelectedRecordingIds([]);
    setAvailableRecordings([]);
    setCustomVideos([]);
    setMaterials([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (pack: IStudyPack) => {
    setEditingId(pack._id);
    setTitle(pack.title);
    setDescription(pack.description || "");
    const gradeId = pack.grade?._id || pack.grade || "";
    const classId = pack.class_id?._id || pack.class_id || "";
    const subjectId = pack.subject?._id || pack.subject || "";
    setSelectedGrade(gradeId);
    setSelectedClass(classId);
    setSelectedSubject(subjectId);
    setPrice(pack.price || 0);
    setThumbnailUrl(pack.thumbnail_url || "");
    setIsPublished(pack.is_published !== false);

    const recIds = (pack.recordings || []).map((r: any) => (typeof r === "object" ? r._id : r));
    setSelectedRecordingIds(recIds);
    setCustomVideos(pack.custom_videos || []);
    setMaterials(pack.materials || []);

    if (classId) {
      await loadClassRecordings(classId);
    }
    setIsModalOpen(true);
  };

  const toggleRecordingSelection = (recId: string) => {
    setSelectedRecordingIds((prev) =>
      prev.includes(recId) ? prev.filter((id) => id !== recId) : [...prev, recId]
    );
  };

  const addCustomVideoRow = () => {
    setCustomVideos((prev) => [
      ...prev,
      { title: "", url: "", provider: "youtube" },
    ]);
  };

  const updateCustomVideo = (index: number, field: keyof ICustomVideo, val: any) => {
    setCustomVideos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeCustomVideo = (index: number) => {
    setCustomVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const addMaterialRow = () => {
    setMaterials((prev) => [
      ...prev,
      { title: "", file_url: "", file_type: "pdf" },
    ]);
  };

  const updateMaterial = (index: number, field: keyof IStudyMaterial, val: any) => {
    setMaterials((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the study pack");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<IStudyPack> = {
        title: title.trim(),
        description: description.trim(),
        grade: selectedGrade || undefined,
        class_id: selectedClass || undefined,
        subject: selectedSubject || undefined,
        price: Number(price) || 0,
        thumbnail_url: thumbnailUrl.trim(),
        recordings: selectedRecordingIds,
        custom_videos: customVideos.filter((v) => v.title.trim() && v.url.trim()),
        materials: materials.filter((m) => m.title.trim() && m.file_url.trim()),
        is_published: isPublished,
      };

      if (editingId) {
        const res = await studyPackService.updateStudyPack(editingId, payload);
        if (res.success) {
          toast.success("Study pack updated successfully");
          setIsModalOpen(false);
          fetchInitialData();
        }
      } else {
        const res = await studyPackService.createStudyPack(payload);
        if (res.success) {
          toast.success("Study pack created successfully");
          setIsModalOpen(false);
          fetchInitialData();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save study pack");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await studyPackService.deleteStudyPack(id);
      if (res.success) {
        toast.success("Study pack deleted successfully");
        setStudyPacks((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete study pack");
    }
  };

  const filteredPacks = studyPacks.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Layers}
          title={
            <EditableContent
              configKey="admin_studypacks_title"
              initialValue="Digital Study Pack Studio"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="admin_studypacks_desc"
              initialValue="Assemble and manage multimedia digital learning bundles with past class recordings, YouTube video breakdowns, and PDF notes."
              as="span"
            />
          }
          actions={
            <div className="flex items-center gap-3">
              <Link href="/study-packs">
                <Button variant="outline" className="text-xs font-semibold rounded-xl">
                  <span>Student Catalog</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
              <Button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs px-4 py-2 text-sm font-medium"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Study Pack</span>
              </Button>
            </div>
          }
        />

        {/* Search bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search study packs..."
              className="pl-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total Study Packs: <span className="font-bold text-slate-900 dark:text-white">{filteredPacks.length}</span>
          </div>
        </div>

        {/* Study Packs List */}
        <CardSection
          title={
            <EditableContent
              configKey="admin_studypacks_table_title"
              initialValue="Published Study Packs"
              as="span"
            />
          }
          icon={Video}
        >
          {loading ? (
            <div className="py-12">
              <SectionLoader />
            </div>
          ) : filteredPacks.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No study packs found. Click "Create Study Pack" to assemble your first digital bundle!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="pb-3 pl-2">Bundle Title</th>
                    <th className="pb-3">Class & Grade</th>
                    <th className="pb-3">Recordings</th>
                    <th className="pb-3">Videos</th>
                    <th className="pb-3">PDFs</th>
                    <th className="pb-3">Fee</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPacks.map((pack) => (
                    <tr key={pack._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-2 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        <Link href={`/study-packs/${pack._id}`} className="hover:text-primary transition-colors">
                          {pack.title}
                        </Link>
                      </td>
                      <td className="py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        {pack.class_id?.title || "No Class"} {pack.grade?.name ? `(${pack.grade.name})` : ""}
                      </td>
                      <td className="py-3.5 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-600">
                          <PlayCircle className="w-3.5 h-3.5" />
                          {pack.recordings?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-purple-600">
                          <Video className="w-3.5 h-3.5" />
                          {pack.custom_videos?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                          <FileText className="w-3.5 h-3.5" />
                          {pack.materials?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs font-bold text-slate-900 dark:text-white">
                        {pack.price > 0 ? `LKR ${pack.price}` : "Free"}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pack.is_published
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {pack.is_published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(pack)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(pack._id, pack.title)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardSection>

        {/* Modal: Create / Edit Study Pack */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full my-8 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingId ? "Edit Digital Study Pack" : "Create Digital Study Pack"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a class to attach its past recordings, and add YouTube or PDF study resources.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Basic Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Study Pack Title *
                    </label>
                    <Input
                      required
                      value={title}
                      onChange={(e: any) => setTitle(e.target.value)}
                      placeholder="e.g. Pure Mathematics Integration Master Bundle"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Description & Syllabus Focus
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Overview of recordings, topic depth, and student guidelines..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm bg-white dark:bg-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Grade Level
                    </label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value="">Select Grade</option>
                      {grades.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Subject
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 outline-none"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Associated Class (to pull past recordings)
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 outline-none font-medium"
                    >
                      <option value="">Select Class to populate past recordings</option>
                      {classesList.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.title} {cls.class_code ? `(${cls.class_code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Access Price (LKR)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e: any) => setPrice(Number(e.target.value))}
                      placeholder="0 for Free"
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Thumbnail Image URL
                    </label>
                    <Input
                      value={thumbnailUrl}
                      onChange={(e: any) => setThumbnailUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Section: Select Past Recordings */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Past Classroom Lecture Recordings
                      </h3>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">
                      {selectedRecordingIds.length} Selected
                    </span>
                  </div>

                  {loadingRecordings ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading recordings...</div>
                  ) : availableRecordings.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      {selectedClass
                        ? "No past recordings found for this class. You can add topic videos below."
                        : "Select an associated class above to browse and attach past recordings."}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {availableRecordings.map((rec) => {
                        const isSelected = selectedRecordingIds.includes(rec._id);
                        return (
                          <div
                            key={rec._id}
                            onClick={() => toggleRecordingSelection(rec._id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-50/80 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-100"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-5 h-5 rounded flex items-center justify-center border ${
                                  isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">{rec.title}</p>
                                {rec.session_date && (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(rec.session_date).toLocaleDateString()}{" "}
                                    {rec.batch_name ? `• ${rec.batch_name}` : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section: Custom Topic Videos */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Topic Videos (YouTube / Upload)
                      </h3>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={addCustomVideoRow}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Video
                    </Button>
                  </div>

                  {customVideos.map((vid, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Video Title (e.g. Calculus Visualizer)"
                        value={vid.title}
                        onChange={(e: any) => updateCustomVideo(idx, "title", e.target.value)}
                        className="rounded-xl text-xs flex-1"
                      />
                      <Input
                        placeholder="YouTube / Video URL"
                        value={vid.url}
                        onChange={(e: any) => updateCustomVideo(idx, "url", e.target.value)}
                        className="rounded-xl text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomVideo(idx)}
                        className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Section: PDF Materials */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        PDF Materials & Derivations
                      </h3>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={addMaterialRow}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add PDF Material
                    </Button>
                  </div>

                  {materials.map((mat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Document Title (e.g. Formulas Sheet)"
                        value={mat.title}
                        onChange={(e: any) => updateMaterial(idx, "title", e.target.value)}
                        className="rounded-xl text-xs flex-1"
                      />
                      <Input
                        placeholder="PDF File URL"
                        value={mat.file_url}
                        onChange={(e: any) => updateMaterial(idx, "file_url", e.target.value)}
                        className="rounded-xl text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeMaterial(idx)}
                        className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Toggle Publish */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <label htmlFor="isPublished" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Publish Study Pack for Students Immediately
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl px-5"
                  >
                    {isSubmitting ? "Saving..." : editingId ? "Update Study Pack" : "Create Study Pack"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
