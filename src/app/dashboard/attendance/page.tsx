"use client";

import { useEffect, useState } from "react";
import { attendanceService, AttendanceStats } from "@/services/attendanceService";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getMyAttendance();
      if (res.success) {
        setStats(res.stats || null);
        setSessions(res.sessions || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={CalendarCheck}
          title={
            <EditableContent
              configKey="attendance_student_title"
              initialValue="My Class Attendance & Engagement"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="attendance_student_desc"
              initialValue="Official classroom and live stream attendance records, percentages, and session logs."
              as="span"
            />
          }
          actions={
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Attendance Rate</span>
              <span className="text-xl font-extrabold text-emerald-600">{stats?.attendanceRate || 0}%</span>
            </div>
          }
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Total Classes</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{stats?.totalSessions || 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Present</span>
              <p className="text-lg font-bold text-emerald-600">{stats?.presentCount || 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Late</span>
              <p className="text-lg font-bold text-amber-600">{stats?.lateCount || 0}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-medium">Absent</span>
              <p className="text-lg font-bold text-red-600">{stats?.absentCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Sessions List wrapped in CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="attendance_student_register_heading"
              initialValue="Session Attendance Register"
              as="span"
            />
          }
          icon={CalendarCheck}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Session Title</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12">
                      <SectionLoader />
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Image
                          src={CLAY_ASSETS.emptyAttendanceRoster}
                          alt="No attendance records"
                          width={96}
                          height={96}
                          className="h-24 w-24 object-contain"
                        />
                        <div className="space-y-1 text-center">
                          <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            No attendance session logs recorded yet
                          </p>
                          <p className="text-xs text-slate-400">
                            Your classroom attendance and live participation records will appear here.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sessions.map((sess) => (
                    <tr key={sess._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(sess.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {sess.class?.title || "Class Session"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {sess.sessionTitle || "Regular Lecture"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] inline-flex items-center gap-1 ${
                            sess.status === "present"
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                              : sess.status === "late"
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                              : sess.status === "excused"
                              ? "bg-purple-100 dark:bg-purple-950/40 text-purple-600"
                              : "bg-red-100 dark:bg-red-950/40 text-red-600"
                          }`}
                        >
                          {sess.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 italic">
                        {sess.note || "—"}
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
