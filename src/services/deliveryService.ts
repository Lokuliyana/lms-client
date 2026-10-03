import API from "@/lib/axios";

export interface IDeliveryOrder {
  _id: string;
  order_id: string;
  student_id: any;
  class_id?: any;
  store_order_id?: any;
  month_key?: string;
  delivery_method: string;
  shipping_address: string;
  recipient_phone?: string;
  recipient_name?: string;
  status: "pending_processing" | "processing" | "dispatched" | "shipped" | "delivered" | "cancelled";
  tracking_number?: string;
  courier_service?: string;
  dispatched_at?: string;
  delivered_at?: string;
  items?: Array<{
    product_id?: any;
    title: string;
    quantity: number;
    price?: number;
  }>;
  created_at: string;
  updated_at: string;
}

export const deliveryService = {
  getMyDeliveries: async () => {
    const res = await API.get("/deliveries/my");
    return res.data;
  },

  fetchMyDeliveries: async () => {
    const res = await API.get("/deliveries/my");
    return res.data;
  },

  getDeliveries: async (params?: {
    status?: string;
    class_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await API.get("/deliveries", { params });
    return res.data;
  },

  fetchAllDeliveries: async (params?: {
    status?: string;
    class_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await API.get("/deliveries", { params });
    return res.data;
  },

  updateDeliveryStatus: async (
    id: string,
    data: { status?: string; tracking_number?: string; courier_service?: string }
  ) => {
    const res = await API.put(`/deliveries/${id}/status`, data);
    return res.data;
  },

  updateTracking: async (
    id: string,
    data: { tracking_number: string; courier_service?: string; mark_dispatched?: boolean }
  ) => {
    const res = await API.put(`/deliveries/${id}/tracking`, data);
    return res.data;
  },
};

export const getMyDeliveries = deliveryService.getMyDeliveries;
export const fetchMyDeliveries = deliveryService.fetchMyDeliveries;
export const getDeliveries = deliveryService.getDeliveries;
export const fetchAllDeliveries = deliveryService.fetchAllDeliveries;
export const updateDeliveryStatus = deliveryService.updateDeliveryStatus;
export const updateTracking = deliveryService.updateTracking;

export default deliveryService;

