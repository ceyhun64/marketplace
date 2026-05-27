"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Package, Truck, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TrackPage() {
  const router = useRouter();
  const [trackingNo, setTrackingNo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trackingNo.trim();
    if (trimmed) {
      router.push(`/track/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <main
      className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "var(--off-white)" }}
    >
      {/* Icon strip */}
      <div className="flex items-center gap-6 mb-10">
        {[
          { Icon: Package, label: "Order Placed" },
          { Icon: Truck, label: "In Transit" },
          { Icon: MapPin, label: "Delivered" },
        ].map(({ Icon, label }, i) => (
          <div key={i} className="flex flex-col items-center gap-2 opacity-60">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--charcoal)", color: "var(--white)" }}
            >
              <Icon size={20} strokeWidth={2} />
            </div>
            <span
              className="text-[11px] font-medium"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Heading */}
      <h1
        className="text-3xl font-bold text-center mb-2"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--charcoal)",
        }}
      >
        Track Your Order
      </h1>
      <p
        className="text-sm text-center mb-8 max-w-xs"
        style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
      >
        Enter your tracking number to see real‑time delivery status.
      </p>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex gap-2"
        aria-label="Order tracking form"
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--charcoal-mist)" }}
          />
          <Input
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
            placeholder="e.g. TRK-20250516-ABCD"
            className="pl-9 h-11 rounded-xl text-sm"
            style={{ fontFamily: "var(--font-body)" }}
            aria-label="Tracking number"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={!trackingNo.trim()}
          className="px-5 h-11 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--charcoal)",
            color: "var(--white)",
            fontFamily: "var(--font-body)",
          }}
        >
          Track
        </button>
      </form>

      {/* Helper text */}
      <p
        className="mt-4 text-xs text-center"
        style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
      >
        Tracking numbers can be found in your order confirmation email or{" "}
        <Link
          href="/orders"
          className="underline underline-offset-2 hover:text-(--charcoal)"
          style={{ color: "var(--charcoal-soft)" }}
        >
          My Orders
        </Link>
        .
      </p>
    </main>
  );
}
