import API from "@/lib/axios";

export interface IExam {
  _id: string;
  title: string;
  description?: string;
  class_id: any;
  exam_type: "paper" | "online" | "hybrid";
  total_marks: number;
  pass_marks: number;
  held_date: string;
  question_paper_url?: string;
  marking_scheme_url?: string;
  is_published: boolean;
  created_by?: any;
  created_at?: string;
  updated_at?: string;
}

export interface IExamScorePayload {
  student_id: string;
  marks_obtained: number;
  is_absent?: boolean;
  remarks?: string;
}

export const examService = {
  createExam: async (data: Partial<IExam>) => {
    const res = await API.post("/exams", data);
    return res.data;
  },

  getExams: async (params?: { class_id?: string; is_published?: boolean; search?: string }) => {
    const res = await API.get("/exams", { params });
    return res.data;
  },

  fetchClassExams: async (classId: string) => {
    const res = await API.get("/exams", { params: { class_id: classId } });
    return res.data;
  },

  getExamById: async (id: string) => {
    const res = await API.get(`/exams/${id}`);
    return res.data;
  },

  updateExam: async (id: string, data: Partial<IExam>) => {
    const res = await API.put(`/exams/${id}`, data);
    return res.data;
  },

  deleteExam: async (id: string) => {
    const res = await API.delete(`/exams/${id}`);
    return res.data;
  },

  recordBulkExamResults: async (
    id: string,
    data: { scores: IExamScorePayload[]; is_published?: boolean; notes?: string }
  ) => {
    const res = await API.post(`/exams/${id}/marks`, data);
    return res.data;
  },

  getMyExamResults: async () => {
    const res = await API.get("/exams/my");
    return res.data;
  },
};

export const createExam = examService.createExam;
export const fetchClassExams = examService.fetchClassExams;
export const getExams = examService.getExams;
export const getExamById = examService.getExamById;

export default examService;

