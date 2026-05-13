"use client";

/**
 * use-auth.ts  (güncellenmiş)
 *
 * login() sonunda:
 *  1. Guest favori listesi sunucuya aktarılır (syncGuestWishlistToServer)
 *  2. Eğer ileride server-side sepet eklenirse burada mergeWith() çağrılır
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "@/lib/api";
import { setTokens, clearTokens, getRoleFromToken } from "@/lib/auth";
import { syncGuestWishlistToServer } from "@/hooks/use-hybrid-wishlist";

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
    firstName: string;
    lastName: string;
    phone: string;
  }) => Promise<void>;
  applyMerchant: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    storeName: string;
    slug: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    handlingHours?: number;
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

          setTokens(accessToken, refreshToken);

          const role = getRoleFromToken(accessToken);
          if (!role) throw new Error("Token'da rol bulunamadı");

          const meRes = await api.get("/api/auth/me");
          // API UserInfoResponse: { id, email, firstName, lastName, phone, role, isVerified, merchantId }
          // AuthUser: { id, email, name, role, merchantId }
          const u = meRes.data as {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            merchantId?: string;
          };
          set({
            user: {
              id: u.id,
              email: u.email,
              name: `${u.firstName} ${u.lastName}`.trim(),
              role: u.role as AuthUser["role"],
              merchantId: u.merchantId,
            },
            isLoading: false,
          });

          // ✅ Giriş başarılı → guest favori listesini sunucuya aktar
          // Hata olsa bile sessizce geç (arka planda çalışır)
          syncGuestWishlistToServer().catch(() => {});

          // Not: Eğer ileride server-side sepet (saved cart) eklenirse:
          // const { data: serverCart } = await api.get("/api/cart");
          // useCart.getState().mergeWith(serverCart.items);
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
          const responseData = (
            err as {
              response?: {
                data?: { message?: string; errors?: Record<string, string[]> };
              };
            }
          )?.response?.data;

          const msg =
            responseData?.message ??
            (responseData?.errors
              ? Object.values(responseData.errors).flat()[0]
              : null) ??
            "Kayıt başarısız";

          set({ error: msg, isLoading: false });
          throw err;
        }
      },

      applyMerchant: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await api.post("/api/auth/register-merchant", data);
          set({ isLoading: false });
        } catch (err: unknown) {
          const responseData = (
            err as {
              response?: {
                data?: { message?: string; errors?: Record<string, string[]> };
              };
            }
          )?.response?.data;
          const msg =
            responseData?.message ??
            (responseData?.errors
              ? Object.values(responseData.errors).flat()[0]
              : null) ??
            "Başvuru gönderilemedi";
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
          clearTokens();
          set({ user: null });
          // NOT: Favoriler ve sepet local'da kalmaya devam eder.
          // Başka kullanıcı giriş yaparsa karışma olmaması için
          // aynı cihazda farklı kullanıcı senaryosunu düşünüyorsanız
          // burada useLocalWishlist.getState().clearAll() ekleyebilirsiniz.
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
      skipHydration: true,
    },
  ),
);
