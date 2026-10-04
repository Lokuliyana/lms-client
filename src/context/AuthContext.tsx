"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import API from "@/lib/axios";

interface AuthContextType {
  user: any;
  loading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => void;
  updateOwnProfile: (data: any) => Promise<void>;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isModerator: boolean;
  hasPermission: (permissionKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check session on mount
    authService.getProfile()
      .then((res) => {
        if (res.data) setUser(res.data.data || res.data);
      })
      .catch(() => {
        setUser(null);
        if (typeof window !== "undefined") localStorage.removeItem("user");
      })
      .finally(() => setLoading(false));

    // Setup Axios interceptor for 401s
    const interceptor = API.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          setUser(null);
          if (typeof window !== "undefined") localStorage.removeItem("user");
          setIsLoginModalOpen(true);
        }
        return Promise.reject(error);
      }
    );

    return () => API.interceptors.response.eject(interceptor);
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const payload: { email?: string; phone?: string; password: string } = { password };
      if (identifier.includes("@")) payload.email = identifier;
      else payload.phone = identifier;

      await authService.login(payload);
      const profileRes = await authService.getProfile();
      const profileUser = profileRes.data.data || profileRes.data;
      setUser(profileUser);
      const user = profileUser;
      setIsLoginModalOpen(false);

      if (pathname === '/login' || pathname === '/') {
        if (user.role === "teacher" || user.role === "admin" || user.role === "moderator") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.push("/");
  };

  const updateOwnProfile = async (updatedData: any) => {
    setLoading(true);
    try {
      await authService.updateOwnProfile(updatedData);
      setUser({ ...user, ...updatedData });
    } finally {
      setLoading(false);
    }
  };

  const rawRole = String(user?.role || "").toLowerCase().trim();
  const isTeacher = rawRole === "teacher" || rawRole === "admin";
  const isStudent = Boolean(user && rawRole === "student");
  const isModerator = rawRole === "moderator";

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    if (isTeacher || user.permissions?.includes("*")) {
      return true;
    }
    return Boolean(user.permissions?.includes(permissionKey));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoginModalOpen,
      openLoginModal: () => setIsLoginModalOpen(true),
      closeLoginModal: () => setIsLoginModalOpen(false),
      login,
      logout,
      updateOwnProfile,
      isAuthenticated: !!user,
      isTeacher,
      isStudent,
      isModerator,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
