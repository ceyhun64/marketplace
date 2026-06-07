"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  FileText,
  Download,
  Search,
  Receipt,
  TrendingUp,
  DollarSign,
  Building2,
  BookOpen,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { useAdminAccountingEntries } from "@/queries/useInvoices";
import { useAdminMerchants } from "@/queries/useAdmin";
import type { AccountingEntry } from "@/types/entities";

interface AdminInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  merchantName: string;
  customerName: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  pdfUrl: string | null;
  isSent: boolean;
  issuedAt: string;
}

interface InvoiceSummary {
  totalInvoices: number;
  totalRevenue: number;
  totalVat: number;
  pendingPdf: number;
}

export default function AdminInvoicesPage() {
  const [search, setSearch] = useState("");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"invoices" | "accounting">(
    "invoices",
  );
  const [accountingEntryType, setAccountingEntryType] = useState("all");

  const { data: merchants } = useAdminMerchants({ limit: 100 });

  const { data: invoices, isLoading } = useQuery<AdminInvoice[]>({
    queryKey: ["admin-invoices", merchantFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Backend GetAllInvoices doesn't support a "search" query param —
      // filtering by invoice/customer name is done client-side below.
      if (merchantFilter !== "all") params.set("merchantId", merchantFilter);
      const res = await api.get(`/api/invoices/admin/all?${params}`);
      // Backend: ApiResponse<{ items, totalCount, page, limit }>
      // interceptor açar → res.data = { items, totalCount, page, limit }
      const items = res.data?.items ?? res.data ?? [];
      // Normalize field names: backend uses merchantStoreName/customerFullName
      return items.map((inv: any) => ({
        ...inv,
        merchantName: inv.merchantName ?? inv.merchantStoreName ?? "—",
        customerName: inv.customerName ?? inv.customerFullName ?? "—",
        subTotal: inv.subTotal ?? inv.subtotal ?? 0,
        vatAmount: inv.vatAmount ?? 0,
      }));
    },
  });

  const filteredInvoices = (invoices ?? []).filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.merchantName.toLowerCase().includes(q)
    );
  });

  const { data: summary } = useQuery<InvoiceSummary>({
    queryKey: ["admin-invoice-summary"],
    queryFn: async () => {
      // /invoices/admin/summary backend'de yok; admin/all'dan hesapla
      const res = await api.get(`/api/invoices/admin/all?limit=1000&page=1`);
      const items: AdminInvoice[] = res.data?.items ?? res.data ?? [];
      return {
        totalInvoices: res.data?.totalCount ?? items.length,
        totalRevenue: items.reduce((s, i) => s + (i.totalAmount ?? 0), 0),
        totalVat: items.reduce((s, i) => s + (i.vatAmount ?? 0), 0),
        pendingPdf: items.filter((i) => !i.pdfUrl).length,
      };
    },
  });

  const { data: accountingData, isLoading: accountingLoading } =
    useAdminAccountingEntries({
      limit: 50,
      entryType:
        accountingEntryType !== "all" ? accountingEntryType : undefined,
    });

  const accountingEntries: AccountingEntry[] = accountingData?.items ?? [];

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      // First try to get the PDF URL directly
      const checkRes = await api.get(`/api/invoices/${invoiceId}`);
      const pdfUrl = checkRes.data?.pdfUrl;

      if (pdfUrl) {
        // If there's a direct URL, open it
        window.open(pdfUrl, "_blank");
        return;
      }

      // Otherwise download as blob
      const res = await api.get(`/api/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });

      // Check if response is actually a PDF blob (not an error JSON)
      const contentType = res.headers?.["content-type"] ?? "";
      if (contentType.includes("application/pdf")) {
        const url = URL.createObjectURL(
          new Blob([res.data], { type: "application/pdf" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoiceNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        toast.error("PDF not available for this invoice");
      }
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const statCards = [
    {
      label: "Total Invoices",
      value: summary?.totalInvoices ?? 0,
      icon: Receipt,
      color: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(summary?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
    {
      label: "Total VAT Collected",
      value: formatCurrency(summary?.totalVat ?? 0),
      icon: TrendingUp,
      color: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
    {
      label: "Pending PDF",
      value: summary?.pendingPdf ?? 0,
      icon: FileText,
      color: "text-(--warning)",
      bg: "bg-(--warning-bg)",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          Invoice Management
        </h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          All platform invoices — accounting overview
        </p>
      </div>
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-(--off-white-2) p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "invoices"
              ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
              : "text-(--text-tertiary) hover:text-(--text-secondary)"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("accounting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "accounting"
              ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
              : "text-(--text-tertiary) hover:text-(--text-secondary)"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Accounting Ledger
        </button>
      </div>
      {/* Stats */}
      {activeTab === "invoices" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="bg-(--bg-surface) border border-(--border-light) rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`${s.bg} p-2 rounded-lg`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-(--text-tertiary)">{s.label}</p>
                    <p className="text-lg font-semibold text-(--text-primary)">
                      {s.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-(--bg-surface) border border-(--border-light) rounded-2xl shadow-sm">
            <div className="p-4 border-b border-(--border-light) flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
                <Input
                  placeholder="Search by invoice number or customer..."
                  className="pl-9 rounded-xl border-(--border-mid)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={merchantFilter} onValueChange={setMerchantFilter}>
                <SelectTrigger className="w-44 rounded-xl border-(--border-mid)">
                  <Building2 className="w-4 h-4 mr-2 text-(--text-tertiary)" />
                  <SelectValue placeholder="All Merchants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Merchants</SelectItem>
                  {(merchants?.items ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.storeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-(--bg-sunken)">
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    Invoice #
                  </TableHead>
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    Merchant
                  </TableHead>
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    Customer
                  </TableHead>
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    Subtotal
                  </TableHead>
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    VAT
                  </TableHead>
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    Total
                  </TableHead>
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                    PDF
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24 rounded" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : filteredInvoices.map((inv) => (
                      <TableRow
                        key={inv.id}
                        className="hover:bg-(--bg-sunken) transition-colors"
                      >
                        <TableCell className="font-mono text-xs font-semibold text-(--text-secondary)">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-sm text-(--text-secondary)">
                          {inv.merchantName}
                        </TableCell>
                        <TableCell className="text-sm text-(--text-secondary)">
                          {inv.customerName}
                        </TableCell>
                        <TableCell className="text-sm text-(--text-secondary)">
                          {formatCurrency(inv.subTotal)}
                        </TableCell>
                        <TableCell className="text-sm text-(--text-tertiary)">
                          {formatCurrency(inv.vatAmount)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-(--text-primary)">
                          {formatCurrency(inv.totalAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-(--text-tertiary)">
                          {formatDate(inv.issuedAt)}
                        </TableCell>
                        <TableCell>
                          {inv.pdfUrl ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-xs h-7 gap-1"
                              onClick={() =>
                                handleDownload(inv.id, inv.invoiceNumber)
                              }
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </Button>
                          ) : (
                            <span className="text-xs text-(--text-tertiary)">
                              Pending
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>

            {!isLoading && (invoices ?? []).length === 0 && (
              <div className="text-center py-16 text-(--text-tertiary)">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No invoices found</p>
              </div>
            )}
          </div>
        </>
      )}{" "}
      {/* end invoices tab */}
      {/* Accounting Ledger Tab */}
      {activeTab === "accounting" && (
        <div className="bg-(--bg-surface) border border-(--border-light) rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-(--border-light)">
            <div>
              <h2 className="text-base font-semibold text-(--text-primary)">
                Accounting Ledger
              </h2>
              <p className="text-xs text-(--text-tertiary) mt-0.5">
                Tam muhasebe izi — sipariş/fatura/ödeme bağlantılı tüm kayıtlar
              </p>
            </div>
            <Select
              value={accountingEntryType}
              onValueChange={setAccountingEntryType}
            >
              <SelectTrigger className="w-36 h-8 text-xs rounded-lg">
                <SelectValue placeholder="Entry type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SALE">Sale</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-(--bg-sunken)">
                <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                  Invoice #
                </TableHead>
                <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                  Merchant
                </TableHead>
                <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                  Type
                </TableHead>
                <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                  Amount
                </TableHead>
                <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                  Description
                </TableHead>
                <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                  Payment Ref
                </TableHead>
                <TableHead className="font-semibold text-(--text-secondary) text-xs uppercase">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountingLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24 rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : accountingEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="hover:bg-(--bg-sunken) transition-colors"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-(--text-secondary)">
                        {entry.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-sm text-(--text-secondary)">
                        {entry.merchantStoreName}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.entryType === "SALE"
                              ? "bg-(--success-bg) text-(--success)"
                              : entry.entryType === "REFUND"
                                ? "bg-red-50 text-(--danger)"
                                : "bg-(--warning-bg) text-(--warning)"
                          }`}
                        >
                          {entry.entryType === "SALE" ? (
                            <ArrowUpCircle className="w-3 h-3" />
                          ) : (
                            <ArrowDownCircle className="w-3 h-3" />
                          )}
                          {entry.entryType}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-sm font-semibold ${
                          entry.amount >= 0
                            ? "text-(--success)"
                            : "text-(--danger)"
                        }`}
                      >
                        {entry.amount >= 0
                          ? `+${formatCurrency(entry.amount)}`
                          : `-${formatCurrency(Math.abs(entry.amount))}`}
                      </TableCell>
                      <TableCell className="text-sm text-(--text-secondary) max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-(--text-tertiary)">
                        {entry.paymentReference ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-(--text-tertiary)">
                        {formatDate(entry.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!accountingLoading && accountingEntries.length === 0 && (
            <div className="text-center py-16 text-(--text-tertiary)">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No accounting entries found</p>
            </div>
          )}
        </div>
      )}{" "}
      {/* end accounting tab */}
    </div>
  );
}
