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
  bankIban: string;
  bankAccountName: string;
  bankName?: string;
  note?: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  bankIban: string;
  bankAccountName: string;
  bankName?: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  note?: string;
  adminNote?: string;
  processedAt?: string;
  createdAt: string;
}

interface WithdrawalRequestsResponse {
  data: WithdrawalRequest[];
  pagination: { page: number; limit: number; total: number };
}

// ── Query Keys ────────────────────────────────────────────────────────────────

export const walletKeys = {
  all:          ["wallet"] as const,
  wallet:       ()                    => [...walletKeys.all, "balance"]              as const,
  transactions: (page: number, limit: number) =>
    [...walletKeys.all, "transactions", page, limit] as const,
  withdrawals:  (page: number, limit: number) =>
    [...walletKeys.all, "withdrawals", page, limit] as const,
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

    // No optimistic balance update: the backend only files a Pending
    // WithdrawalRequest awaiting admin approval — funds are not debited from
    // availableBalance (and totalWithdrawn is not incremented) until that
    // request is approved. Optimistically mutating those figures here would
    // show the merchant a balance that doesn't match the server's truth.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useWithdrawalRequests(page = 1, limit = 20) {
  return useQuery<WithdrawalRequestsResponse>({
    queryKey: walletKeys.withdrawals(page, limit),
    queryFn: async () => {
      const { data } = await api.get(
        `/api/wallet/withdrawals?page=${page}&limit=${limit}`,
      );
      return data;
    },
    staleTime: 30_000,
  });
}
