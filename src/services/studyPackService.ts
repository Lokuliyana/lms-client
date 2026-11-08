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

export interface IMediaTicketWatermark {
  studentId: string;
  email: string;
  clientIp: string;
  timestamp: number;
  displayText: string;
}

export interface IMediaTicketData {
  ticket: string;
  expires_at: number;
  ttl_seconds: number;
  watermark: IMediaTicketWatermark;
  study_pack_id: string;
  media: {
    recordings: any[];
    custom_videos: ICustomVideo[];
    materials: IStudyMaterial[];
  };
}

export interface IPurchaseStudyPackPayload {
  include_physical_delivery?: boolean;
  shipping_address?: string;
  recipient_phone?: string;
  recipient_name?: string;
  payment_method?: string;
  payment_proof?: string;
  payment_slip_name?: string;
  notes?: string;
}

export interface IStudyPackOrder {
  _id: string;
  order_id: string;
  student_id: any;
  user_id?: any;
  study_pack_id: any;
  include_physical_delivery: boolean;
  shipping_address?: string;
  recipient_phone?: string;
  recipient_name?: string;
  delivery_order_id?: any;
  digital_access_granted: boolean;
  digital_access_granted_at?: string;
  status: 'pending' | 'pending_approval' | 'active' | 'completed' | 'cancelled';
  payment_status: 'paid' | 'pending' | 'free' | 'failed';
  amount_paid: number;
  payment_proof?: string;
  payment_slip_name?: string;
  notes?: string;
  approved_by?: any;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
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
  has_access?: boolean;
  is_enrolled?: boolean;
  media_locked?: boolean;
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

  getMediaTicket: async (id: string, ttl?: number) => {
    const res = await API.get(`/study-packs/${id}/media-ticket`, {
      params: ttl ? { ttl } : undefined,
    });
    return res.data as { success: boolean; data: IMediaTicketData; message?: string };
  },

  purchaseStudyPack: async (id: string, data: IPurchaseStudyPackPayload) => {
    const res = await API.post(`/study-packs/${id}/purchase`, data);
    return res.data as {
      success: boolean;
      message: string;
      data: {
        order: any;
        delivery: any;
        digital_access_unlocked: boolean;
        already_owned: boolean;
        study_pack: any;
      };
    };
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

  getOrders: async (params?: { status?: string; study_pack_id?: string }) => {
    const res = await API.get("/study-packs/orders", { params });
    return res.data as { success: boolean; count: number; data: IStudyPackOrder[] };
  },

  getMyOrders: async () => {
    const res = await API.get("/study-packs/my-orders");
    return res.data as { success: boolean; count: number; data: IStudyPackOrder[] };
  },

  approveOrder: async (orderId: string) => {
    const res = await API.post(`/study-packs/orders/${orderId}/approve`);
    return res.data as { success: boolean; message: string; data: IStudyPackOrder };
  },

  rejectOrder: async (orderId: string, reason?: string) => {
    const res = await API.post(`/study-packs/orders/${orderId}/reject`, { reason });
    return res.data as { success: boolean; message: string; data: IStudyPackOrder };
  },
};
