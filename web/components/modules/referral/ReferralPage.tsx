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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Share2,
    title: "Davet Linkini Paylaş",
    desc: "Kişisel referans linkinizi veya kodunuzu arkadaşlarınızla paylaşın.",
    color: "var(--red)",
  },
  {
    step: "02",
    icon: Users,
    title: "Arkadaşın Kayıt Olsun",
    desc: "Arkadaşın linkinizden kayıt olup ilk alışverişini tamamlasın.",
    color: "#eab308",
  },
  {
    step: "03",
    icon: Gift,
    title: "İkisi de Kazansın",
    desc: "Sen $50 bonus, arkadaşın $25 indirim kazanır. Herkes kazanır!",
    color: "#0d7a4e",
  },
];

const REWARD_TIERS = [
  {
    count: "1–4",
    label: "Arkadaş",
    reward: "$50",
    desc: "Davet başına",
    color: "#cd7f32",
    bg: "rgba(205,127,50,0.07)",
    border: "rgba(205,127,50,0.2)",
  },
  {
    count: "5–14",
    label: "Arkadaş",
    reward: "$75",
    desc: "Davet başına",
    color: "#9ca3af",
    bg: "rgba(156,163,175,0.07)",
    border: "rgba(156,163,175,0.2)",
  },
  {
    count: "15–29",
    label: "Arkadaş",
    reward: "$100",
    desc: "Davet başına",
    color: "#eab308",
    bg: "rgba(234,179,8,0.07)",
    border: "rgba(234,179,8,0.2)",
    popular: true,
  },
  {
    count: "30+",
    label: "Arkadaş",
    reward: "$150",
    desc: "Davet başına",
    color: "var(--red)",
    bg: "rgba(200,16,46,0.07)",
    border: "rgba(200,16,46,0.2)",
  },
];

const MOCK_REFERRALS = [
  { name: "Ahmet Y.", joined: "10 May 2026", status: "completed", earned: 50 },
  { name: "Fatma K.", joined: "7 May 2026", status: "completed", earned: 50 },
  { name: "Burak T.", joined: "2 May 2026", status: "pending", earned: 0 },
  { name: "Selin A.", joined: "28 Nis 2026", status: "completed", earned: 50 },
];

const SHARE_CHANNELS = [
  { label: "WhatsApp", color: "#25D366", icon: "💬" },
  { label: "Instagram", color: "#E1306C", icon: "📸" },
  { label: "Twitter / X", color: "#1DA1F2", icon: "🐦" },
  { label: "E-Posta", color: "#6366f1", icon: "✉️" },
];

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "history">(
    "overview",
  );

  const referralCode = user ? "BAZR-A8F2K" : "BAZR-XXXXX";
  const referralLink = `https://bazr.com.tr/r/${referralCode}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalEarned = MOCK_REFERRALS.filter(
    (r) => r.status === "completed",
  ).reduce((sum, r) => sum + r.earned, 0);

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
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
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 25% 60%, rgba(200,16,46,0.15) 0%, transparent 55%), radial-gradient(ellipse at 75% 20%, rgba(200,16,46,0.08) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            border: "24px solid rgba(200,16,46,0.08)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: 80,
            width: 140,
            height: 140,
            border: "16px solid rgba(255,255,255,0.04)",
            borderRadius: "50%",
          }}
        />

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
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
            <HeartHandshake
              style={{ width: 14, height: 14, color: "var(--red-light)" }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--red-light)",
              }}
            >
              ARKADAŞINI DAVET ET
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
            Paylaş ve{" "}
            <span style={{ color: "var(--red-light)" }}>Birlikte Kazan</span>
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
            }}
          >
            Arkadaşlarını BAZR&apos;a davet et — her başarılı davet için sen{" "}
            <strong style={{ color: "white" }}>$50</strong>, arkadaşın{" "}
            <strong style={{ color: "white" }}>$25</strong> kazanır.
          </p>

          {/* Stats row */}
          {user && (
            <div
              style={{
                display: "flex",
                gap: "2rem",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "2.5rem",
              }}
            >
              {[
                { label: "Toplam Davet", value: MOCK_REFERRALS.length },
                {
                  label: "Başarılı",
                  value: MOCK_REFERRALS.filter((r) => r.status === "completed")
                    .length,
                },
                { label: "Kazanılan", value: `$${totalEarned}` },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 800,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: "rgba(255,255,255,0.5)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Referral link box */}
          {user ? (
            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16,
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "monospace",
                  textAlign: "left",
                  wordBreak: "break-all",
                }}
              >
                {referralLink}
              </code>
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: copied ? "#0d7a4e" : "var(--red)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "0.625rem 1.25rem",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? (
                  <>
                    <Check style={{ width: 15, height: 15 }} /> Kopyalandı
                  </>
                ) : (
                  <>
                    <Copy style={{ width: 15, height: 15 }} /> Kopyala
                  </>
                )}
              </button>
            </div>
          ) : (
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
                Hemen Katıl <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link
                href="/auth/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.85)",
                  padding: "0.875rem 2rem",
                  borderRadius: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                }}
              >
                Giriş Yap
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}
      >
        {/* Tabs */}
        {user && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              background: "var(--off-white-2)",
              borderRadius: 12,
              padding: "0.375rem",
              marginBottom: "2.5rem",
              width: "fit-content",
            }}
          >
            {(
              [
                { key: "overview", label: "Nasıl Çalışır?" },
                { key: "history", label: "Davetlerim" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: 9,
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: activeTab === t.key ? "white" : "transparent",
                  color:
                    activeTab === t.key
                      ? "var(--charcoal)"
                      : "var(--charcoal-soft)",
                  boxShadow:
                    activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* How it works */}
        {(!user || activeTab === "overview") && (
          <>
            <div style={{ marginBottom: "3rem" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <Zap style={{ width: 16, height: 16, color: "var(--red)" }} />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "var(--charcoal-soft)",
                    textTransform: "uppercase",
                  }}
                >
                  Nasıl Çalışır
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 600,
                  color: "var(--charcoal)",
                  lineHeight: 1.2,
                }}
              >
                Üç Adımda Kazan
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
                marginBottom: "3rem",
              }}
            >
              {HOW_IT_WORKS.map((step) => (
                <div
                  key={step.step}
                  style={{
                    background: "white",
                    border: "1px solid var(--border-light)",
                    borderRadius: 20,
                    padding: "2rem 1.75rem",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1.25rem",
                      fontSize: "4rem",
                      fontWeight: 900,
                      color: "rgba(0,0,0,0.04)",
                      lineHeight: 1,
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    {step.step}
                  </div>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      background: `${step.color}15`,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <step.icon
                      style={{ width: 24, height: 24, color: step.color }}
                    />
                  </div>
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      color: "var(--charcoal)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--charcoal-soft)",
                      lineHeight: 1.6,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Reward tiers */}
            <div style={{ marginBottom: "3rem" }}>
              <div style={{ marginBottom: "1.75rem" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <Trophy
                    style={{ width: 16, height: 16, color: "var(--red)" }}
                  />
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "var(--charcoal-soft)",
                      textTransform: "uppercase",
                    }}
                  >
                    Ödül Kademeleri
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 600,
                    color: "var(--charcoal)",
                    lineHeight: 1.2,
                  }}
                >
                  Ne Kadar Çok Davet, O Kadar Çok Kazanç
                </h2>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {REWARD_TIERS.map((tier) => (
                  <div
                    key={tier.count}
                    style={{
                      background: tier.popular ? tier.bg : "white",
                      border: `1.5px solid ${tier.popular ? tier.border : "var(--border-light)"}`,
                      borderRadius: 16,
                      padding: "1.75rem 1.5rem",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    {tier.popular && (
                      <div
                        style={{
                          position: "absolute",
                          top: -1,
                          right: 20,
                          background: tier.color,
                          color: "white",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.875rem",
                          borderRadius: "0 0 8px 8px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        POPÜLER
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: 900,
                        color: tier.color,
                        lineHeight: 1,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {tier.reward}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--charcoal-soft)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {tier.desc}
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        background: `${tier.color}12`,
                        border: `1px solid ${tier.border}`,
                        borderRadius: 100,
                        padding: "0.375rem 1rem",
                      }}
                    >
                      <Users
                        style={{ width: 13, height: 13, color: tier.color }}
                      />
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          color: tier.color,
                        }}
                      >
                        {tier.count} {tier.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share channels */}
            {user && (
              <div
                style={{
                  background: "white",
                  border: "1px solid var(--border-light)",
                  borderRadius: 20,
                  padding: "2rem",
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    color: "var(--charcoal)",
                    marginBottom: "1.25rem",
                  }}
                >
                  Hızlı Paylaş
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "0.875rem",
                    flexWrap: "wrap",
                  }}
                >
                  {SHARE_CHANNELS.map((ch) => (
                    <button
                      key={ch.label}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: `${ch.color}10`,
                        border: `1px solid ${ch.color}30`,
                        borderRadius: 10,
                        padding: "0.625rem 1.25rem",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: ch.color,
                        cursor: "pointer",
                      }}
                    >
                      <span>{ch.icon}</span>
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* History tab */}
        {user && activeTab === "history" && (
          <div>
            {/* Summary cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              {[
                {
                  label: "Toplam Davet",
                  value: MOCK_REFERRALS.length,
                  icon: Users,
                  color: "var(--red)",
                },
                {
                  label: "Tamamlanan",
                  value: MOCK_REFERRALS.filter((r) => r.status === "completed")
                    .length,
                  icon: Check,
                  color: "#0d7a4e",
                },
                {
                  label: "Beklenen",
                  value: MOCK_REFERRALS.filter((r) => r.status === "pending")
                    .length,
                  icon: Star,
                  color: "#eab308",
                },
                {
                  label: "Kazanılan",
                  value: `$${totalEarned}`,
                  icon: Wallet,
                  color: "#6366f1",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    background: "white",
                    border: "1px solid var(--border-light)",
                    borderRadius: 16,
                    padding: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: `${card.color}12`,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <card.icon
                      style={{ width: 20, height: 20, color: card.color }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "1.375rem",
                        fontWeight: 800,
                        color: "var(--charcoal)",
                        lineHeight: 1,
                      }}
                    >
                      {card.value}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--charcoal-soft)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {card.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Referral list */}
            <div
              style={{
                background: "white",
                border: "1px solid var(--border-light)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--border-light)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: "var(--charcoal)",
                }}
              >
                Davet Geçmişi
              </div>
              {MOCK_REFERRALS.map((ref, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.5rem",
                    borderBottom:
                      i < MOCK_REFERRALS.length - 1
                        ? "1px solid var(--border-light)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: "var(--off-white-2)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: "var(--charcoal)",
                      }}
                    >
                      {ref.name.charAt(0)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9375rem",
                          color: "var(--charcoal)",
                        }}
                      >
                        {ref.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--charcoal-soft)",
                        }}
                      >
                        Katıldı: {ref.joined}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        background:
                          ref.status === "completed"
                            ? "rgba(13,122,78,0.1)"
                            : "rgba(234,179,8,0.1)",
                        color:
                          ref.status === "completed" ? "#0d7a4e" : "#92730a",
                        borderRadius: 100,
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {ref.status === "completed"
                        ? "✓ Tamamlandı"
                        : "⏳ Bekleniyor"}
                    </div>
                    {ref.earned > 0 && (
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 700,
                          color: "#0d7a4e",
                        }}
                      >
                        +${ref.earned}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA for non-users */}
        {!user && (
          <div
            style={{
              marginTop: "3rem",
              background: "var(--charcoal)",
              borderRadius: 20,
              padding: "3rem 2rem",
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
                  "radial-gradient(ellipse at 50% 100%, rgba(200,16,46,0.2) 0%, transparent 60%)",
              }}
            />
            <div style={{ position: "relative" }}>
              <Gift
                style={{
                  width: 48,
                  height: 48,
                  color: "var(--red-light)",
                  margin: "0 auto 1.25rem",
                }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "2rem",
                  fontWeight: 600,
                  color: "white",
                  marginBottom: "0.75rem",
                }}
              >
                Hemen Başla, İlk Davetinde Kazan
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "2rem",
                  fontSize: "1rem",
                }}
              >
                Hesap oluştur, referans linkini paylaş, $50 kazan.
              </p>
              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--red)",
                  color: "white",
                  padding: "0.875rem 2.5rem",
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: "1rem",
                  textDecoration: "none",
                }}
              >
                Ücretsiz Kayıt Ol{" "}
                <ChevronRight style={{ width: 18, height: 18 }} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
