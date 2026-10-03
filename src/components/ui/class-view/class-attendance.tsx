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
}

export function ClassAttendance({ classId, isPrivileged, enrolledStudents = [] }: ClassAttendanceProps) {
  // State for Privileged (Teacher/Moderator)
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
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

  // Initialize or fetch data
  useEffect(() => {
    fetchData();
  }, [classId, isPrivileged]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isPrivileged) {
        const [historyRes, statsRes] = await Promise.all([
          attendanceService.getClassAttendance(classId),
          attendanceService.getClassAttendanceStats(classId).catch(() => null),
        ]);
        if (historyRes.success) setPastSessions(historyRes.data);
        if (statsRes?.success) setStats(statsRes.stats);

        // Build initial roster from enrolledStudents
        initRoster(enrolledStudents);
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
      studentId: s._id || s.id,
      name: s.full_name || s.name || s.username || "Student",
      email: s.email || "",
      status: "present" as const,
      note: "",
    }));
    setRoster(list);
  };

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late" | "excused") => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRoster((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, note } : item))
    );
  };

  const setAllStatus = (status: "present" | "absent") => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSave = async () => {
    if (roster.length === 0) {
      setMessage({ type: "error", text: "No students in roster to save attendance for." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        classId,
        date,
        sessionTitle,
        sessionType,
        records: roster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note,
        })),
      };

      const res = await attendanceService.markAttendance(payload);
      if (res.success) {
        setMessage({ type: "success", text: "Attendance recorded successfully!" });
        // Refresh past sessions & stats
        const [historyRes, statsRes] = await Promise.all([
          attendanceService.getClassAttendance(classId),
          attendanceService.getClassAttendanceStats(classId).catch(() => null),
        ]);
        if (historyRes.success) setPastSessions(historyRes.data);
        if (statsRes?.success) setStats(statsRes.stats);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to record attendance" });
    } finally {
      setSaving(false);
    }
  };

  const loadPastSession = (session: AttendanceSheet) => {
    setSelectedSessionId(session._id);
    setDate(new Date(session.date).toISOString().split("T")[0]);
    setSessionTitle(session.sessionTitle);
    setSessionType(session.sessionType);

    // Merge existing records with enrolled students
    const studentRecords = new Map<string, any>();
    session.records.forEach((r: any) => {
      const sid = r.studentId?._id || r.studentId;
      studentRecords.set(String(sid), r);
    });

    const newRoster = enrolledStudents.map((s) => {
      const sid = String(s._id || s.id);
      const existing = studentRecords.get(sid);
      return {
        studentId: sid,
        name: s.full_name || s.name || s.username || "Student",
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
      <Card className="bg-white border-slate-200">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Session Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-44 h-9 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Session Title</label>
                <Input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="e.g. Chapter 4 Lecture"
                  className="w-56 h-9 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                  value={sessionType}
                  onChange={(e: any) => setSessionType(e.target.value)}
                  className="h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-700"
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
                onClick={() => setAllStatus("present")}
                className="text-xs"
              >
                All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAllStatus("absent")}
                className="text-xs"
              >
                All Absent
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save Sheet"}
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Quick Roster Status Summary */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Present: {presentCount}
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Late: {lateCount}
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Absent: {absentCount}
            </span>
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Excused: {excusedCount}
            </span>
            <span className="ml-auto text-slate-400">Total: {roster.length} students</span>
          </div>
        </CardContent>
      </Card>

      {/* Roster Grid */}
      <Card className="bg-white border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            Enrolled Students Roster
          </h3>
        </div>
        {roster.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            No enrolled students found in this class to mark attendance for.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {roster.map((student) => (
              <div
                key={student.studentId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">{student.name}</p>
                  <p className="text-xs text-slate-500 truncate">{student.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "present")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      student.status === "present"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "late")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      student.status === "late"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                    }`}
                  >
                    Late
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "absent")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      student.status === "absent"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "excused")}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      student.status === "excused"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    Excused
                  </button>

                  <Input
                    type="text"
                    placeholder="Note..."
                    value={student.note}
                    onChange={(e) => handleNoteChange(student.studentId, e.target.value)}
                    className="w-32 h-7 text-xs ml-2"
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
