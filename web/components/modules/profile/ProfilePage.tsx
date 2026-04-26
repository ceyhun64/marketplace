"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

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
  background: "#f5f5f3",
  border: "1.5px solid rgba(51,51,51,0.15)",
  borderRadius: "8px",
  fontFamily: "'Manrope', sans-serif",
  fontSize: "0.875rem",
  color: "#333333",
  outline: "none",
  transition: "border-color 150ms, background 150ms, box-shadow 150ms",
};

const labelStyle = {
  fontSize: "0.6875rem",
  fontWeight: 600,
  color: "#4a4a4a",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  fontFamily: "'Manrope', sans-serif",
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
        borderColor: focused ? "#c8102e" : "rgba(51,51,51,0.15)",
        background: focused ? "#fff" : "#f5f5f3",
        boxShadow: focused ? "0 0 0 3px rgba(200,16,46,0.08)" : "none",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [info, setInfo] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [addresses] = useState<Address[]>([
    {
      id: "1",
      title: "Home",
      fullName: user?.name ?? "User",
      phone: "0555 000 00 00",
      city: "Istanbul",
      district: "Kadikoy",
      address: "123 Main St, Apt 5",
      isDefault: true,
    },
  ]);

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
    <div className="min-h-screen" style={{ background: "#f5f5f3" }}>
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
              style={{ background: "#c8102e" }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "#6b6b6b" }}
            >
              My Account
            </span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                style={{
                  background: "#333333",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <h1
                  className="font-bold text-[1.25rem] text-[#333333]"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  {user?.name || user?.email}
                </h1>
                <p
                  className="font-mono text-[11px] mt-0.5"
                  style={{ color: "#6b6b6b" }}
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
                color: "#333333",
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#c8102e";
                el.style.color = "#c8102e";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(51,51,51,0.15)";
                el.style.color = "#333333";
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
                color: tab === t.key ? "#333333" : "#6b6b6b",
                fontFamily: "'Manrope', sans-serif",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t.label}
              {tab === t.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "#c8102e" }}
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
                    background: "#333333",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={(e) =>
                    !saving && (e.currentTarget.style.background = "#c8102e")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#333333")
                  }
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {saved && (
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "#c8102e" }}
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
                  style={{ color: "#c8102e" }}
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
                    background: "#333333",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={(e) =>
                    !saving && (e.currentTarget.style.background = "#c8102e")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#333333")
                  }
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
                {pwSaved && (
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: "#c8102e" }}
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
                        className="font-bold text-[#333333]"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        {addr.title}
                      </span>
                      {addr.isDefault && (
                        <span
                          className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.08em]"
                          style={{
                            background: "rgba(200,16,46,0.08)",
                            color: "#c8102e",
                          }}
                        >
                          Default
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[0.875rem] text-[#333333]"
                      style={{ fontFamily: "'Manrope', sans-serif" }}
                    >
                      {addr.fullName}
                    </p>
                    <p
                      className="text-[0.875rem]"
                      style={{
                        color: "#6b6b6b",
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {addr.address}, {addr.district}/{addr.city}
                    </p>
                    <p
                      className="font-mono text-[12px] mt-1"
                      style={{ color: "#6b6b6b" }}
                    >
                      {addr.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={{
                        border: "1.5px solid rgba(51,51,51,0.12)",
                        color: "#333333",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={{
                        border: "1.5px solid rgba(200,16,46,0.2)",
                        color: "#c8102e",
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
                color: "#6b6b6b",
                background: "transparent",
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(200,16,46,0.3)";
                el.style.color = "#c8102e";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(51,51,51,0.12)";
                el.style.color = "#6b6b6b";
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
              color: "#6b6b6b",
              fontFamily: "'Manrope', sans-serif",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#c8102e")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6b6b")}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
