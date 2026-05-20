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
    <section
      style={{
        background: "var(--charcoal)",
        padding: "0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "2.5rem 2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0",
          }}
        >
          {BADGES.map((badge, i) => (
            <div
              key={badge.title}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "1rem 1.5rem",
                borderRight:
                  i < BADGES.length - 1
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "none",
              }}
              className="last:border-r-0"
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
