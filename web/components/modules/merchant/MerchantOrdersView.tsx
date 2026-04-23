"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Package, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import MerchantOrdersTable from "./MerchantOrdersTable";

export default function MerchantOrdersView() {
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

          <MerchantOrdersTable orders={orders} loading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
