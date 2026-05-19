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

export interface WithdrawPayload {
  amount: number;
  reference?: string;
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const walletKeys = {
  all:          ["wallet"] as const,
  wallet:       ()                    => [...walletKeys.all, "balance"]              as const,
  transactions: (page: number, limit: number) =>
    [...walletKeys.all, "transactions", page, limit] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useMerchantWallet() {
  return useQuery<MerchantWallet>({
    queryKey: walletKeys.wallet(),
    queryFn: async () => {
      const { data } = await api.get("/api/wallet/me");
      return data;
    },
    staleTime: 30_000,
  });
}

export function useWalletTransactions(page = 1, limit = 20) {
  return useQuery<TransactionsResponse>({
    queryKey: walletKeys.transactions(page, limit),
    queryFn: async () => {
      const { data } = await api.get(
        `/api/wallet/transactions?page=${page}&limit=${limit}`,
      );
      return data;
    },
    staleTime: 30_000,
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawPayload) =>
      api.post("/api/wallet/withdraw", payload),

    // Optimistic: deduct the amount from availableBalance immediately so the
    // merchant sees the new balance without waiting for the server round-trip.
    onMutate: async ({ amount }) => {
      await qc.cancelQueries({ queryKey: walletKeys.wallet() });
      const snapshot = qc.getQueryData<MerchantWallet>(walletKeys.wallet());

      qc.setQueryData<MerchantWallet>(walletKeys.wallet(), (old) =>
        old
          ? {
              ...old,
              availableBalance: Math.max(0, old.availableBalance - amount),
              totalWithdrawn:   old.totalWithdrawn + amount,
              updatedAt:        new Date().toISOString(),
            }
          : old,
      );

      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(walletKeys.wallet(), ctx.snapshot);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
