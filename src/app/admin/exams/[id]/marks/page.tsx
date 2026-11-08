"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { examService, IExam } from "@/services/examService";
import { attendanceService } from "@/services/attendanceService";
import { classService } from "@/services/classService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/dev/select";
import {
  Award,
  ArrowLeft,
  Save,
  CheckCircle,
  FileCheck,
  User,
  Calculator,
  Search,
  Calendar,
  Filter,
  CornerDownLeft,
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
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [monthChoices, setMonthChoices] = useState<string[]>([]);

  // Ref array for quick keyboard navigation between marks input fields
  const marksInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const loadExamAndRoster = async (targetMonth?: string) => {
    try {
      setLoading(true);
      const res = await examService.getExamById(examId);
      if (res.success && res.data) {
        const examDoc = res.data.exam;
        const resultDoc = res.data.result;
        setExam(examDoc);
        setIsPublished(examDoc.is_published || resultDoc?.isPublished || false);

        // Derive target month from exam held_date (YYYY-MM in Asia/Colombo)
        let examMonth = "";
        try {
          if (examDoc.held_date) {
            examMonth = new Intl.DateTimeFormat("en-CA", {
              timeZone: "Asia/Colombo",
              year: "numeric",
              month: "2-digit",
            }).format(new Date(examDoc.held_date)).slice(0, 7);
          }
        } catch {
          examMonth = new Date().toISOString().slice(0, 7);
        }
        if (!examMonth) {
          examMonth = new Date().toISOString().slice(0, 7);
        }

        const activeMonth = targetMonth || selectedMonth || examMonth;
        setSelectedMonth(activeMonth);

        // Month choices
        const choices = new Set<string>();
        choices.add(examMonth);
        const [y, m] = examMonth.split("-").map(Number);
        if (y && m) {
          for (let i = -4; i <= 4; i++) {
            const d = new Date(y, m - 1 + i, 1);
            choices.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }
        }
        const sortedMonths = Array.from(choices).sort((a, b) => b.localeCompare(a));
        setMonthChoices(["all", ...sortedMonths]);

        // Fetch students registered for this month (or all enrolled students)
        const classId = (examDoc.class_id?._id || examDoc.class_id).toString();
        const enrolledList = await classService.getEnrolledStudents(classId, activeMonth);
        const existingScores = resultDoc?.scores || [];

        const studentMap = new Map<string, any>();
        (Array.isArray(enrolledList) ? enrolledList : []).forEach((stu: any) => {
          const sid = (stu._id || stu.id || stu.studentId?._id || stu.studentId || "").toString();
          if (sid) studentMap.set(sid, stu);
        });

        // Ensure students who already have recorded marks are not dropped
        existingScores.forEach((sc: any) => {
          const stuObj = sc.studentId;
          const sid = (stuObj?._id || stuObj || "").toString();
          if (sid && !studentMap.has(sid)) {
            studentMap.set(sid, typeof stuObj === "object" ? stuObj : { _id: sid, name: "Student", email: "" });
          }
        });

        const initialRows: StudentMarkRow[] = Array.from(studentMap.values()).map((stu: any) => {
          const sid = (stu._id || stu.id || stu.studentId?._id || stu.studentId || "").toString();
          const existing = existingScores.find(
            (s: any) =>
              (s.studentId?._id ? s.studentId._id.toString() : s.studentId?.toString()) === sid
          );

          const firstName = stu.first_name || stu.firstName || "";
          const lastName = stu.last_name || stu.lastName || "";
          const combined = `${firstName} ${lastName}`.trim();
          const fullName =
            stu.full_name ||
            stu.fullName ||
            stu.student_profile?.full_name ||
            (combined.length > 0 ? combined : null) ||
            stu.name ||
            stu.email ||
            "Student";

          return {
            student_id: sid,
            name: fullName,
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

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    loadExamAndRoster(month);
  };

  // Safe update by unique student_id so filtering never mutates the wrong student
  const updateRowByStudentId = (studentId: string, field: keyof StudentMarkRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.student_id !== studentId) return r;
        const updated = { ...r, [field]: value };
        if (field === "is_absent" && value === true) {
          updated.marks_obtained = 0;
        }
        return updated;
      })
    );
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

  // Keyboard navigation: Enter or ArrowDown focuses next student marks input
  const handleMarksKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Find the next student row that isn't marked absent
      for (let i = currentIndex + 1; i < filteredRows.length; i++) {
        if (!filteredRows[i].is_absent && marksInputRefs.current[i]) {
          const targetInput = marksInputRefs.current[i];
          targetInput?.focus();
          try {
            targetInput?.select();
          } catch {}
          targetInput?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return;
        }
      }
      toast.info("Reached end of student roster.");
    } else if ((e.key === "Enter" && e.shiftKey) || e.key === "ArrowUp") {
      e.preventDefault();
      // Find the previous student row that isn't marked absent
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (!filteredRows[i].is_absent && marksInputRefs.current[i]) {
          const targetInput = marksInputRefs.current[i];
          targetInput?.focus();
          try {
            targetInput?.select();
          } catch {}
          targetInput?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return;
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      for (let i = currentIndex + 1; i < filteredRows.length; i++) {
        if (!filteredRows[i].is_absent && marksInputRefs.current[i]) {
          const targetInput = marksInputRefs.current[i];
          targetInput?.focus();
          try {
            targetInput?.select();
          } catch {}
          targetInput?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return;
        }
      }
    }
  };

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

        {/* Month Selector & Filter / Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Registered Month:
              </span>
              <div className="w-48">
                <Select value={selectedMonth} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 text-xs font-semibold rounded-xl border-slate-200">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-56">
                    {monthChoices.map((mk) => (
                      <SelectItem key={mk} value={mk}>
                        {mk === "all" ? "All Enrolled Students" : mk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {selectedMonth === "all"
                  ? "Showing all enrolled students in this class"
                  : `Only registered students for ${selectedMonth} are visible`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 shrink-0">
                Registered Students: <span className="font-bold text-slate-900 dark:text-white">{rows.length}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                placeholder="Search registered students by name or email..."
                className="pl-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 h-9"
              />
            </div>
            {/* Keyboard shortcut hint */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold shrink-0">
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>Press <strong>Enter ↵</strong> or <strong>↓</strong> to jump to next student</span>
            </div>
          </div>
        </div>

        {/* Marks Entry Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 w-36">Marks ({exam?.total_marks || 100})</th>
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
                            ref={(el) => {
                              marksInputRefs.current[idx] = el;
                            }}
                            type="number"
                            min={0}
                            max={maxMarks}
                            disabled={row.is_absent}
                            value={row.marks_obtained}
                            onChange={(e: any) =>
                              updateRowByStudentId(row.student_id, "marks_obtained", e.target.value)
                            }
                            onKeyDown={(e) => handleMarksKeyDown(e, idx)}
                            onFocus={(e) => {
                              try {
                                e.target.select();
                              } catch {}
                            }}
                            placeholder="0"
                            className="w-28 text-xs font-bold rounded-xl transition-all focus:ring-2 focus:ring-indigo-500 border-slate-200 focus:border-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={row.is_absent}
                            onChange={(e: any) =>
                              updateRowByStudentId(row.student_id, "is_absent", e.target.checked)
                            }
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
                            onChange={(e: any) =>
                              updateRowByStudentId(row.student_id, "remarks", e.target.value)
                            }
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
