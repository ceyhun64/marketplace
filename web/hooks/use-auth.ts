"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { setTokens, clearTokens, getRoleFromToken } from "@/lib/auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "Admin" | "Merchant" | "Courier" | "Customer";
  merchantId?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/api/auth/login", {
            email,
            password,
          });
          const { accessToken, refreshToken } = data;

          // Cookie'ye yaz — middleware artık okuyabilir
          setTokens(accessToken, refreshToken);

          // .NET'in uzun claim adını destekleyen helper kullan
          const role = getRoleFromToken(accessToken);
          if (!role) throw new Error("Token'da rol bulunamadı");

          const meRes = await api.get("/api/auth/me");
          set({ user: meRes.data, isLoading: false });
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Giriş başarısız";
          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await api.post("/api/auth/register", data);
          set({ isLoading: false });
        } catch (err: unknown) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Kayıt başarısız";
          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await api.post("/api/auth/logout");
        } catch {
          // sessizce geç
        } finally {
          clearTokens(); // cookie'leri sil
          set({ user: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-store",
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
