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

  // Demo addresses
  const [addresses] = useState<Address[]>([
    {
      id: "1",
      title: "Ev",
      fullName: user?.name ?? "Kullanıcı",
      phone: "0555 000 00 00",
      city: "İstanbul",
      district: "Kadıköy",
      address: "Moda Cad. No:1 D:5",
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
      //
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
    { key: "info", label: "Personal Information" },
    { key: "password", label: "Password" },
    { key: "addresses", label: "My Addresses" },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-mono">
            Hesabım
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold">
                {(user?.name ?? user?.email ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user?.name || user?.email}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
              </div>
            </div>
            <Link
              href="/orders"
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              Siparişlerim →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Personal info */}
        {tab === "info" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Ad Soyad
                  </label>
                  <input
                    value={info.name}
                    onChange={(e) =>
                      setInfo((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={info.email}
                    onChange={(e) =>
                      setInfo((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    value={info.phone}
                    onChange={(e) =>
                      setInfo((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="05XX XXX XX XX"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={saveInfo}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
                {saved && (
                  <span className="text-sm text-green-600">✓ Kaydedildi</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password */}
        {tab === "password" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4 max-w-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, current: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, next: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Yeni Şifre Tekrar
                </label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, confirm: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-900 transition-colors"
                />
              </div>

              {pwError && <p className="text-sm text-red-500">{pwError}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={savePassword}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
                </button>
                {pwSaved && (
                  <span className="text-sm text-green-600">✓ Değiştirildi</span>
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
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {addr.title}
                      </span>
                      {addr.isDefault && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{addr.fullName}</p>
                    <p className="text-sm text-gray-500">
                      {addr.address}, {addr.district}/{addr.city}
                    </p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded px-2 py-1 transition-colors">
                      Düzenle
                    </button>
                    <button className="text-xs text-red-400 hover:text-red-600 border border-red-100 rounded px-2 py-1 transition-colors">
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
              + Yeni Adres Ekle
            </button>
          </div>
        )}

        {/* Danger zone */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => logout()}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
