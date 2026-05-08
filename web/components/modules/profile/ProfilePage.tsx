"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useMe } from "@/queries/useMe";
import { useEffect } from "react";

type Tab = "info" | "password" | "addresses";

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
}: {
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        ...inputStyle,
        borderColor: focused ? "var(--red)" : "rgba(51,51,51,0.15)",
        background: focused ? "#fff" : "var(--off-white)",
        boxShadow: focused ? "0 0 0 3px rgba(200,16,46,0.08)" : "none",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: meData } = useMe();
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [info, setInfo] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: meData?.phone ?? "",
  });
  // Sync phone from API when meData loads
  useEffect(() => {
    if (meData?.phone) {
      setInfo((prev) => ({ ...prev, phone: meData.phone ?? prev.phone }));
    }
  }, [meData?.phone]);

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  // Addresses are managed locally — backend address CRUD not yet implemented
  const [addresses, setAddresses] = useState<Address[]>([]);

  async function saveInfo() {
    setSaving(true);
    try {
      await api.put("/api/auth/me", info);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    setPwError("");
    if (passwords.next !== passwords.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    if (passwords.next.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPwSaved(true);
      setPasswords({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 2000);
    } catch {
      setPwError("Current password is incorrect");
    } finally {
      setSaving(false);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "info", label: "Personal Info" },
    { key: "password", label: "Password" },
    { key: "addresses", label: "Addresses" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
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
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{
                  background: "var(--charcoal)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <h1
                  className="font-bold text-[1.25rem] text-[var(--charcoal)]"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {user?.name || user?.email}
                </h1>
                <p
                  className="font-mono text-[11px] mt-0.5"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  {user?.email}
                </p>
              </div>
            </div>
            <Link
              href="/orders"
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              style={{
                border: "1.5px solid rgba(51,51,51,0.15)",
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--red)";
                el.style.color = "var(--red)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(51,51,51,0.15)";
                el.style.color = "var(--charcoal)";
              }}
            >
              My Orders →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div
          className="flex gap-1 mb-8"
          style={{ borderBottom: "1px solid rgba(51,51,51,0.08)" }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-3 text-sm font-semibold relative transition-colors"
              style={{
                color: tab === t.key ? "var(--charcoal)" : "var(--charcoal-soft)",
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

        {/* Personal Info */}
        {tab === "info" && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{
              border: "1px solid rgba(51,51,51,0.08)",
              boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
            }}
          >
            <div className="space-y-5">
              <div>
                <label style={labelStyle}>Full Name</label>
                <StyledInput
                  value={info.name}
                  onChange={(v) => setInfo((f) => ({ ...f, name: v }))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label style={labelStyle}>Email</label>
                  <StyledInput
                    type="email"
                    value={info.email}
                    onChange={(v) => setInfo((f) => ({ ...f, email: v }))}
                  />
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
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveInfo}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{
                    background: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) =>
                    !saving && (e.currentTarget.style.background = "var(--red)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--charcoal)")
                  }
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {saved && (
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "var(--red)" }}
                  >
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password */}
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
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <StyledInput
                  type="password"
                  value={passwords.confirm}
                  onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))}
                />
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
                <button
                  onClick={savePassword}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{
                    background: "var(--charcoal)",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) =>
                    !saving && (e.currentTarget.style.background = "var(--red)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--charcoal)")
                  }
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
                {pwSaved && (
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "var(--red)" }}
                  >
                    ✓ Changed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Addresses */}
        {tab === "addresses" && (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-2xl p-5"
                style={{
                  border: "1px solid rgba(51,51,51,0.08)",
                  boxShadow: "0 1px 3px rgba(51,51,51,0.04)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
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
                      {addr.address}, {addr.district}/{addr.city}
                    </p>
                    <p
                      className="font-mono text-[12px] mt-1"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      {addr.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={{
                        border: "1.5px solid rgba(51,51,51,0.12)",
                        color: "var(--charcoal)",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={{
                        border: "1.5px solid rgba(200,16,46,0.2)",
                        color: "var(--red)",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
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
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--charcoal-soft)")}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
