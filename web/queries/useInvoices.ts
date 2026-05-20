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

/** Merchant: list own invoices */
export function useMyInvoices() {
  return useQuery({
    queryKey: invoiceKeys.myList(),
    queryFn: async () => {
      const { data } = await api.get<Invoice[]>("/api/invoices");
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/** Invoice detail — for customer, merchant, and admin */
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

/** Admin: list all invoices */
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
 * Download the invoice PDF.
 * To open it in a new browser tab, use the returned `pdfUrl` directly,
 * or call this mutation to download it as a blob.
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
      link.download = `invoice-${invoiceId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}

// ── Accounting Entries ────────────────────────────────────────────────────────

import type { AccountingEntry } from "@/types/entities";

export const accountingKeys = {
  all: ["accounting"] as const,
  admin: (filters?: object) => [...accountingKeys.all, "admin", filters] as const,
  merchant: (filters?: object) => [...accountingKeys.all, "merchant", filters] as const,
};

/** Admin: list all accounting entries (M3 — full audit trail) */
export function useAdminAccountingEntries(filters?: {
  page?: number;
  limit?: number;
  merchantId?: string;
  entryType?: string;
}) {
  return useQuery({
    queryKey: accountingKeys.admin(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.merchantId) params.set("merchantId", filters.merchantId);
      if (filters?.entryType) params.set("entryType", filters.entryType);
      const { data } = await api.get<{
        items: AccountingEntry[];
        totalCount: number;
        page: number;
        limit: number;
      }>(`/api/invoices/accounting?${params}`);
      return data;
    },
  });
}

/** Merchant: list own accounting entries (M3 — full audit trail) */
export function useMerchantAccountingEntries(filters?: {
  page?: number;
  limit?: number;
  entryType?: string;
}) {
  return useQuery({
    queryKey: accountingKeys.merchant(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));
      if (filters?.entryType) params.set("entryType", filters.entryType);
      const { data } = await api.get<{
        items: AccountingEntry[];
        totalCount: number;
        page: number;
        limit: number;
      }>(`/api/invoices/accounting/merchant?${params}`);
      return data;
    },
  });
}

