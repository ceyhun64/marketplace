"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Gift,
  Zap,
  Crown,
  ChevronRight,
  Check,
  ShoppingBag,
  Truck,
  RotateCcw,
  HeartHandshake,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const TIERS = [
  {
    id: "bronze",
    label: "Bronze",
    minPoints: 0,
    maxPoints: 999,
    color: "#cd7f32",
    bg: "rgba(205,127,50,0.08)",
    border: "rgba(205,127,50,0.25)",
    perks: [
      "Earn 1 point per ₺10 spent",
      "Birthday bonus: +50 points",
      "Early access to flash sales",
    ],
    multiplier: "1×",
  },
  {
    id: "silver",
    label: "Silver",
    minPoints: 1000,
    maxPoints: 4999,
    color: "#9ca3af",
    bg: "rgba(156,163,175,0.08)",
    border: "rgba(156,163,175,0.25)",
    perks: [
      "Earn 1.5× points on all purchases",
      "Free standard shipping on orders ₺200+",
      "Priority customer support",
      "Exclusive member-only discounts",
    ],
    multiplier: "1.5×",
  },
  {
    id: "gold",
    label: "Gold",
    minPoints: 5000,
    maxPoints: 19999,
    color: "#eab308",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.25)",
    perks: [
      "Earn 2× points on all purchases",
      "Free express shipping on every order",
      "Dedicated account manager",
      "Access to Gold-only promotions",
      "Early access to new products",
    ],
    multiplier: "2×",
    popular: true,
  },
  {
    id: "platinum",
    label: "Platinum",
    minPoints: 20000,
    maxPoints: Infinity,
    color: "#c8102e",
    bg: "rgba(200,16,46,0.07)",
    border: "rgba(200,16,46,0.22)",
    perks: [
      "Earn 3× points on all purchases",
      "Free express shipping + priority packaging",
      "Exclusive Platinum-only products",
      "Quarterly gift boxes",
      "VIP event invitations",
      "Personalized shopping advisor",
    ],
    multiplier: "3×",
  },
];

const HOW_IT_WORKS = [
  {
    icon: ShoppingBag,
    title: "Shop & Earn",
    desc: "Earn points on every purchase. Your tier determines how fast points accumulate.",
    color: "var(--red)",
  },
  {
    icon: Star,
    title: "Level Up",
    desc: "Accumulate points to reach higher tiers and unlock increasingly valuable perks.",
    color: "#eab308",
  },
  {
    icon: Gift,
    title: "Redeem Rewards",
    desc: "Spend points on discounts, free products, or exclusive experiences.",
    color: "#0d7a4e",
  },
];

const WAYS_TO_EARN = [
  { action: "Make a purchase", points: "1 pt per ₺10", icon: ShoppingBag },
  { action: "Write a product review", points: "+25 pts", icon: Star },
  { action: "Refer a friend", points: "+100 pts", icon: HeartHandshake },
  { action: "Birthday month bonus", points: "+50 pts", icon: Sparkles },
  { action: "First purchase of the month", points: "+30 pts", icon: Zap },
  { action: "Follow on social media", points: "+10 pts", icon: Gift },
];

const REDEEM_OPTIONS = [
  { label: "₺10 Discount", points: 200, desc: "Off your next order" },
  { label: "₺25 Discount", points: 450, desc: "Off your next order" },
  { label: "Free Shipping", points: 150, desc: "On any single order" },
  { label: "₺100 Discount", points: 1800, desc: "Off your next order" },
  { label: "Mystery Box", points: 2500, desc: "Curated surprise products" },
  { label: "₺250 Discount", points: 4200, desc: "Off your next order" },
];

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"earn" | "redeem" | "tiers">(
    "tiers",
  );

  // Mock user points for demonstration
  const userPoints = user ? 1240 : null;
  const userTier =
    userPoints !== null
      ? (TIERS.find(
          (t) => userPoints >= t.minPoints && userPoints <= t.maxPoints,
        ) ?? TIERS[0])
      : null;
  const nextTier = userTier
    ? (TIERS[TIERS.findIndex((t) => t.id === userTier.id) + 1] ?? null)
    : null;
  const progressPct =
    userTier && nextTier
      ? Math.min(
          100,
          ((userPoints! - userTier.minPoints) /
            (nextTier.minPoints - userTier.minPoints)) *
            100,
        )
      : userTier?.id === "platinum"
        ? 100
        : 0;

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <section
        style={{
          background: "var(--charcoal)",
          color: "var(--white)",
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(200,16,46,0.18) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(200,16,46,0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(200,16,46,0.15)",
              border: "1px solid rgba(200,16,46,0.3)",
              borderRadius: 100,
              padding: "0.375rem 1rem",
              marginBottom: "1.5rem",
            }}
          >
            <Crown className="w-3.5 h-3.5" style={{ color: "#eab308" }} />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "#eab308",
              }}
            >
              LOYALTY REWARDS PROGRAM
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: "1.25rem",
            }}
          >
            Every Purchase
            <br />
            <span style={{ color: "var(--red-light)" }}>Earns You More</span>
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "rgba(255,255,255,0.65)",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
            }}
          >
            Join thousands of members earning points on every order. The more
            you shop, the higher your tier — and the better your rewards.
          </p>
          {!user ? (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--red)",
                  color: "white",
                  padding: "0.875rem 2rem",
                  borderRadius: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                }}
              >
                Join for Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(255,255,255,0.08)",
                  color: "white",
                  padding: "0.875rem 2rem",
                  borderRadius: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontSize: "0.9375rem",
                }}
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 20,
                padding: "1.75rem 2rem",
                maxWidth: 480,
                margin: "0 auto",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    YOUR BALANCE
                  </div>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "#eab308",
                    }}
                  >
                    {userPoints?.toLocaleString()} pts
                  </div>
                </div>
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: 100,
                    background: userTier?.bg,
                    border: `1px solid ${userTier?.border}`,
                    color: userTier?.color,
                    fontWeight: 700,
                    fontSize: "0.875rem",
                  }}
                >
                  {userTier?.label}
                </div>
              </div>
              {nextTier && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span>{userPoints} pts</span>
                    <span>
                      {nextTier.minPoints} pts to {nextTier.label}
                    </span>
                  </div>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 100,
                      height: 6,
                    }}
                  >
                    <div
                      style={{
                        width: `${progressPct}%`,
                        background: "var(--red)",
                        borderRadius: 100,
                        height: "100%",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.45)",
                      marginTop: "0.5rem",
                    }}
                  >
                    {(nextTier.minPoints - userPoints!).toLocaleString()} more
                    points to {nextTier.label}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "4rem 1.5rem 2rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "2rem",
            fontWeight: 600,
            textAlign: "center",
            marginBottom: "2.5rem",
            color: "var(--charcoal)",
          }}
        >
          How It Works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {HOW_IT_WORKS.map((item, i) => (
            <div
              key={i}
              style={{
                background: "var(--white)",
                borderRadius: 20,
                padding: "2rem",
                border: "1px solid var(--border-light)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${item.color}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.25rem",
                }}
              >
                <item.icon
                  style={{ width: 24, height: 24, color: item.color }}
                />
              </div>
              <h3
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  color: "var(--charcoal)",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--charcoal-soft)",
                  lineHeight: 1.7,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "2rem 1.5rem 5rem",
        }}
      >
        {/* Tab nav */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "2rem",
            borderBottom: "1px solid var(--border-light)",
            paddingBottom: "0",
          }}
        >
          {(["tiers", "earn", "redeem"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                color:
                  activeTab === tab ? "var(--red)" : "var(--charcoal-soft)",
                borderBottom:
                  activeTab === tab
                    ? "2px solid var(--red)"
                    : "2px solid transparent",
                marginBottom: -1,
                transition: "color 0.15s, border-color 0.15s",
                textTransform: "capitalize",
              }}
            >
              {tab === "tiers"
                ? "Member Tiers"
                : tab === "earn"
                  ? "Ways to Earn"
                  : "Redeem Points"}
            </button>
          ))}
        </div>

        {/* Tiers */}
        {activeTab === "tiers" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                style={{
                  background: "var(--white)",
                  border: tier.popular
                    ? `2px solid ${tier.color}`
                    : "1px solid var(--border-light)",
                  borderRadius: 20,
                  padding: "1.75rem",
                  position: "relative",
                  boxShadow: tier.popular
                    ? `0 4px 24px ${tier.color}22`
                    : "none",
                }}
              >
                {tier.popular && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: tier.color,
                      color: "white",
                      padding: "0.25rem 0.875rem",
                      borderRadius: 100,
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: tier.bg,
                    border: `1px solid ${tier.border}`,
                    borderRadius: 100,
                    padding: "0.375rem 1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <Crown style={{ width: 14, height: 14, color: tier.color }} />
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: tier.color,
                    }}
                  >
                    {tier.label}
                  </span>
                </div>
                <div style={{ marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "var(--charcoal)",
                    }}
                  >
                    {tier.multiplier}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--charcoal-soft)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    points
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--charcoal-mist)",
                    marginBottom: "1.5rem",
                  }}
                >
                  {tier.maxPoints === Infinity
                    ? `${tier.minPoints.toLocaleString()}+ pts`
                    : `${tier.minPoints.toLocaleString()}–${tier.maxPoints.toLocaleString()} pts`}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.625rem",
                  }}
                >
                  {tier.perks.map((perk, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.625rem",
                        fontSize: "0.875rem",
                        color: "var(--charcoal)",
                      }}
                    >
                      <Check
                        style={{
                          width: 15,
                          height: 15,
                          color: tier.color,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Ways to Earn */}
        {activeTab === "earn" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {WAYS_TO_EARN.map((item, i) => (
              <div
                key={i}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 16,
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "var(--red-muted)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <item.icon
                    style={{ width: 20, height: 20, color: "var(--red)" }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      color: "var(--charcoal)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.action}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--red)",
                      fontWeight: 700,
                    }}
                  >
                    {item.points}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Redeem */}
        {activeTab === "redeem" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {REDEEM_OPTIONS.map((opt, i) => (
              <div
                key={i}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 16,
                  padding: "1.5rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "1.375rem",
                    fontWeight: 800,
                    color: "var(--charcoal)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--charcoal-soft)",
                    marginBottom: "1rem",
                  }}
                >
                  {opt.desc}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    background: "var(--red-muted)",
                    padding: "0.375rem 1rem",
                    borderRadius: 100,
                    marginBottom: "1.25rem",
                  }}
                >
                  <Star
                    style={{
                      width: 13,
                      height: 13,
                      color: "var(--red)",
                      fill: "var(--red)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      color: "var(--red)",
                    }}
                  >
                    {opt.points.toLocaleString()} pts
                  </span>
                </div>
                <button
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    background: user ? "var(--charcoal)" : "var(--off-white-2)",
                    color: user ? "white" : "var(--charcoal-mist)",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: user ? "pointer" : "default",
                  }}
                >
                  {user ? "Redeem" : "Sign in to redeem"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
