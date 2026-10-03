"use client";

import { useEffect, useState } from "react";
import { examService, IExam } from "@/services/examService";
import { getClasses } from "@/services/classService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  Calendar,
  BookOpen,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<IExam[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create exam modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_id: "",
    exam_type: "paper",
    total_marks: 100,
    pass_marks: 40,
    held_date: new Date().toISOString().split("T")[0],
    question_paper_url: "",
    marking_scheme_url: "",
    is_published: false,
  });

  useEffect(() => {
    fetchExams();
    fetchClassesList();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await examService.getExams();
      if (res.success) {
        setExams(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesList = async () => {
    try {
      const res: any = await getClasses();
      const list = res.data || res || [];
      setClasses(Array.isArray(list) ? list : []);
      if (list.length > 0 && !formData.class_id) {
        setFormData((prev) => ({ ...prev, class_id: list[0]._id }));
      }
    } catch (err: any) {
      // non-blocking
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.class_id) {
      toast.error("Title and Class are required");
      return;
    }

    try {
      await examService.createExam(formData as any);
      toast.success("Exam created successfully! You can now record student marks.");
      setIsModalOpen(false);
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create exam");
    }
  };

  const handleTogglePublish = async (exam: IExam) => {
    try {
      await examService.updateExam(exam._id, { is_published: !exam.is_published });
      toast.success(`Exam marks ${!exam.is_published ? "published" : "hidden"}`);
      fetchExams();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Award}
          title={
            <EditableContent
              configKey="admin_exams_title"
              initialValue="Paper Examinations & Mark Entry"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="admin_exams_desc"
              initialValue="Create structured paper and term exams, input student marks, and publish report cards."
              as="span"
            />
          }
          actions={
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5 shadow-sm px-4 py-2"
            >
              <Plus className="w-4 h-4" /> New Paper Exam
            </Button>
          }
        />

        {/* Exams Table wrapped in CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="admin_exams_table_heading"
              initialValue="Scheduled & Completed Examinations"
              as="span"
            />
          }
          icon={Award}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Exam Title</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Held Date</th>
                  <th className="py-3 px-4">Total Marks</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Image
                          src={CLAY_ASSETS.examPaperCreation}
                          alt="No exams"
                          width={96}
                          height={96}
                          className="h-24 w-24 object-contain"
                        />
                        <div className="space-y-1 text-center">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">No paper exams created yet</p>
                          <p className="text-xs text-slate-400">Click &quot;New Paper Exam&quot; to create one.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{exam.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{exam.description}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {exam.class_id?.title || "Class"}
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-600 dark:text-slate-400">
                        {exam.exam_type}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(exam.held_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {exam.total_marks} marks (Pass: {exam.pass_marks})
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleTogglePublish(exam)}
                          className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] transition-all ${
                            exam.is_published
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {exam.is_published ? "Published" : "Draft / Hidden"}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/exams/${exam._id}/marks`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" /> Enter Marks
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardSection>

        {/* Modal: New Exam */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/40 p-2 border border-violet-100 dark:border-violet-900/30 flex items-center justify-center shrink-0">
                  <Image
                    src={CLAY_ASSETS.examPaperCreation}
                    alt="Create Paper Exam"
                    width={40}
                    height={40}
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Create Paper Exam
                  </h2>
                  <p className="text-xs text-slate-500">Set up structure, papers, and marking criteria</p>
                </div>
              </div>

              <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Exam Title *
                  </label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 2026 Term 01 Mid-Evaluation Paper"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Class *
                  </label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e: any) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Select a class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} ({c.class_code || c.grade || "Class"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Total Marks *
                    </label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={formData.total_marks}
                      onChange={(e: any) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Pass Marks
                    </label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={formData.pass_marks}
                      onChange={(e: any) => setFormData({ ...formData, pass_marks: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Held Date
                    </label>
                    <Input
                      type="date"
                      value={formData.held_date}
                      onChange={(e: any) => setFormData({ ...formData, held_date: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Exam Format
                    </label>
                    <select
                      value={formData.exam_type}
                      onChange={(e: any) => setFormData({ ...formData, exam_type: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="paper">Physical Paper / Written</option>
                      <option value="online">Online Assessment</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Question Paper PDF URL (Optional)
                  </label>
                  <Input
                    value={formData.question_paper_url}
                    onChange={(e: any) => setFormData({ ...formData, question_paper_url: e.target.value })}
                    placeholder="https://... (or /uploads/...)"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl bg-primary text-white">
                    Create Exam
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
