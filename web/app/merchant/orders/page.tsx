"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Package, ShoppingCart, Clock, CheckCircle } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  placed: {
    label: "Alındı",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  payment_confirmed: {
    label: "Ödendi",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  label_generated: {
    label: "Etiket Hazır",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  courier_assigned: {
    label: "Kurye Atandı",
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  picked_up: {
    label: "Teslim Alındı",
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  in_transit: {
    label: "Yolda",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  delivered: {
    label: "Teslim Edildi",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  failed: {
    label: "Başarısız",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  cancelled: {
    label: "İptal",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export default function MerchantOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-incoming-orders", statusFilter],
    queryFn: async () => {
      const res = await api.get("/api/orders/incoming", {
        params: {
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 50,
        },
      });
      return res.data;
    },
  });

  const packMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/orders/${id}/pack`),
    onSuccess: () => {
      toast.success("Sipariş hazırlandı olarak işaretlendi");
      queryClient.invalidateQueries({ queryKey: ["merchant-incoming-orders"] });
    },
    onError: () => toast.error("İşlem başarısız"),
  });

  const orders = data?.items || data || [];

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) =>
      ["placed", "payment_confirmed"].includes(o.status),
    ).length,
    processing: orders.filter((o: any) =>
      [
        "label_generated",
        "courier_assigned",
        "picked_up",
        "in_transit",
      ].includes(o.status),
    ).length,
    delivered: orders.filter((o: any) => o.status === "delivered").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Siparişlerim</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gelen siparişleri yönetin ve hazırlayın
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Toplam",
            value: stats.total,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Bekleyen",
            value: stats.pending,
            icon: Clock,
            color: "text-orange-500",
            bg: "bg-orange-50",
          },
          {
            label: "İşlemde",
            value: stats.processing,
            icon: Package,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Teslim",
            value: stats.delivered,
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              {orders.length} sipariş
            </p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-8">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="placed">Alındı</SelectItem>
                <SelectItem value="payment_confirmed">Ödendi</SelectItem>
                <SelectItem value="label_generated">Etiket Hazır</SelectItem>
                <SelectItem value="delivered">Teslim Edildi</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Henüz sipariş yok</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Sipariş No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürünler</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="w-28">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => {
                  const statusInfo =
                    STATUS_LABELS[order.status] || STATUS_LABELS.placed;
                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="font-mono text-xs">
                          #{order.id?.slice(-8).toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.customerName || "Müşteri"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {order.items?.length ?? 0} kalem
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        ₺{order.totalAmount?.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {order.source === "MARKETPLACE"
                            ? "Marketplace"
                            : "E-Mağaza"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        {order.status === "payment_confirmed" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => packMutation.mutate(order.id)}
                            disabled={packMutation.isPending}
                          >
                            Hazırlandı ✓
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
