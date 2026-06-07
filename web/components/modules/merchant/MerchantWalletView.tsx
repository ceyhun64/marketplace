"use client";

import { useState } from "react";
import {
  useMerchantWallet,
  useWalletTransactions,
  useWithdraw,
  useWithdrawalRequests,
  type WalletTransaction,
  type WithdrawalRequest,
} from "@/queries/useWallet";
import { formatDateTime, formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wallet,
  Clock,
  ArrowDownCircle,
  TrendingUp,
  ArrowUpCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// -- Helpers -------------------------------------------------------------------

const TYPE_META: Record<
  WalletTransaction["type"],
  { label: string; color: string; bg: string; sign: "+" | "-" | "→" }
> = {
  ESCROW_HOLD: {
    label: "Escrow Hold",
    color: "text-(--warning)",
    bg: "bg-(--warning-bg)",
    sign: "→",
  },
  SETTLEMENT: {
    label: "Settlement",
    color: "text-(--success)",
    bg: "bg-(--success-bg)",
    sign: "+",
  },
  WITHDRAWAL: {
    label: "Withdrawal",
    color: "text-(--danger)",
    bg: "bg-(--danger-bg)",
    sign: "-",
  },
  REFUND_DEBIT: {
    label: "Refund Debit",
    color: "text-(--danger)",
    bg: "bg-(--danger-bg)",
    sign: "-",
  },
};

// -- Skeleton helpers ----------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-16 mt-1.5" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// -- Main View -----------------------------------------------------------------

const WITHDRAWAL_STATUS_META: Record<
  WithdrawalRequest["status"],
  { label: string; color: string; bg: string }
> = {
  Pending:   { label: "Pending review",  color: "text-(--warning)", bg: "bg-(--warning-bg)" },
  Approved:  { label: "Approved",        color: "text-(--info)",    bg: "bg-(--info-bg)" },
  Completed: { label: "Completed",       color: "text-(--success)", bg: "bg-(--success-bg)" },
  Rejected:  { label: "Rejected",        color: "text-(--danger)",  bg: "bg-(--danger-bg)" },
};

export default function MerchantWalletView() {
  const { data: wallet, isLoading: walletLoading } = useMerchantWallet();
  const [page, setPage] = useState(1);
  const { data: txData, isLoading: txLoading } = useWalletTransactions(page);
  const [requestsPage, setRequestsPage] = useState(1);
  const { data: requestsData, isLoading: requestsLoading } = useWithdrawalRequests(requestsPage);
  const withdraw = useWithdraw();

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");

  const resetWithdrawForm = () => {
    setWithdrawAmount("");
    setBankIban("");
    setBankAccountName("");
    setBankName("");
    setWithdrawNote("");
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid withdrawal amount.");
      return;
    }
    if (wallet && amount > wallet.availableBalance) {
      toast.error("Amount exceeds your available balance.");
      return;
    }
    if (!bankIban.trim()) {
      toast.error("Bank IBAN is required.");
      return;
    }
    if (!bankAccountName.trim()) {
      toast.error("Bank account holder name is required.");
      return;
    }
    try {
      await withdraw.mutateAsync({
        amount,
        bankIban: bankIban.trim(),
        bankAccountName: bankAccountName.trim(),
        bankName: bankName.trim() || undefined,
        note: withdrawNote.trim() || undefined,
      });
      toast.success(
        `Withdrawal request for ${formatCurrency(amount)} submitted — pending admin approval.`,
      );
      setWithdrawOpen(false);
      resetWithdrawForm();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Withdrawal request failed. Please try again.");
    }
  };

  const transactions = txData?.data ?? [];
  const pagination = txData?.pagination;
  const withdrawalRequests = requestsData?.data ?? [];
  const requestsPagination = requestsData?.pagination;
  const requestsTotalPages = requestsPagination
    ? Math.max(1, Math.ceil(requestsPagination.total / requestsPagination.limit))
    : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          Wallet & Payouts
        </h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          Escrow balance, cleared funds, and transaction ledger
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {walletLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <BalanceCard
              icon={Clock}
              iconBg="bg-(--warning-bg)"
              iconColor="text-(--warning)"
              label="Pending (Escrow)"
              value={formatCurrency(wallet?.pendingBalance ?? 0)}
              sub="Held — not yet cleared"
            />
            <BalanceCard
              icon={Wallet}
              iconBg="bg-(--success-bg)"
              iconColor="text-(--success)"
              label="Available Balance"
              value={formatCurrency(wallet?.availableBalance ?? 0)}
              sub="Ready to withdraw"
              highlight
            />
            <BalanceCard
              icon={ArrowDownCircle}
              iconBg="bg-(--off-white-2)"
              iconColor="text-(--text-secondary)"
              label="Total Withdrawn"
              value={formatCurrency(wallet?.totalWithdrawn ?? 0)}
              sub="All time"
            />
            <BalanceCard
              icon={TrendingUp}
              iconBg="bg-(--info-bg)"
              iconColor="text-(--info)"
              label="Total Earned"
              value={formatCurrency(
                (wallet?.availableBalance ?? 0) +
                  (wallet?.pendingBalance ?? 0) +
                  (wallet?.totalWithdrawn ?? 0),
              )}
              sub="Gross (before withdrawals)"
            />
          </>
        )}
      </div>

      {/* Escrow notice */}
      {!walletLoading && (wallet?.pendingBalance ?? 0) > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-(--warning-border) bg-(--warning-bg) px-4 py-3">
          <AlertCircle className="w-4 h-4 text-(--warning) shrink-0 mt-0.5" />
          <p className="text-sm text-(--warning)">
            <span className="font-semibold">{formatCurrency(wallet!.pendingBalance)}</span>{" "}
            is currently held in escrow. Funds are cleared automatically 3 days
            after delivery is confirmed.
          </p>
        </div>
      )}

      {/* Withdraw CTA */}
      {!walletLoading && (wallet?.availableBalance ?? 0) > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-(--success-border) bg-(--success-bg) px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-(--success)">
              {formatCurrency(wallet!.availableBalance)} available for withdrawal
            </p>
            <p className="text-xs text-(--text-secondary) mt-0.5">
              Funds will be transferred to your registered bank account.
            </p>
          </div>
          <Button
            onClick={() => setWithdrawOpen(true)}
            className="h-9 text-sm font-semibold shrink-0"
            style={{ backgroundColor: "var(--success)", color: "#fff" }}
          >
            <ArrowUpCircle className="w-4 h-4 mr-1.5" />
            Withdraw
          </Button>
        </div>
      )}

      <Separator />

      {/* Transaction Ledger */}
      <div>
        <h2 className="text-sm font-semibold text-(--text-primary) mb-4">
          Transaction Ledger
        </h2>
        <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden">
          {txLoading ? (
            <div className="divide-y divide-(--border-subtle)">
              {Array.from({ length: 6 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet className="w-10 h-10 text-(--text-tertiary) opacity-20 mx-auto mb-3" />
              <p className="text-sm text-(--text-secondary) font-medium">
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-(--border-subtle)">
              {transactions.map((txn) => {
                const meta = TYPE_META[txn.type];
                return (
                  <div
                    key={txn.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-(--bg-sunken) transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}
                    >
                      <span className={`text-sm font-bold ${meta.color}`}>
                        {meta.sign}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        {txn.orderId && (
                          <span className="text-[11px] text-(--text-tertiary) font-mono">
                            #{txn.orderId.slice(0, 8).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-(--text-tertiary) mt-0.5">
                        {txn.notes ?? txn.reference ?? "—"}
                      </p>
                      <p className="text-[11px] text-(--text-tertiary) mt-0.5">
                        {formatDateTime(txn.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${meta.color}`}>
                        {meta.sign === "+" ? "+" : meta.sign === "-" ? "-" : ""}
                        {formatCurrency(txn.amount)}
                      </p>
                      <p className="text-[11px] text-(--text-tertiary)">
                        avail: {formatCurrency(txn.availableAfter)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-(--border-light)">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-(--text-tertiary)">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(pagination.pages, p + 1))
                }
                disabled={page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Withdrawal Requests */}
      <div>
        <h2 className="text-sm font-semibold text-(--text-primary) mb-4">
          Withdrawal Requests
        </h2>
        <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden">
          {requestsLoading ? (
            <div className="divide-y divide-(--border-subtle)">
              {Array.from({ length: 3 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          ) : withdrawalRequests.length === 0 ? (
            <div className="py-16 text-center">
              <ArrowUpCircle className="w-10 h-10 text-(--text-tertiary) opacity-20 mx-auto mb-3" />
              <p className="text-sm text-(--text-secondary) font-medium">
                No withdrawal requests yet
              </p>
              <p className="text-xs text-(--text-tertiary) mt-1">
                Submitted requests will appear here with their approval status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-(--border-subtle)">
              {withdrawalRequests.map((req) => {
                const meta = WITHDRAWAL_STATUS_META[req.status];
                return (
                  <div
                    key={req.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-(--bg-sunken) transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-(--text-tertiary) font-mono">
                          {req.bankAccountName} · {req.bankIban}
                        </span>
                      </div>
                      {req.adminNote && (
                        <p className="text-xs text-(--text-tertiary) mt-1">
                          Admin note: {req.adminNote}
                        </p>
                      )}
                      <p className="text-[11px] text-(--text-tertiary) mt-0.5">
                        Requested {formatDateTime(req.createdAt)}
                        {req.processedAt && ` · Processed ${formatDateTime(req.processedAt)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-(--text-primary)">
                        {formatCurrency(req.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {requestsPagination && requestsTotalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-(--border-light)">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestsPage((p) => Math.max(1, p - 1))}
                disabled={requestsPage === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-(--text-tertiary)">
                Page {requestsPage} of {requestsTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequestsPage((p) => Math.min(requestsTotalPages, p + 1))}
                disabled={requestsPage === requestsTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog
        open={withdrawOpen}
        onOpenChange={(open) => {
          setWithdrawOpen(open);
          if (!open) resetWithdrawForm();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-(--text-secondary)">
              Available:{" "}
              <span className="font-semibold text-(--success)">
                {formatCurrency(wallet?.availableBalance ?? 0)}
              </span>
            </p>
            <p className="text-xs text-(--text-tertiary) -mt-2">
              This submits a request for admin review — funds stay in your wallet
              until it's approved and transferred to the bank account below.
            </p>
            <div>
              <Label className="text-sm mb-1 block">Amount ($)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="border-(--border-mid)"
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Bank Account Holder Name</Label>
              <Input
                placeholder="Full legal name on the account"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="border-(--border-mid)"
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Bank IBAN</Label>
              <Input
                placeholder="e.g. TR00 0000 0000 0000 0000 0000 00"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                className="border-(--border-mid) font-mono uppercase"
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Bank Name (optional)</Label>
              <Input
                placeholder="e.g. Garanti BBVA"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="border-(--border-mid)"
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Note (optional)</Label>
              <Input
                placeholder="Anything the admin should know"
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                className="border-(--border-mid)"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={withdraw.isPending}
              style={{ backgroundColor: "var(--success)", color: "#fff" }}
            >
              {withdraw.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -- BalanceCard ---------------------------------------------------------------

function BalanceCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight
          ? "bg-(--success-bg) border-(--success-border)"
          : "bg-(--bg-surface) border-(--border-light)"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
          {label}
        </p>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <p
        className={`text-xl font-bold ${highlight ? "text-(--success)" : "text-(--text-primary)"}`}
      >
        {value}
      </p>
      <p className="text-xs text-(--text-tertiary) mt-1">{sub}</p>
    </div>
  );
}
