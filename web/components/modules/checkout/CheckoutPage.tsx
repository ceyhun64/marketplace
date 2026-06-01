"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { ShippingRateSelect } from "@/components/modules/shipping/ShippingRateSelect";
import CartSummary from "./CartSummary";
import { PaymentForm } from "./PaymentForm";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  CreditCard,
  Loader2,
  CheckCircle2,
  Package,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/api";
import { CITY_COORDINATES } from "@/lib/constants";
import type { ShippingRate } from "@/types/enums";
import type { ShippingAddress } from "@/types/entities";
import { useCheckout } from "@/hooks/use-checkout";

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

type AddressErrors = Partial<Record<keyof ShippingAddress, string>>;

function validateAddress(form: Partial<ShippingAddress>): AddressErrors {
  const errors: AddressErrors = {};
  if (!form.fullName?.trim()) errors.fullName = "Full name is required.";
  if (!form.phone?.trim()) errors.phone = "Phone number is required.";
  if (!form.addressLine?.trim()) errors.addressLine = "Address is required.";
  if (!form.city?.trim()) errors.city = "City is required.";
  if (!form.postalCode?.trim()) errors.postalCode = "Postal code is required.";
  return errors;
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
              <div className="relative shrink-0">
                {active && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: "rgba(51,51,51,0.08)", animationDuration: "2s" }}
                  />
                )}
                <div
                  className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
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
  const [errors, setErrors] = useState<AddressErrors>({});

  const handleNext = () => {
    const errs = validateAddress(value);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onNext();
  };

  const clearField = (field: keyof AddressErrors) =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const inputStyle = (field: keyof AddressErrors): React.CSSProperties => ({
    ...fieldStyle,
    borderColor: errors[field] ? "var(--red)" : "rgba(51,51,51,0.15)",
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!errors[e.currentTarget.name as keyof AddressErrors]) {
      e.currentTarget.style.borderColor = "var(--charcoal)";
    }
    e.currentTarget.style.background = "#fff";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!errors[e.currentTarget.name as keyof AddressErrors]) {
      e.currentTarget.style.borderColor = "rgba(51,51,51,0.15)";
    }
    e.currentTarget.style.background = "var(--off-white)";
  };

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-[1.4rem] font-normal text-(--charcoal) mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Delivery <em style={{ color: "var(--red)" }}>Address</em>
        </h2>
        <p className="font-mono text-[11px] text-(--charcoal-soft)">
          Fill in your shipping details below
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--charcoal-soft)" }}>
            Full Name *
          </label>
          <input
            name="fullName"
            type="text"
            value={value.fullName ?? ""}
            onChange={(e) => { onChange({ ...value, fullName: e.target.value }); clearField("fullName"); }}
            placeholder="Ayşe Yılmaz"
            style={inputStyle("fullName")}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {errors.fullName && <p className="mt-1 text-[11px] font-mono" style={{ color: "var(--red)" }}>{errors.fullName}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--charcoal-soft)" }}>
            Phone *
          </label>
          <input
            name="phone"
            type="tel"
            value={value.phone ?? ""}
            onChange={(e) => { onChange({ ...value, phone: e.target.value }); clearField("phone"); }}
            placeholder="+90 5xx xxx xx xx"
            style={inputStyle("phone")}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {errors.phone && <p className="mt-1 text-[11px] font-mono" style={{ color: "var(--red)" }}>{errors.phone}</p>}
        </div>
      </div>

      {/* Address Line */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--charcoal-soft)" }}>
          Address *
        </label>
        <input
          name="addressLine"
          type="text"
          value={value.addressLine ?? ""}
          onChange={(e) => { onChange({ ...value, addressLine: e.target.value }); clearField("addressLine"); }}
          placeholder="Street, apartment, floor..."
          style={inputStyle("addressLine")}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {errors.addressLine && <p className="mt-1 text-[11px] font-mono" style={{ color: "var(--red)" }}>{errors.addressLine}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* City */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--charcoal-soft)" }}>
            City *
          </label>
          <input
            name="city"
            type="text"
            value={value.city ?? ""}
            onChange={(e) => { onChange({ ...value, city: e.target.value }); clearField("city"); }}
            placeholder="İstanbul"
            style={inputStyle("city")}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {errors.city && <p className="mt-1 text-[11px] font-mono" style={{ color: "var(--red)" }}>{errors.city}</p>}
        </div>

        {/* District (optional) */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--charcoal-soft)" }}>
            District
          </label>
          <input
            name="district"
            type="text"
            value={value.district ?? ""}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
            placeholder="Kadıköy"
            style={fieldStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] mb-2 block" style={{ color: "var(--charcoal-soft)" }}>
            Postal Code *
          </label>
          <input
            name="postalCode"
            type="text"
            value={value.postalCode ?? ""}
            onChange={(e) => { onChange({ ...value, postalCode: e.target.value }); clearField("postalCode"); }}
            placeholder="34700"
            style={inputStyle("postalCode")}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {errors.postalCode && <p className="mt-1 text-[11px] font-mono" style={{ color: "var(--red)" }}>{errors.postalCode}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all"
        style={{
          background: "var(--charcoal)",
          fontFamily: "var(--font-body)",
          boxShadow: "0 4px 16px rgba(51,51,51,0.15)",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--red)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--charcoal)")}
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
  isLoading = false,
}: {
  address: Partial<ShippingAddress>;
  merchantId?: string;
  value: ShippingRate | null;
  onChange: (r: ShippingRate) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}) {
  const cityCoords = resolveCityCoords(address.city);
  const canProceed = !!value && !isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-[1.4rem] font-normal text-(--charcoal) mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Shipping <em style={{ color: "var(--red)" }}>Options</em>
        </h2>
        <p className="font-mono text-[11px] text-(--charcoal-soft)">
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
          <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--red)" }} />
          <span className="text-(--charcoal-soft) text-[13px]" style={{ fontFamily: "var(--font-body)" }}>
            {[address.addressLine, address.district, address.city].filter(Boolean).join(", ")}
          </span>
          {cityCoords && (
            <span
              className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded-full shrink-0"
              style={{ color: "#2d7a4f", background: "rgba(45,122,79,0.08)" }}
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
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
          style={{
            border: "1.5px solid rgba(51,51,51,0.15)",
            color: "var(--charcoal)",
            background: "transparent",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              (e.currentTarget as HTMLElement).style.background = "var(--off-white)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--charcoal)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(51,51,51,0.15)";
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--charcoal)",
            fontFamily: "var(--font-body)",
            boxShadow: canProceed ? "0 4px 16px rgba(51,51,51,0.15)" : "none",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => {
            if (canProceed) e.currentTarget.style.background = "var(--red)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--charcoal)";
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating order…
            </>
          ) : (
            <>
              Continue to Payment
              <ArrowRight className="w-4 h-4" />
            </>
          )}
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

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("address");
  // address is kept local (Partial) while the form is being filled;
  // the validated ShippingAddress is synced to the store on step advance.
  const [address, setAddress] = useState<Partial<ShippingAddress>>({
    fullName: user?.name ?? "",
    phone: "",
  });
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>("REGULAR");

  // ── Persistent checkout state (Zustand) ────────────────────────────────────
  const {
    orderId,
    setOrderResult,
    isSubmitting: creatingOrder,
    setSubmitting: setCreatingOrder,
    error: orderError,
    setError: setOrderError,
    setShippingAddress,
    reset: resetCheckout,
  } = useCheckout();

  // Stable idempotency key: one UUID per checkout session so that retrying
  // "Continue to Payment" never creates a duplicate pending order.
  // The backend IdempotencyMiddleware caches the first 2xx response against this key.
  const idempotencyKey = useRef(crypto.randomUUID());

  const merchantId = items[0]?.merchantId;

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  // Reset store state when the user leaves checkout without completing payment.
  // This prevents stale errors/orderId from showing on the next checkout visit.
  useEffect(() => {
    return () => { resetCheckout(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // If an order was already created (e.g. user went back from payment step),
    // reuse it instead of creating a duplicate pending order.
    if (orderId) {
      goNext();
      return;
    }

    setCreatingOrder(true);
    setOrderError(null);
    try {
      const { data } = await api.post<{ orderId: string }>(
        "/api/orders",
        {
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            ...(i.variantId ? { variantId: i.variantId } : {}),
          })),
          shippingAddress: address,
          shippingRate,
          source: "MARKETPLACE",
        },
        { headers: { "X-Idempotency-Key": idempotencyKey.current } },
      );
      // Sync validated address and orderId to persistent store
      if (address.fullName && address.addressLine && address.city && address.postalCode && address.phone) {
        setShippingAddress(address as ShippingAddress);
      }
      setOrderResult(data.orderId, "");
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

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--off-white)" }}>
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white border border-(--border-light) flex items-center justify-center mx-auto">
            <Package className="w-5 h-5 text-(--charcoal-soft)" />
          </div>
          <p className="font-mono text-[12px] uppercase tracking-widest text-(--charcoal-soft)">
            Redirecting to cart…
          </p>
        </div>
      </div>
    );
  }

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
            type="button"
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
              className="text-[1rem] font-bold text-(--charcoal)"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Checkout
            </h1>
          </div>
          {/* Security badge — hidden on xs to avoid overflow */}
          <div
            className="hidden sm:flex font-mono text-[10px] items-center gap-1.5 px-3 py-1.5 rounded-full"
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
                    isLoading={creatingOrder}
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
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {orderError}
                    </div>
                  )}
                </div>
              )}

              {step === "payment" && orderId && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2
                        className="text-[1.4rem] font-normal text-(--charcoal) mb-1"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        Secure <em style={{ color: "var(--red)" }}>Payment</em>
                      </h2>
                      <p className="font-mono text-[11px] text-(--charcoal-soft)">
                        Powered by Stripe — your data is safe
                      </p>
                    </div>
                    <button
                      type="button"
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
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <CartSummary readonly={step !== "address"} />

            {/* Trust badges */}
            <div
              className="bg-white rounded-2xl p-5 space-y-3 opacity-50 grayscale
                          hover:opacity-100 hover:grayscale-0 transition-all duration-500"
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
                      className="text-[12px] font-bold text-(--charcoal)"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {badge.title}
                    </p>
                    <p className="font-mono text-[10px] text-(--charcoal-soft)">
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
