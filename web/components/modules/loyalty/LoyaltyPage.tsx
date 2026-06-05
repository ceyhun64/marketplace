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
  Lock,
  Home,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// ── Static data ───────────────────────────────────────────────────────────────
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
      "Earn 1 point per $10 spent",
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
      "Free standard shipping on orders $200+",
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
  { icon: ShoppingBag,   title: "Shop & Earn",     desc: "Earn points on every purchase. Your tier determines how fast points accumulate.", color: "var(--red)"  },
  { icon: Star,          title: "Level Up",         desc: "Accumulate points to reach higher tiers and unlock increasingly valuable perks.", color: "#eab308" },
  { icon: Gift,          title: "Redeem Rewards",   desc: "Spend points on discounts, free products, or exclusive experiences.",           color: "#16a34a" },
];

const WAYS_TO_EARN = [
  { action: "Make a purchase",          points: "1 pt per $10", icon: ShoppingBag    },
  { action: "Write a product review",   points: "+25 pts",      icon: Star           },
  { action: "Refer a friend",           points: "+100 pts",     icon: HeartHandshake },
  { action: "Birthday month bonus",     points: "+50 pts",      icon: Sparkles       },
  { action: "First purchase of month",  points: "+30 pts",      icon: Zap            },
  { action: "Follow on social media",   points: "+10 pts",      icon: Gift           },
];

const REDEEM_OPTIONS = [
  { label: "$10 Discount",   points: 200,  desc: "Off your next order"    },
  { label: "$25 Discount",   points: 450,  desc: "Off your next order"    },
  { label: "Free Shipping",  points: 150,  desc: "On any single order"    },
  { label: "$100 Discount",  points: 1800, desc: "Off your next order"    },
  { label: "Mystery Box",    points: 2500, desc: "Curated surprise items"  },
  { label: "$250 Discount",  points: 4200, desc: "Off your next order"    },
];

const TIER_SCALE_MAX = 20000;

// ── Hero tier badge visual ────────────────────────────────────────────────────
const HERO_BADGES = [
  { label: "Bronze",   color: "#cd7f32", size: 68,  x: 0,   y: 80  },
  { label: "Silver",   color: "#9ca3af", size: 78,  x: 55,  y: 50  },
  { label: "Gold",     color: "#eab308", size: 88,  x: 118, y: 20  },
  { label: "Platinum", color: "#c8102e", size: 100, x: 188, y: 0   },
];

function HeroTierVisual() {
  return (
    <div className="relative select-none hidden lg:block shrink-0" style={{ width: 300, height: 195 }}>
      {HERO_BADGES.map((b) => (
        <div
          key={b.label}
          style={{
            position: "absolute",
            left: b.x, top: b.y,
            width: b.size, height: b.size,
            borderRadius: "50%",
            background: `radial-gradient(circle at 38% 35%, ${b.color}dd, ${b.color}77)`,
            border: `2px solid ${b.color}55`,
            boxShadow: `0 8px 24px ${b.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          <Crown style={{ width: b.size * 0.28, height: b.size * 0.28, color: "white", opacity: 0.95 }} />
          <span style={{ color: "white", fontSize: b.size * 0.145, fontWeight: 800, letterSpacing: "0.02em", opacity: 0.9 }}>
            {b.label}
          </span>
        </div>
      ))}
      {/* Sparkle decorations */}
      <Star  style={{ position:"absolute", top:-6,  right:8,   width:14, height:14, color:"rgba(255,220,0,0.6)", fill:"rgba(255,220,0,0.6)" }} />
      <Sparkles style={{ position:"absolute", bottom:-4, left:-8, width:13, height:13, color:"rgba(255,255,255,0.4)" }} />
      <Star  style={{ position:"absolute", top:40,  left:-14, width:10, height:10, color:"rgba(234,179,8,0.5)", fill:"rgba(234,179,8,0.5)" }} />
    </div>
  );
}

// ── Progress tracker ──────────────────────────────────────────────────────────
function ProgressTracker({ userPoints }: { userPoints: number }) {
  const currentTier =
    TIERS.find((t) => userPoints >= t.minPoints && userPoints <= t.maxPoints) ?? TIERS[0];
  const nextTier    = TIERS[TIERS.findIndex((t) => t.id === currentTier.id) + 1] ?? null;
  const isPlatinum  = currentTier.id === "platinum";

  const progressPct = isPlatinum
    ? 100
    : nextTier
      ? Math.min(100, ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100)
      : 0;

  const pointsToNext = nextTier ? nextTier.minPoints - userPoints : 0;

  const milestones = (() => {
    if (!nextTier) return [];
    const range = nextTier.minPoints - currentTier.minPoints;
    const step  = range / 4;
    return [1, 2, 3].map((i) => ({ pts: Math.round(currentTier.minPoints + step * i), pct: (i / 4) * 100 }));
  })();

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", maxWidth: 540, margin: "0 auto", textAlign: "left" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Your Balance</div>
          <div className="text-[2rem] font-bold" style={{ color: "#eab308" }}>
            {userPoints.toLocaleString()}{" "}
            <span className="text-[1rem] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>pts</span>
          </div>
        </div>
        <div className="px-4 py-2 rounded-full flex items-center gap-2" style={{ background: currentTier.bg, border: `1px solid ${currentTier.border}` }}>
          <Crown className="w-4 h-4" style={{ color: currentTier.color }} />
          <span className="font-bold text-sm" style={{ color: currentTier.color }}>{currentTier.label}</span>
        </div>
      </div>

      {/* Full tier track */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-jetbrains)" }}>
          {TIERS.map((t) => (
            <span key={t.id} style={{ color: t.id === currentTier.id ? t.color : undefined }} className={t.id === currentTier.id ? "font-bold" : ""}>
              {t.label}
            </span>
          ))}
        </div>
        <div className="relative h-3 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="absolute left-0 top-0 h-3 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (userPoints / TIER_SCALE_MAX) * 100)}%`, background: "linear-gradient(90deg, #cd7f32, #9ca3af, #eab308, #c8102e)" }}
          />
          {TIERS.slice(1).map((t) => {
            const pct     = (t.minPoints / TIER_SCALE_MAX) * 100;
            const reached = userPoints >= t.minPoints;
            return (
              <div key={t.id} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${pct}%` }}>
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: reached ? t.color : "rgba(255,255,255,0.2)", background: reached ? t.color : "rgba(30,30,30,0.8)" }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-jetbrains)" }}>
          <span>0</span>
          {TIERS.slice(1).map((t) => (
            <span key={t.id} style={{ color: userPoints >= t.minPoints ? t.color : undefined }}>
              {t.minPoints >= 1000 ? `${t.minPoints / 1000}k` : t.minPoints}
            </span>
          ))}
        </div>
      </div>

      {/* Progress to next */}
      {nextTier && (
        <div>
          <div className="flex justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
            <span>{userPoints.toLocaleString()} pts</span>
            <span className="font-semibold" style={{ color: nextTier.color }}>{nextTier.minPoints.toLocaleString()} pts → {nextTier.label}</span>
          </div>
          <div className="relative h-2 rounded-full mb-1" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: nextTier.color }} />
            {milestones.map((m) => (
              <div key={m.pts} className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 opacity-25" style={{ left: `${m.pct}%`, background: "white" }} />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {pointsToNext.toLocaleString()} more pts to{" "}
              <strong style={{ color: nextTier.color }}>{nextTier.label}</strong>
            </span>
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{Math.round(progressPct)}%</span>
          </div>
          <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: nextTier.color }}>Unlocks at {nextTier.label}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{nextTier.perks[0]}</p>
          </div>
        </div>
      )}

      {isPlatinum && (
        <div className="mt-3 flex items-center gap-2 justify-center text-sm font-semibold" style={{ color: "#eab308" }}>
          <Trophy className="w-4 h-4" />
          You&rsquo;re at the top tier — Platinum!
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoyaltyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"earn" | "redeem" | "tiers">("tiers");

  const userPoints = user ? 1240 : null;
  const userTier   = userPoints !== null
    ? (TIERS.find((t) => userPoints >= t.minPoints && userPoints <= t.maxPoints) ?? TIERS[0])
    : null;

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-4 py-20"
        style={{ background: "var(--charcoal)" }}
      >
        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 25% 55%, rgba(200,16,46,0.16) 0%, transparent 55%), " +
                      "radial-gradient(ellipse at 75% 30%, rgba(234,179,8,0.08) 0%, transparent 50%)",
        }} />
        {/* Faint dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{
          backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16">
          {/* Left: text */}
          <div className="flex-1">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 mb-7 text-[12px]" style={{ color: "var(--charcoal-soft)" }}>
              <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
                <Home className="w-3 h-3" />Home
              </Link>
              <ChevronRight className="w-3 h-3 opacity-40" />
              <span className="text-white font-semibold">Loyalty Rewards</span>
            </nav>

            {/* Label */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
              style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)" }}
            >
              <Crown className="w-3.5 h-3.5" style={{ color: "#eab308" }} />
              <span className="text-xs font-bold uppercase tracking-[0.06em]" style={{ color: "#eab308" }}>
                Loyalty Rewards Program
              </span>
            </div>

            <h1
              className="text-white leading-[1.05] mb-5"
              style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(2.5rem, 5.5vw, 4rem)", fontWeight: 600 }}
            >
              Every Purchase
              <br />
              <span style={{ color: "var(--red-light)" }}>Earns You More</span>
            </h1>

            <p className="text-[1.0625rem] leading-relaxed mb-8 max-w-md" style={{ color: "rgba(255,255,255,0.55)" }}>
              Join thousands of members earning points on every order.
              The more you shop, the higher your tier — and the better your rewards.
            </p>

            {/* Tier quick summary */}
            <div className="flex items-center gap-3 mb-8 flex-wrap">
              {TIERS.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `${t.color}15`, border: `1px solid ${t.color}35`, color: t.color }}
                >
                  <Crown className="w-3 h-3" />
                  {t.label}
                </div>
              ))}
            </div>

            {/* CTAs */}
            {!user ? (
              <div className="flex items-center gap-3 flex-wrap">
                <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white text-[0.9375rem] transition-all hover:opacity-90" style={{ background: "#c8102e" }}>
                  Join for Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/auth/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-[0.9375rem] transition-all" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
                  Sign In
                </Link>
              </div>
            ) : null}
          </div>

          {/* Right: tier visual OR progress tracker */}
          <div className="shrink-0 flex justify-center lg:justify-end">
            {user ? (
              <div className="w-full max-w-lg lg:max-w-none lg:w-auto">
                <ProgressTracker userPoints={userPoints!} />
              </div>
            ) : (
              <HeroTierVisual />
            )}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-14">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4" style={{ color: "var(--red)" }} />
          <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--charcoal-soft)" }}>
            Simple Process
          </span>
        </div>
        <h2 className="mb-8" style={{ fontFamily: "var(--font-cormorant)", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 600, color: "var(--charcoal)" }}>
          How It Works
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl p-7" style={{ background: "white", border: "1px solid var(--border-light)" }}>
              <span className="absolute top-4 right-5 font-black leading-none select-none" style={{ fontSize: "4.5rem", color: "rgba(0,0,0,0.035)", fontFamily: "var(--font-cormorant)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${item.color}12` }}>
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-[1.0625rem] mb-2" style={{ color: "var(--charcoal)" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--charcoal-soft)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="flex gap-1.5 mb-8 p-1 rounded-xl w-fit" style={{ background: "var(--off-white-2)", border: "1px solid var(--border-light)" }}>
          {(["tiers", "earn", "redeem"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all"
              style={{
                background: activeTab === tab ? "white" : "transparent",
                color:      activeTab === tab ? "var(--charcoal)" : "var(--charcoal-soft)",
                boxShadow:  activeTab === tab ? "0 1px 4px rgba(30,30,30,0.08)" : "none",
              }}
            >
              {tab === "tiers" ? "Tier Benefits" : tab === "earn" ? "Ways to Earn" : "Redeem Points"}
            </button>
          ))}
        </div>

        {/* ── Tiers ───────────────────────────────────────────────────── */}
        {activeTab === "tiers" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((tier) => {
              const isCurrentTier = userTier?.id === tier.id;
              const tierIdx       = TIERS.findIndex((t) => t.id === tier.id);
              const userTierIdx   = userTier ? TIERS.findIndex((t) => t.id === userTier.id) : -1;
              const isLocked      = user ? tierIdx > userTierIdx : true;

              return (
                <div
                  key={tier.id}
                  className="relative rounded-2xl p-7"
                  style={{
                    background: "white",
                    border: isCurrentTier ? `2px solid ${tier.color}` : tier.popular ? `2px solid ${tier.color}` : "1px solid var(--border-light)",
                    boxShadow: isCurrentTier ? `0 4px 24px ${tier.color}22` : "var(--shadow-sm)",
                    opacity: !user || isLocked ? 0.75 : 1,
                  }}
                >
                  {(isCurrentTier || tier.popular) && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: tier.color, color: "white",
                      padding: "0.25rem 0.875rem", borderRadius: 100,
                      fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap",
                    }}>
                      {isCurrentTier ? "YOUR TIER" : "MOST POPULAR"}
                    </div>
                  )}

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                    <Crown style={{ width: 13, height: 13, color: tier.color }} />
                    <span className="text-[0.8125rem] font-bold" style={{ color: tier.color }}>{tier.label}</span>
                  </div>

                  <div className="mb-1">
                    <span className="font-black" style={{ fontSize: "2rem", color: "var(--charcoal)" }}>{tier.multiplier}</span>
                    <span className="text-sm ml-2" style={{ color: "var(--charcoal-soft)" }}>points</span>
                  </div>
                  <div className="text-xs mb-5" style={{ color: "var(--charcoal-mist)" }}>
                    {tier.maxPoints === Infinity
                      ? `${tier.minPoints.toLocaleString()}+ pts`
                      : `${tier.minPoints.toLocaleString()}–${tier.maxPoints.toLocaleString()} pts`}
                  </div>

                  <ul className="space-y-2.5">
                    {tier.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--charcoal)" }}>
                        <Check style={{ width: 14, height: 14, color: tier.color, flexShrink: 0, marginTop: 2 }} />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {user && isLocked && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs" style={{ color: "var(--charcoal-mist)" }}>
                      <Lock className="w-3 h-3" />
                      Reach {tier.minPoints.toLocaleString()} pts to unlock
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Ways to Earn ────────────────────────────────────────────── */}
        {activeTab === "earn" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WAYS_TO_EARN.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl p-5"
                style={{ background: "white", border: "1px solid var(--border-light)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(200,16,46,0.07)" }}>
                  <item.icon className="w-5 h-5" style={{ color: "var(--red)" }} />
                </div>
                <div>
                  <div className="font-semibold text-[0.9375rem] mb-0.5" style={{ color: "var(--charcoal)" }}>{item.action}</div>
                  <div className="text-sm font-bold" style={{ color: "var(--red)" }}>{item.points}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Redeem ──────────────────────────────────────────────────── */}
        {activeTab === "redeem" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REDEEM_OPTIONS.map((opt, i) => {
              const canRedeem = user && userPoints !== null && userPoints >= opt.points;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 text-center"
                  style={{
                    background: "white",
                    border: "1px solid var(--border-light)",
                    opacity: user && !canRedeem ? 0.72 : 1,
                  }}
                >
                  <div className="font-black text-xl mb-1" style={{ color: "var(--charcoal)" }}>{opt.label}</div>
                  <div className="text-sm mb-4" style={{ color: "var(--charcoal-soft)" }}>{opt.desc}</div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(200,16,46,0.07)" }}>
                    <Star className="w-3.5 h-3.5" style={{ color: "var(--red)", fill: "var(--red)" }} />
                    <span className="text-sm font-bold" style={{ color: "var(--red)" }}>{opt.points.toLocaleString()} pts</span>
                  </div>

                  {user && userPoints !== null && !canRedeem && (
                    <div className="mb-4">
                      <div className="h-1.5 rounded-full mb-1" style={{ background: "rgba(30,30,30,0.07)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (userPoints / opt.points) * 100)}%`, background: "var(--red)" }} />
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--charcoal-mist)" }}>{(opt.points - userPoints).toLocaleString()} pts needed</p>
                    </div>
                  )}

                  <button
                    disabled={!canRedeem}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all disabled:cursor-default"
                    style={{
                      background: canRedeem ? "var(--charcoal)" : "var(--off-white-2)",
                      color:      canRedeem ? "white" : "var(--charcoal-mist)",
                    }}
                  >
                    {!user ? (
                      "Sign in to redeem"
                    ) : canRedeem ? (
                      <><CheckCircle2 className="w-4 h-4" /> Redeem</>
                    ) : (
                      <><Lock className="w-3.5 h-3.5" /> Not enough points</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
