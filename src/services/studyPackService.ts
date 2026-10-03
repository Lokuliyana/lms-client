import API from "@/lib/axios";

export interface ICustomVideo {
  _id?: string;
  title: string;
  url: string;
  provider: "youtube" | "upload" | "vimeo" | "external";
}

export interface IStudyMaterial {
  _id?: string;
  title: string;
  file_url: string;
  file_type?: string;
  size_bytes?: number;
}

export interface IStudyPack {
  _id: string;
  title: string;
  description: string;
  grade?: any;
  class_id?: any;
  subject?: any;
  price: number;
  thumbnail_url: string;
  recordings: any[];
  custom_videos: ICustomVideo[];
  materials: IStudyMaterial[];
  is_published: boolean;
  created_by?: any;
  created_at?: string;
  updated_at?: string;
}

export const studyPackService = {
  getStudyPacks: async (params?: {
    grade?: string;
    class_id?: string;
    subject?: string;
    search?: string;
  }) => {
    const res = await API.get("/study-packs", { params });
    return res.data;
  },

  getStudyPackById: async (id: string) => {
    const res = await API.get(`/study-packs/${id}`);
    return res.data;
  },

  createStudyPack: async (data: Partial<IStudyPack>) => {
    const res = await API.post("/study-packs", data);
    return res.data;
  },

  updateStudyPack: async (id: string, data: Partial<IStudyPack>) => {
    const res = await API.put(`/study-packs/${id}`, data);
    return res.data;
  },

  deleteStudyPack: async (id: string) => {
    const res = await API.delete(`/study-packs/${id}`);
    return res.data;
  },

  getClassRecordings: async (classId: string) => {
    const res = await API.get(`/study-packs/class-recordings/${classId}`);
    return res.data;
  },
};
