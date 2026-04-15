// web/hooks/use-auth.ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import {
  saveTokens,
  clearTokens,
  getUserFromToken,
  type AuthUser,
} from "@/lib/auth";

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  initFromStorage: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      initFromStorage: () => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("access_token");
        if (token) {
          const user = getUserFromToken(token);
          if (user) set({ user, isAuthenticated: true });
        }
      },

      login: async (dto) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>("/api/auth/login", dto);
          saveTokens(data);
          const user = getUserFromToken(data.accessToken);
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (dto) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post<AuthResponse>(
            "/api/auth/register",
            dto,
          );
          saveTokens(data);
          const user = getUserFromToken(data.accessToken);
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post("/api/auth/logout");
        } catch {
          // Sunucu hatası olsa bile local'i temizle
        } finally {
          clearTokens();
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "auth-storage",
      // Sadece user objesini persist et, token'lar localStorage'da ayrı
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
