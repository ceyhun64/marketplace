"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent } from "@/components/ui/card";
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
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderStatus,
} from "@/types/enums";

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
  { value: "ALL", label: "Tüm Durumlar" },
  { value: "PENDING", label: "Beklemede" },
  { value: "PAYMENT_CONFIRMED", label: "Ödeme Onaylandı" },
  { value: "LABEL_GENERATED", label: "Etiket Oluşturuldu" },
  { value: "COURIER_ASSIGNED", label: "Kurye Atandı" },
  { value: "PICKED_UP", label: "Teslim Alındı" },
  { value: "IN_TRANSIT", label: "Yolda" },
  { value: "OUT_FOR_DELIVERY", label: "Dağıtımda" },
  { value: "DELIVERED", label: "Teslim Edildi" },
  { value: "FAILED", label: "Başarısız" },
  { value: "CANCELLED", label: "İptal" },
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
      toast.success("Sipariş durumu güncellendi");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrder(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Durum güncellenemedi");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sipariş Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Platform genelindeki tüm siparişler
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Sipariş",
            value: stats.total,
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Bekleyen",
            value: stats.pending,
            icon: Clock,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
          {
            label: "Taşımada",
            value: stats.inTransit,
            icon: Truck,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Teslim Edildi",
            value: stats.delivered,
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">
                  {isLoading ? "—" : s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sipariş ID, müşteri veya mağaza ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Durum filtrele" />
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Sipariş ID
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Müşteri
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Mağaza
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Kaynak
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Tutar
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Durum
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">
                Tarih
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
                  className="text-center text-gray-500 py-12"
                >
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  Sipariş bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-xs text-gray-600">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.customerName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {order.merchantStoreName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {order.source === "MARKETPLACE"
                        ? "Pazaryeri"
                        : "E-Mağaza"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
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
            ← Önceki
          </Button>
          <span className="px-3 py-1 text-sm text-gray-600">
            Sayfa {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki →
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
              Sipariş #{selectedOrder?.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Müşteri</p>
                  <p className="font-medium">
                    {selectedOrder.customerName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Mağaza</p>
                  <p className="font-medium">
                    {selectedOrder.merchantStoreName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tutar</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Kargo</p>
                  <p>
                    {selectedOrder.shippingRate === "EXPRESS"
                      ? "⚡ Ekspres"
                      : "📦 Standart"}
                  </p>
                </div>
                {selectedOrder.shipment?.trackingNumber && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-0.5">Takip No</p>
                    <p className="font-mono text-sm">
                      {selectedOrder.shipment.trackingNumber}
                    </p>
                  </div>
                )}
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Ürünler</p>
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
                <p className="text-xs text-gray-500 mb-2">Durum Güncelle</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[selectedOrder.status] ?? ""}`}
                  >
                    {ORDER_STATUS_LABELS[selectedOrder.status] ??
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
                        {
                          ORDER_STATUS_LABELS[
                            NEXT_STATUSES[selectedOrder.status]!
                          ]
                        }
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
                      İptal Et
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
