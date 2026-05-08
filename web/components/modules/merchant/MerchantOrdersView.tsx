"use client";

import { useState } from "react";
import { useMerchantIncomingOrders } from "@/queries/useOrders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ShoppingCart, Clock, CheckCircle } from "lucide-react";
import MerchantOrdersTable from "./MerchantOrdersTable";
import type { OrderStatus } from "@/types/enums";

export default function MerchantOrdersView() {
  const [statusFilter, setStatusFilter] = useState("all");

  const statusParam = statusFilter === "all" ? undefined : (statusFilter as OrderStatus);

  const { data: filteredOrders = [], isLoading } = useMerchantIncomingOrders(statusParam);
  const { data: allOrders = [] } = useMerchantIncomingOrders(); // for stats

  const orders = filteredOrders;
  const paginationTotal = orders.length;

  const stats = {
    total: statusFilter === "all" ? paginationTotal : allOrders.length,
    pending: allOrders.filter((o: any) =>
      ["PENDING", "PAYMENT_CONFIRMED"].includes(o.status),
    ).length,
    processing: allOrders.filter((o: any) =>
      [
        "LABEL_GENERATED",
        "COURIER_ASSIGNED",
        "PICKED_UP",
        "IN_TRANSIT",
      ].includes(o.status),
    ).length,
    delivered: allOrders.filter((o: any) => o.status === "DELIVERED").length,
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
              ({paginationTotal} orders)
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
