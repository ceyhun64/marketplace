"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

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

export default function AdminCouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

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

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await api.post("/api/couriers", form);
      setShowForm(false);
      setForm({ name: "", email: "", password: "", phone: "" });
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Kurye oluşturulamadı.";
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await api.patch(`/api/couriers/${id}`, { isActive: !current });
      setCouriers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c)),
      );
    } catch {
      alert("Güncelleme başarısız.");
    }
  }

  const activeCouriers = couriers.filter((c) => c.isActive);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kurye Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCouriers.length} aktif / {couriers.length} toplam kurye
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setFormError("");
          }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Yeni Kurye
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Toplam Kurye</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {couriers.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Aktif Kurye</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {activeCouriers.length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Aktif Teslimat</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {couriers.reduce((s, c) => s + (c.activeShipmentCount ?? 0), 0)}
          </p>
        </div>
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Yeni Kurye Hesabı</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Ali Yılmaz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="kurye@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="+90 5XX XXX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="En az 8 karakter"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {formLoading ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Couriers List */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm bg-white border border-gray-200 rounded-xl">
          Yükleniyor...
        </div>
      ) : couriers.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-lg">Henüz kurye yok.</p>
          <p className="text-sm mt-1">
            &quot;Yeni Kurye&quot; ile ilk kuryeyi ekleyin.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  Kurye
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  Aktif Teslimat
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  Tamamlanan
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  Durum
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  Kayıt Tarihi
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((courier) => (
                <tr key={courier.id} className="border-b hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{courier.name}</p>
                    <p className="text-xs text-gray-400">{courier.email}</p>
                    {courier.phone && (
                      <p className="text-xs text-gray-400">{courier.phone}</p>
                    )}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {courier.activeShipmentCount ?? 0}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {courier.totalDelivered ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        courier.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {courier.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {new Date(courier.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() =>
                        handleToggleActive(courier.id, courier.isActive)
                      }
                      className={`text-xs hover:underline ${
                        courier.isActive ? "text-orange-500" : "text-blue-600"
                      }`}
                    >
                      {courier.isActive ? "Pasife Al" : "Aktife Al"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
