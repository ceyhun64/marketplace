// web/lib/api.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5010";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ── camelCase transformation ──────────────────────────────────────────────
function toCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k.charAt(0).toLowerCase() + k.slice(1),
        toCamel(v),
      ]),
    );
  }
  return obj;
}

// ── Request Interceptor ───────────────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response Interceptor ─────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {
    // Backend PascalCase → frontend camelCase
    response.data = toCamel(response.data);

    // Unwrap ApiResponse<T> wrapper:
    // { success: true, data: T } → T
    if (
      response.data !== null &&
      typeof response.data === "object" &&
      "success" in response.data &&
      "data" in response.data &&
      response.data.success === true
    ) {
      response.data = response.data.data;
    }

    // Some endpoints return { data: T } without a success field — unwrap those too.
    // The previous Object.keys().length === 1 check was missing two-key responses like
    // { data: [...], total: 10 }. Now we only unwrap responses that have a "data" key
    // and do NOT contain pagination keys like "total/page/limit/items".
    // "pagination" guards against { data: T[], pagination: {...} } shaped responses
    // being incorrectly unwrapped to just the inner array.
    const PAGINATION_KEYS = ["total", "page", "limit", "items", "pages", "stores", "pagination"];
    if (
      response.data !== null &&
      typeof response.data === "object" &&
      !("success" in response.data) &&
      "data" in response.data &&
      !PAGINATION_KEYS.some((k) => k in (response.data as object))
    ) {
      response.data = (response.data as { data: unknown }).data;
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(Promise.reject);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();

        // If there is no refresh token, the user is not authenticated.
        // Forward the error instead of redirecting to the login page.
        if (!refreshToken) {
          isRefreshing = false;
          processQueue(error, null);
          return Promise.reject(error);
        }

        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${API_URL}/api/auth/refresh`, { refreshToken });

        setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
