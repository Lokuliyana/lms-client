"use client";

import React, { useState, useEffect } from "react";
import { attendanceService, AttendanceSheet } from "@/services/attendanceService";
import { Button } from "@/components/dev/button";
import { Input } from "@/components/dev/input";
import { Card, CardContent } from "@/components/dev/card";
import { Badge } from "@/components/dev/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, Calendar, Save, History, Users, BarChart3 } from "lucide-react";

interface ClassAttendanceProps {
  classId: string;
  isPrivileged: boolean;
  enrolledStudents?: any[];
  selectedMonth?: string;
}

const getStudentDisplayName = (s: any) => {
  if (!s) return "Student";
  const fn = s.first_name || s.firstName || "";
  const ln = s.last_name || s.lastName || "";
  const combined = `${fn} ${ln}`.trim();
  return (
    s.full_name ||
    s.fullName ||
    s.student_profile?.full_name ||
    (combined.length > 0 ? combined : null) ||
    s.computedName ||
    s.name ||
    s.username ||
    s.email?.split("@")[0] ||
    "Student"
  );
};

export function ClassAttendance({
  classId,
  isPrivileged,
  enrolledStudents = [],
  selectedMonth,
}: ClassAttendanceProps) {
  // State for Privileged (Teacher/Moderator)
  const [date, setDate] = useState<string>(() => {
    if (selectedMonth && /^\d{4}-\d{2}$/.test(selectedMonth)) {
      const today = new Date().toISOString().split("T")[0];
      if (today.startsWith(selectedMonth)) return today;
      return `${selectedMonth}-01`;
    }
    return new Date().toISOString().split("T")[0];
  });
  const [sessionTitle, setSessionTitle] = useState<string>("Regular Class Session");
  const [sessionType, setSessionType] = useState<"lecture" | "tutorial" | "revision" | "exam" | "other">("lecture");
  const [roster, setRoster] = useState<Array<{ studentId: string; name: string; email: string; status: "present" | "absent" | "late" | "excused"; note: string }>>([]);
  const [pastSessions, setPastSessions] = useState<AttendanceSheet[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // State for Student
  const [myAttendance, setMyAttendance] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [classId, isPrivileged, selectedMonth]);

  useEffect(() => {
    if (enrolledStudents.length > 0 && !selectedSessionId) {
      initRoster(enrolledStudents);
    }
  }, [enrolledStudents, selectedSessionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isPrivileged) {
        const monthParam = selectedMonth && selectedMonth !== "all" ? selectedMonth : undefined;
        const [historyRes, statsRes] = await Promise.all([
          attendanceService.getClassAttendance(classId, monthParam ? { month: monthParam } : undefined),
          attendanceService.getClassAttendanceStats(classId, monthParam ? { month: monthParam } : undefined).catch(() => null),
        ]);
        if (historyRes.success) setPastSessions(historyRes.data);
        if (statsRes?.success) setStats(statsRes.stats);

        if (!selectedSessionId) {
          initRoster(enrolledStudents);
        }
      } else {
        const myRes = await attendanceService.getMyAttendance(classId);
        if (myRes.success) setMyAttendance(myRes);
      }
    } catch (err: any) {
      console.error("Error loading attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const initRoster = (students: any[]) => {
    const list = students.map((s) => ({
      studentId: String(s._id || s.id),
      name: getStudentDisplayName(s),
      email: s.email || "",
      status: "present" as const,
      note: "",
    }));
    setRoster(list);
  };

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
  };

  const handleMarkAll = (status: "present" | "absent") => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const payload = {
        classId,
        date,
        sessionTitle: sessionTitle || "Class Session",
        sessionType,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note,
        })),
      };

      if (selectedSessionId) {
        await attendanceService.updateAttendance(selectedSessionId, payload);
        setMessage({ type: "success", text: "Attendance sheet updated successfully!" });
      } else {
        const res = await attendanceService.markAttendance(payload);
        if (res.data?._id) setSelectedSessionId(res.data._id);
        setMessage({ type: "success", text: "Attendance sheet recorded successfully!" });
      }

      const monthParam = selectedMonth && selectedMonth !== "all" ? selectedMonth : undefined;
      const [historyRes, statsRes] = await Promise.all([
        attendanceService.getClassAttendance(classId, monthParam ? { month: monthParam } : undefined),
        attendanceService.getClassAttendanceStats(classId, monthParam ? { month: monthParam } : undefined).catch(() => null),
      ]);
      if (historyRes.success) setPastSessions(historyRes.data);
      if (statsRes?.success) setStats(statsRes.stats);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save attendance" });
    } finally {
      setSaving(false);
    }
  };

  const handleStartNewSession = () => {
    setSelectedSessionId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setSessionTitle("Regular Class Session");
    setSessionType("lecture");
    initRoster(enrolledStudents);
    setMessage(null);
  };

  const loadPastSession = (session: AttendanceSheet) => {
    setSelectedSessionId(session._id);
    setDate(new Date(session.date).toISOString().split("T")[0]);
    setSessionTitle(session.sessionTitle);
    setSessionType(session.sessionType);

    const studentRecords = new Map<string, any>();
    session.records.forEach((r: any) => {
      const sid = r.studentId?._id || r.studentId;
      studentRecords.set(String(sid), r);
    });

    const studentList: any[] = [...enrolledStudents];
    const seenIds = new Set(enrolledStudents.map((s) => String(s._id || s.id)));
    session.records.forEach((r: any) => {
      const sid = String(r.studentId?._id || r.studentId);
      if (!seenIds.has(sid)) {
        seenIds.add(sid);
        studentList.push(
          typeof r.studentId === "object"
            ? r.studentId
            : { _id: sid, name: "Student", email: "" }
        );
      }
    });

    const newRoster = studentList.map((s) => {
      const sid = String(s._id || s.id);
      const existing = studentRecords.get(sid);
      return {
        studentId: sid,
        name: getStudentDisplayName(s),
        email: s.email || "",
        status: existing?.status || "absent",
        note: existing?.note || "",
      };
    });

    setRoster(newRoster);
  };

  if (loading) {
    return (
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
      </div>
    );
  }

  // ================= STUDENT VIEW =================
  if (!isPrivileged) {
    const stats = myAttendance?.stats;
    const sessions = myAttendance?.sessions || [];

    return (
      <div className="space-y-6">
        {/* Attendance Summary Header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Overall Rate</span>
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{stats?.attendanceRate ?? 0}%</span>
                <span className="text-xs text-slate-500">of sessions</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats?.attendanceRate ?? 0)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-600">Present</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-slate-900">{stats?.presentCount ?? 0}</span>
                <span className="text-xs text-slate-500 ml-2">sessions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-600">Late</span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-slate-900">{stats?.lateCount ?? 0}</span>
                <span className="text-xs text-slate-500 ml-2">sessions</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-rose-600">Absent</span>
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-slate-900">{stats?.absentCount ?? 0}</span>
                <span className="text-xs text-slate-500 ml-2">sessions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <Card className="bg-white border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Session Attendance Log
            </h3>
            <span className="text-xs text-slate-500">{sessions.length} sessions recorded</span>
          </div>
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No attendance records have been published for this class yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((sess: any) => (
                <div key={sess._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <p className="font-medium text-slate-900">{sess.sessionTitle || "Class Session"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{new Date(sess.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="capitalize px-2 py-0.5 bg-slate-100 rounded text-slate-600">{sess.sessionType}</span>
                      {sess.note && <span className="italic text-slate-400">"{sess.note}"</span>}
                    </div>
                  </div>
                  <div>
                    {sess.status === "present" && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Present</Badge>
                    )}
                    {sess.status === "late" && (
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200">Late</Badge>
                    )}
                    {sess.status === "absent" && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200">Absent</Badge>
                    )}
                    {sess.status === "excused" && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">Excused</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ================= PRIVILEGED (TEACHER / MODERATOR) VIEW =================
  const presentCount = roster.filter((r) => r.status === "present").length;
  const lateCount = roster.filter((r) => r.status === "late").length;
  const absentCount = roster.filter((r) => r.status === "absent").length;
  const excusedCount = roster.filter((r) => r.status === "excused").length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Class Attendance Rate</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.overallRate ?? 0}%</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Recorded Sessions</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalSessions ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Total Present Marks</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalPresent ?? 0}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Total Absences</span>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.totalAbsent ?? 0}</p>
          </div>
        </div>
      )}

      {/* Sheet Metadata / Controls */}
      <Card className="bg-white border-slate-200 shadow-2xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-44 h-9 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Title</label>
                <Input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Lecture"
                  className="w-56 h-9 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={sessionType}
                  onChange={(e: any) => setSessionType(e.target.value)}
                  className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="lecture">Lecture</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="revision">Revision</option>
                  <option value="exam">Exam</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartNewSession}
                className="h-9 text-xs rounded-xl border-slate-200 hover:bg-slate-50"
              >
                + New Sheet
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAttendance}
                disabled={saving}
                className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : selectedSessionId ? "Update Attendance" : "Save Attendance"}
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Quick Roster Status Summary & Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-600 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Present: {presentCount}
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Late: {lateCount}
              </span>
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Absent: {absentCount}
              </span>
              <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Excused: {excusedCount}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 mr-2">Total: {roster.length} students</span>
              <button
                type="button"
                onClick={() => handleMarkAll("present")}
                className="text-xs text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll("absent")}
                className="text-xs text-rose-700 font-semibold hover:underline bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
              >
                Mark All Absent
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Grid */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Enrolled Students Attendance Roster ({roster.length})
          </h3>
          <span className="text-xs text-slate-500">Click a status button to toggle attendance for each student</span>
        </div>
        {roster.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            No enrolled students found in this class.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {roster.map((student) => (
              <div
                key={student.studentId}
                className="p-3.5 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
              >
                <div className="min-w-0 md:w-56 shrink-0">
                  <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">{student.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{student.email}</p>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "present")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      student.status === "present"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "late")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      student.status === "late"
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    Late
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "absent")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      student.status === "absent"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "excused")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      student.status === "excused"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    Excused
                  </button>
                </div>

                {/* Remarks Note Input */}
                <div className="flex-1 max-w-sm">
                  <Input
                    type="text"
                    value={student.note}
                    onChange={(e) => handleNoteChange(student.studentId, e.target.value)}
                    placeholder="Optional note / remark..."
                    className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Past Sessions List */}
      {pastSessions.length > 0 && (
        <Card className="bg-white border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Past Attendance Sessions
            </h3>
            <span className="text-xs text-slate-500">{pastSessions.length} total</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {pastSessions.map((session) => {
              const pCount = session.records.filter((r) => r.status === "present").length;
              const aCount = session.records.filter((r) => r.status === "absent").length;
              const isSelected = selectedSessionId === session._id;

              return (
                <div
                  key={session._id}
                  className={`p-3 px-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                    isSelected ? "bg-indigo-50/60" : ""
                  }`}
                  onClick={() => loadPastSession(session)}
                >
                  <div>
                    <span className="font-medium text-xs text-slate-900 mr-2">{session.sessionTitle}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-700 font-medium">{pCount} Present</span>
                    <span className="text-rose-700 font-medium">{aCount} Absent</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600 hover:text-indigo-700">
                      {isSelected ? "Active" : "Load"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
export default ClassAttendance;
