"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Truck,
  Package,
  MapPin,
  Clock,
  Search,
  UserCheck,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CircleDot,
} from "lucide-react";

type ShipmentStatus =
  | "PLACED"
  | "PAYMENT_CONFIRMED"
  | "LABEL_GENERATED"
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

interface Shipment {
  id: string;
  trackingNumber: string;
  status: ShipmentStatus;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerAddress: string;
  merchantName: string;
  courierId?: string;
  courierName?: string;
  estimatedDelivery?: string;
  shippingRate: "EXPRESS" | "REGULAR";
  updatedAt: string;
}

interface Courier {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  activeShipments: number;
}

const STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  PLACED: {
    label: "Sipariş Alındı",
    color: "bg-slate-100 text-slate-700",
    icon: <CircleDot className="w-3 h-3" />,
  },
  PAYMENT_CONFIRMED: {
    label: "Ödeme Onaylandı",
    color: "bg-blue-100 text-blue-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  LABEL_GENERATED: {
    label: "Etiket Hazır",
    color: "bg-purple-100 text-purple-700",
    icon: <Package className="w-3 h-3" />,
  },
  COURIER_ASSIGNED: {
    label: "Kurye Atandı",
    color: "bg-yellow-100 text-yellow-700",
    icon: <UserCheck className="w-3 h-3" />,
  },
  PICKED_UP: {
    label: "Teslim Alındı",
    color: "bg-orange-100 text-orange-700",
    icon: <Truck className="w-3 h-3" />,
  },
  IN_TRANSIT: {
    label: "Yolda",
    color: "bg-cyan-100 text-cyan-700",
    icon: <Truck className="w-3 h-3" />,
  },
  OUT_FOR_DELIVERY: {
    label: "Dağıtımda",
    color: "bg-indigo-100 text-indigo-700",
    icon: <MapPin className="w-3 h-3" />,
  },
  DELIVERED: {
    label: "Teslim Edildi",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  FAILED: {
    label: "Başarısız",
    color: "bg-red-100 text-red-700",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function AdminFulfillmentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    shipment?: Shipment;
  }>({ open: false });
  const [selectedCourier, setSelectedCourier] = useState("");

  const { data: shipmentsData, isLoading: loadingShipments } = useQuery({
    queryKey: ["admin-shipments", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await api.get(`/api/fulfillment${params}`);
      return res.data;
    },
  });

  const { data: couriersData, isLoading: loadingCouriers } = useQuery({
    queryKey: ["admin-couriers-active"],
    queryFn: async () => {
      const res = await api.get("/api/couriers");
      return res.data;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({
      shipmentId,
      courierId,
    }: {
      shipmentId: string;
      courierId: string;
    }) => {
      const res = await api.post("/api/fulfillment/assign", {
        shipmentId,
        courierId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Kurye başarıyla atandı");
      queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
      setAssignDialog({ open: false });
      setSelectedCourier("");
    },
    onError: () => {
      toast.error("Kurye atama başarısız");
    },
  });

  const shipments: Shipment[] = shipmentsData?.data || [];
  const couriers: Courier[] = couriersData?.data || [];

  const filtered = shipments.filter(
    (s) =>
      s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.orderNumber?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: shipments.length,
    active: shipments.filter(
      (s) => !["DELIVERED", "FAILED", "PLACED"].includes(s.status),
    ).length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
    needsCourier: shipments.filter(
      (s) => s.status === "LABEL_GENERATED" && !s.courierId,
    ).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Fulfillment Paneli
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kurye atama ve sevkiyat izleme
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-shipments"] })
          }
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Sevkiyat",
            value: stats.total,
            icon: Package,
            color: "text-slate-600",
            bg: "bg-slate-50",
          },
          {
            label: "Aktif Sevkiyat",
            value: stats.active,
            icon: Truck,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Teslim Edildi",
            value: stats.delivered,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Kurye Bekliyor",
            value: stats.needsCourier,
            icon: AlertCircle,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Takip no, müşteri adı veya sipariş ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Shipments Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Sevkiyatlar
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} kayıt)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Takip No</TableHead>
                  <TableHead className="text-xs">Müşteri</TableHead>
                  <TableHead className="text-xs">Satıcı</TableHead>
                  <TableHead className="text-xs">Durum</TableHead>
                  <TableHead className="text-xs">Kargo Tipi</TableHead>
                  <TableHead className="text-xs">Kurye</TableHead>
                  <TableHead className="text-xs">ETA</TableHead>
                  <TableHead className="text-xs text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingShipments ? (
                  Array.from({ length: 5 }).map((_, i) => (
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
                      className="text-center py-12 text-gray-400"
                    >
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sevkiyat bulunamadı</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((shipment) => (
                    <TableRow key={shipment.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-blue-600">
                        {shipment.trackingNumber}
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">{shipment.customerName}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[140px]">
                          {shipment.customerAddress}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {shipment.merchantName}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={shipment.status} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            shipment.shippingRate === "EXPRESS"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {shipment.shippingRate === "EXPRESS"
                            ? "⚡ Express"
                            : "Regular"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {shipment.courierName ? (
                          <span className="text-green-700 font-medium">
                            {shipment.courierName}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">
                            Atanmadı
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {shipment.estimatedDelivery
                          ? new Date(
                              shipment.estimatedDelivery,
                            ).toLocaleDateString("tr-TR")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(shipment.status === "LABEL_GENERATED" ||
                            shipment.status === "PAYMENT_CONFIRMED") &&
                            !shipment.courierId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                onClick={() =>
                                  setAssignDialog({
                                    open: true,
                                    shipment,
                                  })
                                }
                              >
                                <UserCheck className="w-3 h-3 mr-1" />
                                Ata
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() =>
                              window.open(
                                `/orders/${shipment.orderId}/tracking`,
                                "_blank",
                              )
                            }
                          >
                            <Eye className="w-3 h-3" />
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

      {/* Assign Courier Dialog */}
      <Dialog
        open={assignDialog.open}
        onOpenChange={(open) => setAssignDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kurye Ata</DialogTitle>
          </DialogHeader>
          {assignDialog.shipment && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <span className="text-gray-500">Takip No:</span>{" "}
                  <span className="font-mono font-medium text-blue-600">
                    {assignDialog.shipment.trackingNumber}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Müşteri:</span>{" "}
                  {assignDialog.shipment.customerName}
                </p>
                <p>
                  <span className="text-gray-500">Adres:</span>{" "}
                  {assignDialog.shipment.customerAddress}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Kurye Seç
                </label>
                {loadingCouriers ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {couriers
                      .filter((c) => c.isActive)
                      .map((courier) => (
                        <label
                          key={courier.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedCourier === courier.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="courier"
                            value={courier.id}
                            checked={selectedCourier === courier.id}
                            onChange={() => setSelectedCourier(courier.id)}
                            className="accent-blue-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {courier.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {courier.phone} ·{" "}
                              <span className="text-orange-500">
                                {courier.activeShipments} aktif paket
                              </span>
                            </p>
                          </div>
                          {courier.activeShipments === 0 && (
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                              Müsait
                            </span>
                          )}
                        </label>
                      ))}
                    {couriers.filter((c) => c.isActive).length === 0 && (
                      <p className="text-center text-sm text-gray-400 py-4">
                        Aktif kurye bulunamadı
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setAssignDialog((prev) => ({ ...prev, open: false }))
              }
            >
              İptal
            </Button>
            <Button
              disabled={!selectedCourier || assignMutation.isPending}
              onClick={() => {
                if (assignDialog.shipment && selectedCourier) {
                  assignMutation.mutate({
                    shipmentId: assignDialog.shipment.id,
                    courierId: selectedCourier,
                  });
                }
              }}
            >
              {assignMutation.isPending ? "Atanıyor..." : "Kurye Ata"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
