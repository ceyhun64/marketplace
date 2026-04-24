"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Truck, UserCheck, Package, Activity } from "lucide-react";

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
      await api.post("/api/couriers", form);
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

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await api.patch(`/api/couriers/${id}`, { isActive: !current });
      setCouriers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c)),
      );
    } catch {
      alert("Failed to update courier status.");
    }
  }

  const activeCouriers = couriers.filter((c) => c.isActive);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Couriers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCouriers.length} active / {couriers.length} total couriers
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setFormError("");
          }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span> New Courier
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Couriers",
            value: couriers.length,
            icon: Truck,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Active",
            value: activeCouriers.length,
            icon: UserCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Active Deliveries",
            value: couriers.reduce(
              (s, c) => s + (c.activeShipmentCount ?? 0),
              0,
            ),
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
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

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              New Courier Account
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="courier@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="+1 5XX XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="At least 8 characters"
                />
              </div>
              {formError && (
                <p className="text-sm text-rose-600">{formError}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={formLoading}
                  onClick={handleCreate}
                  className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {formLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Couriers List */}
      {loading ? (
        <div className="bg-white border border-gray-100 rounded-xl flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : couriers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl flex flex-col items-center justify-center py-16 text-gray-400">
          <Truck className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">No couriers yet</p>
          <p className="text-xs mt-1">
            Click "New Courier" to add your first courier.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Courier
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Active Deliveries
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Completed
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Joined
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {couriers.map((courier) => (
                <tr
                  key={courier.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold">
                        {courier.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {courier.name}
                        </p>
                        <p className="text-xs text-gray-400">{courier.email}</p>
                        {courier.phone && (
                          <p className="text-xs text-gray-400">
                            {courier.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {courier.activeShipmentCount ?? 0}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {courier.totalDelivered ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${courier.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {courier.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {new Date(courier.createdAt).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() =>
                        handleToggleActive(courier.id, courier.isActive)
                      }
                      className={`text-xs font-medium hover:underline ${courier.isActive ? "text-amber-600" : "text-blue-600"}`}
                    >
                      {courier.isActive ? "Deactivate" : "Activate"}
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
