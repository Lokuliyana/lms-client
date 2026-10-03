"use client";

import React, { useState, useEffect } from "react";
import { gradeService, ExamResultDoc } from "@/services/gradeService";
import { Button } from "@/components/dev/button";
import { Input } from "@/components/dev/input";
import { Card, CardContent } from "@/components/dev/card";
import { Badge } from "@/components/dev/badge";
import {
  Award,
  BarChart2,
  Calendar,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  PlusCircle,
  Save,
  TrendingUp,
  Users,
} from "lucide-react";

interface ClassGradesProps {
  classId: string;
  isPrivileged: boolean;
  enrolledStudents?: any[];
}

function getGradeBadgeColor(grade: string) {
  switch (grade) {
    case "A+":
    case "A":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "B":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "C":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "S":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

function calculateGrade(percentage: number): string {
  if (percentage >= 85) return "A+";
  if (percentage >= 75) return "A";
  if (percentage >= 65) return "B";
  if (percentage >= 55) return "C";
  if (percentage >= 40) return "S";
  return "F";
}

export function ClassGrades({ classId, isPrivileged, enrolledStudents = [] }: ClassGradesProps) {
  const [exams, setExams] = useState<ExamResultDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);

  // Form states for creating / editing
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [termOrMonth, setTermOrMonth] = useState("");
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [passMarks, setPassMarks] = useState<number>(40);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [scores, setScores] = useState<
    Array<{
      studentId: string;
      name: string;
      email: string;
      marksObtained: number | string;
      percentage: number;
      grade: string;
      remarks: string;
    }>
  >([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchExams();
  }, [classId, isPrivileged]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      if (isPrivileged) {
        const res = await gradeService.getClassExamResults(classId);
        if (res.success) {
          setExams(res.data);
        }
        initRoster(enrolledStudents, 100);
      } else {
        const res = await gradeService.getMyExamResults(classId);
        if (res.success) {
          setExams(res.data);
        }
      }
    } catch (err: any) {
      console.error("Error loading exam results:", err);
    } finally {
      setLoading(false);
    }
  };

  const initRoster = (students: any[], max: number) => {
    const list = students.map((s) => ({
      studentId: s._id || s.id,
      name: s.full_name || s.name || s.username || "Student",
      email: s.email || "",
      marksObtained: 0,
      percentage: 0,
      grade: "F",
      remarks: "",
    }));
    setScores(list);
  };

  const handleScoreChange = (studentId: string, val: string) => {
    const num = Number(val);
    const marks = isNaN(num) ? 0 : Math.min(Math.max(0, num), maxMarks);
    const pct = maxMarks > 0 ? Math.round((marks / maxMarks) * 100 * 10) / 10 : 0;
    const grade = calculateGrade(pct);

    setScores((prev) =>
      prev.map((item) =>
        item.studentId === studentId
          ? {
              ...item,
              marksObtained: val === "" ? "" : marks,
              percentage: pct,
              grade,
            }
          : item
      )
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setScores((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, remarks } : item))
    );
  };

  const handleSave = async () => {
    if (!examTitle.trim()) {
      setMessage({ type: "error", text: "Exam title is required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        classId,
        examTitle,
        examDate,
        termOrMonth,
        maxMarks: Number(maxMarks) || 100,
        passMarks: Number(passMarks) || 40,
        isPublished,
        scores: scores.map((s) => ({
          studentId: s.studentId,
          marksObtained: Number(s.marksObtained) || 0,
          remarks: s.remarks,
        })),
      };

      if (activeExamId) {
        await gradeService.updateExamResults(activeExamId, payload);
        setMessage({ type: "success", text: "Exam results updated successfully!" });
      } else {
        await gradeService.recordExamResults(payload);
        setMessage({ type: "success", text: "Exam results created and recorded successfully!" });
      }

      const res = await gradeService.getClassExamResults(classId);
      if (res.success) setExams(res.data);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save exam results" });
    } finally {
      setSaving(false);
    }
  };

  const loadExamForEditing = (exam: ExamResultDoc) => {
    setActiveExamId(exam._id);
    setExamTitle(exam.examTitle);
    setExamDate(new Date(exam.examDate).toISOString().split("T")[0]);
    setTermOrMonth(exam.termOrMonth || "");
    setMaxMarks(exam.maxMarks);
    setPassMarks(exam.passMarks);
    setIsPublished(exam.isPublished);

    const scoreMap = new Map<string, any>();
    (exam.scores || []).forEach((s: any) => {
      const sid = s.studentId?._id || s.studentId;
      scoreMap.set(String(sid), s);
    });

    const newScores = enrolledStudents.map((s) => {
      const sid = String(s._id || s.id);
      const existing = scoreMap.get(sid);
      const marks = existing?.marksObtained ?? 0;
      const pct = exam.maxMarks > 0 ? Math.round((marks / exam.maxMarks) * 100 * 10) / 10 : 0;
      return {
        studentId: sid,
        name: s.full_name || s.name || s.username || "Student",
        email: s.email || "",
        marksObtained: marks,
        percentage: pct,
        grade: existing?.grade || calculateGrade(pct),
        remarks: existing?.remarks || "",
      };
    });

    setScores(newScores);
  };

  const handleTogglePublish = async (examId: string, current: boolean) => {
    try {
      await gradeService.togglePublish(examId, !current);
      setExams((prev) =>
        prev.map((e) => (e._id === examId ? { ...e, isPublished: !current } : e))
      );
    } catch (err) {
      console.error("Error toggling publish:", err);
    }
  };

  const startNewExam = () => {
    setActiveExamId(null);
    setExamTitle("");
    setExamDate(new Date().toISOString().split("T")[0]);
    setTermOrMonth("");
    setMaxMarks(100);
    setPassMarks(40);
    setIsPublished(true);
    initRoster(enrolledStudents, 100);
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-8 w-28 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="h-10 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-slate-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ================= STUDENT VIEW =================
  if (!isPrivileged) {
    const studentExams = exams as any[];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Exam Report Cards</h2>
            <p className="text-sm text-slate-500">Official term assessments, tests, and semester grades</p>
          </div>
        </div>

        {studentExams.length === 0 ? (
          <Card className="bg-white border-slate-200 p-12 text-center text-slate-500">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No Exam Results Published Yet</p>
            <p className="text-xs text-slate-400 mt-1">When your teacher grades and publishes an exam, it will appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentExams.map((exam) => {
              const my = exam.myScore;
              return (
                <Card key={exam._id} className="bg-white border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-base">{exam.examTitle}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                        {exam.termOrMonth && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                            {exam.termOrMonth}
                          </span>
                        )}
                      </div>
                    </div>
                    {my && (
                      <Badge className={`text-base font-bold px-3 py-1 ${getGradeBadgeColor(my.grade)}`}>
                        Grade {my.grade}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {my ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-xl">
                          <div>
                            <span className="text-xs text-slate-500">Score</span>
                            <p className="text-lg font-bold text-slate-900 mt-0.5">
                              {my.marksObtained} <span className="text-xs font-normal text-slate-400">/ {exam.maxMarks}</span>
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Percentage</span>
                            <p className="text-lg font-bold text-indigo-600 mt-0.5">{my.percentage}%</p>
                          </div>
                          <div>
                            <span className="text-xs text-slate-500">Rank</span>
                            <p className="text-lg font-bold text-slate-900 mt-0.5">
                              {my.rank ? `#${my.rank}` : "-"}
                              {my.totalStudents && <span className="text-xs font-normal text-slate-400">/{my.totalStudents}</span>}
                            </p>
                          </div>
                        </div>

                        {exam.classStats && (
                          <div className="text-xs text-slate-500 flex items-center justify-between px-1">
                            <span>Class Average: {exam.classStats.averageMarks} ({exam.classStats.averagePercentage}%)</span>
                            <span>Highest: {exam.classStats.highestMarks}</span>
                          </div>
                        )}

                        {my.remarks && (
                          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-lg text-xs text-amber-900">
                            <span className="font-semibold">Teacher Remark: </span>
                            {my.remarks}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Score not recorded for this assessment.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ================= PRIVILEGED (TEACHER / MODERATOR) VIEW =================
  const computedAverage = scores.length > 0
    ? Math.round((scores.reduce((sum, s) => sum + (Number(s.marksObtained) || 0), 0) / scores.length) * 10) / 10
    : 0;
  const passCount = scores.filter((s) => (Number(s.marksObtained) || 0) >= passMarks).length;
  const passRate = scores.length > 0 ? Math.round((passCount / scores.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Exam Creator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Exam Results & Score Sheets</h2>
          <p className="text-xs text-slate-500">Record marks, compute grades automatically, and export reports</p>
        </div>
        <div className="flex items-center gap-2">
          {activeExamId && (
            <Button variant="outline" size="sm" onClick={startNewExam} className="gap-1.5 text-xs">
              <PlusCircle className="w-3.5 h-3.5" />
              New Exam
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : activeExamId ? "Update Exam" : "Save Exam Sheet"}
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Exam Details Card */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Exam Title *</label>
              <Input
                type="text"
                placeholder="e.g. 1st Term Midterm Exam"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exam Date *</label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max Marks</label>
              <Input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pass Marks</label>
              <Input
                type="number"
                value={passMarks}
                onChange={(e) => setPassMarks(Number(e.target.value))}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Published to Students</span>
              </label>
              <Input
                type="text"
                placeholder="Term or Month (e.g. Term 1)"
                value={termOrMonth}
                onChange={(e) => setTermOrMonth(e.target.value)}
                className="w-48 h-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-4 text-slate-600">
              <span>Avg Score: <strong>{computedAverage}</strong></span>
              <span>Pass Rate: <strong className="text-emerald-600">{passRate}%</strong></span>
              <span>Roster: <strong>{scores.length} students</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Score Entry Sheet */}
      <Card className="bg-white border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Student Score Sheet ({scores.length})
          </h3>
        </div>
        {scores.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            No enrolled students found in this class to record exam grades for.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-600 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 w-32">Marks (/{maxMarks})</th>
                  <th className="py-3 px-4 w-28">Percentage</th>
                  <th className="py-3 px-4 w-24">Grade</th>
                  <th className="py-3 px-4">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scores.map((s) => (
                  <tr key={s.studentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="number"
                        min="0"
                        max={maxMarks}
                        value={s.marksObtained}
                        onChange={(e) => handleScoreChange(s.studentId, e.target.value)}
                        className="w-24 h-8 text-sm font-semibold"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {s.percentage}%
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`font-bold ${getGradeBadgeColor(s.grade)}`}>
                        {s.grade}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Input
                        type="text"
                        placeholder="Optional remarks..."
                        value={s.remarks}
                        onChange={(e) => handleRemarksChange(s.studentId, e.target.value)}
                        className="w-full max-w-xs h-8 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Past Recorded Exams List */}
      {exams.length > 0 && (
        <Card className="bg-white border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              Recorded Class Exams ({exams.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{exam.examTitle}</span>
                    <Badge
                      className={`text-[10px] ${
                        exam.isPublished
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {exam.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                    <span>Max: {exam.maxMarks}</span>
                    <span>Pass: {exam.passMarks}</span>
                    <span>{exam.scores?.length || 0} students recorded</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(exam._id, exam.isPublished)}
                    className="h-8 text-xs gap-1"
                  >
                    {exam.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {exam.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-8 text-xs gap-1"
                  >
                    <a href={gradeService.exportCsvUrl(exam._id)} download>
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => loadExamForEditing(exam)}
                    className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default ClassGrades;
