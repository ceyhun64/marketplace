"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Invoice } from "@/types/entities";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const invoiceKeys = {
  all: ["invoices"] as const,
  myList: () => [...invoiceKeys.all, "mine"] as const,
  adminList: (filters?: object) =>
    [...invoiceKeys.all, "admin", filters] as const,
  detail: (id: string) => [...invoiceKeys.all, "detail", id] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Merchant: kendi faturalarını listele */
export function useMyInvoices() {
  return useQuery({
    queryKey: invoiceKeys.myList(),
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>("/api/invoices");
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 dakika
  });
}

/** Fatura detayı — customer, merchant ve admin için */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Invoice>(`/api/invoices/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/** Admin: tüm faturaları listele */
export function useAdminInvoices(filters?: {
  page?: number;
  limit?: number;
  merchantId?: string;
}) {
  return useQuery({
    queryKey: invoiceKeys.adminList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.merchantId) params.set("merchantId", filters.merchantId);
      const { data } = await api.get<{ items: Invoice[]; totalCount: number }>(
        `/api/invoices/admin/all?${params}`,
      );
      return data;
    },
  });
}

/**
 * Fatura PDF'ini indir.
 * Tarayıcıda yeni sekmede açmak için dönen `pdfUrl`'i doğrudan kullanabilirsin,
 * ya da bu mutation'ı çağırarak blob indir.
 */
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await api.get(`/api/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `fatura-${invoiceId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}
