import API from "@/lib/axios";

export interface StudentScoreEntry {
  studentId: string | any;
  marksObtained: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
}

export interface ExamResultDoc {
  _id: string;
  classId: string;
  examTitle: string;
  examDate: string;
  termOrMonth?: string;
  maxMarks: number;
  passMarks: number;
  isPublished: boolean;
  recordedBy?: any;
  scores: StudentScoreEntry[];
  notes?: string;
  stats?: {
    averageScore: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
    totalStudents: number;
  };
  myScore?: {
    marksObtained: number;
    percentage: number;
    grade: string;
    remarks?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export const gradeService = {
  recordExamResults: async (payload: {
    classId: string;
    examTitle: string;
    examDate: string;
    termOrMonth?: string;
    maxMarks?: number;
    passMarks?: number;
    isPublished?: boolean;
    scores: Array<{ studentId: string; marksObtained: number; remarks?: string }>;
    notes?: string;
  }) => {
    const res = await API.post("/grades", payload);
    return res.data;
  },

  updateExamResults: async (id: string, payload: any) => {
    const res = await API.put(`/grades/${id}`, payload);
    return res.data;
  },

  togglePublish: async (id: string, isPublished?: boolean) => {
    const res = await API.put(`/grades/${id}/publish`, { isPublished });
    return res.data;
  },

  getClassExamResults: async (classId: string) => {
    const res = await API.get(`/grades/class/${classId}`);
    return res.data;
  },

  getMyExamResults: async (classId?: string) => {
    const params: any = {};
    if (classId) params.classId = classId;
    const res = await API.get("/grades/my", { params });
    return res.data;
  },

  exportCsvUrl: (id: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    return `${base}/grades/export/${id}`;
  },
};

export default gradeService;
