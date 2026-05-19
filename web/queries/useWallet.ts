import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MerchantWallet {
  id: string;
  merchantId: string;
  pendingBalance: number;
  availableBalance: number;
  totalWithdrawn: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: "ESCROW_HOLD" | "SETTLEMENT" | "WITHDRAWAL" | "REFUND_DEBIT";
  amount: number;
  pendingBefore: number;
  pendingAfter: number;
  availableBefore: number;
  availableAfter: number;
  orderId?: string;
  vendorOrderId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

interface TransactionsResponse {
  data: WalletTransaction[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useMerchantWallet() {
  return useQuery<MerchantWallet>({
    queryKey: ["merchant-wallet"],
    queryFn: async () => {
      const { data } = await api.get("/api/wallet/me");
      return data;
    },
    staleTime: 30_000,
  });
}

export function useWalletTransactions(page = 1, limit = 20) {
  return useQuery<TransactionsResponse>({
    queryKey: ["wallet-transactions", page, limit],
    queryFn: async () => {
      const { data } = await api.get(`/api/wallet/transactions?page=${page}&limit=${limit}`);
      return data;
    },
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; reference?: string }) =>
      api.post("/api/wallet/withdraw", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["merchant-wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
}
