"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

export default function MerchantInvoicesView() {
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-invoices"],
    queryFn: async () => {
      const res = await api.get("/merchant/invoices");
      return res.data;
    },
  });

  const invoices: Invoice[] = data?.data || [];

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await api.get(`/merchant/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `fatura-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Fatura indiriliyor...");
    } catch {
      toast.error("Fatura indirilemedi");
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faturalarım</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tüm satış faturalarını görüntüle ve PDF olarak indir
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Fatura",
            value: filtered.length,
            icon: Receipt,
            color: "text-slate-600",
            bg: "bg-slate-50",
          },
          {
            label: "Brüt Ciro",
            value: formatCurrency(totalRevenue),
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Net Gelir",
            value: formatCurrency(netRevenue),
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Toplam KDV",
            value: formatCurrency(totalVat),
            icon: Receipt,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{s.label}</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Fatura no, müşteri veya sipariş ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Ay filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Aylar</SelectItem>
            {months.map((m) => {
              const [year, month] = m.split("-");
              const date = new Date(parseInt(year), parseInt(month) - 1);
              return (
                <SelectItem key={m} value={m}>
                  {date.toLocaleDateString("tr-TR", {
                    month: "long",
                    year: "numeric",
                  })}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Fatura Listesi
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} fatura)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Fatura No</TableHead>
                  <TableHead className="text-xs">Sipariş</TableHead>
                  <TableHead className="text-xs">Müşteri</TableHead>
                  <TableHead className="text-xs">Kanal</TableHead>
                  <TableHead className="text-xs text-right">Net Tutar</TableHead>
                  <TableHead className="text-xs text-right">KDV</TableHead>
                  <TableHead className="text-xs text-right">Toplam</TableHead>
                  <TableHead className="text-xs">Tarih</TableHead>
                  <TableHead className="text-xs text-right">PDF</TableHead>
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
                      <p className="text-sm font-medium">Fatura bulunamadı</p>
                      <p className="text-xs mt-1">
                        Satış gerçekleştiğinde faturalar otomatik oluşturulur
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-gray-50/50">
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
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {invoice.source === "MARKETPLACE"
                            ? "Marketplace"
                            : "E-Mağaza"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.subTotal)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {formatCurrency(invoice.vatAmount)}
                        <span className="ml-1 text-gray-400">
                          (%{Math.round(invoice.vatRate * 100)})
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(invoice.issuedAt).toLocaleDateString("tr-TR", {
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
                            className="h-7 text-xs"
                            onClick={() =>
                              handleDownload(invoice.id, invoice.invoiceNumber)
                            }
                          >
                            <Download className="w-3 h-3 mr-1" />
                            İndir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
