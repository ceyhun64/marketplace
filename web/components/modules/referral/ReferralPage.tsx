"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HeartHandshake,
  Copy,
  Check,
  Share2,
  Gift,
  Users,
  Wallet,
  ArrowRight,
  ChevronRight,
  Star,
  Zap,
  Trophy,
  Mail,
  Clock,
  Home,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// ── Brand logo SVGs ───────────────────────────────────────────────────────────
function WhatsAppLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="ig-grad-ref" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#f09433" />
          <stop offset="25%"  stopColor="#e6683c" />
          <stop offset="50%"  stopColor="#dc2743" />
          <stop offset="75%"  stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ig-grad-ref)"
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
      />
    </svg>
  );
}

function XLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step:  "01",
    icon:  Share2,
    title: "Share Your Invite Link",
    desc:  "Share your personal referral link or code with friends, family, or followers.",
    color: "var(--red)",
  },
  {
    step:  "02",
    icon:  Users,
    title: "Friend Signs Up",
    desc:  "Your friend registers using your link and completes their first purchase.",
    color: "#eab308",
  },
  {
    step:  "03",
    icon:  Gift,
    title: "Both of You Win",
    desc:  "You earn $50 in credit, your friend gets $25 off their first order.",
    color: "#16a34a",
  },
];

const REWARD_TIERS = [
  { count: "1–4",  label: "Friends", reward: "$50",  desc: "Per referral", color: "#cd7f32", bg: "rgba(205,127,50,0.07)",  border: "rgba(205,127,50,0.2)"  },
  { count: "5–14", label: "Friends", reward: "$75",  desc: "Per referral", color: "#9ca3af", bg: "rgba(156,163,175,0.07)", border: "rgba(156,163,175,0.2)" },
  { count: "15–29",label: "Friends", reward: "$100", desc: "Per referral", color: "#eab308", bg: "rgba(234,179,8,0.07)",   border: "rgba(234,179,8,0.2)",  popular: true },
  { count: "30+",  label: "Friends", reward: "$150", desc: "Per referral", color: "var(--red)", bg: "rgba(200,16,46,0.07)", border: "rgba(200,16,46,0.2)" },
];

const MOCK_REFERRALS = [
  { name: "James R.", joined: "10 May 2026", status: "completed", earned: 50 },
  { name: "Sarah M.", joined: "7 May 2026",  status: "completed", earned: 50 },
  { name: "David K.", joined: "2 May 2026",  status: "pending",   earned: 0  },
  { name: "Emily T.", joined: "28 Apr 2026", status: "completed", earned: 50 },
];

const SHARE_CHANNELS = [
  { label: "WhatsApp",    color: "#25D366", Logo: WhatsAppLogo,  textColor: "#25D366" },
  { label: "Instagram",   color: "#E1306C", Logo: InstagramLogo, textColor: "#E1306C" },
  { label: "Twitter / X", color: "#1a1a1a", Logo: XLogo,         textColor: "#1a1a1a" },
  { label: "Email",       color: "#6366f1", Logo: null,          textColor: "#6366f1" },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReferralPage() {
  const { user }                  = useAuth();
  const [copied, setCopied]       = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const referralCode = user ? "BAZR-A8F2K" : "BAZR-XXXXX";
  const referralLink = `https://bazr.com/r/${referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalEarned    = MOCK_REFERRALS.filter((r) => r.status === "completed").reduce((s, r) => s + r.earned, 0);
  const completedCount = MOCK_REFERRALS.filter((r) => r.status === "completed").length;
  const pendingCount   = MOCK_REFERRALS.filter((r) => r.status === "pending").length;

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--charcoal)",
          color: "white",
          padding: "5rem 1.5rem 4rem",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <style>{`
          @keyframes ref-float  { 0%,100%{transform:translateY(0px) rotate(-4deg)}  50%{transform:translateY(-14px) rotate(-4deg)}  }
          @keyframes ref-float2 { 0%,100%{transform:translateY(0px) rotate(6deg)}   50%{transform:translateY(-18px) rotate(6deg)}   }
          @keyframes ref-float3 { 0%,100%{transform:translateY(0px) rotate(-8deg)}  50%{transform:translateY(-10px) rotate(-8deg)}  }
          @keyframes ref-ping   { 0%{transform:scale(1);opacity:.45} 100%{transform:scale(2.2);opacity:0} }
          @keyframes ref-chip   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes ref-sent   { 0%{opacity:0;transform:scale(.5) translateY(4px)} 60%{opacity:1;transform:scale(1.05) translateY(-2px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        `}</style>

        {/* Radial glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 25% 60%, rgba(200,16,46,0.15) 0%, transparent 55%), radial-gradient(ellipse at 75% 20%, rgba(200,16,46,0.08) 0%, transparent 50%)",
          pointerEvents: "none",
        }} />

        {/* ── Floating social logos (bg decoration) ── */}
        <div style={{ position:"absolute", top:"14%", left:"4%",  opacity:.14, animation:"ref-float  4.2s ease-in-out infinite",       pointerEvents:"none" }}><WhatsAppLogo  size={56} /></div>
        <div style={{ position:"absolute", top:"18%", right:"5%", opacity:.12, animation:"ref-float2 5.1s ease-in-out infinite 0.8s",   pointerEvents:"none" }}><InstagramLogo size={50} /></div>
        <div style={{ position:"absolute", bottom:"22%", right:"3%", opacity:.10, animation:"ref-float3 3.8s ease-in-out infinite 1.6s", pointerEvents:"none" }}><XLogo         size={42} /></div>
        <div style={{ position:"absolute", bottom:"30%", left:"5%", opacity:.08, animation:"ref-float  6.0s ease-in-out infinite 0.4s",  pointerEvents:"none" }}><WhatsAppLogo  size={30} /></div>
        <div style={{ position:"absolute", top:"55%",   left:"8%", opacity:.07, animation:"ref-float2 4.5s ease-in-out infinite 2.2s",  pointerEvents:"none" }}><InstagramLogo size={26} /></div>

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-1.5 mb-8 text-[12px]" style={{ color: "var(--charcoal-soft)" }}>
            <Link href="/" className="flex items-center gap-1 hover:text-white transition-colors">
              <Home className="w-3 h-3" />Home
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-white font-semibold">Refer &amp; Earn</span>
          </nav>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(200,16,46,0.15)", border: "1px solid rgba(200,16,46,0.3)",
            borderRadius: 100, padding: "0.375rem 1rem", marginBottom: "1.5rem",
          }}>
            <HeartHandshake style={{ width: 14, height: 14, color: "var(--red-light)" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", color: "var(--red-light)" }}>
              INVITE FRIENDS
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 600, lineHeight: 1.1, marginBottom: "1.25rem",
            color: "white",
          }}>
            Share &amp;{" "}
            <span style={{ color: "var(--red-light)" }}>Earn Together</span>
          </h1>

          <p style={{ fontSize: "1.125rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: "2rem" }}>
            Invite your friends to BAZR — for every successful referral you earn{" "}
            <strong style={{ color: "white" }}>$50</strong>, and your friend gets{" "}
            <strong style={{ color: "white" }}>$25</strong> off their first order.
          </p>

          {/* ── Share platforms visual ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", marginBottom:"2.5rem", flexWrap:"wrap" }}>
            {/* "Your link" pill */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:"0.5rem",
              background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.13)",
              borderRadius:100, padding:"0.4rem 1rem",
              fontSize:"0.8125rem", fontWeight:600, color:"rgba(255,255,255,0.7)",
            }}>
              <Copy style={{ width:13, height:13 }} />
              Your link
            </div>

            {/* Arrow */}
            <div style={{ color:"rgba(255,255,255,0.25)", fontSize:"1.1rem", margin:"0 0.25rem" }}>→</div>

            {/* Platform chips — staggered fade-in */}
            {[
              { Logo: WhatsAppLogo,  label: "WhatsApp",  bg: "rgba(37,211,102,0.15)",  border: "rgba(37,211,102,0.3)",  delay: "0s"    },
              { Logo: InstagramLogo, label: "Instagram", bg: "rgba(225,48,108,0.15)",  border: "rgba(225,48,108,0.3)",  delay: "0.12s" },
              { Logo: XLogo,         label: "X",         bg: "rgba(255,255,255,0.1)",  border: "rgba(255,255,255,0.18)", delay: "0.24s" },
            ].map((ch) => (
              <div
                key={ch.label}
                style={{
                  display:"inline-flex", alignItems:"center", gap:"0.4rem",
                  background: ch.bg, border:`1px solid ${ch.border}`,
                  borderRadius:100, padding:"0.375rem 0.875rem",
                  fontSize:"0.8125rem", fontWeight:600, color:"rgba(255,255,255,0.85)",
                  animation:`ref-chip 0.4s ease-out ${ch.delay} both`,
                }}
              >
                {/* Pulsing live dot */}
                <span style={{ position:"relative", display:"inline-flex", width:8, height:8 }}>
                  <span style={{
                    position:"absolute", inset:0, borderRadius:"50%",
                    background: ch.label === "WhatsApp" ? "#25D366" : ch.label === "Instagram" ? "#E1306C" : "white",
                    animation:"ref-ping 1.5s ease-out infinite",
                    animationDelay: ch.delay,
                  }} />
                  <span style={{
                    position:"relative", display:"inline-block", width:8, height:8,
                    borderRadius:"50%",
                    background: ch.label === "WhatsApp" ? "#25D366" : ch.label === "Instagram" ? "#E1306C" : "white",
                  }} />
                </span>
                <ch.Logo size={15} />
                {ch.label}
              </div>
            ))}
          </div>

          {/* Stats */}
          {user && (
            <div style={{ display: "flex", gap: "2rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2.5rem" }}>
              {[
                { label: "Total Referrals", value: MOCK_REFERRALS.length },
                { label: "Completed",       value: completedCount },
                { label: "Total Earned",    value: `$${totalEarned}` },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Referral link */}
          {user ? (
            <div style={{
              background: "rgba(255,255,255,0.06)",
              border: copied ? "1px solid rgba(13,122,78,0.6)" : "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16, padding: "1.25rem 1.5rem",
              display: "flex", alignItems: "center", gap: "1rem",
              maxWidth: 520, margin: "0 auto",
              transition: "border-color 0.3s",
              boxShadow: copied ? "0 0 0 3px rgba(13,122,78,0.15)" : "none",
            }}>
              <code style={{
                flex: 1, fontSize: "0.9375rem", color: "rgba(255,255,255,0.8)",
                fontFamily: "var(--font-jetbrains)", textAlign: "left", wordBreak: "break-all",
              }}>
                {referralLink}
              </code>
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: copied ? "#0d7a4e" : "var(--red)",
                  color: "white", border: "none", borderRadius: 10,
                  padding: "0.625rem 1.25rem", fontWeight: 600, fontSize: "0.875rem",
                  cursor: "pointer", transition: "background 0.25s",
                  animation: copied ? "ref-sent 0.35s ease-out" : "none",
                }}
              >
                {copied
                  ? <><Check style={{ width: 15, height: 15 }} /> Copied!</>
                  : <><Copy  style={{ width: 15, height: 15 }} /> Copy Link</>}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/auth/register" style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "var(--red)", color: "white",
                padding: "0.875rem 2rem", borderRadius: 12, fontWeight: 600,
                textDecoration: "none", fontSize: "0.9375rem",
              }}>
                Join Now <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link href="/auth/login" style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.85)", padding: "0.875rem 2rem",
                borderRadius: 12, fontWeight: 600, textDecoration: "none", fontSize: "0.9375rem",
              }}>
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Tabs */}
        {user && (
          <div style={{
            display: "flex", gap: "0.5rem", background: "var(--off-white-2)",
            borderRadius: 12, padding: "0.375rem", marginBottom: "2.5rem", width: "fit-content",
          }}>
            {([
              { key: "overview", label: "How It Works" },
              { key: "history",  label: "My Referrals" },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "0.625rem 1.5rem", borderRadius: 9, border: "none",
                  fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s",
                  background: activeTab === t.key ? "white" : "transparent",
                  color:      activeTab === t.key ? "var(--charcoal)" : "var(--charcoal-soft)",
                  boxShadow:  activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Overview ─────────────────────────────────────────────────── */}
        {(!user || activeTab === "overview") && (
          <>
            {/* How it works */}
            <div style={{ marginBottom: "3rem" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Zap style={{ width: 16, height: 16, color: "var(--red)" }} />
                <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--charcoal-soft)", textTransform: "uppercase" }}>
                  How It Works
                </span>
              </div>
              <h2 style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 600, color: "var(--charcoal)", lineHeight: 1.2,
              }}>
                Earn in Three Steps
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
              {HOW_IT_WORKS.map((step) => (
                <div key={step.step} style={{
                  background: "white", border: "1px solid var(--border-light)",
                  borderRadius: 20, padding: "2rem 1.75rem",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: "1rem", right: "1.25rem",
                    fontSize: "4rem", fontWeight: 900, color: "rgba(0,0,0,0.04)",
                    lineHeight: 1, fontFamily: "var(--font-cormorant)",
                  }}>
                    {step.step}
                  </div>
                  <div style={{
                    width: 52, height: 52, background: `${step.color}15`,
                    borderRadius: 14, display: "flex", alignItems: "center",
                    justifyContent: "center", marginBottom: "1.25rem",
                  }}>
                    <step.icon style={{ width: 24, height: 24, color: step.color }} />
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--charcoal-soft)", lineHeight: 1.6 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Reward tiers */}
            <div style={{ marginBottom: "3rem" }}>
              <div style={{ marginBottom: "1.75rem" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <Trophy style={{ width: 16, height: 16, color: "var(--red)" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--charcoal-soft)", textTransform: "uppercase" }}>
                    Reward Tiers
                  </span>
                </div>
                <h2 style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 600, color: "var(--charcoal)", lineHeight: 1.2,
                }}>
                  More Referrals, More Rewards
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                {REWARD_TIERS.map((tier) => (
                  <div key={tier.count} style={{
                    background: tier.popular ? tier.bg : "white",
                    border: `1.5px solid ${tier.popular ? tier.border : "var(--border-light)"}`,
                    borderRadius: 16, padding: "1.75rem 1.5rem",
                    textAlign: "center", position: "relative",
                  }}>
                    {tier.popular && (
                      <div style={{
                        position: "absolute", top: -1, right: 20,
                        background: tier.color, color: "white",
                        fontSize: "0.6875rem", fontWeight: 700,
                        padding: "0.25rem 0.875rem", borderRadius: "0 0 8px 8px",
                        letterSpacing: "0.05em",
                      }}>
                        POPULAR
                      </div>
                    )}
                    <div style={{ fontSize: "2.25rem", fontWeight: 900, color: tier.color, lineHeight: 1, marginBottom: "0.25rem" }}>
                      {tier.reward}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--charcoal-soft)", marginBottom: "0.75rem" }}>
                      {tier.desc}
                    </div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      background: `${tier.color}12`, border: `1px solid ${tier.border}`,
                      borderRadius: 100, padding: "0.375rem 1rem",
                    }}>
                      <Users style={{ width: 13, height: 13, color: tier.color }} />
                      <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: tier.color }}>
                        {tier.count} {tier.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share channels */}
            {user && (
              <div style={{ background: "white", border: "1px solid var(--border-light)", borderRadius: 20, padding: "2rem" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.0625rem", color: "var(--charcoal)", marginBottom: "1.25rem" }}>
                  Share Via
                </h3>
                <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
                  {SHARE_CHANNELS.map((ch) => (
                    <button
                      key={ch.label}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        background: `${ch.color}10`, border: `1px solid ${ch.color}30`,
                        borderRadius: 10, padding: "0.625rem 1.25rem",
                        fontWeight: 600, fontSize: "0.875rem", color: ch.textColor, cursor: "pointer",
                      }}
                    >
                      {ch.Logo ? <ch.Logo size={17} /> : <Mail className="w-4 h-4" />}
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── History tab ───────────────────────────────────────────────── */}
        {user && activeTab === "history" && (
          <div>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {[
                { label: "Total Referrals", value: MOCK_REFERRALS.length, icon: Users,  color: "var(--red)"  },
                { label: "Completed",       value: completedCount,        icon: Check,  color: "#0d7a4e"     },
                { label: "Pending",         value: pendingCount,          icon: Clock,  color: "#eab308"     },
                { label: "Total Earned",    value: `$${totalEarned}`,     icon: Wallet, color: "#6366f1"     },
              ].map((card) => (
                <div key={card.label} style={{
                  background: "white", border: "1px solid var(--border-light)",
                  borderRadius: 16, padding: "1.25rem",
                  display: "flex", alignItems: "center", gap: "1rem",
                }}>
                  <div style={{
                    width: 44, height: 44, background: `${card.color}12`,
                    borderRadius: 12, display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <card.icon style={{ width: 20, height: 20, color: card.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--charcoal)", lineHeight: 1 }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--charcoal-soft)", marginTop: "0.2rem" }}>
                      {card.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Referral list */}
            <div style={{ background: "white", border: "1px solid var(--border-light)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{
                padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-light)",
                fontWeight: 700, fontSize: "0.9375rem", color: "var(--charcoal)",
              }}>
                Referral History
              </div>
              {MOCK_REFERRALS.map((ref, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "1rem 1.5rem",
                  borderBottom: i < MOCK_REFERRALS.length - 1 ? "1px solid var(--border-light)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <div style={{
                      width: 40, height: 40, background: "var(--off-white-2)",
                      borderRadius: "50%", display: "flex", alignItems: "center",
                      justifyContent: "center", fontWeight: 700, fontSize: "0.9375rem", color: "var(--charcoal)",
                    }}>
                      {ref.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--charcoal)" }}>{ref.name}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--charcoal-soft)" }}>Joined: {ref.joined}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      background: ref.status === "completed" ? "rgba(13,122,78,0.1)" : "rgba(234,179,8,0.1)",
                      color: ref.status === "completed" ? "#0d7a4e" : "#92730a",
                      borderRadius: 100, padding: "0.25rem 0.75rem",
                      fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.25rem",
                    }}>
                      {ref.status === "completed"
                        ? <><Check style={{ width: 12, height: 12 }} /> Completed</>
                        : <><Clock style={{ width: 12, height: 12 }} /> Pending</>}
                    </div>
                    {ref.earned > 0 && (
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0d7a4e" }}>
                        +${ref.earned}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA for guests ────────────────────────────────────────────── */}
        {!user && (
          <div style={{
            marginTop: "3rem", background: "var(--charcoal)",
            borderRadius: 20, padding: "3rem 2rem",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 100%, rgba(200,16,46,0.2) 0%, transparent 60%)",
            }} />
            <div style={{ position: "relative" }}>
              <Gift style={{ width: 48, height: 48, color: "var(--red-light)", margin: "0 auto 1.25rem" }} />
              <h2 style={{ fontFamily: "var(--font-cormorant)", fontSize: "2rem", fontWeight: 600, color: "white", marginBottom: "0.75rem" }}>
                Start Earning Today
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "2rem", fontSize: "1rem" }}>
                Create an account, share your referral link, and earn $50 per friend.
              </p>
              <Link href="/auth/register" style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "var(--red)", color: "white",
                padding: "0.875rem 2.5rem", borderRadius: 12,
                fontWeight: 600, fontSize: "1rem", textDecoration: "none",
              }}>
                Create Free Account <ChevronRight style={{ width: 18, height: 18 }} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
