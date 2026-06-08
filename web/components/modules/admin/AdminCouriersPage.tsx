"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Truck, UserCheck, Package, Plus } from "lucide-react";

// -- Types ---------------------------------------------------------------------

interface Courier {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  activeShipmentCount: number;
  totalDelivered: number;
  createdAt: string;
}

// -- Main Component ------------------------------------------------------------

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toggleConfirm, setToggleConfirm] = useState<{ courier: Courier } | null>(null);
  const [toggling, setToggling] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Courier[]>("/api/couriers");
      setCouriers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      await api.post("/api/couriers", {
        fullName: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phone,
      });
      setShowForm(false);
      setForm({ name: "", email: "", password: "", phone: "" });
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create courier.";
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function confirmToggleActive() {
    if (!toggleConfirm) return;
    const { courier } = toggleConfirm;
    setToggling(true);
    try {
      await api.patch(`/api/couriers/${courier.id}/toggle-active`);
      setCouriers((prev) =>
        prev.map((c) => (c.id === courier.id ? { ...c, isActive: !courier.isActive } : c)),
      );
      toast.success(courier.isActive ? "Courier deactivated" : "Courier activated");
      setToggleConfirm(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update courier status");
    } finally {
      setToggling(false);
    }
  }

  const activeCouriers = couriers.filter((c) => c.isActive);

  const statCards = [
    {
      label: "Total Couriers",
      value: couriers.length,
      icon: Truck,
      color: "text-(--text-tertiary)",
      bg: "bg-(--off-white-2)",
    },
    {
      label: "Active",
      value: activeCouriers.length,
      icon: UserCheck,
      color: "text-(--success)",
      bg: "bg-(--success-bg)",
    },
    {
      label: "Active Deliveries",
      value: couriers.reduce((s, c) => s + (c.activeShipmentCount ?? 0), 0),
      icon: Package,
      color: "text-(--info)",
      bg: "bg-(--info-bg)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">Couriers</h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            {activeCouriers.length} active / {couriers.length} total couriers
          </p>
        </div>
        <Button
          onClick={() => { setShowForm(true); setFormError(""); }}
          className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
        >
          <Plus className="w-4 h-4" /> New Courier
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
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
            {loading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <p className="text-2xl font-bold text-(--text-primary)">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) setFormError(""); }}>
        <DialogContent className="sm:max-w-105">
          <DialogHeader>
            <DialogTitle>New Courier Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-(--danger)">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-(--danger)">*</span></Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="courier@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+90 5XX XXX XX XX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password <span className="text-(--danger)">*</span></Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="At least 8 characters"
              />
            </div>
            {formError && (
              <p className="text-sm text-(--danger) bg-(--danger-bg) rounded-lg px-3 py-2">
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={formLoading || !form.name || !form.email || !form.password}
            >
              {formLoading ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle Active Confirm Dialog */}
      <Dialog open={!!toggleConfirm} onOpenChange={(o) => !o && setToggleConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {toggleConfirm?.courier.isActive ? "Deactivate Courier" : "Activate Courier"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-(--text-secondary) py-2">
            {toggleConfirm?.courier.isActive
              ? `Are you sure you want to deactivate ${toggleConfirm.courier.name}? They won't be able to accept new shipments.`
              : `Activate ${toggleConfirm?.courier.name}? They will be available for new shipments.`}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToggleConfirm(null)}>
              Cancel
            </Button>
            <Button
              className={toggleConfirm?.courier.isActive ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-(--success) hover:opacity-90 text-white"}
              onClick={confirmToggleActive}
              disabled={toggling}
            >
              {toggling ? "Updating…" : toggleConfirm?.courier.isActive ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Couriers Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-(--bg-sunken) border-b border-(--border-light) hover:bg-(--bg-sunken)">
              {["Courier", "Active Deliveries", "Completed", "Status", "Joined", "Action"].map(
                (h) => (
                  <TableHead
                    key={h}
                    className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide"
                  >
                    {h}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-(--border-subtle)">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : couriers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-(--text-tertiary) opacity-20" />
                  <p className="text-sm text-(--text-tertiary) font-medium">
                    No couriers yet
                  </p>
                  <p className="text-xs text-(--text-tertiary) mt-1">
                    Click &ldquo;New Courier&rdquo; to add your first courier.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              couriers.map((courier) => (
                <TableRow
                  key={courier.id}
                  className="border-b border-(--border-subtle) hover:bg-(--bg-sunken) transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-(--charcoal) flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {courier.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-(--text-primary)">
                          {courier.name}
                        </p>
                        <p className="text-xs text-(--text-tertiary)">{courier.email}</p>
                        {courier.phone && (
                          <p className="text-xs text-(--text-tertiary)">{courier.phone}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-(--text-primary)">
                    {courier.activeShipmentCount ?? 0}
                  </TableCell>
                  <TableCell className="text-(--text-secondary)">
                    {courier.totalDelivered ?? 0}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        courier.isActive
                          ? "bg-(--success-bg) text-(--success)"
                          : "bg-(--off-white-2) text-(--text-tertiary)"
                      }`}
                    >
                      {courier.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-(--text-tertiary)">
                    {courier.createdAt
                      ? formatDate(courier.createdAt)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setToggleConfirm({ courier })}
                      className={`text-xs font-medium hover:underline transition-opacity ${
                        courier.isActive ? "text-(--warning)" : "text-(--info)"
                      }`}
                    >
                      {courier.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
