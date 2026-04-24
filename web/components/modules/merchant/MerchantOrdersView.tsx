"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import MerchantOrdersTable from "./MerchantOrdersTable";

export default function MerchantOrdersView() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-incoming-orders", statusFilter],
    queryFn: async () => {
      const res = await api.get("/api/orders/merchant/incoming", {
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and fulfill incoming orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Processing",
            value: stats.processing,
            icon: Package,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
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
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">
            All Orders
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({orders.length} orders)
            </span>
          </p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-8 border-gray-200 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="payment_confirmed">
                Payment Confirmed
              </SelectItem>
              <SelectItem value="label_generated">Label Generated</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <MerchantOrdersTable orders={orders} loading={isLoading} />
      </div>
    </div>
  );
}
