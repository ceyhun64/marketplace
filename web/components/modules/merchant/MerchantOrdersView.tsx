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
        <h1 className="text-2xl font-semibold text-(--text-primary)">Orders</h1>
        <p className="text-sm text-(--text-secondary) mt-1">
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
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "text-(--warning)",
            bg: "bg-(--warning-bg)",
          },
          {
            label: "Processing",
            value: stats.processing,
            icon: Package,
            color: "text-(--charcoal-mid)",
            bg: "bg-(--off-white-2)]",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle,
            color: "text-(--success)",
            bg: "bg-(--success-bg)",
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
            <p className="text-2xl font-bold text-(--text-primary)">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light)">
        <div className="px-5 py-4 border-b border-(--border-light) flex items-center justify-between">
          <p className="text-sm font-semibold text-(--text-primary)">
            All Orders
            <span className="ml-2 text-sm font-normal text-(--text-tertiary)">
              ({paginationTotal} orders)
            </span>
          </p>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 h-8 border-(--border-mid) text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAYMENT_CONFIRMED">Payment Confirmed</SelectItem>
              <SelectItem value="LABEL_GENERATED">Label Generated</SelectItem>
              <SelectItem value="COURIER_ASSIGNED">Courier Assigned</SelectItem>
              <SelectItem value="PICKED_UP">Picked Up</SelectItem>
              <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
              <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <MerchantOrdersTable orders={orders} loading={isLoading} />
      </div>
    </div>
  );
}
