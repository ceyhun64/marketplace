"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import { Package, Search, UserCheck, Eye, RefreshCw } from "lucide-react";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_ORDER,
  type ShipmentStatus,
} from "@/types/enums";

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
  activeShipmentCount: number; // backend alanı — activeShipments değil
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
      const raw = res.data;
      // Normalize status values from PascalCase to SCREAMING_SNAKE_CASE
      const normalizeStatus = (s: string) =>
        s.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
      const items = (raw?.data ?? []).map((s: any) => ({
        ...s,
        status: s.status ? normalizeStatus(s.status) : s.status,
      }));
      return { ...raw, data: items };
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
      toast.success("Courier assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
      setAssignDialog({ open: false });
      setSelectedCourier("");
    },
    onError: () => toast.error("Failed to assign courier"),
  });

  // /api/fulfillment → { data: Shipment[], pagination: {...} } — interceptor açmıyor (success alanı yok)
  const shipments: Shipment[] = shipmentsData?.data || [];
  // /api/couriers → ApiResponse<Courier[]> — interceptor tarafından açılır, doğrudan dizi gelir
  const couriers: Courier[] = Array.isArray(couriersData)
    ? couriersData
    : couriersData?.data || [];

  const filtered = shipments.filter(
    (s) =>
      s.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      s.orderNumber?.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = {
    total: shipments.length,
    active: shipments.filter(
      (s) => !["DELIVERED", "FAILED", "PENDING"].includes(s.status),
    ).length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
    needsCourier: shipments.filter(
      (s) => s.status === "LABEL_GENERATED" && !s.courierId,
    ).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Fulfillment</h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Courier assignment and shipment tracking
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-shipments"] })
          }
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Shipments",
            value: stats.total,
            icon: Package,
            color: "text-(--text-secondary)",
            bg: "bg-(--off-white-2)",
          },
          {
            label: "Active Shipments",
            value: stats.active,
            icon: Truck,
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle2,
            color: "text-(--success)",
            bg: "bg-(--success-bg)",
          },
          {
            label: "Needs Courier",
            value: stats.needsCourier,
            icon: AlertCircle,
            color: "text-(--warning)",
            bg: "bg-(--warning-bg)",
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

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
          <Input
            placeholder="Search by tracking no, customer or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-(--border-mid)"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52 border-(--border-mid)">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {SHIPMENT_STATUS_ORDER.concat("FAILED").map((key) => (
              <SelectItem key={key} value={key}>
                {SHIPMENT_STATUS_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Shipments Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden overflow-x-auto">
        <div className="px-5 py-4 border-b border-(--border-light)">
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Shipments
            <span className="ml-2 text-sm font-normal text-(--text-tertiary)">
              ({filtered.length} records)
            </span>
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-(--bg-sunken) border-b border-(--border-light)">
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Tracking No.
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Customer
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Merchant
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Shipping
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Courier
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                ETA
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide text-right">
                Actions
              </TableHead>
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
                  className="text-center py-16 text-(--text-tertiary)"
                >
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No shipments found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((shipment) => (
                <TableRow
                  key={shipment.id}
                  className="hover:bg-(--bg-sunken) border-b border-(--border-subtle)"
                >
                  <TableCell className="font-mono text-xs text-(--info)">
                    {shipment.trackingNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p className="font-medium text-(--text-primary)">
                      {shipment.customerName}
                    </p>
                    <p className="text-xs text-(--text-tertiary) truncate max-w-35">
                      {shipment.customerAddress}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-(--text-secondary)">
                    {shipment.merchantName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge type="shipment" status={shipment.status} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${shipment.shippingRate === "EXPRESS" ? "bg-(--warning-bg) text-(--warning)" : "bg-(--off-white-2) text-(--text-secondary)"}`}
                    >
                      {shipment.shippingRate === "EXPRESS"
                        ? "⚡ Express"
                        : "Regular"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {shipment.courierName ? (
                      <span className="text-(--success) font-medium">
                        {shipment.courierName}
                      </span>
                    ) : (
                      <span className="text-(--text-tertiary) italic text-xs">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-(--text-tertiary)">
                    {shipment.estimatedDelivery
                      ? formatDate(shipment.estimatedDelivery)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(shipment.status === "LABEL_GENERATED" ||
                        shipment.status === "PENDING") &&
                        !shipment.courierId && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-blue-200 text-(--info) hover:bg-(--info-bg)"
                            onClick={() =>
                              setAssignDialog({ open: true, shipment })
                            }
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
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

      {/* Assign Courier Dialog */}
      <Dialog
        open={assignDialog.open}
        onOpenChange={(open) => setAssignDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Courier</DialogTitle>
          </DialogHeader>
          {assignDialog.shipment && (
            <div className="space-y-4">
              <div className="bg-(--bg-sunken) rounded-lg p-3 text-sm space-y-1">
                <p>
                  <span className="text-(--text-tertiary)">Tracking No.:</span>{" "}
                  <span className="font-mono font-medium text-(--info)">
                    {assignDialog.shipment.trackingNumber}
                  </span>
                </p>
                <p>
                  <span className="text-(--text-tertiary)">Customer:</span>{" "}
                  {assignDialog.shipment.customerName}
                </p>
                <p>
                  <span className="text-(--text-tertiary)">Address:</span>{" "}
                  {assignDialog.shipment.customerAddress}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-(--text-secondary) mb-2 block">
                  Select Courier
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
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedCourier === courier.id ? "border-blue-500 bg-(--info-bg)" : "border-(--border-mid) hover:bg-(--bg-sunken)"}`}
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
                            <p className="text-sm font-medium text-(--text-primary)">
                              {courier.name}
                            </p>
                            <p className="text-xs text-(--text-tertiary)">
                              {courier.phone} ·{" "}
                              <span className="text-(--warning)">
                                {courier.activeShipmentCount} active packages
                              </span>
                            </p>
                          </div>
                          {courier.activeShipmentCount === 0 && (
                            <span className="text-xs text-(--success) font-medium bg-(--success-bg) px-2 py-0.5 rounded-full">
                              Available
                            </span>
                          )}
                        </label>
                      ))}
                    {couriers.filter((c) => c.isActive).length === 0 && (
                      <p className="text-center text-sm text-(--text-tertiary) py-4">
                        No active couriers available
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
              Cancel
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
              {assignMutation.isPending ? "Assigning..." : "Assign Courier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
