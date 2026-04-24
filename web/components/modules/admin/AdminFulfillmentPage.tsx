"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
    label: "Order Placed",
    color: "bg-slate-100 text-slate-700",
    icon: <CircleDot className="w-3 h-3" />,
  },
  PAYMENT_CONFIRMED: {
    label: "Payment Confirmed",
    color: "bg-blue-100 text-blue-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  LABEL_GENERATED: {
    label: "Label Ready",
    color: "bg-violet-100 text-violet-700",
    icon: <Package className="w-3 h-3" />,
  },
  COURIER_ASSIGNED: {
    label: "Courier Assigned",
    color: "bg-amber-100 text-amber-700",
    icon: <UserCheck className="w-3 h-3" />,
  },
  PICKED_UP: {
    label: "Picked Up",
    color: "bg-orange-100 text-orange-700",
    icon: <Truck className="w-3 h-3" />,
  },
  IN_TRANSIT: {
    label: "In Transit",
    color: "bg-cyan-100 text-cyan-700",
    icon: <Truck className="w-3 h-3" />,
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    color: "bg-indigo-100 text-indigo-700",
    icon: <MapPin className="w-3 h-3" />,
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  FAILED: {
    label: "Failed",
    color: "bg-rose-100 text-rose-700",
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
      toast.success("Courier assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-shipments"] });
      setAssignDialog({ open: false });
      setSelectedCourier("");
    },
    onError: () => toast.error("Failed to assign courier"),
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fulfillment</h1>
          <p className="text-sm text-gray-500 mt-1">
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
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Active Shipments",
            value: stats.active,
            icon: Truck,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Needs Courier",
            value: stats.needsCourier,
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
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

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by tracking no, customer or order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52 border-gray-200">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Shipments
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} records)
            </span>
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-100">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tracking No.
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Customer
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Merchant
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Shipping
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Courier
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                ETA
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
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
                  className="text-center py-16 text-gray-400"
                >
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No shipments found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((shipment) => (
                <TableRow
                  key={shipment.id}
                  className="hover:bg-gray-50 border-b border-gray-50"
                >
                  <TableCell className="font-mono text-xs text-blue-600">
                    {shipment.trackingNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p className="font-medium text-gray-900">
                      {shipment.customerName}
                    </p>
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
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${shipment.shippingRate === "EXPRESS" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {shipment.shippingRate === "EXPRESS"
                        ? "⚡ Express"
                        : "Regular"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {shipment.courierName ? (
                      <span className="text-emerald-700 font-medium">
                        {shipment.courierName}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {shipment.estimatedDelivery
                      ? new Date(shipment.estimatedDelivery).toLocaleDateString(
                          "en-US",
                        )
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
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <span className="text-gray-500">Tracking No.:</span>{" "}
                  <span className="font-mono font-medium text-blue-600">
                    {assignDialog.shipment.trackingNumber}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Customer:</span>{" "}
                  {assignDialog.shipment.customerName}
                </p>
                <p>
                  <span className="text-gray-500">Address:</span>{" "}
                  {assignDialog.shipment.customerAddress}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedCourier === courier.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
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
                            <p className="text-sm font-medium text-gray-900">
                              {courier.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {courier.phone} ·{" "}
                              <span className="text-amber-500">
                                {courier.activeShipments} active packages
                              </span>
                            </p>
                          </div>
                          {courier.activeShipments === 0 && (
                            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                              Available
                            </span>
                          )}
                        </label>
                      ))}
                    {couriers.filter((c) => c.isActive).length === 0 && (
                      <p className="text-center text-sm text-gray-400 py-4">
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
