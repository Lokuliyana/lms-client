import API from "@/lib/axios";

export interface StudentAttendanceEntry {
  studentId: string | any;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
}

export interface AttendanceSheet {
  _id: string;
  classId: string;
  date: string;
  sessionTitle: string;
  sessionType: "lecture" | "tutorial" | "revision" | "exam" | "other";
  markedBy?: any;
  records: StudentAttendanceEntry[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceStats {
  totalSessions: number;
  totalEntries?: number;
  totalPresent?: number;
  totalLate?: number;
  totalAbsent?: number;
  totalExcused?: number;
  overallRate?: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  excusedCount?: number;
  attendanceRate?: number;
}

export const attendanceService = {
  markAttendance: async (payload: {
    classId: string;
    date: string;
    sessionTitle?: string;
    sessionType?: string;
    records: Array<{ studentId: string; status: string; note?: string }>;
    notes?: string;
  }) => {
    const res = await API.post("/attendance", payload);
    return res.data;
  },

  getSessionRoster: async (classId: string, date?: string) => {
    const params: any = {};
    if (date) params.date = date;
    const res = await API.get(`/attendance/classes/${classId}/session`, { params });
    return res.data;
  },

  markBulkAttendance: async (
    classId: string,
    payload: {
      date: string;
      sessionTitle?: string;
      sessionType?: string;
      records: Array<{ studentId: string; status: string; note?: string }>;
      notes?: string;
    }
  ) => {
    const res = await API.post(`/attendance/classes/${classId}/mark-bulk`, payload);
    return res.data;
  },

  updateAttendance: async (id: string, payload: any) => {
    const res = await API.put(`/attendance/${id}`, payload);
    return res.data;
  },

  getClassAttendance: async (classId: string, from?: string, to?: string) => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await API.get(`/attendance/class/${classId}`, { params });
    return res.data;
  },

  getClassAttendanceStats: async (classId: string) => {
    const res = await API.get(`/attendance/class/${classId}/stats`);
    return res.data;
  },

  getMyAttendance: async (classId?: string) => {
    const params: any = {};
    if (classId) params.classId = classId;
    const res = await API.get("/attendance/my", { params });
    return res.data;
  },

  fetchSessionRoster: async (classId: string, date?: string) => {
    const params: any = {};
    if (date) params.date = date;
    const res = await API.get(`/attendance/classes/${classId}/session`, { params });
    return res.data;
  },

  fetchMyAttendanceStats: async (classId?: string) => {
    const params: any = {};
    if (classId) params.classId = classId;
    const res = await API.get("/attendance/my", { params });
    return res.data;
  },
};

export const fetchSessionRoster = attendanceService.fetchSessionRoster;
export const fetchMyAttendanceStats = attendanceService.fetchMyAttendanceStats;
export const getSessionRoster = attendanceService.getSessionRoster;
export const getMyAttendance = attendanceService.getMyAttendance;
export const markAttendance = attendanceService.markAttendance;

export default attendanceService;

