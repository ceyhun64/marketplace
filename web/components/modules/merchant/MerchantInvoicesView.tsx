"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
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
    .replace("TRY", "₺");
}

export default function MerchantInvoicesView() {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"invoices" | "accounting">("invoices");
  const [accountingEntryType, setAccountingEntryType] = useState("all");

  const { data: accountingData, isLoading: accountingLoading } =
    useMerchantAccountingEntries({
      limit: 100,
      entryType: accountingEntryType !== "all" ? accountingEntryType : undefined,
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
      const res = await api.get(`/api/merchants/invoices/${invoiceId}/download`);
      const pdfUrl = res.data?.pdfUrl;

      if (pdfUrl) {
        // Cloudinary CDN URL'ini yeni sekmede aç
        window.open(pdfUrl, "_blank");
      } else {
        // Fallback: blob olarak indir
        const blobRes = await api.get(
          `/api/merchants/invoices/${invoiceId}/download`,
          { responseType: "blob" }
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
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and download all sales invoices
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "invoices"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("accounting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "accounting"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
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
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Gross Revenue",
            value: formatCurrency(totalRevenue),
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Net Revenue",
            value: formatCurrency(netRevenue),
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Total VAT",
            value: formatCurrency(totalVat),
            icon: Receipt,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by invoice no, customer or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-200"
          />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-44 border-gray-200">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
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
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Invoice List
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} invoices)
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-100">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Invoice No.
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Order
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Channel
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                  Net
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                  VAT
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                  Total
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
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
                    className="text-center py-16 text-gray-400"
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
                    className="hover:bg-gray-50 border-b border-gray-50"
                  >
                    <TableCell className="font-mono text-xs text-blue-600 font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-mono">
                      {invoice.orderNumber}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {invoice.customerName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          invoice.source === "MARKETPLACE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {invoice.source === "MARKETPLACE"
                          ? "Marketplace"
                          : "E-Store"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.subTotal)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-gray-500">
                      {formatCurrency(invoice.vatAmount)}
                      <span className="ml-1 text-gray-400">
                        ({Math.round(invoice.vatRate * 100)}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-bold text-gray-900">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(invoice.issuedAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
                              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-gray-200"
                          onClick={() =>
                            handleDownload(invoice.id, invoice.invoiceNumber)
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
      </> )} {/* end invoices tab */}

      {/* Accounting Ledger Tab */}
      {activeTab === "accounting" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Accounting Ledger</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Sipariş/fatura/ödeme bağlantılı tam muhasebe izi
              </p>
            </div>
            <Select value={accountingEntryType} onValueChange={setAccountingEntryType}>
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
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice #</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Ref</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountingLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 w-24 bg-gray-100 animate-pulse rounded" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : accountingEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-gray-700">
                        {entry.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.entryType === "SALE"
                              ? "bg-green-50 text-green-700"
                              : entry.entryType === "REFUND"
                              ? "bg-red-50 text-red-700"
                              : "bg-orange-50 text-orange-700"
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
                          entry.amount >= 0 ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {entry.amount >= 0 ? "+" : ""}₺{entry.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-400">
                        {entry.paymentReference ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!accountingLoading && accountingEntries.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No accounting entries found</p>
            </div>
          )}
        </div>
      )} {/* end accounting tab */}
    </div>
  );
}
