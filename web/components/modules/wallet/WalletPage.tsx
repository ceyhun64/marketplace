"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Shield,
  Clock,
  ChevronRight,
  Banknote,
  RefreshCw,
  Gift,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MOCK_TRANSACTIONS = [
  {
    id: "1",
    type: "credit",
    desc: "Order refund — #ORD-2841",
    amount: 149.9,
    date: "May 12, 2026",
    status: "completed",
  },
  {
    id: "2",
    type: "debit",
    desc: "Purchase — Sony WH-1000XM5",
    amount: -849.0,
    date: "May 10, 2026",
    status: "completed",
  },
  {
    id: "3",
    type: "credit",
    desc: "Wallet top-up via credit card",
    amount: 1000.0,
    date: "May 8, 2026",
    status: "completed",
  },
  {
    id: "4",
    type: "credit",
    desc: "Referral bonus",
    amount: 50.0,
    date: "May 5, 2026",
    status: "completed",
  },
  {
    id: "5",
    type: "debit",
    desc: "Purchase — Nike Air Max 270",
    amount: -2199.0,
    date: "May 1, 2026",
    status: "completed",
  },
];

const TOP_UP_AMOUNTS = [50, 100, 200, 500, 1000];

const BENEFITS = [
  {
    icon: Banknote,
    title: "Instant Payments",
    desc: "Pay instantly at checkout without entering card details every time.",
  },
  {
    icon: Shield,
    title: "Secure & Protected",
    desc: "Your wallet balance is insured and protected by our fraud prevention system.",
  },
  {
    icon: Gift,
    title: "Bonus Credits",
    desc: "Get cashback, referral bonuses, and refunds credited directly to your wallet.",
  },
  {
    icon: RefreshCw,
    title: "Instant Refunds",
    desc: "Refunds are processed to your wallet instantly, no waiting days for bank transfers.",
  },
];

export default function WalletPage() {
  const { user } = useAuth();
  const [topUpAmount, setTopUpAmount] = useState<number | "">("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "topup" | "history" | "withdraw"
  >("overview");
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");

  // Mock balance
  const balance = user ? 350.9 : null;

  const handlePreset = (amt: number) => {
    setSelectedPreset(amt);
    setTopUpAmount(amt);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Header — green/finance identity */}
      <section
        style={{
          background: "linear-gradient(135deg, #071a10 0%, #0c2217 50%, #081a0f 100%)",
          padding: "4rem 1.5rem 3rem",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Green radial glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 75% 50%, rgba(5,150,105,0.18) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        {/* Decorative ring */}
        <div
          style={{
            position: "absolute",
            top: -32, right: -32,
            width: 200, height: 200,
            borderRadius: "50%",
            border: "24px solid rgba(5,150,105,0.09)",
            pointerEvents: "none",
          }}
        />
        {/* Large faint wallet watermark */}
        <Wallet
          style={{
            position: "absolute",
            right: 48, bottom: 8,
            width: 96, height: 96,
            color: "rgba(5,150,105,0.07)",
            pointerEvents: "none",
          }}
        />
        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0,
            width: "100%", height: 2,
            background: "linear-gradient(90deg, rgba(5,150,105,0.55) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <Wallet style={{ width: 14, height: 14, color: "rgba(52,211,153,0.85)" }} />
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "rgba(52,211,153,0.6)",
                textTransform: "uppercase",
                fontFamily: "var(--font-mono)",
              }}
            >
              BAZR Wallet
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: "0.75rem",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            Your Digital Wallet
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "1rem",
              maxWidth: 500,
            }}
          >
            Store funds, receive refunds instantly, and pay faster at checkout.
          </p>
        </div>
      </section>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "2.5rem 1.5rem 5rem",
        }}
      >
        {user ? (
          <>
            {/* Balance card */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, var(--charcoal) 0%, var(--charcoal-2) 100%)",
                borderRadius: 24,
                padding: "2.5rem",
                color: "white",
                marginBottom: "2rem",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1.5rem",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "rgba(200,16,46,0.1)",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: "0.75rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  AVAILABLE BALANCE
                </div>
                <div
                  style={{
                    fontSize: "3.5rem",
                    fontWeight: 800,
                    lineHeight: 1,
                    marginBottom: "0.5rem",
                  }}
                >
                  ${balance?.toFixed(2)}
                </div>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  Updated just now
                </div>
              </div>
              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                <button
                  onClick={() => setActiveTab("topup")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "var(--red)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    padding: "0.75rem 1.5rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Funds
                </button>
                <button
                  onClick={() => setActiveTab("withdraw")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    padding: "0.75rem 1.5rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  <ArrowDownRight className="w-4 h-4" /> Withdraw
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    padding: "0.75rem 1.5rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  <Clock className="w-4 h-4" /> History
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "0.375rem",
                marginBottom: "1.75rem",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              {(["overview", "topup", "withdraw", "history"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "0.75rem 1.25rem",
                      background: "none",
                      border: "none",
                      borderBottom:
                        activeTab === tab
                          ? "2px solid var(--red)"
                          : "2px solid transparent",
                      color:
                        activeTab === tab
                          ? "var(--red)"
                          : "var(--charcoal-soft)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      marginBottom: -1,
                      textTransform: "capitalize",
                    }}
                  >
                    {tab === "topup"
                      ? "Add Funds"
                      : tab === "overview"
                        ? "Overview"
                        : tab === "withdraw"
                          ? "Withdraw"
                          : "History"}
                  </button>
                ),
              )}
            </div>

            {/* Overview */}
            {activeTab === "overview" && (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                  }}
                >
                  {[
                    {
                      label: "Total Loaded",
                      value: "$1,050.00",
                      icon: Plus,
                      color: "#0d7a4e",
                    },
                    {
                      label: "Total Spent",
                      value: "$699.10",
                      icon: ArrowUpRight,
                      color: "var(--red)",
                    },
                    {
                      label: "Refunds Received",
                      value: "$149.90",
                      icon: ArrowDownLeft,
                      color: "#2563eb",
                    },
                    {
                      label: "Bonus Credits",
                      value: "$50.00",
                      icon: Gift,
                      color: "#7c3aed",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        borderRadius: 16,
                        padding: "1.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: `${stat.color}14`,
                          borderRadius: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <stat.icon
                          style={{ width: 18, height: 18, color: stat.color }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 800,
                          color: "var(--charcoal)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {stat.value}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--charcoal-soft)",
                        }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Spending Analytics */}
                <div
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 20,
                    padding: "1.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <BarChart3
                      style={{ width: 18, height: 18, color: "var(--red)" }}
                    />
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--charcoal)",
                      }}
                    >
                      Spending Analytics
                    </h3>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.75rem",
                        color: "var(--charcoal-mist)",
                      }}
                    >
                      Last 30 days
                    </span>
                  </div>

                  {/* Category breakdown */}
                  {[
                    {
                      label: "Electronics",
                      amount: 849,
                      pct: 72,
                      color: "var(--red)",
                    },
                    {
                      label: "Fashion",
                      amount: 2199,
                      pct: 55,
                      color: "#7c3aed",
                    },
                    {
                      label: "Home & Garden",
                      amount: 320,
                      pct: 28,
                      color: "#2563eb",
                    },
                    { label: "Books", amount: 89, pct: 8, color: "#059669" },
                  ].map((cat) => (
                    <div key={cat.label} style={{ marginBottom: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "0.375rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--charcoal)",
                          }}
                        >
                          {cat.label}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8125rem",
                            color: "var(--charcoal-soft)",
                          }}
                        >
                          ${cat.amount.toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 99,
                          background: "var(--off-white-3)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${cat.pct}%`,
                            borderRadius: 99,
                            background: cat.color,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      marginTop: "1.25rem",
                      paddingTop: "1.25rem",
                      borderTop: "1px solid var(--border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.8125rem",
                      color: "var(--charcoal-soft)",
                    }}
                  >
                    <TrendingUp
                      style={{ width: 14, height: 14, color: "#0d7a4e" }}
                    />
                    You&apos;ve spent{" "}
                    <strong style={{ color: "var(--charcoal)" }}>
                      $699.10
                    </strong>{" "}
                    this month — 12% less than last month.
                  </div>
                </div>
              </div>
            )}

            {/* Top Up */}
            {activeTab === "topup" && (
              <div style={{ maxWidth: 520 }}>
                <div
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 20,
                    padding: "2rem",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      marginBottom: "1.5rem",
                      color: "var(--charcoal)",
                    }}
                  >
                    Add Funds
                  </h3>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--charcoal-mid)",
                        letterSpacing: "0.04em",
                        display: "block",
                        marginBottom: "0.75rem",
                      }}
                    >
                      QUICK AMOUNTS
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {TOP_UP_AMOUNTS.map((amt) => (
                        <button
                          key={amt}
                          onClick={() => handlePreset(amt)}
                          style={{
                            padding: "0.5rem 1.125rem",
                            border:
                              selectedPreset === amt
                                ? "2px solid var(--red)"
                                : "1.5px solid var(--border-mid)",
                            background:
                              selectedPreset === amt
                                ? "var(--red-muted)"
                                : "transparent",
                            color:
                              selectedPreset === amt
                                ? "var(--red)"
                                : "var(--charcoal)",
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            cursor: "pointer",
                          }}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--charcoal-mid)",
                        letterSpacing: "0.04em",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      CUSTOM AMOUNT
                    </label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontWeight: 700,
                          color: "var(--charcoal-mid)",
                        }}
                      >
                        $
                      </span>
                      <Input
                        type="number"
                        min={10}
                        max={5000}
                        value={topUpAmount}
                        onChange={(e) => {
                          setTopUpAmount(
                            e.target.value ? Number(e.target.value) : "",
                          );
                          setSelectedPreset(null);
                        }}
                        placeholder="Enter amount"
                        style={{ paddingLeft: "2rem" }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--charcoal-mist)",
                        marginTop: "0.5rem",
                      }}
                    >
                      Minimum $10 — Maximum $5,000 per top-up
                    </p>
                  </div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--charcoal-mid)",
                        letterSpacing: "0.04em",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      PAYMENT METHOD
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.875rem 1rem",
                        background: "var(--off-white)",
                        border: "1.5px solid var(--border-mid)",
                        borderRadius: 10,
                      }}
                    >
                      <CreditCard
                        style={{
                          width: 18,
                          height: 18,
                          color: "var(--charcoal-soft)",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--charcoal)",
                        }}
                      >
                        •••• •••• •••• 4242
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--charcoal-mist)",
                          marginLeft: "auto",
                        }}
                      >
                        Default
                      </span>
                    </div>
                  </div>
                  <button
                    disabled={!topUpAmount || Number(topUpAmount) < 10}
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      background:
                        topUpAmount && Number(topUpAmount) >= 10
                          ? "var(--charcoal)"
                          : "var(--off-white-3)",
                      color:
                        topUpAmount && Number(topUpAmount) >= 10
                          ? "white"
                          : "var(--charcoal-mist)",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      cursor:
                        topUpAmount && Number(topUpAmount) >= 10
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    Add ${topUpAmount || "0"} to Wallet
                  </button>
                </div>
              </div>
            )}

            {/* Withdraw */}
            {activeTab === "withdraw" && (
              <div style={{ maxWidth: 520 }}>
                <div
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 20,
                    padding: "2rem",
                  }}
                >
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      marginBottom: "0.5rem",
                      color: "var(--charcoal)",
                    }}
                  >
                    Withdraw Funds
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--charcoal-soft)",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Transfer your wallet balance to your registered bank
                    account. Processing takes 1–3 business days.
                  </p>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--charcoal-mid)",
                        letterSpacing: "0.04em",
                        display: "block",
                        marginBottom: "0.5rem",
                      }}
                    >
                      AMOUNT
                    </label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontWeight: 700,
                          color: "var(--charcoal-mid)",
                        }}
                      >
                        $
                      </span>
                      <Input
                        type="number"
                        min={10}
                        max={balance ?? 0}
                        value={withdrawAmount}
                        onChange={(e) =>
                          setWithdrawAmount(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        placeholder="Enter amount"
                        style={{ paddingLeft: "2rem" }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--charcoal-mist)",
                        marginTop: "0.5rem",
                      }}
                    >
                      Available: ${balance?.toFixed(2)} — Minimum withdrawal $10
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem 1rem",
                      background: "var(--off-white)",
                      border: "1.5px solid var(--border-mid)",
                      borderRadius: 10,
                      marginBottom: "1.5rem",
                    }}
                  >
                    <Banknote
                      style={{
                        width: 18,
                        height: 18,
                        color: "var(--charcoal-soft)",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--charcoal)",
                          fontWeight: 600,
                        }}
                      >
                        IBAN ending ••• 4821
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--charcoal-mist)",
                        }}
                      >
                        Default bank account
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={
                      !withdrawAmount ||
                      Number(withdrawAmount) < 10 ||
                      Number(withdrawAmount) > (balance ?? 0)
                    }
                    style={{
                      width: "100%",
                      padding: "0.875rem",
                      background:
                        withdrawAmount && Number(withdrawAmount) >= 10
                          ? "var(--charcoal)"
                          : "var(--off-white-3)",
                      color:
                        withdrawAmount && Number(withdrawAmount) >= 10
                          ? "white"
                          : "var(--charcoal-mist)",
                      border: "none",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      cursor:
                        withdrawAmount && Number(withdrawAmount) >= 10
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    Withdraw ${withdrawAmount || "0"} to Bank
                  </button>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--charcoal-mist)",
                      marginTop: "0.75rem",
                      textAlign: "center",
                    }}
                  >
                    Withdrawals are processed within 1–3 business days.
                  </p>
                </div>
              </div>
            )}

            {/* History */}
            {activeTab === "history" && (
              <div
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border-light)",
                  borderRadius: 20,
                  overflow: "hidden",
                }}
              >
                {MOCK_TRANSACTIONS.map((tx, i) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1.25rem 1.5rem",
                      borderBottom:
                        i < MOCK_TRANSACTIONS.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background:
                          tx.type === "credit"
                            ? "rgba(13,122,78,0.1)"
                            : "rgba(200,16,46,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {tx.type === "credit" ? (
                        <ArrowDownLeft
                          style={{ width: 18, height: 18, color: "#0d7a4e" }}
                        />
                      ) : (
                        <ArrowUpRight
                          style={{ width: 18, height: 18, color: "var(--red)" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9375rem",
                          color: "var(--charcoal)",
                          marginBottom: "0.2rem",
                        }}
                      >
                        {tx.desc}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--charcoal-mist)",
                        }}
                      >
                        {tx.date}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1.0625rem",
                        color: tx.type === "credit" ? "#0d7a4e" : "var(--red)",
                        flexShrink: 0,
                      }}
                    >
                      {tx.type === "credit" ? "+" : ""}$
                      {Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Not logged in */
          <div>
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--border-light)",
                borderRadius: 24,
                padding: "4rem 2rem",
                textAlign: "center",
                marginBottom: "3rem",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  background: "var(--red-muted)",
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                }}
              >
                <Wallet
                  style={{ width: 32, height: 32, color: "var(--red)" }}
                />
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.75rem",
                  marginBottom: "0.75rem",
                  color: "var(--charcoal)",
                }}
              >
                Sign in to access your wallet
              </h2>
              <p
                style={{
                  color: "var(--charcoal-soft)",
                  marginBottom: "2rem",
                  maxWidth: 400,
                  margin: "0 auto 2rem",
                }}
              >
                Your BAZR Wallet is tied to your account. Sign in or register to
                manage your balance.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/auth/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "var(--charcoal)",
                    color: "white",
                    padding: "0.875rem 2rem",
                    borderRadius: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    fontSize: "0.9375rem",
                  }}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "transparent",
                    color: "var(--charcoal)",
                    padding: "0.875rem 2rem",
                    borderRadius: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    border: "1.5px solid var(--border-mid)",
                    fontSize: "0.9375rem",
                  }}
                >
                  Create Account
                </Link>
              </div>
            </div>

            {/* Benefits */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {BENEFITS.map((b, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 16,
                    padding: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: "var(--red-muted)",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <b.icon
                      style={{ width: 20, height: 20, color: "var(--red)" }}
                    />
                  </div>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      marginBottom: "0.5rem",
                      color: "var(--charcoal)",
                    }}
                  >
                    {b.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--charcoal-soft)",
                      lineHeight: 1.6,
                    }}
                  >
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
