"use client";

import { useEffect, useState } from "react";
import { attendanceService } from "@/services/attendanceService";
import { getClasses } from "@/services/classService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Save,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";

interface StudentRosterItem {
  studentId: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: "present" | "absent" | "late" | "excused" | "unmarked";
  note: string;
}

export default function AdminAttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionTitle, setSessionTitle] = useState("Regular Class Session");
  const [sessionType, setSessionType] = useState<"lecture" | "tutorial" | "revision" | "exam" | "other">("lecture");
  const [notes, setNotes] = useState("");

  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      loadRoster();
    }
  }, [selectedClassId, selectedDate]);

  const fetchClasses = async () => {
    try {
      const res: any = await getClasses();
      const list = res.data || res || [];
      const validList = Array.isArray(list) ? list : [];
      setClasses(validList);
      if (validList.length > 0) {
        setSelectedClassId(validList[0]._id);
      }
    } catch (err: any) {
      toast.error("Failed to load classes");
    }
  };

  const loadRoster = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getSessionRoster(selectedClassId, selectedDate);
      if (res.success && res.data) {
        setSessionTitle(res.data.sessionTitle || "Regular Class Session");
        setSessionType(res.data.sessionType || "lecture");
        setNotes(res.data.notes || "");
        setRoster(res.data.roster || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load session roster");
    } finally {
      setLoading(false);
    }
  };

  const setStudentStatus = (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
  };

  const setStudentNote = (studentId: string, note: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, note } : s))
    );
  };

  const markAll = (status: "present" | "absent") => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
    toast.info(`Marked all students as ${status}`);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;

    try {
      setSaving(true);
      const records = roster.map((s) => ({
        studentId: s.studentId,
        status: s.status === "unmarked" ? "absent" : s.status,
        note: s.note,
      }));

      await attendanceService.markBulkAttendance(selectedClassId, {
        date: selectedDate,
        sessionTitle,
        sessionType,
        records,
        notes,
      });

      toast.success("Daily attendance session sheet saved successfully!");
      loadRoster();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((s) => s.status === "present").length;
  const lateCount = roster.filter((s) => s.status === "late").length;
  const absentCount = roster.filter((s) => s.status === "absent" || s.status === "unmarked").length;

  const filteredRoster = roster.filter(
    (s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={CalendarCheck}
          title={
            <EditableContent
              configKey="admin_attendance_title"
              initialValue="Classroom Attendance & Session Register"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="admin_attendance_desc"
              initialValue="Live session check-ins, barcode / student roll calls, and official attendance logs."
              as="span"
            />
          }
          actions={
            <Button
              onClick={handleSaveAttendance}
              disabled={saving || loading || roster.length === 0}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5 shadow-sm px-4 py-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Attendance Sheet"}
            </Button>
          }
        />

        {/* Controls & Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title} ({c.class_code || c.grade || "Class"})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Session Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e: any) => setSelectedDate(e.target.value)}
              className="text-xs rounded-xl"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-around">
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">Present</span>
              <span className="text-lg font-bold text-emerald-600">{presentCount}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">Late</span>
              <span className="text-lg font-bold text-amber-600">{lateCount}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">Absent</span>
              <span className="text-lg font-bold text-red-600">{absentCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Batch Actions & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              placeholder="Search enrolled students..."
              className="pl-9 text-xs rounded-xl bg-white dark:bg-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAll("present")}
              className="rounded-xl text-xs text-emerald-600 hover:text-emerald-700"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark All Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => markAll("absent")}
              className="rounded-xl text-xs text-red-600 hover:text-red-700"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Mark All Absent
            </Button>
          </div>
        </div>

        {/* Student Roster Table in CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="admin_attendance_roster_heading"
              initialValue="Live Session Student Roster"
              as="span"
            />
          }
          icon={Users}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Session Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-slate-400">
                      Loading session roster...
                    </td>
                  </tr>
                ) : filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Image
                          src={CLAY_ASSETS.emptyAttendanceRoster}
                          alt="No enrolled students"
                          width={96}
                          height={96}
                          className="h-24 w-24 object-contain"
                        />
                        <div className="space-y-1 text-center">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            {searchTerm ? "No matching students found" : "No enrolled students found in this class"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {searchTerm ? "Try searching by a different name or email." : "Students enrolled in this class will appear here for daily attendance tracking."}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((student) => (
                    <tr key={student.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-[11px] text-slate-400">{student.email}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {student.phone || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button
                            onClick={() => setStudentStatus(student.studentId, "present")}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              student.status === "present"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => setStudentStatus(student.studentId, "late")}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              student.status === "late"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-amber-600"
                            }`}
                          >
                            Late
                          </button>
                          <button
                            onClick={() => setStudentStatus(student.studentId, "absent")}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              student.status === "absent" || student.status === "unmarked"
                                ? "bg-red-500 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-red-600"
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => setStudentStatus(student.studentId, "excused")}
                            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                              student.status === "excused"
                                ? "bg-purple-500 text-white shadow-sm"
                                : "text-slate-600 dark:text-slate-400 hover:text-purple-600"
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Input
                          value={student.note}
                          onChange={(e: any) => setStudentNote(student.studentId, e.target.value)}
                          placeholder="Note (e.g. joined via online link)"
                          className="text-xs rounded-xl"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardSection>
      </div>
    </div>
  );
}
