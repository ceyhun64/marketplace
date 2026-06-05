"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Gift,
  Sparkles,
  CheckCircle,
  CheckCircle2,
  CreditCard,
  Send,
  Tag,
  AlertCircle,
  Copy,
  Info,
  Home,
  ChevronRight,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ── Static data ───────────────────────────────────────────────────────────────
const AMOUNTS = [50, 100, 200, 500, 1000];

const DESIGNS = [
  {
    id: "classic",
    label: "Classic",
    gradient: "linear-gradient(135deg,#c8102e 0%,#7d0a1c 100%)",
  },
  {
    id: "celebration",
    label: "Celebration",
    gradient: "linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)",
  },
  {
    id: "minimal",
    label: "Minimal",
    gradient: "linear-gradient(135deg,#1f2937 0%,#4b5563 100%)",
  },
  {
    id: "nature",
    label: "Nature",
    gradient: "linear-gradient(135deg,#059669 0%,#0891b2 100%)",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Tag,
    title: "Choose an amount",
    desc: "Pick from preset amounts or enter a custom value between $10 and $5,000.",
  },
  {
    step: "02",
    icon: Send,
    title: "Send to recipient",
    desc: "Enter the recipient's email. They'll receive the gift card code instantly.",
  },
  {
    step: "03",
    icon: CreditCard,
    title: "Redeem at checkout",
    desc: "The recipient applies the code at checkout — no expiry, no hidden fees.",
  },
];

const CODE_REGEX = /^GC-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Types ──────────────────────────────────────────────────────────────────────
type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; balance: number; code: string }
  | { status: "empty"; code: string }
  | { status: "invalid" };

type RedeemState = "idle" | "loading" | "success" | "invalid";
type PurchaseState = "idle" | "loading" | "success";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `GC-${clean.slice(2)}`;
  return `GC-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

// ── Hero gift-card visual ──────────────────────────────────────────────────────
function HeroCards() {
  return (
    <div
      className="relative select-none hidden lg:block"
      style={{ width: 300, height: 200 }}
    >
      {/* Third card (nature, furthest back) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "rotate(-10deg) translate(-24px, 12px)",
          background: "linear-gradient(135deg,#059669 0%,#0891b2 100%)",
          borderRadius: 18,
          opacity: 0.35,
        }}
      />
      {/* Second card (celebration, behind) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: "rotate(5deg) translate(12px, -8px)",
          background: "linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)",
          borderRadius: 18,
          opacity: 0.65,
        }}
      />
      {/* Front card (classic red) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg,#c8102e 0%,#7d0a1c 100%)",
          borderRadius: 18,
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 24px 48px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.2)",
        }}
      >
        {/* Card header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Gift style={{ width: 18, height: 18, color: "white" }} />
            <span
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "0.875rem",
                letterSpacing: "0.1em",
              }}
            >
              BAZR
            </span>
          </div>
          <Sparkles
            style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)" }}
          />
        </div>
        {/* Card chip */}
        <div
          style={{
            width: 32,
            height: 24,
            borderRadius: 4,
            background:
              "linear-gradient(135deg,rgba(255,255,255,0.35),rgba(255,255,255,0.15))",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        />
        {/* Card footer */}
        <div>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.6875rem",
              marginBottom: "0.2rem",
              letterSpacing: "0.04em",
            }}
          >
            Gift Card
          </p>
          <p
            style={{
              color: "white",
              fontSize: "1.875rem",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            $100
          </p>
        </div>
      </div>
      {/* Sparkle decorations */}
      <Star
        style={{
          position: "absolute",
          top: -10,
          right: -8,
          width: 16,
          height: 16,
          color: "rgba(255,255,255,0.5)",
          fill: "rgba(255,255,255,0.5)",
        }}
      />
      <Sparkles
        style={{
          position: "absolute",
          bottom: -8,
          left: -10,
          width: 14,
          height: 14,
          color: "rgba(255,220,0,0.6)",
        }}
      />
      <Star
        style={{
          position: "absolute",
          top: 20,
          left: -18,
          width: 10,
          height: 10,
          color: "rgba(255,255,255,0.3)",
          fill: "rgba(255,255,255,0.3)",
        }}
      />
    </div>
  );
}

// ── Card preview component ─────────────────────────────────────────────────────
function CardPreview({
  gradient,
  amount,
  message,
  senderName,
}: {
  gradient: string;
  amount: number;
  message: string;
  senderName: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "1.6/1",
        borderRadius: 16,
        background: gradient,
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 12px 32px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Gift style={{ width: 18, height: 18, color: "white" }} />
          <span
            style={{
              color: "white",
              fontWeight: 800,
              fontSize: "0.8125rem",
              letterSpacing: "0.1em",
            }}
          >
            BAZR
          </span>
        </div>
        <Sparkles
          style={{ width: 14, height: 14, color: "rgba(255,255,255,0.55)" }}
        />
      </div>
      <div>
        {message && (
          <p
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.75rem",
              fontStyle: "italic",
              marginBottom: "0.375rem",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            &ldquo;{message}&rdquo;
          </p>
        )}
        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.6875rem",
            marginBottom: "0.25rem",
          }}
        >
          Gift Card
        </p>
        <p
          style={{
            color: "white",
            fontSize: "2rem",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {amount ? `$${amount}` : "$–"}
        </p>
        {senderName && (
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "0.6875rem",
              marginTop: "0.375rem",
            }}
          >
            From: {senderName}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedDesign, setSelectedDesign] = useState("classic");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  const [balanceCode, setBalanceCode] = useState("");
  const [balanceState, setBalanceState] = useState<BalanceState>({
    status: "idle",
  });

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemState, setRedeemState] = useState<RedeemState>("idle");

  const finalAmount =
    selectedAmount ?? (customAmount ? parseInt(customAmount, 10) || 0 : 0);
  const customAmountNum = customAmount ? parseInt(customAmount, 10) : 0;
  const customInvalid =
    !!customAmount && (customAmountNum < 10 || customAmountNum > 5000);
  const emailInvalid = !!recipientEmail && !isValidEmail(recipientEmail);
  const canPurchase =
    finalAmount >= 10 &&
    isValidEmail(recipientEmail) &&
    !customInvalid &&
    purchaseState === "idle";

  const selectedDesignObj = DESIGNS.find((d) => d.id === selectedDesign)!;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCheckBalance = async () => {
    const code = balanceCode.trim();
    if (!code) return;
    if (!CODE_REGEX.test(code)) {
      setBalanceState({ status: "invalid" });
      return;
    }
    setBalanceState({ status: "loading" });
    await new Promise((r) => setTimeout(r, 900));
    const hasBalance = !code.endsWith("0000");
    if (hasBalance) {
      const balance = Math.round(
        (parseInt(code.replace(/\D/g, "").slice(-4), 16) % 450) + 50,
      );
      setBalanceState({ status: "found", balance, code });
    } else {
      setBalanceState({ status: "empty", code });
    }
  };

  const handleRedeem = async () => {
    const code = redeemCode.trim();
    if (!CODE_REGEX.test(code)) {
      setRedeemState("invalid");
      return;
    }
    setRedeemState("loading");
    await new Promise((r) => setTimeout(r, 1000));
    setRedeemState("success");
  };

  const handlePurchase = async () => {
    if (!canPurchase) return;
    setPurchaseState("loading");
    await new Promise((r) => setTimeout(r, 1300));
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const rand = (n: number) =>
      Array.from(
        { length: n },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("");
    setGeneratedCode(`GC-${rand(4)}-${rand(4)}`);
    setPurchaseState("success");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const resetPurchase = () => {
    setPurchaseState("idle");
    setRecipientEmail("");
    setSenderName("");
    setMessage("");
    setGeneratedCode("");
    setCodeCopied(false);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-16 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 30% 60%, rgba(200,16,46,0.18) 0%, transparent 55%), " +
              "radial-gradient(ellipse at 75% 30%, rgba(200,16,46,0.08) 0%, transparent 50%)",
          }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16">
          {/* Left: text */}
          <div className="flex-1">
            {/* Breadcrumb */}
            <nav
              className="flex items-center gap-1.5 mb-7 text-[12px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <Home className="w-3 h-3" />
                Home
              </Link>
              <ChevronRight className="w-3 h-3 opacity-40" />
              <span className="text-white font-semibold">Gift Cards</span>
            </nav>

            {/* Label */}
            <div className="flex items-center gap-2 mb-5">
              <Gift className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
              <span
                className="text-[10px] font-bold uppercase tracking-[3px]"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-jetbrains)",
                }}
              >
                Gift Cards
              </span>
            </div>

            <h1
              className="text-white leading-tight mb-4"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
                fontWeight: 600,
              }}
            >
              The perfect{" "}
              <span style={{ color: "var(--red-light)" }}>gift</span>
              <br />
              for everyone.
            </h1>

            <p
              className="text-[1.0625rem] leading-relaxed mb-8 max-w-md"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Let them choose what they love. Gift cards are delivered instantly
              by email and <strong className="text-white">never expire</strong>.
            </p>

            {/* Trust badges */}
            <div className="flex items-center gap-4 flex-wrap">
              {[
                { icon: CheckCircle2, text: "Instant delivery" },
                { icon: CreditCard, text: "No expiry date" },
                { icon: Gift, text: "Any amount $10–$5k" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: "rgba(255,255,255,0.55)" }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--red-light)" }}
                  />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: stacked card visual */}
          <div className="flex justify-center lg:justify-end shrink-0">
            <HeroCards />
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14 grid lg:grid-cols-[1fr_400px] gap-12">
        {/* ── Left: Purchase form ─────────────────────────────────────── */}
        <div className="space-y-8">
          {purchaseState === "success" ? (
            /* ── Success state ── */
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: "white",
                border: "1px solid var(--border-light)",
              }}
            >
              <CheckCircle2
                className="w-16 h-16 mx-auto mb-5"
                style={{ color: "#059669" }}
              />
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  color: "var(--charcoal)",
                }}
              >
                Gift Card Sent!
              </h2>
              <p
                className="text-sm mb-6"
                style={{ color: "var(--charcoal-soft)" }}
              >
                A <strong>${finalAmount}</strong> gift card has been sent to{" "}
                <strong>{recipientEmail}</strong>.
              </p>
              {/* Generated code */}
              <div className="flex items-center gap-2 justify-center mb-7">
                <code
                  className="text-lg font-black tracking-widest px-5 py-3 rounded-xl"
                  style={{
                    background: "var(--off-white-2)",
                    border: "1px solid var(--border-light)",
                    color: "var(--charcoal)",
                    fontFamily: "var(--font-jetbrains)",
                  }}
                >
                  {generatedCode}
                </code>
                <button
                  onClick={copyCode}
                  className="p-3 rounded-xl transition-all"
                  style={{
                    background: codeCopied
                      ? "rgba(5,150,105,0.08)"
                      : "var(--off-white-2)",
                    border: `1px solid ${codeCopied ? "rgba(5,150,105,0.3)" : "var(--border-light)"}`,
                    color: codeCopied ? "#059669" : "var(--charcoal-mist)",
                  }}
                  title="Copy code"
                >
                  {codeCopied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <button
                onClick={resetPurchase}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: "var(--charcoal)" }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <>
              {/* 1. Amount */}
              <section
                className="rounded-2xl p-6"
                style={{
                  background: "white",
                  border: "1px solid var(--border-light)",
                }}
              >
                <h2
                  className="text-[17px] font-bold mb-4"
                  style={{ color: "var(--charcoal)" }}
                >
                  1 — Choose Amount
                </h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={
                        selectedAmount === amt
                          ? {
                              background: "rgba(200,16,46,0.07)",
                              border: "2px solid var(--red)",
                              color: "var(--red)",
                            }
                          : {
                              background: "var(--off-white-2)",
                              border: "2px solid transparent",
                              color: "var(--charcoal)",
                            }
                      }
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide shrink-0"
                    style={{ color: "var(--charcoal-soft)" }}
                  >
                    Custom:
                  </span>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    placeholder="$ Enter amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className="h-10 text-sm rounded-xl px-3 outline-none transition-all max-w-45"
                    style={{
                      border: `1.5px solid ${customInvalid ? "var(--red)" : "var(--border-light)"}`,
                      background: "var(--off-white)",
                      color: "var(--charcoal)",
                    }}
                  />
                  {customInvalid && (
                    <span
                      className="text-xs flex items-center gap-1"
                      style={{ color: "var(--red)" }}
                    >
                      <AlertCircle className="w-3.5 h-3.5" /> $10–$5,000
                    </span>
                  )}
                </div>
              </section>

              {/* 2. Design */}
              <section
                className="rounded-2xl p-6"
                style={{
                  background: "white",
                  border: "1px solid var(--border-light)",
                }}
              >
                <h2
                  className="text-[17px] font-bold mb-4"
                  style={{ color: "var(--charcoal)" }}
                >
                  2 — Pick a Design
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {DESIGNS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDesign(d.id)}
                      className="relative transition-all"
                      style={{
                        width: 120,
                        height: 76,
                        borderRadius: 12,
                        background: d.gradient,
                        outline:
                          selectedDesign === d.id
                            ? "2.5px solid var(--red)"
                            : "2.5px solid transparent",
                        outlineOffset: 2,
                        opacity: selectedDesign === d.id ? 1 : 0.65,
                      }}
                    >
                      {selectedDesign === d.id && (
                        <div
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow"
                          style={{ background: "white" }}
                        >
                          <CheckCircle
                            className="w-3.5 h-3.5"
                            style={{ color: "var(--red)" }}
                          />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-3 text-white text-[11px] font-bold">
                        {d.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 3. Recipient */}
              <section
                className="rounded-2xl p-6"
                style={{
                  background: "white",
                  border: "1px solid var(--border-light)",
                }}
              >
                <h2
                  className="text-[17px] font-bold mb-4"
                  style={{ color: "var(--charcoal)" }}
                >
                  3 — Recipient Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      placeholder="friend@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-xl outline-none transition-all"
                      style={{
                        border: `1.5px solid ${emailInvalid ? "var(--red)" : "var(--border-light)"}`,
                        background: "var(--off-white)",
                        color: "var(--charcoal)",
                      }}
                    />
                    {emailInvalid && (
                      <p
                        className="text-xs mt-1 flex items-center gap-1"
                        style={{ color: "var(--red)" }}
                      >
                        <AlertCircle className="w-3 h-3" /> Enter a valid email
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="From (optional)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-xl outline-none transition-all"
                      style={{
                        border: "1.5px solid var(--border-light)",
                        background: "var(--off-white)",
                        color: "var(--charcoal)",
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block"
                      style={{ color: "var(--charcoal-soft)" }}
                    >
                      Personal Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add a heartfelt note (optional)…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl outline-none resize-none transition-all"
                      style={{
                        border: "1.5px solid var(--border-light)",
                        background: "var(--off-white)",
                        color: "var(--charcoal)",
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Purchase CTA */}
              <div>
                <button
                  disabled={!canPurchase}
                  onClick={handlePurchase}
                  className="h-12 px-8 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{
                    background: canPurchase ? "#c8102e" : "var(--charcoal)",
                  }}
                >
                  <Gift className="w-4 h-4" />
                  {purchaseState === "loading"
                    ? "Processing…"
                    : `Send Gift Card — $${finalAmount || "–"}`}
                </button>
                <p
                  className="text-xs mt-3"
                  style={{ color: "var(--charcoal-mist)" }}
                >
                  By purchasing, you agree to our{" "}
                  <Link
                    href="/terms#gift-cards"
                    className="underline hover:text-(--charcoal) transition-colors"
                  >
                    Gift Card Terms &amp; Conditions
                  </Link>
                  . Gift cards never expire and are non-refundable.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ── Right: Preview + tools ──────────────────────────────────── */}
        <div className="space-y-6">
          {/* Card preview */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "white",
              border: "1px solid var(--border-light)",
            }}
          >
            <h2
              className="text-[17px] font-bold mb-4"
              style={{ color: "var(--charcoal)" }}
            >
              Preview
            </h2>
            <CardPreview
              gradient={selectedDesignObj.gradient}
              amount={finalAmount}
              message={message}
              senderName={senderName}
            />
          </div>

          {/* Balance checker */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--off-white-2)",
              border: "1px solid var(--border-light)",
            }}
          >
            <h3
              className="text-[15px] font-bold mb-1"
              style={{ color: "var(--charcoal)" }}
            >
              Check Balance
            </h3>
            <p
              className="text-xs mb-1"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Enter a code to see its remaining balance.
            </p>
            <p
              className="text-[11px] mb-4 flex items-center gap-1"
              style={{ color: "var(--charcoal-mist)" }}
            >
              <Info className="w-3 h-3" /> Format: GC-XXXX-XXXX
            </p>
            <div className="flex gap-2">
              <input
                placeholder="e.g. GC-A1B2-C3D4"
                value={balanceCode}
                onChange={(e) => {
                  setBalanceCode(formatCode(e.target.value));
                  setBalanceState({ status: "idle" });
                }}
                maxLength={12}
                className="flex-1 h-10 px-3 text-xs rounded-xl outline-none"
                style={{
                  fontFamily: "var(--font-jetbrains)",
                  border: `1.5px solid ${balanceState.status === "invalid" ? "var(--red)" : "var(--border-light)"}`,
                  background: "white",
                  color: "var(--charcoal)",
                }}
              />
              <button
                disabled={!balanceCode || balanceState.status === "loading"}
                onClick={handleCheckBalance}
                className="shrink-0 h-10 px-4 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40"
                style={{ background: "var(--charcoal)" }}
              >
                {balanceState.status === "loading" ? "…" : "Check"}
              </button>
            </div>
            {balanceState.status === "invalid" && (
              <div
                className="mt-3 flex items-start gap-2 text-xs"
                style={{ color: "var(--red)" }}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Invalid code. Format: <strong>GC-A1B2-C3D4</strong>
              </div>
            )}
            {balanceState.status === "found" && (
              <div
                className="mt-3 p-3 rounded-xl"
                style={{
                  background: "rgba(5,150,105,0.07)",
                  border: "1px solid rgba(5,150,105,0.2)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CheckCircle2
                    className="w-4 h-4"
                    style={{ color: "#059669" }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#057a4e" }}
                  >
                    Active card
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#057a4e" }}>
                  Remaining balance:{" "}
                  <strong>${balanceState.balance.toFixed(2)}</strong>
                </p>
              </div>
            )}
            {balanceState.status === "empty" && (
              <div
                className="mt-3 p-3 rounded-xl"
                style={{
                  background: "rgba(200,16,46,0.06)",
                  border: "1px solid rgba(200,16,46,0.18)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle
                    className="w-4 h-4"
                    style={{ color: "var(--red)" }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--red)" }}
                  >
                    No remaining balance
                  </span>
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  This card has been fully redeemed.
                </p>
              </div>
            )}
          </div>

          {/* Redeem */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: "var(--off-white-2)",
              border: "1px solid var(--border-light)",
            }}
          >
            <h3
              className="text-[15px] font-bold mb-1"
              style={{ color: "var(--charcoal)" }}
            >
              Redeem a Gift Card
            </h3>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Have a code? Apply it to your account balance.
            </p>
            {redeemState === "success" ? (
              <div
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: "#059669" }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Gift card applied to your account!
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    placeholder="GC-XXXX-XXXX"
                    value={redeemCode}
                    onChange={(e) => {
                      setRedeemCode(formatCode(e.target.value));
                      setRedeemState("idle");
                    }}
                    maxLength={12}
                    className="flex-1 h-10 px-3 text-xs rounded-xl outline-none"
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      border: `1.5px solid ${redeemState === "invalid" ? "var(--red)" : "var(--border-light)"}`,
                      background: "white",
                      color: "var(--charcoal)",
                    }}
                  />
                  <button
                    disabled={!redeemCode || redeemState === "loading"}
                    onClick={handleRedeem}
                    className="shrink-0 h-10 px-4 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40"
                    style={{ background: "var(--charcoal)" }}
                  >
                    {redeemState === "loading" ? "…" : "Redeem"}
                  </button>
                </div>
                {redeemState === "invalid" && (
                  <p
                    className="mt-2 text-xs flex items-center gap-1"
                    style={{ color: "var(--red)" }}
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Enter a valid code:
                    GC-XXXX-XXXX
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div
        className="py-16 px-4"
        style={{
          background: "white",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" style={{ color: "var(--red)" }} />
              <span
                className="text-xs font-bold uppercase tracking-[0.08em]"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Simple Process
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 600,
                color: "var(--charcoal)",
              }}
            >
              How it works
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl p-7 relative overflow-hidden"
                style={{
                  background: "var(--off-white)",
                  border: "1px solid var(--border-light)",
                }}
              >
                <span
                  className="absolute top-4 right-5 font-black leading-none select-none"
                  style={{
                    fontSize: "4rem",
                    color: "rgba(0,0,0,0.04)",
                    fontFamily: "var(--font-cormorant)",
                  }}
                >
                  {item.step}
                </span>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(200,16,46,0.08)" }}
                  >
                    <item.icon
                      className="w-4 h-4"
                      style={{ color: "var(--red)" }}
                    />
                  </div>
                  <span
                    className="text-xs font-bold"
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      color: "var(--red)",
                    }}
                  >
                    Step {item.step}
                  </span>
                </div>
                <h3
                  className="font-bold text-[15px] mb-2"
                  style={{ color: "var(--charcoal)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <p
            className="text-center text-xs mt-8"
            style={{ color: "var(--charcoal-mist)" }}
          >
            Gift cards are subject to our{" "}
            <Link
              href="/terms#gift-cards"
              className="underline hover:text-(--charcoal) transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            . No expiry date. Not redeemable for cash.
          </p>
        </div>
      </div>
    </main>
  );
}
