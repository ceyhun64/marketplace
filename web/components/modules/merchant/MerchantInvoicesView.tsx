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
} from "lucide-react";

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

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-invoices"],
    queryFn: async () => {
      const res = await api.get("/api/invoices");
      return res.data;
    },
  });

  const invoices: Invoice[] = data?.data || [];

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await api.get(`/api/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
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

      {/* Stats */}
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
    </div>
  );
}
