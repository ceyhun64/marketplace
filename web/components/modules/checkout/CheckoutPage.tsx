"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ShippingRateSelect } from "@/components/modules/shipping/ShippingRateSelect";
import CartSummary from "./CartSummary";
import { PaymentForm } from "./PaymentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  CreditCard,
  Loader2,
  CheckCircle2,
  Package,
} from "lucide-react";
import api from "@/lib/api";
import { CITY_COORDINATES } from "@/lib/constants";
import type { ShippingRate } from "@/types/enums";
import type { ShippingAddress } from "@/types/entities";

function resolveCityCoords(
  city?: string,
): { lat: number; lng: number } | undefined {
  if (!city?.trim()) return undefined;
  const rawKey = city.toLowerCase().trim();
  if (CITY_COORDINATES[rawKey]) return CITY_COORDINATES[rawKey];
  const normalize = (s: string) =>
    s
      .replace(/[ıİ]/g, "i")
      .replace(/[ğĞ]/g, "g")
      .replace(/[üÜ]/g, "u")
      .replace(/[şŞ]/g, "s")
      .replace(/[öÖ]/g, "o")
      .replace(/[çÇ]/g, "c");
  const normalizedCity = normalize(rawKey);
  const match = Object.entries(CITY_COORDINATES).find(
    ([key]) =>
      normalize(key).startsWith(normalizedCity) ||
      normalizedCity.startsWith(normalize(key)),
  );
  return match?.[1];
}

type Step = "address" | "shipping" | "payment";
const STEPS: Step[] = ["address", "shipping", "payment"];

const STEP_CONFIG: Record<
  Step,
  { label: string; sublabel: string; icon: React.ReactNode }
> = {
  address: {
    label: "Delivery Address",
    sublabel: "Where should we send it?",
    icon: <MapPin className="w-4 h-4" />,
  },
  shipping: {
    label: "Shipping",
    sublabel: "Choose your delivery speed",
    icon: <Truck className="w-4 h-4" />,
  },
  payment: {
    label: "Payment",
    sublabel: "Secure checkout",
    icon: <CreditCard className="w-4 h-4" />,
  },
};

function validateAddress(form: Partial<ShippingAddress>): string | null {
  if (!form.fullName?.trim()) return "Full name is required.";
  if (!form.phone?.trim()) return "Phone number is required.";
  if (!form.addressLine?.trim()) return "Address is required.";
  if (!form.city?.trim()) return "City is required.";
  if (!form.postalCode?.trim()) return "Postal code is required.";
  return null;
}

// ── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const config = STEP_CONFIG[step];
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex items-center gap-3 flex-1">
              {/* Circle */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: done
                    ? "var(--red)"
                    : active
                      ? "var(--charcoal)"
                      : "rgba(51,51,51,0.08)",
                  color: done || active ? "#fff" : "var(--charcoal-soft)",
                }}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : config.icon}
              </div>
              {/* Labels */}
              <div className="hidden sm:block min-w-0">
                <p
                  className="text-[12px] font-bold leading-tight truncate"
                  style={{
                    color: active
                      ? "var(--charcoal)"
                      : done
                        ? "var(--red)"
                        : "var(--charcoal-soft)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {config.label}
                </p>
                <p
                  className="font-mono text-[10px] truncate"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  {config.sublabel}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className="h-px flex-1 mx-3 transition-all duration-500"
                style={{
                  background: done ? "var(--red)" : "rgba(51,51,51,0.1)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Address Step ────────────────────────────────────────────────────────────

const fieldStyle = {
  height: "2.75rem",
  border: "1.5px solid rgba(51,51,51,0.15)",
  borderRadius: "10px",
  background: "var(--off-white)",
  fontFamily: "var(--font-body)",
  fontSize: "0.875rem",
  color: "var(--charcoal)",
  outline: "none",
  padding: "0 0.875rem",
  transition: "border-color 0.15s, background 0.15s",
  width: "100%",
};

function AddressStep({
  value,
  onChange,
  onNext,
}: {
  value: Partial<ShippingAddress>;
  onChange: (v: Partial<ShippingAddress>) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    const err = validateAddress(value);
    if (err) return setError(err);
    setError(null);
    onNext();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--charcoal)";
    e.currentTarget.style.background = "#fff";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "rgba(51,51,51,0.15)";
    e.currentTarget.style.background = "var(--off-white)";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-[1.4rem] font-normal text-[var(--charcoal)] mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Delivery <em style={{ color: "var(--red)" }}>Address</em>
        </h2>
        <p className="font-mono text-[11px] text-[var(--charcoal-soft)]">
          Fill in your shipping details below
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label
            className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block"
            style={{ color: "var(--charcoal-soft)" }}
          >
            Full Name *
          </label>
          <input
            type="text"
            value={value.fullName ?? ""}
            onChange={(e) => onChange({ ...value, fullName: e.target.value })}
            placeholder="Ayşe Yılmaz"
            style={fieldStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <label
            className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block"
            style={{ color: "var(--charcoal-soft)" }}
          >
            Phone *
          </label>
          <input
            type="tel"
            value={value.phone ?? ""}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="+90 5xx xxx xx xx"
            style={fieldStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>

      <div>
        <label
          className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block"
          style={{ color: "var(--charcoal-soft)" }}
        >
          Address *
        </label>
        <input
          type="text"
          value={value.addressLine ?? ""}
          onChange={(e) => onChange({ ...value, addressLine: e.target.value })}
          placeholder="Street, apartment, floor..."
          style={fieldStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label
            className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block"
            style={{ color: "var(--charcoal-soft)" }}
          >
            City *
          </label>
          <input
            type="text"
            value={value.city ?? ""}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            placeholder="İstanbul"
            style={fieldStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <label
            className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block"
            style={{ color: "var(--charcoal-soft)" }}
          >
            District
          </label>
          <input
            type="text"
            value={value.district ?? ""}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
            placeholder="Kadıköy"
            style={fieldStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
        <div>
          <label
            className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block"
            style={{ color: "var(--charcoal-soft)" }}
          >
            Postal Code *
          </label>
          <input
            type="text"
            value={value.postalCode ?? ""}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            placeholder="34700"
            style={fieldStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(187,16,35,0.06)",
            border: "1px solid rgba(187,16,35,0.2)",
            color: "var(--red)",
            fontFamily: "var(--font-body)",
          }}
        >
          <span className="w-4 h-4 flex-shrink-0">⚠</span>
          {error}
        </div>
      )}

      <button
        onClick={handleNext}
        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all"
        style={{
          background: "var(--charcoal)",
          fontFamily: "var(--font-body)",
          boxShadow: "0 4px 16px rgba(51,51,51,0.15)",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--red)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "var(--charcoal)")
        }
      >
        Continue to Shipping
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Shipping Step ───────────────────────────────────────────────────────────

function ShippingStep({
  address,
  merchantId,
  value,
  onChange,
  onNext,
  onBack,
}: {
  address: Partial<ShippingAddress>;
  merchantId?: string;
  value: ShippingRate | null;
  onChange: (r: ShippingRate) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const cityCoords = resolveCityCoords(address.city);

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-[1.4rem] font-normal text-[var(--charcoal)] mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Shipping <em style={{ color: "var(--red)" }}>Options</em>
        </h2>
        <p className="font-mono text-[11px] text-[var(--charcoal-soft)]">
          Choose how fast you want your order
        </p>
      </div>

      {address.city && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(51,51,51,0.03)",
            border: "1px solid rgba(51,51,51,0.08)",
          }}
        >
          <MapPin
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "var(--red)" }}
          />
          <span
            className="text-[var(--charcoal-soft)] text-[13px]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {[address.addressLine, address.district, address.city]
              .filter(Boolean)
              .join(", ")}
          </span>
          {cityCoords && (
            <span
              className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                color: "#2d7a4f",
                background: "rgba(45,122,79,0.08)",
              }}
            >
              ETA calculating
            </span>
          )}
        </div>
      )}

      <ShippingRateSelect
        merchantId={merchantId ?? ""}
        destinationLat={cityCoords?.lat}
        destinationLng={cityCoords?.lng}
        value={value}
        onChange={onChange}
      />

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-semibold transition-all"
          style={{
            border: "1.5px solid rgba(51,51,51,0.15)",
            color: "var(--charcoal)",
            background: "transparent",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "var(--off-white)";
            el.style.borderColor = "var(--charcoal)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "transparent";
            el.style.borderColor = "rgba(51,51,51,0.15)";
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--charcoal)",
            fontFamily: "var(--font-body)",
            boxShadow: value ? "0 4px 16px rgba(51,51,51,0.15)" : "none",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled)
              e.currentTarget.style.background = "var(--red)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--charcoal)";
          }}
        >
          Continue to Payment
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Ana Checkout sayfası ────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<Partial<ShippingAddress>>({
    fullName: user
      ? `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim()
      : "",
    phone: (user as any)?.phone ?? "",
  });
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>(
    "REGULAR",
  );

  const [orderId, setOrderId] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const merchantId = items[0]?.merchantId;

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  const goNext = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx < STEPS.length - 1) setStep(STEPS[currentIdx + 1]);
  };

  const goBack = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1]);
  };

  const handleGoToPayment = async () => {
    if (!shippingRate || !address) return;
    setCreatingOrder(true);
    setOrderError(null);
    try {
      const { data } = await api.post<{ orderId: string }>("/api/orders", {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: address,
        shippingRate,
        source: "MARKETPLACE",
      });
      setOrderId(data.orderId);
      goNext();
    } catch (err: any) {
      setOrderError(
        err?.response?.data?.message ??
          "Order could not be created. Please try again.",
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Top bar */}
      <div
        style={{
          borderBottom: "1px solid rgba(51,51,51,0.08)",
          background: "#fff",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{
              color: "var(--charcoal-soft)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--charcoal)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--charcoal-soft)")
            }
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: "var(--red)" }} />
            <h1
              className="text-[1rem] font-bold text-[var(--charcoal)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Checkout
            </h1>
          </div>
          {/* Security badge */}
          <div
            className="font-mono text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(45,122,79,0.08)",
              color: "#2d7a4f",
            }}
          >
            <span>🔒</span>
            SSL Secured
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Main column */}
          <div>
            <StepIndicator current={step} />

            <div
              className="bg-white rounded-2xl p-6 lg:p-8"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
                boxShadow: "0 2px 8px rgba(51,51,51,0.04)",
              }}
            >
              {step === "address" && (
                <AddressStep
                  value={address}
                  onChange={setAddress}
                  onNext={goNext}
                />
              )}

              {step === "shipping" && (
                <div>
                  <ShippingStep
                    address={address}
                    merchantId={merchantId}
                    value={shippingRate}
                    onChange={setShippingRate}
                    onNext={handleGoToPayment}
                    onBack={goBack}
                  />
                  {orderError && (
                    <div
                      className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "rgba(187,16,35,0.06)",
                        border: "1px solid rgba(187,16,35,0.2)",
                        color: "var(--red)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      ⚠ {orderError}
                    </div>
                  )}
                  {creatingOrder && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--charcoal-soft)]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span style={{ fontFamily: "var(--font-body)" }}>
                        Creating order...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {step === "payment" && orderId && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2
                        className="text-[1.4rem] font-normal text-[var(--charcoal)] mb-1"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Secure <em style={{ color: "var(--red)" }}>Payment</em>
                      </h2>
                      <p className="font-mono text-[11px] text-[var(--charcoal-soft)]">
                        Powered by Stripe — your data is safe
                      </p>
                    </div>
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1 text-sm transition-colors"
                      style={{
                        color: "var(--charcoal-soft)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--charcoal)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--charcoal-soft)")
                      }
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>
                  </div>
                  <PaymentForm
                    orderId={orderId}
                    onSuccess={(oid) => {
                      router.push(`/orders/${oid}/tracking`);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="space-y-4">
            <CartSummary readonly={step !== "address"} />

            {/* Trust badges */}
            <div
              className="bg-white rounded-2xl p-5 space-y-3"
              style={{
                border: "1px solid rgba(51,51,51,0.08)",
              }}
            >
              {[
                {
                  icon: "🔒",
                  title: "Secure Payment",
                  desc: "256-bit SSL encryption",
                },
                {
                  icon: "📦",
                  title: "Fast Delivery",
                  desc: "Real-time order tracking",
                },
                {
                  icon: "↩️",
                  title: "Easy Returns",
                  desc: "14-day return policy",
                },
              ].map((badge) => (
                <div key={badge.title} className="flex items-center gap-3">
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <p
                      className="text-[12px] font-bold text-[var(--charcoal)]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {badge.title}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--charcoal-soft)]">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
