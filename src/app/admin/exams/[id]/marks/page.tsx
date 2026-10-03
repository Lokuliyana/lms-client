"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { examService, IExam } from "@/services/examService";
import { attendanceService } from "@/services/attendanceService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Award,
  ArrowLeft,
  Save,
  CheckCircle,
  FileCheck,
  User,
  Calculator,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { SectionHeader } from "@/components/reusable/section-header";

interface StudentMarkRow {
  student_id: string;
  name: string;
  email: string;
  marks_obtained: number | string;
  is_absent: boolean;
  remarks: string;
}

export default function ExamMarkEntryPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [exam, setExam] = useState<IExam | null>(null);
  const [rows, setRows] = useState<StudentMarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (examId) {
      loadExamAndRoster();
    }
  }, [examId]);

  const calculateGrade = (pct: number) => {
    if (pct >= 85) return "A+";
    if (pct >= 75) return "A";
    if (pct >= 65) return "B";
    if (pct >= 55) return "C";
    if (pct >= 40) return "S";
    return "F";
  };

  const loadExamAndRoster = async () => {
    try {
      setLoading(true);
      const res = await examService.getExamById(examId);
      if (res.success && res.data) {
        const examDoc = res.data.exam;
        const resultDoc = res.data.result;
        setExam(examDoc);
        setIsPublished(examDoc.is_published || resultDoc?.isPublished || false);

        // Fetch enrolled students for class roster
        const classId = examDoc.class_id?._id || examDoc.class_id;
        const rosterRes = await attendanceService.getSessionRoster(classId);

        const enrolledList = rosterRes?.data?.roster || [];
        const existingScores = resultDoc?.scores || [];

        const initialRows: StudentMarkRow[] = enrolledList.map((stu: any) => {
          const sid = stu.studentId?._id ? stu.studentId._id.toString() : stu.studentId.toString();
          const existing = existingScores.find(
            (s: any) =>
              (s.studentId?._id ? s.studentId._id.toString() : s.studentId?.toString()) === sid
          );

          return {
            student_id: sid,
            name: `${stu.first_name || ""} ${stu.last_name || ""}`.trim() || stu.email || "Student",
            email: stu.email || "",
            marks_obtained: existing ? existing.marksObtained : "",
            is_absent: existing ? Boolean(existing.isAbsent) : false,
            remarks: existing ? existing.remarks || "" : "",
          };
        });

        setRows(initialRows);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load exam details");
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index: number, field: keyof StudentMarkRow, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "is_absent" && value === true) {
        next[index].marks_obtained = 0;
      }
      return next;
    });
  };

  const handleSaveMarks = async (publishImmediate = false) => {
    if (!exam) return;

    try {
      setSaving(true);
      const payloadScores = rows.map((r) => ({
        student_id: r.student_id,
        marks_obtained: r.is_absent ? 0 : Number(r.marks_obtained) || 0,
        is_absent: r.is_absent,
        remarks: r.remarks,
      }));

      await examService.recordBulkExamResults(examId, {
        scores: payloadScores,
        is_published: publishImmediate ? true : isPublished,
      });

      if (publishImmediate) {
        setIsPublished(true);
      }

      toast.success(
        publishImmediate
          ? "Marks saved and published to students!"
          : "Exam marks saved successfully."
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <SectionHeader
          title={exam?.title || "Exam Mark Entry"}
          breadcrumbs={[
            { label: "Home", href: "/admin/dashboard" },
            { label: "Exams", href: "/admin/exams" },
            { label: "Mark Entry" },
          ]}
          description={
            exam?.class_id?.title
              ? `Class: ${exam.class_id.title} • Maximum Marks: ${exam?.total_marks ?? 100}`
              : "Record, compute weighted totals, and publish student examination scores."
          }
          illustration={CLAY_ASSETS.examMarksSpreadsheet}
          variant="cream"
          icon={Award}
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => handleSaveMarks(false)}
                disabled={saving}
                className="rounded-xl text-xs flex items-center gap-1.5 bg-white shadow-2xs"
              >
                <Save className="w-4 h-4" /> Save Draft
              </Button>
              <Button
                onClick={() => handleSaveMarks(true)}
                disabled={saving}
                className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
              >
                <FileCheck className="w-4 h-4" /> Save & Publish
              </Button>
            </div>
          }
        />

        {/* Filter / Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search student by name..."
              className="pl-9 text-xs rounded-xl bg-white dark:bg-slate-900"
            />
          </div>

          <div className="text-xs text-slate-500">
            Enrolled Students: <span className="font-bold text-slate-900 dark:text-white">{rows.length}</span>
          </div>
        </div>

        {/* Marks Entry Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 w-32">Marks ({exam?.total_marks || 100})</th>
                  <th className="py-3 px-4 w-24 text-center">Absent</th>
                  <th className="py-3 px-4 w-28 text-center">Percentage</th>
                  <th className="py-3 px-4 w-24 text-center">Grade</th>
                  <th className="py-3 px-4">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Loading class roster...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Image
                          src={CLAY_ASSETS.examMarksSpreadsheet}
                          alt="No students"
                          width={88}
                          height={88}
                          className="h-20 w-20 object-contain"
                        />
                        <div className="space-y-1 text-center">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            {searchTerm ? "No matching students found" : "No enrolled students found for this class"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {searchTerm ? "Try searching with a different name or email." : "Students enrolled in this class will automatically appear in this roster."}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const maxMarks = exam?.total_marks || 100;
                    const marksNum = Number(row.marks_obtained) || 0;
                    const pct = row.is_absent ? 0 : Math.round((marksNum / maxMarks) * 100);
                    const grade = row.is_absent ? "AB" : calculateGrade(pct);

                    return (
                      <tr key={row.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                          <p className="text-[11px] text-slate-400">{row.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            min={0}
                            max={maxMarks}
                            disabled={row.is_absent}
                            value={row.marks_obtained}
                            onChange={(e: any) => updateRow(idx, "marks_obtained", e.target.value)}
                            placeholder="0"
                            className="w-24 text-xs font-bold rounded-xl"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={row.is_absent}
                            onChange={(e: any) => updateRow(idx, "is_absent", e.target.checked)}
                            className="rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {row.is_absent ? "—" : `${pct}%`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              row.is_absent
                                ? "bg-slate-100 text-slate-500"
                                : grade === "A+" || grade === "A"
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                                : grade === "B" || grade === "C"
                                ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600"
                                : grade === "S"
                                ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                                : "bg-red-100 dark:bg-red-950/40 text-red-600"
                            }`}
                          >
                            {grade}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            value={row.remarks}
                            onChange={(e: any) => updateRow(idx, "remarks", e.target.value)}
                            placeholder="e.g. Excellent presentation in Section B"
                            className="text-xs rounded-xl"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
