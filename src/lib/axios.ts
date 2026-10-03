// src/lib/axios.ts
import axios, { type AxiosRequestHeaders } from "axios";
import { startGlobalLoading, stopGlobalLoading } from "@/lib/globalLoading";

const isBrowser = typeof window !== "undefined";

function resolveBaseURL(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    process.env.API_ORIGIN;

  if (envUrl) {
    const trimmed = envUrl.replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
  }

  return isBrowser ? "/api" : "http://127.0.0.1:4002/api";
}

const defaultBaseURL = resolveBaseURL();
const API = axios.create({ baseURL: defaultBaseURL, withCredentials: true });


// Only these routes should be sent WITHOUT a token
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/forgot-password",
  "/auth/refresh-token",
  "/auth/profile",
];

function isPublicAuthPath(url: string): boolean {
  try {
    const u = url.startsWith("http")
      ? new URL(url).pathname
      : url.split("?")[0].split("#")[0];

    const clean = u.replace(/^\/api/, "");
    return PUBLIC_AUTH_PATHS.some((p) => clean === p || clean.startsWith(p + "/"));
  } catch {
    return false;
  }
}

API.interceptors.request.use(
  (config) => {
    if (config.url && typeof config.url === "string") {
      const base = String(config.baseURL || "");
      if (base.endsWith("/api") || base.endsWith("/api/")) {
        if (config.url.startsWith("/api/")) {
          config.url = config.url.replace(/^\/api\//, "/");
        } else if (config.url === "/api") {
          config.url = "/";
        }
      }
    }
    // start global loader for every request
    if (isBrowser) {
      startGlobalLoading();
    }
    return config;
  },
  (error) => {
    if (isBrowser) {
      stopGlobalLoading();
    }
    return Promise.reject(error);
  }
);

import { openLoginDialog } from "./authState";

API.interceptors.response.use(
  (response) => {
    if (isBrowser) {
      stopGlobalLoading();
    }
    return response;
  },
  (error) => {
    if (isBrowser) {
      stopGlobalLoading();
    }
    const status = error.response?.status;
    const url = error.config?.url || "";

    // If 401/403 occurs on a non-public route, trigger the re-login dialog
    if (isBrowser && (status === 401 || status === 403) && !isPublicAuthPath(url)) {
      openLoginDialog();
    }

    return Promise.reject(error);
  }
);

export default API;
