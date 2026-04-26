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
import { ArrowLeft, ArrowRight, MapPin, Truck, CreditCard } from "lucide-react";
import type { ShippingRate } from "@/types/enums";
import type { ShippingAddress } from "@/types/entities";

// ── Step definitions ──────────────────────────────────────────────────────────

type Step = "address" | "shipping" | "payment";
const STEPS: Step[] = ["address", "shipping", "payment"];

const STEP_LABEL: Record<Step, string> = {
  address: "Delivery Address",
  shipping: "Shipping",
  payment: "Payment",
};

const STEP_ICON: Record<Step, React.ReactNode> = {
  address: <MapPin className="w-4 h-4" />,
  shipping: <Truck className="w-4 h-4" />,
  payment: <CreditCard className="w-4 h-4" />,
};

// ── Address form validation ───────────────────────────────────────────────────

function validateAddress(form: Partial<ShippingAddress>): string | null {
  if (!form.fullName?.trim()) return "Full name is required.";
  if (!form.phone?.trim()) return "Phone number is required.";
  if (!form.addressLine?.trim()) return "Address is required.";
  if (!form.city?.trim()) return "City is required.";
  if (!form.postalCode?.trim()) return "Postal code is required.";
  return null;
}

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({
  current,
  steps,
}: {
  current: Step;
  steps: Step[];
}) {
  const currentIdx = steps.indexOf(current);
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active
                  ? "bg-gray-900 text-white"
                  : done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {done ? "✓" : STEP_ICON[step]}
              <span className="hidden sm:inline">{STEP_LABEL[step]}</span>
              <span className="sm:hidden">{idx + 1}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-px ${done ? "bg-emerald-300" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Address Step ──────────────────────────────────────────────────────────────

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

  const field = (label: string, key: keyof ShippingAddress, placeholder?: string) => (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <Input
        value={(value[key] as string) ?? ""}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        placeholder={placeholder}
        className="border-gray-200"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Delivery Address</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {field("Full Name", "fullName", "Jane Doe")}
        {field("Phone", "phone", "+90 5xx xxx xx xx")}
      </div>
      {field("Address", "addressLine", "Street, apartment, floor...")}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {field("City", "city", "Istanbul")}
        {field("District", "district", "Kadıköy")}
        {field("Postal Code", "postalCode", "34700")}
      </div>
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <Button className="w-full gap-2" onClick={handleNext}>
        Continue to Shipping
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Shipping Step — integrates ShippingRateSelect (Milestone 2) ────────────────

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
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Shipping Option</h2>

      {/* Destination summary */}
      {address.city && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <span>
            {[address.addressLine, address.district, address.city]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
      )}

      {/* ShippingRateSelect — fetches real ETA from backend via Haversine calc */}
      <ShippingRateSelect
        merchantId={merchantId ?? ""}
        value={value}
        onChange={onChange}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          className="flex-1 gap-2"
          disabled={!value}
          onClick={onNext}
        >
          Continue to Payment
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Main CheckoutPage ─────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();

  const [step, setStep] = useState<Step>("address");
  const [address, setAddress] = useState<Partial<ShippingAddress>>({
    fullName: user ? `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim() : "",
    phone: (user as any)?.phone ?? "",
  });
  const [shippingRate, setShippingRate] = useState<ShippingRate | null>("REGULAR");

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  // Merchant from first cart item — used for ETA calculation
  const merchantId = items[0]?.merchantId;

  const goNext = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx < STEPS.length - 1) setStep(STEPS[currentIdx + 1]);
  };

  const goBack = () => {
    const currentIdx = STEPS.indexOf(step);
    if (currentIdx > 0) setStep(STEPS[currentIdx - 1]);
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(51,51,51,0.08)", background: "#fff" }}>
        <div className="max-w-4xl mx-auto px-4 py-5">
          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Left — steps */}
          <div>
            <StepIndicator current={step} steps={STEPS} />

            <div
              className="bg-white rounded-2xl p-6"
              style={{ border: "1px solid rgba(51,51,51,0.08)" }}
            >
              {step === "address" && (
                <AddressStep
                  value={address}
                  onChange={setAddress}
                  onNext={goNext}
                />
              )}

              {step === "shipping" && (
                <ShippingStep
                  address={address}
                  merchantId={merchantId}
                  value={shippingRate}
                  onChange={setShippingRate}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {step === "payment" && shippingRate && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Payment</h2>
                    <button
                      onClick={goBack}
                      className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>
                  </div>
                  <PaymentForm
                    merchantId={merchantId ?? ""}
                    shippingAddress={address as ShippingAddress}
                    shippingRate={shippingRate}
                    source="MARKETPLACE"
                    onSuccess={(orderId) => {
                      router.push(`/orders/${orderId}/tracking`);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right — cart summary */}
          <div className="space-y-4">
            <CartSummary readonly={step !== "address"} />
          </div>
        </div>
      </div>
    </div>
  );
}
