"use client";

import { useState } from "react";
import {
  Gift,
  Sparkles,
  CheckCircle,
  CreditCard,
  Send,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AMOUNTS = [50, 100, 200, 500, 1000];

const DESIGNS = [
  { id: "classic", label: "Classic", gradient: "from-[var(--red)] to-[#a50f25]" },
  { id: "celebration", label: "Celebration", gradient: "from-purple-600 to-pink-500" },
  { id: "minimal", label: "Minimal", gradient: "from-gray-800 to-gray-600" },
  { id: "nature", label: "Nature", gradient: "from-emerald-600 to-teal-400" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Tag,
    title: "Choose an amount",
    desc: "Pick from preset amounts or enter a custom value between ₺10 and ₺5,000.",
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

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedDesign, setSelectedDesign] = useState("classic");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [redeemCode, setRedeemCode] = useState("");

  const finalAmount =
    selectedAmount ?? (customAmount ? parseInt(customAmount, 10) || 0 : 0);

  const selectedDesignObj = DESIGNS.find((d) => d.id === selectedDesign)!;

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
            Let them choose what they love. Gift cards are delivered instantly by
            email and never expire.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-14 grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Left — Purchase form */}
        <div className="space-y-8">
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
                  ₺{amt}
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
                placeholder="₺ Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="max-w-[200px] h-10 text-[14px]"
              />
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
                    <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-white" />
                  )}
                  <span className="absolute bottom-2 left-3 text-white text-[11px] font-bold">
                    {d.label}
                  </span>
                  <Gift className="absolute top-2 left-3 w-4 h-4 text-white/70" />
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
            disabled={!finalAmount || !recipientEmail}
            className="h-12 px-8 rounded-full font-bold text-[14px] bg-[var(--red)] hover:bg-[var(--red)]/90 text-white"
          >
            <Gift className="w-4 h-4 mr-2" />
            Send Gift Card — ₺{finalAmount || "–"}
          </Button>
        </div>

        {/* Right — Preview + redeem */}
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
                  {finalAmount ? `₺${finalAmount}` : "₺–"}
                </p>
                {senderName && (
                  <p className="text-white/60 text-[11px] mt-1">
                    From: {senderName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Redeem section */}
          <div className="bg-[var(--off-white)] rounded-2xl p-6 border border-black/5">
            <h3 className="text-[15px] font-bold text-[var(--charcoal)] mb-1">
              Redeem a gift card
            </h3>
            <p className="text-[13px] text-[var(--charcoal-soft)] mb-4">
              Have a code? Apply it to your account balance.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code e.g. GC-XXXX-XXXX"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value)}
                className="h-10 text-[13px] font-mono"
              />
              <Button
                disabled={!redeemCode}
                className="shrink-0 bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/90 text-white h-10 px-5 rounded-xl font-bold text-[13px]"
              >
                Redeem
              </Button>
            </div>
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
                      <Icon className="w-4.5 h-4.5 text-[var(--red)]" />
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
        </div>
      </div>
    </main>
  );
}
