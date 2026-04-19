"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  status: string;
  customerName: string;
  deliveryAddress: string;
  estimatedDelivery: string;
  labelUrl?: string;
}

const STATUS_LABEL: Record<string, string> = {
  COURIER_ASSIGNED: "Assigned — Pick Up",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

const STATUS_COLOR: Record<string, string> = {
  COURIER_ASSIGNED: "bg-yellow-50 text-yellow-700",
  PICKED_UP: "bg-blue-50 text-blue-700",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
};

export default function CourierDashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get<Shipment[]>("/api/fulfillment/courier/my-shipments")
      .then((r) => setShipments(r.data))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handlePickup = async (id: string) => {
    await api.post(`/api/fulfillment/${id}/pickup-confirm`);
    load();
  };

  const handleDeliver = async (id: string) => {
    await api.post(`/api/fulfillment/${id}/delivered`);
    load();
  };

  const active = shipments.filter((s) => s.status !== "DELIVERED");
  const done = shipments.filter((s) => s.status === "DELIVERED");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
        <p className="text-sm text-gray-500 mt-1">
          {active.length} active · {done.length} delivered
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
      ) : shipments.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400 bg-white border border-gray-200 rounded-xl">
          No assigned shipments
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {s.trackingNumber}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_COLOR[s.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{s.customerName}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.deliveryAddress}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ETA: {new Date(s.estimatedDelivery).toLocaleString("en-US")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  {s.labelUrl && (
                    <a
                      href={s.labelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Print Label
                    </a>
                  )}
                  {s.status === "COURIER_ASSIGNED" && (
                    <button
                      onClick={() => handlePickup(s.id)}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                    >
                      Picked Up ✓
                    </button>
                  )}
                  {(s.status === "PICKED_UP" || s.status === "IN_TRANSIT") && (
                    <button
                      onClick={() => handleDeliver(s.id)}
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Delivered ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
