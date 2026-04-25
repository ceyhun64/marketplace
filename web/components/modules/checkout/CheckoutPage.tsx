"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface CartItem {
  offerId: string;
  productName: string;
  merchantName: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ETAResult {
  expressEta: string;
  regularEta: string;
  expressPrice: number;
  regularPrice: number;
}

// Simple cart store — in real project comes from Zustand use-cart.ts
function useCart() {
  const [items] = useState<CartItem[]>([
    // Demo data — actually comes from store
  ]);
  return { items };
}

const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Mersin",
  "Diyarbakır",
  "Kayseri",
  "Eskişehir",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();

  const [step, setStep] = useState<"address" | "shipping" | "payment">(
    "address",
  );
  const [form, setForm] = useState({
    fullName: user?.name ?? "",
    phone: "",
    city: "",
    district: "",
    address: "",
    zipCode: "",
  });
  const [shippingRate, setShippingRate] = useState<"Express" | "Regular">(
    "Regular",
  );
  const [eta, setEta] = useState<ETAResult | null>(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost =
    eta?.[shippingRate === "Express" ? "expressPrice" : "regularPrice"] ?? 0;
  const total = subtotal + shippingCost;

  // ETA hesapla (şehir seçince)
  useEffect(() => {
    if (!form.city || items.length === 0) return;
    setEtaLoading(true);

    // Demo: ilk merchant'tan ETA al
    const firstOffer = items[0];
    api
      .get<ETAResult>("/api/fulfillment/calculate-eta", {
        params: {
          offerId: firstOffer.offerId,
          destCity: form.city,
        },
      })
      .then((r) => setEta(r.data))
      .catch(() => {
        // Fallback demo değerleri
        setEta({
          expressEta: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
          regularEta: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          expressPrice: 49.9,
          regularPrice: 19.9,
        });
      })
      .finally(() => setEtaLoading(false));
  }, [form.city]);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.fullName.trim()) e.fullName = "Full name required";
    if (!form.phone.trim()) e.phone = "Phone required";
    if (!form.city) e.city = "Select city";
    if (!form.district.trim()) e.district = "District required";
    if (!form.address.trim()) e.address = "Address required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/api/orders", {
        items: items.map((i) => ({
          offerId: i.offerId,
          quantity: i.quantity,
        })),
        shippingAddress: `${form.address}, ${form.district}, ${form.city} ${form.zipCode}`,
        recipientName: form.fullName,
        recipientPhone: form.phone,
        shippingRate,
        source: "Marketplace",
      });
      router.push(`/orders/${data.orderId}/tracking`);
    } catch {
      alert("Order could not be created. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
  }: {
    label: string;
    name: keyof typeof form;
    type?: string;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${
          errors[name]
            ? "border-red-400 focus:border-red-500"
            : "border-gray-200 focus:border-gray-900"
        }`}
      />
      {errors[name] && (
        <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          {/* Steps */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {(["address", "shipping", "payment"] as const).map((s, idx) => (
              <span key={s} className="flex items-center gap-2">
                <span
                  className={`${
                    step === s
                      ? "text-gray-900 font-bold"
                      : step === "shipping" && s === "address"
                        ? "text-gray-400"
                        : step === "payment"
                          ? "text-gray-400"
                          : "text-gray-300"
                  }`}
                >
                  {idx + 1}.{" "}
                  {s === "address"
                    ? "Address"
                    : s === "shipping"
                      ? "Shipping"
                      : "Payment"}
                </span>
                {idx < 2 && <span className="text-gray-200">›</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Address step */}
            {step === "address" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-5">
                  Delivery Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field
                      label="Full Name"
                      name="fullName"
                      placeholder="Your First and Last Name"
                    />
                  </div>
                  <Field
                    label="Phone"
                    name="phone"
                    placeholder="05XX XXX XX XX"
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none bg-white transition-colors ${
                        errors.city
                          ? "border-red-400"
                          : "border-gray-200 focus:border-gray-900"
                      }`}
                    >
                      <option value="">Select city</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                    )}
                  </div>
                  <Field
                    label="District"
                    name="district"
                    placeholder="District"
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Detailed Address
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
                      }
                      rows={3}
                      placeholder="Neighborhood, Street, No, Apartment..."
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none resize-none transition-colors ${
                        errors.address
                          ? "border-red-400"
                          : "border-gray-200 focus:border-gray-900"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.address}
                      </p>
                    )}
                  </div>
                  <Field
                    label="Postal Code"
                    name="zipCode"
                    placeholder="34XXX"
                  />
                </div>
                <button
                  onClick={() => {
                    if (validate()) setStep("shipping");
                  }}
                  className="mt-6 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Proceed to Shipping Selection →
                </button>
              </div>
            )}

            {/* Shipping step */}
            {step === "shipping" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900">
                    Shipping Selection
                  </h2>
                  <button
                    onClick={() => setStep("address")}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    ← Edit Address
                  </button>
                </div>

                {etaLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">
                      Calculating ETA...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Express */}
                    <button
                      onClick={() => setShippingRate("Express")}
                      className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                        shippingRate === "Express"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            ⚡ Express Shipping
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {eta
                              ? new Date(eta.expressEta).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  },
                                ) + " delivery"
                              : "1-2 business days"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₺{(eta?.expressPrice ?? 49.9).toFixed(2)}
                          </p>
                          {shippingRate === "Express" && (
                            <p className="text-xs text-green-600 mt-0.5">
                              ✓ Selected
                            </p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Regular */}
                    <button
                      onClick={() => setShippingRate("Regular")}
                      className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                        shippingRate === "Regular"
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">
                            📦 Standard Shipping
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {eta
                              ? new Date(eta.regularEta).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  },
                                ) + " delivery"
                              : "3-5 business days"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₺{(eta?.regularPrice ?? 19.9).toFixed(2)}
                          </p>
                          {shippingRate === "Regular" && (
                            <p className="text-xs text-green-600 mt-0.5">
                              ✓ Selected
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setStep("payment")}
                  className="mt-6 w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Proceed to Payment →
                </button>
              </div>
            )}

            {/* Payment step */}
            {step === "payment" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900">Payment</h2>
                  <button
                    onClick={() => setStep("shipping")}
                    className="text-xs text-gray-400 hover:text-gray-700"
                  >
                    ← Change Shipping
                  </button>
                </div>

                {/* iyzico embed gelecek */}
                <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center mb-6">
                  <p className="text-gray-400 text-sm">
                    iyzico payment form will be displayed here
                  </p>
                  <p className="text-xs text-gray-300 mt-1 font-mono">
                    POST /api/payments/checkout → token → iyzico JS SDK
                  </p>
                </div>

                {/* Demo: create order directly */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? "Processing..."
                    : `Pay ₺${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Secure payment · 256-bit SSL encryption
                </p>
              </div>
            )}
          </div>

          {/* Right: Order summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              {items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Cart is empty
                </p>
              ) : (
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.offerId} className="flex gap-3 items-start">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.merchantName} · ×{item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                        ₺{(item.price * item.quantity).toLocaleString("en-US")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₺{subtotal.toLocaleString("en-US")}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    Shipping (
                    {shippingRate === "Express" ? "Express" : "Standard"})
                  </span>
                  <span>
                    {shippingCost > 0 ? `₺${shippingCost.toFixed(2)}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Toplam</span>
                  <span>₺{total.toLocaleString("tr-TR")}</span>
                </div>
              </div>

              {eta && step !== "address" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    📅 Tahmini teslimat:{" "}
                    <strong className="text-gray-800">
                      {new Date(
                        shippingRate === "Express"
                          ? eta.expressEta
                          : eta.regularEta,
                      ).toLocaleDateString("tr-TR", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                      })}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
