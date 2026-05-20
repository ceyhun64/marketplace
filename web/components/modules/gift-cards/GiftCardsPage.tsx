"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AMOUNTS = [50, 100, 200, 500, 1000];

const DESIGNS = [
  {
    id: "classic",
    label: "Classic",
    gradient: "from-[var(--red)] to-[#a50f25]",
  },
  {
    id: "celebration",
    label: "Celebration",
    gradient: "from-purple-600 to-pink-500",
  },
  { id: "minimal", label: "Minimal", gradient: "from-gray-800 to-gray-600" },
  { id: "nature", label: "Nature", gradient: "from-emerald-600 to-teal-400" },
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

type BalanceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; balance: number; code: string }
  | { status: "empty"; code: string }
  | { status: "invalid" };

type RedeemState = "idle" | "loading" | "success" | "invalid";
type PurchaseState = "idle" | "loading" | "success";

function formatCode(raw: string): string {
  // Auto-format as user types: GC-XXXX-XXXX
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `GC-${clean.slice(2)}`;
  return `GC-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
}

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

  // Balance checker
  const [balanceCode, setBalanceCode] = useState("");
  const [balanceState, setBalanceState] = useState<BalanceState>({
    status: "idle",
  });

  // Redeem
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemState, setRedeemState] = useState<RedeemState>("idle");

  const finalAmount =
    selectedAmount ?? (customAmount ? parseInt(customAmount, 10) || 0 : 0);

  const selectedDesignObj = DESIGNS.find((d) => d.id === selectedDesign)!;

  const isValidCode = (code: string) => CODE_REGEX.test(code);

  const handleCheckBalance = async () => {
    const trimmed = balanceCode.trim();
    if (!trimmed) return;
    if (!isValidCode(trimmed)) {
      setBalanceState({ status: "invalid" });
      return;
    }
    setBalanceState({ status: "loading" });
    await new Promise((r) => setTimeout(r, 900));
    // Simulate: codes ending in 0000 are empty, others have balance
    const hasBalance = !trimmed.endsWith("0000");
    if (hasBalance) {
      const balance = Math.round(Math.random() * 450 + 50);
      setBalanceState({ status: "found", balance, code: trimmed });
    } else {
      setBalanceState({ status: "empty", code: trimmed });
    }
  };

  const handleRedeem = async () => {
    const trimmed = redeemCode.trim();
    if (!isValidCode(trimmed)) {
      setRedeemState("invalid");
      return;
    }
    setRedeemState("loading");
    await new Promise((r) => setTimeout(r, 1000));
    setRedeemState("success");
  };

  const handlePurchase = async () => {
    if (!finalAmount || !recipientEmail) return;
    setPurchaseState("loading");
    await new Promise((r) => setTimeout(r, 1300));
    // Generate a fake code
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
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-52 h-52 border-[20px] border-[var(--red)]/10 rounded-full" />
        <div className="absolute -bottom-16 left-36 w-36 h-36 border-[16px] border-white/5 rounded-full" />
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-[var(--red)]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
              Gift Cards
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[52px] leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The perfect <span className="text-[var(--red)]">gift</span>
            <br />
            for everyone.
          </h1>
          <p className="text-[var(--charcoal-soft)] text-[15px] max-w-[480px]">
            Let them choose what they love. Gift cards are delivered instantly
            by email and never expire.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-14 grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Left — Purchase form */}
        <div className="space-y-8">
          {purchaseState === "success" ? (
            <div className="bg-white rounded-2xl border border-black/5 p-10 text-center shadow-sm">
              <CheckCircle2
                className="w-16 h-16 mx-auto mb-5"
                style={{ color: "#059669" }}
              />
              <h2
                className="text-[24px] font-bold text-[var(--charcoal)] mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Gift Card Sent!
              </h2>
              <p className="text-[14px] text-[var(--charcoal-soft)] mb-6">
                A ${finalAmount} gift card has been sent to{" "}
                <strong>{recipientEmail}</strong>. The code is also shown below.
              </p>
              <div className="flex items-center gap-2 justify-center mb-6">
                <code className="font-mono text-[18px] font-bold tracking-widest text-[var(--charcoal)] px-5 py-3 bg-[var(--off-white)] rounded-xl border border-black/5">
                  {generatedCode}
                </code>
                <button
                  onClick={copyCode}
                  className="p-3 rounded-xl transition-all border"
                  style={{
                    background: codeCopied
                      ? "rgba(5,150,105,0.08)"
                      : "var(--off-white)",
                    borderColor: codeCopied
                      ? "rgba(5,150,105,0.3)"
                      : "rgba(51,51,51,0.08)",
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
                onClick={() => {
                  setPurchaseState("idle");
                  setRecipientEmail("");
                  setSenderName("");
                  setMessage("");
                  setGeneratedCode("");
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "var(--charcoal)" }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <>
              {/* Amount selector */}
              <section>
                <h2 className="text-[17px] font-bold text-[var(--charcoal)] mb-4">
                  1. Choose amount
                </h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`px-5 py-2.5 rounded-xl text-[14px] font-bold border-2 transition-all ${
                        selectedAmount === amt
                          ? "border-[var(--red)] bg-[var(--red)]/5 text-[var(--red)]"
                          : "border-black/10 text-[var(--charcoal)] hover:border-[var(--red)]/40"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-[var(--charcoal-soft)] shrink-0">
                    Custom:
                  </span>
                  <Input
                    type="number"
                    min={10}
                    max={5000}
                    placeholder="$ Enter amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className="max-w-[200px] h-10 text-[14px]"
                  />
                  {customAmount &&
                    (parseInt(customAmount) < 10 ||
                      parseInt(customAmount) > 5000) && (
                      <span className="text-[12px] text-[var(--red)] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> $10–$5,000 only
                      </span>
                    )}
                </div>
              </section>

              {/* Design selector */}
              <section>
                <h2 className="text-[17px] font-bold text-[var(--charcoal)] mb-4">
                  2. Pick a design
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {DESIGNS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDesign(d.id)}
                      className={`relative w-[120px] h-[76px] rounded-xl bg-gradient-to-br ${d.gradient} transition-all ${
                        selectedDesign === d.id
                          ? "ring-2 ring-[var(--red)] ring-offset-2"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {selectedDesign === d.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                          <CheckCircle className="w-3.5 h-3.5 text-[var(--red)]" />
                        </div>
                      )}
                      <span className="absolute bottom-2 left-3 text-white text-[11px] font-bold">
                        {d.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Recipient details */}
              <section>
                <h2 className="text-[17px] font-bold text-[var(--charcoal)] mb-4">
                  3. Recipient details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-[var(--charcoal-soft)] mb-1 block uppercase tracking-wide">
                      Recipient Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="h-10 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[var(--charcoal-soft)] mb-1 block uppercase tracking-wide">
                      Your Name
                    </label>
                    <Input
                      placeholder="From (optional)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="h-10 text-[14px]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-semibold text-[var(--charcoal-soft)] mb-1 block uppercase tracking-wide">
                      Personal Message
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add a heartfelt note (optional)…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full border border-input rounded-xl px-3 py-2.5 text-[14px] text-[var(--charcoal)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--red)]/30"
                    />
                  </div>
                </div>
              </section>

              <Button
                disabled={
                  !finalAmount ||
                  !recipientEmail ||
                  purchaseState === "loading" ||
                  (!!customAmount &&
                    (parseInt(customAmount) < 10 ||
                      parseInt(customAmount) > 5000))
                }
                onClick={handlePurchase}
                className="h-12 px-8 rounded-full font-bold text-[14px] bg-[var(--red)] hover:bg-[var(--red)]/90 text-white"
              >
                <Gift className="w-4 h-4 mr-2" />
                {purchaseState === "loading"
                  ? "Processing…"
                  : `Send Gift Card — $${finalAmount || "–"}`}
              </Button>
              <p className="text-[12px] text-[var(--charcoal-mist)] mt-3">
                By purchasing, you agree to our{" "}
                <a
                  href="/terms#gift-cards"
                  className="underline hover:text-[var(--charcoal)] transition-colors"
                >
                  Gift Card Terms &amp; Conditions
                </a>
                . Gift cards never expire and are non-refundable.
              </p>
            </>
          )}
        </div>

        {/* Right — Preview + balance + redeem */}
        <div className="space-y-8">
          {/* Card preview */}
          <div>
            <h2 className="text-[17px] font-bold text-[var(--charcoal)] mb-4">
              Preview
            </h2>
            <div
              className={`w-full aspect-[1.6/1] rounded-2xl bg-gradient-to-br ${selectedDesignObj.gradient} p-6 flex flex-col justify-between shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-[13px]">
                    MARKETPLACE
                  </span>
                </div>
                <Sparkles className="w-4 h-4 text-white/60" />
              </div>
              <div>
                {message && (
                  <p className="text-white/70 text-[12px] italic mb-2 line-clamp-2">
                    &ldquo;{message}&rdquo;
                  </p>
                )}
                <p className="text-white/80 text-[12px] mb-1">Gift Card</p>
                <p className="text-white text-[32px] font-bold leading-none">
                  {finalAmount ? `$${finalAmount}` : "$–"}
                </p>
                {senderName && (
                  <p className="text-white/60 text-[11px] mt-1">
                    From: {senderName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Balance checker — enhanced */}
          <div className="bg-[var(--off-white)] rounded-2xl p-6 border border-black/5">
            <h3 className="text-[15px] font-bold text-[var(--charcoal)] mb-1">
              Check balance
            </h3>
            <p className="text-[13px] text-[var(--charcoal-soft)] mb-1">
              Enter a gift card code to see its remaining balance.
            </p>
            <p className="text-[11px] text-[var(--charcoal-mist)] mb-4 flex items-center gap-1">
              <Info className="w-3 h-3" /> Format: GC-XXXX-XXXX
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. GC-A1B2-C3D4"
                value={balanceCode}
                onChange={(e) => {
                  const formatted = formatCode(e.target.value);
                  setBalanceCode(formatted);
                  setBalanceState({ status: "idle" });
                }}
                className={`h-10 text-[13px] font-mono ${
                  balanceState.status === "invalid"
                    ? "border-[var(--red)] focus:ring-[var(--red)]/30"
                    : ""
                }`}
                maxLength={12}
              />
              <Button
                disabled={!balanceCode || balanceState.status === "loading"}
                onClick={handleCheckBalance}
                className="shrink-0 bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/90 text-white h-10 px-5 rounded-xl font-bold text-[13px]"
              >
                {balanceState.status === "loading" ? "…" : "Check"}
              </Button>
            </div>

            {/* Balance results */}
            {balanceState.status === "invalid" && (
              <div className="mt-3 flex items-start gap-2 text-[13px] text-[var(--red)]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Invalid code format. Gift card codes look like{" "}
                  <strong>GC-A1B2-C3D4</strong>.
                </span>
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
                <div className="flex items-center gap-2 mb-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-[13px] font-bold text-green-700">
                    Active card
                  </span>
                </div>
                <p className="text-[13px] text-green-700">
                  Remaining balance:{" "}
                  <strong>${balanceState.balance.toFixed(2)}</strong>
                </p>
                <p className="text-[11px] text-green-600/70 mt-1">
                  Code: {balanceState.code}
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
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--red)]" />
                  <span className="text-[13px] font-bold text-[var(--red)]">
                    No remaining balance
                  </span>
                </div>
                <p className="text-[12px] text-[var(--charcoal-soft)] mt-1">
                  This gift card has been fully redeemed.
                </p>
              </div>
            )}
          </div>

          {/* Redeem section — enhanced */}
          <div className="bg-[var(--off-white)] rounded-2xl p-6 border border-black/5">
            <h3 className="text-[15px] font-bold text-[var(--charcoal)] mb-1">
              Redeem a gift card
            </h3>
            <p className="text-[13px] text-[var(--charcoal-soft)] mb-4">
              Have a code? Apply it to your account balance.
            </p>

            {redeemState === "success" ? (
              <div className="flex items-center gap-2 text-green-600 font-semibold text-[14px]">
                <CheckCircle2 className="w-5 h-5" />
                Gift card applied to your account!
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code e.g. GC-XXXX-XXXX"
                    value={redeemCode}
                    onChange={(e) => {
                      setRedeemCode(formatCode(e.target.value));
                      setRedeemState("idle");
                    }}
                    className={`h-10 text-[13px] font-mono ${
                      redeemState === "invalid" ? "border-[var(--red)]" : ""
                    }`}
                    maxLength={12}
                  />
                  <Button
                    disabled={!redeemCode || redeemState === "loading"}
                    onClick={handleRedeem}
                    className="shrink-0 bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/90 text-white h-10 px-5 rounded-xl font-bold text-[13px]"
                  >
                    {redeemState === "loading" ? "…" : "Redeem"}
                  </Button>
                </div>
                {redeemState === "invalid" && (
                  <p className="mt-2 text-[12px] text-[var(--red)] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please enter a valid
                    code in the format GC-XXXX-XXXX.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[var(--off-white)] border-t border-black/5 py-16 px-4">
        <div className="max-w-[1200px] mx-auto">
          <h2
            className="text-center text-[28px] text-[var(--charcoal)] mb-10"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-[11px] text-[var(--red)] font-bold">
                      {item.step}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[var(--red)]/8 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[var(--red)]" />
                    </div>
                  </div>
                  <h3 className="font-bold text-[15px] text-[var(--charcoal)] mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[13.5px] text-[var(--charcoal-soft)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[12px] text-[var(--charcoal-mist)] mt-8">
            Gift cards are subject to our{" "}
            <a
              href="/terms#gift-cards"
              className="underline hover:text-[var(--charcoal)] transition-colors"
            >
              Terms &amp; Conditions
            </a>
            . No expiry date. Not redeemable for cash.
          </p>
        </div>
      </div>
    </main>
  );
}
