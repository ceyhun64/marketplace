"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnnouncementItem {
  id: string;
  text: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSettings {
  badgeText: string;
  headline: string;
  headlineAccent?: string;
  subtitle: string;
  searchPlaceholder: string;
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  backgroundImageUrl?: string;
  tags: string[];
  isActive: boolean;
  updatedAt: string;
}

export interface UpsertAnnouncementPayload {
  text: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdateHeroPayload extends Omit<HeroSettings, "updatedAt"> {}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const siteSettingsKeys = {
  all:           ["site-settings"]              as const,
  announcements: () => [...siteSettingsKeys.all, "announcements"] as const,
  hero:          () => [...siteSettingsKeys.all, "hero"]          as const,
};

// ── Public Hooks (no auth) ────────────────────────────────────────────────────

/** Fetches only active announcements, sorted by SortOrder. */
export function useAnnouncements() {
  return useQuery<AnnouncementItem[]>({
    queryKey: siteSettingsKeys.announcements(),
    queryFn: async () => {
      const { data } = await api.get<AnnouncementItem[]>(
        "/api/site-settings/announcements",
      );
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60_000,  // 5 minutes — content changes rarely
    gcTime:    10 * 60_000,
  });
}

/** Fetches the current hero section configuration. */
export function useHeroSettings() {
  return useQuery<HeroSettings>({
    queryKey: siteSettingsKeys.hero(),
    queryFn: async () => {
      const { data } = await api.get<HeroSettings>("/api/site-settings/hero");
      return data;
    },
    staleTime: 5 * 60_000,
    gcTime:    10 * 60_000,
  });
}

// ── Admin Hooks (require AdminOnly JWT) ───────────────────────────────────────

/** Fetches the hero settings via the admin endpoint (always fresh). */
export function useAdminHeroSettings() {
  return useQuery<HeroSettings>({
    queryKey: [...siteSettingsKeys.hero(), "admin"],
    queryFn: async () => {
      const { data } = await api.get<HeroSettings>("/api/admin/site-settings/hero");
      return data;
    },
    staleTime: 0,
    retry: 1,
  });
}

/** Fetches ALL announcements (including inactive) for the admin panel. */
export function useAdminAnnouncements() {
  return useQuery<AnnouncementItem[]>({
    queryKey: [...siteSettingsKeys.announcements(), "admin"],
    queryFn: async () => {
      const { data } = await api.get<AnnouncementItem[]>(
        "/api/admin/site-settings/announcements",
      );
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0, // always fresh for admin
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertAnnouncementPayload) =>
      api.post("/api/admin/site-settings/announcements", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteSettingsKeys.announcements() });
    },
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpsertAnnouncementPayload & { id: string }) =>
      api.put(`/api/admin/site-settings/announcements/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteSettingsKeys.announcements() });
    },
  });
}

export function useToggleAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/admin/site-settings/announcements/${id}/toggle`),
    // Optimistic flip
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [...siteSettingsKeys.announcements(), "admin"] });
      const prev = qc.getQueryData<AnnouncementItem[]>([...siteSettingsKeys.announcements(), "admin"]);
      qc.setQueryData<AnnouncementItem[]>(
        [...siteSettingsKeys.announcements(), "admin"],
        (old) => old?.map((a) => a.id === id ? { ...a, isActive: !a.isActive } : a),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev)
        qc.setQueryData([...siteSettingsKeys.announcements(), "admin"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: siteSettingsKeys.announcements() });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/admin/site-settings/announcements/${id}`),
    // Optimistic removal
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [...siteSettingsKeys.announcements(), "admin"] });
      const prev = qc.getQueryData<AnnouncementItem[]>([...siteSettingsKeys.announcements(), "admin"]);
      qc.setQueryData<AnnouncementItem[]>(
        [...siteSettingsKeys.announcements(), "admin"],
        (old) => old?.filter((a) => a.id !== id),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev)
        qc.setQueryData([...siteSettingsKeys.announcements(), "admin"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: siteSettingsKeys.announcements() });
    },
  });
}

export function useUpdateHeroSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateHeroPayload) =>
      api.put("/api/admin/site-settings/hero", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: siteSettingsKeys.hero() });
    },
  });
}
