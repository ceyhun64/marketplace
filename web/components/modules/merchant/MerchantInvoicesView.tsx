"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
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
  TrendingUp,
  Receipt,
  Calendar,
  ExternalLink,
  BookOpen,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { useMerchantAccountingEntries } from "@/queries/useInvoices";
import type { AccountingEntry } from "@/types/entities";

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  subTotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  pdfUrl?: string;
  issuedAt: string;
  source: "MARKETPLACE" | "ESTORE";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "TRY",
    currencyDisplay: "symbol",
  })
    .format(amount)
    .replace("TRY", "$");
}

export default function MerchantInvoicesView() {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"invoices" | "accounting">(
    "invoices",
  );
  const [accountingEntryType, setAccountingEntryType] = useState("all");

  const { data: accountingData, isLoading: accountingLoading } =
    useMerchantAccountingEntries({
      limit: 100,
      entryType:
        accountingEntryType !== "all" ? accountingEntryType : undefined,
    });
  const accountingEntries: AccountingEntry[] = accountingData?.items ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-invoices"],
    queryFn: async () => {
      const res = await api.get("/api/merchants/invoices");
      return res.data;
    },
  });

  // Backend yeni format: { total, totalRevenue, invoices: [...] }
  const invoices: Invoice[] = Array.isArray(data)
    ? data
    : data?.invoices || data?.data || data?.items || [];

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      // Backend'den PDF URL'i al, sonra Cloudinary'den indir
      const res = await api.get(
        `/api/merchants/invoices/${invoiceId}/download`,
      );
      const pdfUrl = res.data?.pdfUrl;

      if (pdfUrl) {
        // Open Cloudinary CDN URL in a new tab
        window.open(pdfUrl, "_blank");
      } else {
        // Fallback: blob olarak indir
        const blobRes = await api.get(
          `/api/merchants/invoices/${invoiceId}/download`,
          { responseType: "blob" },
        );
        const url = window.URL.createObjectURL(new Blob([blobRes.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `invoice-${invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
      toast.success("Downloading invoice...");
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const months = [
    ...new Set(
      invoices.map((inv) => {
        const d = new Date(inv.issuedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }),
    ),
  ].sort((a, b) => b.localeCompare(a));

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.orderNumber?.toLowerCase().includes(search.toLowerCase());
    const matchMonth =
      monthFilter === "all" ||
      new Date(inv.issuedAt).toISOString().startsWith(monthFilter);
    return matchSearch && matchMonth;
  });

  const totalRevenue = filtered.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalVat = filtered.reduce((sum, inv) => sum + inv.vatAmount, 0);
  const netRevenue = filtered.reduce((sum, inv) => sum + inv.subTotal, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          Invoices
        </h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          View and download all sales invoices
        </p>
      </div>
      {/* Tab Switcher */}
      <div className="flex gap-1 bg-(--off-white-2) p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "invoices"
              ? "bg-(--bg-surface) text-(--text-primary) shadow-sm"
              : "text-(--text-secondary) hover:text-(--text-secondary)"
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
              : "text-(--text-secondary) hover:text-(--text-secondary)"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Accounting Ledger
        </button>
      </div>
      {/* Stats */}
      {activeTab === "invoices" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Invoices",
                value: filtered.length,
                icon: Receipt,
                color: "text-(--text-secondary)",
                bg: "bg-(--off-white-2)",
              },
              {
                label: "Gross Revenue",
                value: formatCurrency(totalRevenue),
                icon: TrendingUp,
                color: "text-(--success)",
                bg: "bg-(--success-bg)",
              },
              {
                label: "Net Revenue",
                value: formatCurrency(netRevenue),
                icon: FileText,
                color: "text-(--info)",
                bg: "bg-(--info-bg)",
              },
              {
                label: "Total VAT",
                value: formatCurrency(totalVat),
                icon: Receipt,
                color: "text-(--warning)",
                bg: "bg-(--warning-bg)",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                    {s.label}
                  </p>
                  <div className={`p-1.5 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-(--text-primary)">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
              <Input
                placeholder="Search by invoice no, customer or order..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-(--border-mid)"
              />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-44 border-(--border-mid)">
                <Calendar className="w-4 h-4 mr-2 text-(--text-tertiary)" />
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((m) => {
                  const [year, month] = m.split("-");
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return (
                    <SelectItem key={m} value={m}>
                      {date.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden">
            <div className="px-5 py-4 border-b border-(--border-light)">
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Invoice List
                <span className="ml-2 text-sm font-normal text-(--text-tertiary)">
                  ({filtered.length} invoices)
                </span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-(--bg-sunken) border-b border-(--border-light)">
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                      Invoice No.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                      Order
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                      Customer
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                      Channel
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide text-right">
                      Net
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide text-right">
                      VAT
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide text-right">
                      Total
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide text-right">
                      PDF
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-16 text-(--text-tertiary)"
                      >
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No invoices found</p>
                        <p className="text-xs mt-1">
                          Invoices are generated automatically after each sale
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="hover:bg-(--bg-sunken) border-b border-(--border-subtle)"
                      >
                        <TableCell className="font-mono text-xs text-(--info) font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-xs text-(--text-secondary) font-mono">
                          {invoice.orderNumber}
                        </TableCell>
                        <TableCell className="text-sm text-(--text-secondary)">
                          {invoice.customerName}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              invoice.source === "MARKETPLACE"
                                ? "bg-(--info-bg) text-(--info)"
                                : "bg-(--success-bg) text-(--success)"
                            }`}
                          >
                            {invoice.source === "MARKETPLACE"
                              ? "Marketplace"
                              : "E-Store"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-(--text-primary)">
                          {formatCurrency(invoice.subTotal)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-(--text-secondary)">
                          {formatCurrency(invoice.vatAmount)}
                          <span className="ml-1 text-(--text-tertiary)">
                            ({Math.round(invoice.vatRate * 100)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-(--text-primary)">
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell className="text-xs text-(--text-secondary)">
                          {formatDate(invoice.issuedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {invoice.pdfUrl && (
                              <a
                                href={invoice.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-(--text-tertiary) hover:text-(--info)"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-(--border-mid)"
                              onClick={() =>
                                handleDownload(
                                  invoice.id,
                                  invoice.invoiceNumber,
                                )
                              }
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
              <p className="text-xs text-(--text-secondary) mt-0.5">
                Full audit trail linked to orders, invoices, and payments
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
                <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                  Invoice #
                </TableHead>
                <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                  Type
                </TableHead>
                <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                  Description
                </TableHead>
                <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                  Payment Ref
                </TableHead>
                <TableHead className="text-xs font-semibold text-(--text-secondary) uppercase tracking-wide">
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountingLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 w-24 bg-(--off-white-2) animate-pulse rounded" />
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
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.entryType === "SALE"
                              ? "bg-(--success-bg) text-(--success)"
                              : entry.entryType === "REFUND"
                                ? "bg-(--danger-bg) text-(--danger)"
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
                        {entry.amount >= 0 ? "+" : ""}${entry.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-(--text-secondary) max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-(--text-tertiary)">
                        {entry.paymentReference ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-(--text-secondary)">
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
