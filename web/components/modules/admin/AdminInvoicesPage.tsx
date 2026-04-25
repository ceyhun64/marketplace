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
  Receipt,
  TrendingUp,
  DollarSign,
  Building2,
} from "lucide-react";

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

  const { data: invoices, isLoading } = useQuery<AdminInvoice[]>({
    queryKey: ["admin-invoices", search, merchantFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (merchantFilter !== "all") params.set("merchantId", merchantFilter);
      const res = await api.get(`/invoices/admin/all?${params}`);
      return res.data;
    },
  });

  const { data: summary } = useQuery<InvoiceSummary>({
    queryKey: ["admin-invoice-summary"],
    queryFn: async () => {
      const res = await api.get("/invoices/admin/summary");
      return res.data;
    },
  });

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download invoice");
    }
  };

  const statCards = [
    {
      label: "Total Invoices",
      value: summary?.totalInvoices ?? 0,
      icon: Receipt,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Revenue",
      value: `$${((summary?.totalRevenue ?? 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total VAT Collected",
      value: `$${((summary?.totalVat ?? 0) / 100).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Pending PDF",
      value: summary?.pendingPdf ?? 0,
      icon: FileText,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Invoice Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          All platform invoices — accounting overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`${s.bg} p-2 rounded-lg`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-semibold text-gray-900">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number or customer..."
              className="pl-9 rounded-xl border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={merchantFilter} onValueChange={setMerchantFilter}>
            <SelectTrigger className="w-44 rounded-xl border-gray-200">
              <Building2 className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All Merchants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Merchants</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Invoice #
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Merchant
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Customer
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Subtotal
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                VAT
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Total
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
                Date
              </TableHead>
              <TableHead className="font-semibold text-gray-600 text-xs uppercase">
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
              : (invoices ?? []).map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-gray-700">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {inv.merchantName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {inv.customerName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      ${(inv.subTotal / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      ${(inv.vatAmount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900">
                      ${(inv.totalAmount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(inv.issuedAt).toLocaleDateString()}
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
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>

        {!isLoading && (invoices ?? []).length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
}
