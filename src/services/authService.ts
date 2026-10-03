import API from "@/lib/axios";

type RegisterDto = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
};

type VerifyOtpDto = {
  email: string;
  otp: string;
  full_name: string;
  phone: string;
  password: string;
  grade?: string;
  school?: string;
  birth_date?: string;
  ol_year?: string;
  al_year?: string;
  home_address?: string;
};

const storage = {
  set(token: string, user: any) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  },
  clear() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },
  user(): any | null {
    try {
      if (typeof localStorage !== "undefined") {
        return JSON.parse(localStorage.getItem("user") || "null");
      }
      return null;
    } catch {
      return null;
    }
  },
};


export const authService = {
  register: (data: RegisterDto) => API.post("/auth/register", data),

  verifyOtp: (data: VerifyOtpDto) => API.post("/auth/verify-otp", data),

  login: async (data: { email?: string; phone?: string; password: string }) => {
    const res = await API.post("/auth/login", data);
    const { token, user } = res.data;
    storage.set(token, user);
    return { token, user };
  },

  getProfile: () => API.get("/auth/profile"),

  updateProfile: (data: any) => API.put("/auth/profile", data),

  getUserById: (userId: string) => API.get(`/auth/user/${userId}`),

  editUser: (userId: string, data: Partial<any>) =>
    API.put(`/auth/edit-user/${userId}`, data),

  forgotPassword: (email: string) => API.post("/auth/forgot-password", { email }),

  resetPasswordWithOTP: (data: any) => API.post("/auth/reset-password", data),

  adminResetPassword: (userId: string, data: any) =>
    API.post(`/auth/admin/reset-password/${userId}`, data),

  changePassword: (data: any) => API.post("/auth/change-password", data),

  logout: async () => {
    try {
      await API.post("/auth/logout");
    } catch (e) {
      console.error("Logout API failed", e);
    }
    storage.clear();
    window.location.href = "/login";
  },

  getAllUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    API.get("/users", { params }),

  getStoredUser: () => storage.user(),

  refreshToken: async () => {
    const res = await API.post("/auth/refresh-token");
    const { token } = res.data;
    const user = storage.user();
    if (token) {} // localStorage.setItem("token", token);
    return token;
  },

  createModerator: (data: {
    full_name: string;
    email: string;
    phone: string;
    password: string;
    permitted_class_ids?: string[];
  }) => API.post("/users", { ...data, role: "moderator" }),

  updateOwnProfile: (data: Partial<any>) => {
    const user = storage.user();
    if (!user?._id) throw new Error("User not found in local storage");
    return API.put(`/auth/edit-user/${user._id}`, data);
  },

  getUserRole: () => {
    const user = storage.user();
    return user?.role || null;
  },

  getRoles: () => API.get("/permissions/roles"),

  updateUserRole: (userId: string, role_ids: string[]) => 
    API.put(`/users/${userId}/roles`, { role_ids }),
    
  createUser: (data: any) => API.post("/users", data),
};
