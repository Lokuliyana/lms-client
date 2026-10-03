import API from "@/lib/axios";

export interface IProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: "study_pack" | "tute" | "book" | "merchandise";
  inventory_count: number;
  thumbnail_url: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IStoreOrderItem {
  product_id: string | any;
  title: string;
  price: number;
  quantity: number;
}

export interface IStoreOrder {
  _id: string;
  order_id: string;
  user_id: any;
  items: IStoreOrderItem[];
  total_amount: number;
  shipping_address: string;
  contact_phone: string;
  payment_status: "pending" | "paid" | "failed";
  fulfillment_status: "unfulfilled" | "processing" | "dispatched" | "delivered" | "cancelled";
  transaction_id?: any;
  delivery_order_id?: any;
  created_at: string;
  updated_at: string;
}

export const storeService = {
  getProducts: async (params?: { category?: string; search?: string; include_inactive?: boolean }) => {
    const res = await API.get("/store/products", { params });
    return res.data;
  },

  getProductById: async (id: string) => {
    const res = await API.get(`/store/products/${id}`);
    return res.data;
  },

  createProduct: async (data: Partial<IProduct>) => {
    const res = await API.post("/store/products", data);
    return res.data;
  },

  updateProduct: async (id: string, data: Partial<IProduct>) => {
    const res = await API.put(`/store/products/${id}`, data);
    return res.data;
  },

  deleteProduct: async (id: string) => {
    const res = await API.delete(`/store/products/${id}`);
    return res.data;
  },

  createCheckout: async (data: {
    items: Array<{ product_id: string; quantity: number }>;
    shipping_address: string;
    contact_phone?: string;
    payment_method?: string;
  }) => {
    const res = await API.post("/store/checkout", data);
    return res.data;
  },

  getMyOrders: async () => {
    const res = await API.get("/store/orders/my");
    return res.data;
  },

  getAllOrders: async (status?: string) => {
    const params: any = {};
    if (status) params.status = status;
    const res = await API.get("/store/orders", { params });
    return res.data;
  },

  fetchProducts: async (params?: { category?: string; search?: string; include_inactive?: boolean }) => {
    const res = await API.get("/store/products", { params });
    return res.data;
  },

  fetchProductById: async (id: string) => {
    const res = await API.get(`/store/products/${id}`);
    return res.data;
  },
};

export const getProducts = storeService.getProducts;
export const fetchProducts = storeService.fetchProducts;
export const getProductById = storeService.getProductById;
export const fetchProductById = storeService.fetchProductById;
export const createProduct = storeService.createProduct;
export const updateProduct = storeService.updateProduct;
export const deleteProduct = storeService.deleteProduct;

export default storeService;

