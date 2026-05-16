"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useMe, useUpdateMe } from "@/queries/useMe";
import { useMyOrders } from "@/queries/useOrders";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types/enums";

type Tab = "info" | "password" | "addresses" | "orders";

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

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  background: "var(--off-white)",
  border: "1.5px solid rgba(51,51,51,0.15)",
  borderRadius: "8px",
  fontFamily: "var(--font-body)",
  fontSize: "0.875rem",
  color: "var(--charcoal)",
  outline: "none",
  transition: "border-color 150ms, background 150ms, box-shadow 150ms",
};

const labelStyle = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "var(--charcoal-mid)",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  fontFamily: "var(--font-body)",
  display: "block",
  marginBottom: "0.5rem",
};

function StyledInput({
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...inputStyle,
        borderColor: focused ? "var(--red)" : "rgba(51,51,51,0.15)",
        background: disabled
          ? "rgba(51,51,51,0.04)"
          : focused
          ? "#fff"
          : "var(--off-white)",
        boxShadow: focused ? "0 0 0 3px rgba(200,16,46,0.08)" : "none",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "not-allowed" : "text",
      }}
      onFocus={() => !disabled && setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function SaveButton({
  onClick,
  loading,
  label = "Save Changes",
  loadingLabel = "Saving...",
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
  loadingLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
      style={{ background: "var(--charcoal)", fontFamily: "var(--font-body)" }}
      onMouseEnter={(e) =>
        !loading && (e.currentTarget.style.background = "var(--red)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--charcoal)")
      }
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

// ── Address Modal ─────────────────────────────────────────────────────────────

const emptyAddress = (): Omit<Address, "id"> => ({
  title: "",
  fullName: "",
  phone: "",
  city: "",
  district: "",
  address: "",
  isDefault: false,
});

function AddressModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Address;
  onSave: (addr: Omit<Address, "id">, id?: string) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Address, "id">>(
    initial ? { ...initial } : emptyAddress()
  );
  const [error, setError] = useState("");

  function handleSave() {
    if (!form.title.trim()) return setError("Address title is required");
    if (!form.fullName.trim()) return setError("Full name is required");
    if (!form.phone.trim()) return setError("Phone is required");
    if (!form.city.trim()) return setError("City is required");
    if (!form.address.trim()) return setError("Address is required");
    setError("");
    onSave(form, initial?.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        style={{ border: "1px solid rgba(51,51,51,0.08)" }}
      >
        <h3
          className="font-bold text-[1.1rem] mb-5"
          style={{ fontFamily: "var(--font-body)", color: "var(--charcoal)" }}
        >
          {initial ? "Edit Address" : "Add New Address"}
        </h3>
        <div className="space-y-4">
          <div>
            <label style={labelStyle}>Address Title</label>
            <StyledInput
              value={form.title}
              onChange={(v) => setForm((f) => ({ ...f, title: v }))}
              placeholder="Home, Work…"
            />
          </div>
          <div>
            <label style={labelStyle}>Full Name</label>
            <StyledInput
              value={form.fullName}
              onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <StyledInput
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="05XX XXX XX XX"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>City</label>
              <StyledInput
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
              />
            </div>
            <div>
              <label style={labelStyle}>District</label>
              <StyledInput
                value={form.district}
                onChange={(v) => setForm((f) => ({ ...f, district: v }))}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <textarea
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              rows={3}
              placeholder="Street, building, apt…"
              style={{ ...inputStyle, resize: "none", lineHeight: "1.5" }}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm((f) => ({ ...f, isDefault: e.target.checked }))
              }
              className="accent-red-600"
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--charcoal)" }}
            >
              Set as default address
            </span>
          </label>
          {error && (
            <p
              className="font-mono text-[12px]"
              style={{ color: "var(--red)" }}
            >
              {error}
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{
              background: "var(--charcoal)",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--red)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--charcoal)")
            }
          >
            {initial ? "Update Address" : "Add Address"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{
              border: "1.5px solid rgba(51,51,51,0.15)",
              color: "var(--charcoal)",
              fontFamily: "var(--font-body)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: meData } = useMe();
  const updateMe = useUpdateMe();

  const [tab, setTab] = useState<Tab>("info");

  // ── Personal Info ──────────────────────────────────────────────────────────
  const [info, setInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [infoError, setInfoError] = useState("");

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
    setInfoError("");
    if (!info.firstName.trim()) {
      setInfoError("First name is required");
      return;
    }
    setSaving(true);
    try {
      await updateMe.mutateAsync({
        firstName: info.firstName,
        lastName: info.lastName,
        phone: info.phone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setInfoError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Password ───────────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  async function savePassword() {
    setPwError("");
    if (!passwords.current) {
      setPwError("Current password is required");
      return;
    }
    if (passwords.next.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPwSaved(true);
      setPasswords({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2500);
    } catch {
      setPwError("Current password is incorrect");
    } finally {
      setPwSaving(false);
    }
  }

  // ── Addresses ──────────────────────────────────────────────────────────────
  // NOTE: Backend address CRUD not yet implemented — managed client-side
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrModal, setAddrModal] = useState<{
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
            : a
        )
      );
    } else {
      const newAddr: Address = { ...form, id: Date.now().toString() };
      setAddresses((prev) =>
        form.isDefault
          ? [...prev.map((a) => ({ ...a, isDefault: false })), newAddr]
          : [...prev, newAddr]
      );
    }
    setAddrModal({ open: false });
  }

  function handleDeleteAddress(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  function handleSetDefault(id: string) {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  }

  // ── Orders ─────────────────────────────────────────────────────────────────
  const { data: orders = [], isLoading: ordersLoading } = useMyOrders();
  const recentOrders = orders.slice(0, 5);

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayName = meData
    ? `${meData.firstName} ${meData.lastName}`.trim() || meData.email
    : user?.name || user?.email || "";
  const initials = displayName[0]?.toUpperCase() ?? "?";

  const roleLabel =
    meData?.role === "Merchant"
      ? "Merchant"
      : meData?.role === "Admin"
      ? "Admin"
      : meData?.role === "Courier"
      ? "Courier"
      : "Customer";

  const TABS: { key: Tab; label: string }[] = [
    { key: "info", label: "Personal Info" },
    { key: "password", label: "Password" },
    {
      key: "addresses",
      label: `Addresses${addresses.length ? ` (${addresses.length})` : ""}`,
    },
    {
      key: "orders",
      label: `Orders${orders.length ? ` (${orders.length})` : ""}`,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Address Modal */}
      {addrModal.open && (
        <AddressModal
          initial={addrModal.editing}
          onSave={handleSaveAddress}
          onClose={() => setAddrModal({ open: false })}
        />
      )}

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(51,51,51,0.08)",
          background: "#fff",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--red)" }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "var(--charcoal-soft)" }}
            >
              My Account
            </span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{
                  background: "var(--charcoal)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {initials}
              </div>
              <div>
                <h1
                  className="font-bold text-[1.25rem] text-[var(--charcoal)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {displayName}
                </h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p
                    className="font-mono text-[11px]"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    {meData?.email ?? user?.email}
                  </p>
                  {/* Role badge */}
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.08em]"
                    style={{
                      background: "rgba(200,16,46,0.08)",
                      color: "var(--red)",
                    }}
                  >
                    {roleLabel}
                  </span>
                  {/* Verified badge */}
                  {meData?.isVerified ? (
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.08em]"
                      style={{
                        background: "rgba(16,185,129,0.1)",
                        color: "#059669",
                      }}
                    >
                      ✓ Verified
                    </span>
                  ) : meData ? (
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.08em]"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        color: "#d97706",
                      }}
                    >
                      Unverified
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p
                  className="font-bold text-[1.25rem]"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {ordersLoading ? "—" : orders.length}
                </p>
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.08em]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Orders
                </p>
              </div>
              <div
                className="h-8 w-px"
                style={{ background: "rgba(51,51,51,0.1)" }}
              />
              <div className="text-center">
                <p
                  className="font-bold text-[1.25rem]"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {addresses.length}
                </p>
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.08em]"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Addresses
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div
          className="flex gap-1 mb-8 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(51,51,51,0.08)" }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-3 text-sm font-semibold relative transition-colors whitespace-nowrap"
              style={{
                color:
                  tab === t.key ? "var(--charcoal)" : "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t.label}
              {tab === t.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "var(--red)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* ── Personal Info ──────────────────────────────────────────────────── */}
        {tab === "info" && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{
              border: "1px solid rgba(51,51,51,0.08)",
              boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
            }}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label style={labelStyle}>First Name</label>
                  <StyledInput
                    value={info.firstName}
                    onChange={(v) => setInfo((f) => ({ ...f, firstName: v }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <StyledInput
                    value={info.lastName}
                    onChange={(v) => setInfo((f) => ({ ...f, lastName: v }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label style={labelStyle}>Email</label>
                  <StyledInput
                    type="email"
                    value={info.email}
                    onChange={() => {}}
                    disabled
                  />
                  <p
                    className="font-mono text-[11px] mt-1"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    Email cannot be changed here.
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <StyledInput
                    value={info.phone}
                    onChange={(v) => setInfo((f) => ({ ...f, phone: v }))}
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Account meta info */}
              <div
                className="rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-4"
                style={{ background: "var(--off-white)" }}
              >
                <div>
                  <p style={labelStyle}>Role</p>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--charcoal)" }}
                  >
                    {roleLabel}
                  </p>
                </div>
                <div>
                  <p style={labelStyle}>Email Status</p>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: meData?.isVerified ? "#059669" : "#d97706",
                    }}
                  >
                    {meData?.isVerified ? "Verified" : "Not Verified"}
                  </p>
                </div>
                {meData?.merchantId && (
                  <div>
                    <p style={labelStyle}>Store</p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--charcoal)" }}
                    >
                      Active
                    </p>
                  </div>
                )}
              </div>

              {infoError && (
                <p
                  className="font-mono text-[12px]"
                  style={{ color: "var(--red)" }}
                >
                  {infoError}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <SaveButton onClick={saveInfo} loading={saving} />
                {saved && (
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "#059669" }}
                  >
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Password ──────────────────────────────────────────────────────── */}
        {tab === "password" && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{
              border: "1px solid rgba(51,51,51,0.08)",
              boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
            }}
          >
            <div className="space-y-5 max-w-sm">
              <div>
                <label style={labelStyle}>Current Password</label>
                <StyledInput
                  type="password"
                  value={passwords.current}
                  onChange={(v) => setPasswords((p) => ({ ...p, current: v }))}
                />
              </div>
              <div>
                <label style={labelStyle}>New Password</label>
                <StyledInput
                  type="password"
                  value={passwords.next}
                  onChange={(v) => setPasswords((p) => ({ ...p, next: v }))}
                />
                {/* Password strength indicator */}
                {passwords.next.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors duration-200"
                        style={{
                          background:
                            passwords.next.length >= i * 3
                              ? i <= 1
                                ? "#ef4444"
                                : i <= 2
                                ? "#f59e0b"
                                : i <= 3
                                ? "#3b82f6"
                                : "#10b981"
                              : "rgba(51,51,51,0.1)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <StyledInput
                  type="password"
                  value={passwords.confirm}
                  onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                />
                {passwords.confirm.length > 0 &&
                  passwords.next !== passwords.confirm && (
                    <p
                      className="font-mono text-[11px] mt-1"
                      style={{ color: "var(--red)" }}
                    >
                      Passwords do not match
                    </p>
                  )}
              </div>
              {pwError && (
                <p
                  className="font-mono text-[12px]"
                  style={{ color: "var(--red)" }}
                >
                  {pwError}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                <SaveButton
                  onClick={savePassword}
                  loading={pwSaving}
                  label="Change Password"
                  loadingLabel="Changing..."
                />
                {pwSaved && (
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "#059669" }}
                  >
                    ✓ Password changed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Addresses ─────────────────────────────────────────────────────── */}
        {tab === "addresses" && (
          <div className="space-y-3">
            {addresses.length === 0 && (
              <div
                className="bg-white rounded-2xl p-8 text-center"
                style={{
                  border: "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                }}
              >
                <p
                  className="font-mono text-[13px] mb-1"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  No addresses saved
                </p>
                <p className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
                  Add an address to speed up checkout.
                </p>
              </div>
            )}

            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-2xl p-5"
                style={{
                  border: addr.isDefault
                    ? "1.5px solid rgba(200,16,46,0.25)"
                    : "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="font-bold text-[var(--charcoal)]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {addr.title}
                      </span>
                      {addr.isDefault && (
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.08em]"
                          style={{
                            background: "rgba(200,16,46,0.08)",
                            color: "var(--red)",
                          }}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[0.875rem] text-[var(--charcoal)]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {addr.fullName}
                    </p>
                    <p
                      className="text-[0.875rem]"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {addr.address}
                      {addr.district ? `, ${addr.district}` : ""}/{addr.city}
                    </p>
                    <p
                      className="font-mono text-[12px] mt-1"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      {addr.phone}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setAddrModal({ open: true, editing: addr })
                        }
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                        style={{
                          border: "1.5px solid rgba(51,51,51,0.12)",
                          color: "var(--charcoal)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                        style={{
                          border: "1.5px solid rgba(200,16,46,0.2)",
                          color: "var(--red)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-[11px] font-semibold transition-colors"
                        style={{
                          color: "var(--charcoal-soft)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "var(--red)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--charcoal-soft)")
                        }
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setAddrModal({ open: true })}
              className="w-full py-4 rounded-2xl text-sm font-semibold transition-colors"
              style={{
                border: "2px dashed rgba(51,51,51,0.12)",
                color: "var(--charcoal-soft)",
                background: "transparent",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(200,16,46,0.3)";
                el.style.color = "var(--red)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(51,51,51,0.12)";
                el.style.color = "var(--charcoal-soft)";
              }}
            >
              + Add New Address
            </button>
          </div>
        )}

        {/* ── Orders ────────────────────────────────────────────────────────── */}
        {tab === "orders" && (
          <div className="space-y-3">
            {ordersLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-5 animate-pulse"
                    style={{
                      border: "1px solid rgba(51,51,51,0.08)",
                      height: "88px",
                    }}
                  />
                ))}
              </div>
            )}

            {!ordersLoading && orders.length === 0 && (
              <div
                className="bg-white rounded-2xl p-10 text-center"
                style={{
                  border: "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                }}
              >
                <p
                  className="font-mono text-[13px] mb-1"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  No orders yet
                </p>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  Your order history will appear here.
                </p>
                <Link
                  href="/"
                  className="text-sm font-semibold px-4 py-2 rounded-lg inline-block transition-all"
                  style={{
                    background: "var(--charcoal)",
                    color: "#fff",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Start Shopping →
                </Link>
              </div>
            )}

            {!ordersLoading &&
              recentOrders.map((order) => {
                const statusLabel =
                  ORDER_STATUS_LABELS[order.status] ?? order.status;
                const statusColor =
                  ORDER_STATUS_COLORS[order.status] ??
                  "bg-gray-100 text-gray-700";
                const date = new Date(order.createdAt).toLocaleDateString(
                  "tr-TR",
                  { day: "2-digit", month: "short", year: "numeric" }
                );
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white rounded-2xl p-5 transition-all"
                    style={{
                      border: "1px solid rgba(51,51,51,0.08)",
                      boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(200,16,46,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(51,51,51,0.08)";
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-mono text-[12px] font-semibold"
                            style={{ color: "var(--charcoal)" }}
                          >
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p
                          className="text-sm"
                          style={{
                            color: "var(--charcoal-soft)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {order.merchantStoreName ?? "Store"} · {date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="font-bold text-[1rem]"
                          style={{
                            color: "var(--charcoal)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          ₺{order.totalAmount.toFixed(2)}
                        </p>
                        <p
                          className="font-mono text-[11px]"
                          style={{ color: "var(--charcoal-soft)" }}
                        >
                          {order.items?.length ?? 0} item
                          {(order.items?.length ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}

            {!ordersLoading && orders.length > 5 && (
              <div className="text-center pt-2">
                <Link
                  href="/orders"
                  className="text-sm font-semibold transition-colors"
                  style={{
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color = "var(--red)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      "var(--charcoal)")
                  }
                >
                  View all {orders.length} orders →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Danger zone */}
        <div
          className="mt-8 pt-6"
          style={{ borderTop: "1px solid rgba(51,51,51,0.08)" }}
        >
          <button
            onClick={() => logout()}
            className="text-sm font-semibold transition-colors"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--red)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--charcoal-soft)")
            }
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
