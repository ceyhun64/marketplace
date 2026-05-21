"use client";

import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CreditCard,
  Lock,
} from "lucide-react";

const BADGES = [
  {
    icon: <Truck className="w-5 h-5" />,
    title: "Free Shipping",
    subtitle: "On orders over $500",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Buyer Protection",
    subtitle: "100% purchase guarantee",
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    title: "Easy Returns",
    subtitle: "30-day hassle-free returns",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Secure Payment",
    subtitle: "256-bit SSL encryption",
  },
  {
    icon: <Headphones className="w-5 h-5" />,
    title: "24/7 Support",
    subtitle: "Always here to help",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Privacy First",
    subtitle: "Your data stays private",
  },
];

export default function TrustBadges() {
  return (
    <section className="bg-(--charcoal) overflow-hidden">
      <div className="max-w-325 mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {BADGES.map((badge, i) => (
            <div
              key={badge.title}
              className="flex items-center gap-3.5 px-4 py-4 sm:px-6"
              style={{
                borderRight:
                  i < BADGES.length - 1
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "none",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(200,16,46,0.15)",
                  border: "1px solid rgba(200,16,46,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--red-light)",
                  flexShrink: 0,
                }}
              >
                {badge.icon}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.3,
                  }}
                >
                  {badge.title}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.6875rem",
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {badge.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
