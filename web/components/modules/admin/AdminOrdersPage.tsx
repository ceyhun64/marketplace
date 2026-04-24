"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Eye,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_STATUS_COLORS, type OrderStatus } from "@/types/enums";

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  merchantStoreName?: string;
  source: "MARKETPLACE" | "ESTORE";
  status: OrderStatus;
  totalAmount: number;
  shippingRate: "EXPRESS" | "REGULAR";
  createdAt: string;
  items?: OrderItem[];
  shipment?: { trackingNumber: string; courierName?: string };
}

interface PaginatedOrders {
  items: Order[];
  totalCount: number;
  page: number;
  limit: number;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAYMENT_CONFIRMED", label: "Payment Confirmed" },
  { value: "LABEL_GENERATED", label: "Label Generated" },
  { value: "COURIER_ASSIGNED", label: "Courier Assigned" },
  { value: "PICKED_UP", label: "Picked Up" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "PAYMENT_CONFIRMED",
  PAYMENT_CONFIRMED: "LABEL_GENERATED",
  LABEL_GENERATED: "COURIER_ASSIGNED",
  COURIER_ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const TERMINAL_STATUSES: OrderStatus[] = ["DELIVERED", "FAILED", "CANCELLED"];

const STATUS_LABEL_EN: Partial<Record<OrderStatus, string>> = {
  PENDING: "Pending",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  LABEL_GENERATED: "Label Generated",
  COURIER_ASSIGNED: "Courier Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter && statusFilter !== "ALL")
        params.set("status", statusFilter);
      const res = await api.get<PaginatedOrders>(
        `/api/orders/admin/all?${params}`,
      );
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Order status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    },
  });

  const orders: Order[] = data?.items ?? [];
  const totalPages = data ? Math.ceil(data.totalCount / 20) : 1;
  const filtered = search
    ? orders.filter(
        (o) =>
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          o.merchantStoreName?.toLowerCase().includes(search.toLowerCase()),
      )
    : orders;

  const stats = {
    total: data?.totalCount ?? 0,
    pending: orders.filter((o) => o.status === "PENDING").length,
    inTransit: orders.filter((o) =>
      ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status),
    ).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            All orders across the platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Orders",
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
            label: "In Transit",
            value: stats.inTransit,
            icon: Truck,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
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
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? "—" : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order ID, customer or store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-200"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52 border-gray-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-100">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Order ID
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Customer
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Store
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Source
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Amount
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Date
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-400 py-16"
                >
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No orders found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-gray-50 border-b border-gray-50"
                >
                  <TableCell className="font-mono text-xs text-gray-500">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {order.customerName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {order.merchantStoreName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-600">
                      {order.source === "MARKETPLACE"
                        ? "Marketplace"
                        : "E-Store"}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-sm text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {STATUS_LABEL_EN[order.status] ?? order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </Button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}

      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                  <p className="font-medium">
                    {selectedOrder.customerName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Store</p>
                  <p className="font-medium">
                    {selectedOrder.merchantStoreName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Shipping</p>
                  <p>
                    {selectedOrder.shippingRate === "EXPRESS"
                      ? "⚡ Express"
                      : "📦 Standard"}
                  </p>
                </div>
                {selectedOrder.shipment?.trackingNumber && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Tracking No.</p>
                    <p className="font-mono text-sm">
                      {selectedOrder.shipment.trackingNumber}
                    </p>
                  </div>
                )}
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Items</p>
                  <div className="space-y-1">
                    {selectedOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                      >
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-2">Update Status</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[selectedOrder.status] ?? ""}`}
                  >
                    {STATUS_LABEL_EN[selectedOrder.status] ??
                      selectedOrder.status}
                  </span>
                  {NEXT_STATUSES[selectedOrder.status] && (
                    <>
                      <span className="text-gray-400">→</span>
                      <Button
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: selectedOrder.id,
                            status: NEXT_STATUSES[selectedOrder.status]!,
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        {STATUS_LABEL_EN[NEXT_STATUSES[selectedOrder.status]!]}
                      </Button>
                    </>
                  )}
                  {!TERMINAL_STATUSES.includes(selectedOrder.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: selectedOrder.id,
                          status: "CANCELLED",
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
