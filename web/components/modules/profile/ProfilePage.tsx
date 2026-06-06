"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useMe, useUpdateMe } from "@/queries/useMe";
import { useMyOrders } from "@/queries/useOrders";
import { useWishlist, useRemoveFromWishlist } from "@/queries/useWishlist";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/enums";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Lock,
  MapPin,
  ShoppingBag,
  Heart,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Star,
  Package,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// -- Types ---------------------------------------------------------------------

type Tab = "info" | "password" | "addresses" | "orders" | "wishlist";

interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
}

// -- Helpers -------------------------------------------------------------------

const PASSWORD_STRENGTH = (pw: string) => {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "",
  "bg-(--danger)",
  "bg-(--warning)",
  "bg-(--info)",
  "bg-(--success)",
];

// -- Address Dialog ------------------------------------------------------------

const emptyAddress = (): Omit<Address, "id"> => ({
  title: "",
  fullName: "",
  phone: "",
  city: "",
  district: "",
  address: "",
  isDefault: false,
});

function AddressDialog({
  open,
  initial,
  onSave,
  onClose,
}: {
  open: boolean;
  initial?: Address;
  onSave: (form: Omit<Address, "id">, id?: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Address, "id">>(
    initial ? { ...initial } : emptyAddress(),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(initial ? { ...initial } : emptyAddress());
    setError("");
  }, [initial, open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function handleSave() {
    if (!form.title.trim()) return setError("Address title is required.");
    if (!form.fullName.trim()) return setError("Full name is required.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!form.city.trim()) return setError("City is required.");
    if (!form.address.trim()) return setError("Address is required.");
    setError("");
    onSave(form, initial?.id);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Address Title</Label>
            <Input
              placeholder="Home, Work…"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              type="tel"
              placeholder="05XX XXX XX XX"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Input
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <textarea
              rows={3}
              placeholder="Street, building, apt…"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full rounded-lg border border-(--border-mid) px-3 py-2.5 text-sm bg-(--bg-surface) text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--charcoal)/15 focus:border-(--charcoal) transition-colors resize-none"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => set("isDefault", e.target.checked)}
              className="w-4 h-4 rounded border-(--border-mid) accent-(--charcoal)"
            />
            <span className="text-sm text-(--text-secondary)">
              Set as default address
            </span>
          </label>

          {error && (
            <p className="text-sm text-(--danger) flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-(--border-mid)"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
          >
            {initial ? "Update Address" : "Add Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Tab config ----------------------------------------------------------------

const TAB_META: {
  key: Tab;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "info", label: "Personal Info", icon: User },
  { key: "password", label: "Password", icon: Lock },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "wishlist", label: "Wishlist", icon: Heart },
];

// -- Main Component ------------------------------------------------------------

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: meData, isLoading: meLoading } = useMe();
  const updateMe = useUpdateMe();

  const [tab, setTab] = useState<Tab>("info");

  // -- Personal Info ----------------------------------------------------------
  const [info, setInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (meData) {
      setInfo({
        firstName: meData.firstName ?? "",
        lastName: meData.lastName ?? "",
        email: meData.email ?? "",
        phone: meData.phone ?? "",
      });
    }
  }, [meData]);

  async function saveInfo() {
    if (!info.firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    try {
      await updateMe.mutateAsync({
        firstName: info.firstName.trim(),
        lastName: info.lastName.trim(),
        phone: info.phone.trim() || undefined,
      });
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to save changes. Please try again.");
    }
  }

  // -- Password ---------------------------------------------------------------
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const pwStrength = PASSWORD_STRENGTH(passwords.next);

  async function savePassword() {
    if (!passwords.current) {
      toast.error("Current password is required.");
      return;
    }
    if (passwords.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      toast.success("Password changed successfully.");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch {
      toast.error("Current password is incorrect.");
    } finally {
      setPwSaving(false);
    }
  }

  // -- Addresses (client-side — backend CRUD not yet implemented) -------------
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrDialog, setAddrDialog] = useState<{
    open: boolean;
    editing?: Address;
  }>({ open: false });

  function handleSaveAddress(form: Omit<Address, "id">, id?: string) {
    if (id) {
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...form, id }
            : form.isDefault
              ? { ...a, isDefault: false }
              : a,
        ),
      );
    } else {
      const newAddr: Address = { ...form, id: Date.now().toString() };
      setAddresses((prev) =>
        form.isDefault
          ? [...prev.map((a) => ({ ...a, isDefault: false })), newAddr]
          : [...prev, newAddr],
      );
    }
    setAddrDialog({ open: false });
    toast.success(id ? "Address updated." : "Address added.");
  }

  function handleDeleteAddress(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Address removed.");
  }

  // -- Orders -----------------------------------------------------------------
  const { data: orders = [], isLoading: ordersLoading } = useMyOrders();

  // -- Wishlist ---------------------------------------------------------------
  const { data: wishlistData, isLoading: wishlistLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const wishlistItems = wishlistData?.items ?? [];

  // -- Derived ----------------------------------------------------------------
  const displayName = meData
    ? `${meData.firstName} ${meData.lastName}`.trim() || meData.email
    : user?.name || user?.email || "";
  const initials = displayName.charAt(0)?.toUpperCase() ?? "?";

  const roleLabel =
    meData?.role === "Merchant"
      ? "Merchant"
      : meData?.role === "Admin"
        ? "Admin"
        : meData?.role === "Courier"
          ? "Courier"
          : "Customer";

  return (
    <div className="min-h-screen bg-(--off-white)">
      {/* Address Dialog */}
      <AddressDialog
        open={addrDialog.open}
        initial={addrDialog.editing}
        onSave={handleSaveAddress}
        onClose={() => setAddrDialog({ open: false })}
      />

      {/* Page Header */}
      <div className="bg-(--bg-surface) border-b border-(--border-light)">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-block w-6 h-px bg-(--red)" />
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-(--text-tertiary)">
              My Account
            </span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {meLoading ? (
                <Skeleton className="w-14 h-14 rounded-full" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-(--charcoal) flex items-center justify-center text-xl font-bold text-white shrink-0">
                  {initials}
                </div>
              )}
              <div>
                {meLoading ? (
                  <>
                    <Skeleton className="h-5 w-36 mb-2" />
                    <Skeleton className="h-3.5 w-48" />
                  </>
                ) : (
                  <>
                    <h1 className="font-bold text-[1.25rem] text-(--text-primary)">
                      {displayName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-mono text-[11px] text-(--text-tertiary)">
                        {meData?.email ?? user?.email}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide bg-(--red-muted) text-(--red)">
                        {roleLabel}
                      </span>
                      {meData?.isVerified ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide bg-(--success-bg) text-(--success)">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : meData ? (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide bg-(--warning-bg) text-(--warning)">
                          Unverified
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-5 text-center">
              <div>
                <div className="font-bold text-[1.25rem] text-(--text-primary)">
                  {ordersLoading ? (
                    <Skeleton className="h-6 w-8 inline-block" />
                  ) : (
                    orders.length
                  )}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-(--text-tertiary)">
                  Orders
                </p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <div className="font-bold text-[1.25rem] text-(--text-primary)">
                  {wishlistLoading ? (
                    <Skeleton className="h-6 w-8 inline-block" />
                  ) : (
                    wishlistItems.length
                  )}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-(--text-tertiary)">
                  Wishlist
                </p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <div className="font-bold text-[1.25rem] text-(--text-primary)">
                  {addresses.length}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-(--text-tertiary)">
                  Addresses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex mb-8 border-b border-(--border-light)">
          {TAB_META.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2.5 text-[10px] md:text-sm font-semibold relative transition-colors border-b-2 -mb-px ${
                tab === key
                  ? "border-(--red) text-(--text-primary)"
                  : "border-transparent text-(--text-tertiary) hover:text-(--text-secondary)"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight text-center">{label}</span>
              {key === "wishlist" && wishlistItems.length > 0 && (
                <span className="text-[10px] font-bold bg-(--red) text-white px-1.5 py-0.5 rounded-full leading-none">
                  {wishlistItems.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* -- Personal Info ---------------------------------------------------- */}
        {tab === "info" && (
          <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-6 shadow-[var(--shadow-sm)]">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input
                    value={info.firstName}
                    onChange={(e) =>
                      setInfo((f) => ({ ...f, firstName: e.target.value }))
                    }
                    className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input
                    value={info.lastName}
                    onChange={(e) =>
                      setInfo((f) => ({ ...f, lastName: e.target.value }))
                    }
                    className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={info.email}
                    disabled
                    className="border-(--border-mid) bg-(--bg-sunken) opacity-60 cursor-not-allowed"
                  />
                  <p className="text-xs text-(--text-tertiary)">
                    Email cannot be changed here.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={info.phone}
                    onChange={(e) =>
                      setInfo((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
                  />
                </div>
              </div>

              {/* Account meta */}
              <div className="rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-(--bg-sunken)">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-(--text-tertiary) mb-1">
                    Role
                  </p>
                  <p className="text-sm font-semibold text-(--text-primary)">
                    {roleLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-(--text-tertiary) mb-1">
                    Email Status
                  </p>
                  <p
                    className={`text-sm font-semibold ${meData?.isVerified ? "text-(--success)" : "text-(--warning)"}`}
                  >
                    {meData?.isVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
                {meData?.merchantId && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-(--text-tertiary) mb-1">
                      Store
                    </p>
                    <Link
                      href="/merchant"
                      className="text-sm font-semibold text-(--info) hover:underline"
                    >
                      Go to Dashboard →
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={saveInfo}
                  disabled={updateMe.isPending}
                  className="bg-(--charcoal) hover:bg-(--charcoal-2) text-white gap-2"
                >
                  {updateMe.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {updateMe.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* -- Password -------------------------------------------------------- */}
        {tab === "password" && (
          <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-6 shadow-[var(--shadow-sm)]">
            <div className="space-y-5 max-w-sm">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, current: e.target.value }))
                  }
                  className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
                />
              </div>

              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwords.next}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, next: e.target.value }))
                  }
                  className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
                />
                {/* Password strength meter */}
                {passwords.next.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            pwStrength >= i
                              ? STRENGTH_COLORS[pwStrength]
                              : "bg-(--off-white-3)"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-(--text-tertiary)">
                      {STRENGTH_LABELS[pwStrength]}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, confirm: e.target.value }))
                  }
                  className="border-(--border-mid) focus:ring-(--charcoal)/15 focus:border-(--charcoal)"
                />
                {passwords.confirm.length > 0 &&
                  passwords.next !== passwords.confirm && (
                    <p className="text-xs text-(--danger)">
                      Passwords do not match.
                    </p>
                  )}
              </div>

              <div className="pt-1">
                <Button
                  onClick={savePassword}
                  disabled={pwSaving}
                  className="bg-(--charcoal) hover:bg-(--charcoal-2) text-white gap-2"
                >
                  {pwSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {pwSaving ? "Changing…" : "Change Password"}
                </Button>
              </div>

              {/* Security tips */}
              <div className="rounded-xl border border-(--border-light) p-4 bg-(--bg-sunken) space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-(--success)" />
                  <p className="text-xs font-semibold text-(--text-primary)">
                    Password tips
                  </p>
                </div>
                {[
                  "At least 8 characters",
                  "Mix uppercase and lowercase",
                  "Include numbers and symbols",
                ].map((tip) => (
                  <p key={tip} className="text-xs text-(--text-tertiary) pl-6">
                    · {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -- Addresses ------------------------------------------------------- */}
        {tab === "addresses" && (
          <div className="space-y-3">
            {addresses.length === 0 && (
              <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-10 text-center shadow-[var(--shadow-sm)]">
                <MapPin className="w-10 h-10 mx-auto mb-3 text-(--text-tertiary) opacity-30" />
                <p className="text-sm font-semibold text-(--text-secondary) mb-1">
                  No addresses saved
                </p>
                <p className="text-xs text-(--text-tertiary)">
                  Add a delivery address to speed up checkout.
                </p>
              </div>
            )}

            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-(--bg-surface) rounded-2xl p-5 shadow-[var(--shadow-sm)] ${
                  addr.isDefault
                    ? "border-[1.5px] border-(--red-subtle)"
                    : "border border-(--border-light)"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-bold text-(--text-primary)">
                        {addr.title}
                      </span>
                      {addr.isDefault && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide bg-(--red-muted) text-(--red)">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-(--text-primary)">
                      {addr.fullName}
                    </p>
                    <p className="text-sm text-(--text-secondary) mt-0.5">
                      {addr.address}
                      {addr.district ? `, ${addr.district}` : ""} / {addr.city}
                    </p>
                    <p className="font-mono text-xs text-(--text-tertiary) mt-1">
                      {addr.phone}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 border-(--border-mid) gap-1.5 text-xs"
                        onClick={() =>
                          setAddrDialog({ open: true, editing: addr })
                        }
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 border-(--danger-border) text-(--danger) hover:bg-(--danger-bg) gap-1.5 text-xs"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                    {!addr.isDefault && (
                      <button
                        onClick={() =>
                          setAddresses((prev) =>
                            prev.map((a) => ({
                              ...a,
                              isDefault: a.id === addr.id,
                            })),
                          )
                        }
                        className="text-[11px] font-semibold text-(--text-tertiary) hover:text-(--red) transition-colors"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setAddrDialog({ open: true })}
              className="w-full py-4 rounded-2xl text-sm font-semibold transition-all border-2 border-dashed border-(--border-mid) text-(--text-tertiary) hover:border-(--red-mid) hover:text-(--red) flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>
          </div>
        )}

        {/* -- Orders ---------------------------------------------------------- */}
        {tab === "orders" && (
          <div className="space-y-3">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3.5 w-48" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-5 w-20 ml-auto" />
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                  </div>
                </div>
              ))
            ) : orders.length === 0 ? (
              <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-12 text-center shadow-[var(--shadow-sm)]">
                <Package className="w-10 h-10 mx-auto mb-3 text-(--text-tertiary) opacity-30" />
                <p className="text-sm font-semibold text-(--text-secondary) mb-1">
                  No orders yet
                </p>
                <p className="text-xs text-(--text-tertiary) mb-4">
                  Your order history will appear here.
                </p>
                <Link href="/">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
                  >
                    Start Shopping
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {orders.map((order) => {
                  const statusLabel =
                    ORDER_STATUS_LABELS[order.status] ?? order.status;
                  const statusColor =
                    ORDER_STATUS_COLORS[order.status] ??
                    "bg-(--off-white-2) text-(--text-secondary)";
                  const date = formatDate(order.createdAt);
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block bg-(--bg-surface) rounded-2xl border border-(--border-light) p-5 transition-all hover:border-(--red-subtle) shadow-[var(--shadow-xs)]"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-(--text-primary)">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-sm text-(--text-secondary)">
                            {order.merchantStoreName ?? "Store"} · {date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-(--text-primary)">
                            ${order.totalAmount.toFixed(2)}
                          </p>
                          <p className="font-mono text-[11px] text-(--text-tertiary)">
                            {order.items?.length ?? 0} item
                            {(order.items?.length ?? 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                <Link
                  href="/orders"
                  className="flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                >
                  View all orders
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        )}

        {/* -- Wishlist --------------------------------------------------------- */}
        {tab === "wishlist" && (
          <div className="space-y-3">
            {wishlistLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-4"
                  >
                    <Skeleton className="w-full aspect-square rounded-xl mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3.5 w-1/2" />
                  </div>
                ))}
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="bg-(--bg-surface) rounded-2xl border border-(--border-light) p-12 text-center shadow-[var(--shadow-sm)]">
                <Heart className="w-10 h-10 mx-auto mb-3 text-(--text-tertiary) opacity-30" />
                <p className="text-sm font-semibold text-(--text-secondary) mb-1">
                  Your wishlist is empty
                </p>
                <p className="text-xs text-(--text-tertiary) mb-4">
                  Save products you love while browsing the marketplace.
                </p>
                <Link href="/products">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
                  >
                    Browse Products
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="text-xs text-(--text-tertiary) mb-4">
                  {wishlistItems.length} saved product
                  {wishlistItems.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => {
                    const product = item.product;
                    return (
                      <div
                        key={item.id}
                        className="group bg-(--bg-surface) rounded-2xl border border-(--border-light) overflow-hidden hover:border-(--border-mid) hover:shadow-sm transition-all"
                      >
                        {/* Image */}
                        <Link href={`/product/${product.id}`} className="block">
                          <div className="aspect-square bg-(--bg-sunken) overflow-hidden relative">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-(--text-tertiary) opacity-30" />
                              </div>
                            )}
                            {product.stock === 0 && (
                              <div className="absolute inset-0 bg-(--bg-surface)/70 flex items-center justify-center">
                                <span className="text-xs font-bold text-(--text-tertiary) border border-(--border-mid) px-2 py-1 rounded">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="p-4">
                          <Link href={`/product/${product.id}`}>
                            <p className="font-semibold text-sm text-(--text-primary) line-clamp-2 hover:text-(--red) transition-colors">
                              {product.name}
                            </p>
                          </Link>
                          <p className="text-xs text-(--text-tertiary) mt-0.5">
                            {product.merchant?.storeName}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-(--text-primary)">
                              ${product.price.toLocaleString("tr-TR")}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 border-(--danger-border) text-(--danger) hover:bg-(--danger-bg) gap-1 text-xs"
                              onClick={() =>
                                removeFromWishlist.mutate(product.id)
                              }
                              disabled={removeFromWishlist.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* -- Danger Zone ----------------------------------------------------- */}
        <div className="mt-10 pt-6 border-t border-(--border-light)">
          <button
            onClick={async () => { await logout(); router.push("/"); }}
            className="flex items-center gap-2 text-sm font-semibold text-(--text-tertiary) hover:text-(--danger) transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
