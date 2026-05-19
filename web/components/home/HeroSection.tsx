"use client";

import { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Truck, Store, ChevronRight, ArrowRight } from "lucide-react";
import { useHeroSettings, type HeroSettings } from "@/queries/useSiteSettings";

// ── Fallback — mirrors the seeded DB defaults ────────────────────────────────

const FALLBACK: HeroSettings = {
  badgeText: "Next-Gen Commerce",
  headline: "Premium Marketplace\nMeets Fast Delivery.",
  headlineAccent: "Marketplace",
  subtitle:
    "We redefine digital commerce with independent stores and an integrated courier engine — everything under one roof.",
  searchPlaceholder: "Search products, stores...",
  primaryCtaText: "Search",
  primaryCtaHref: "/products",
  secondaryCtaText: undefined,
  secondaryCtaHref: undefined,
  backgroundImageUrl: undefined,
  tags: ["Electronics", "Fashion", "Home & Living", "Fast Delivery"],
  isActive: true,
  updatedAt: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function HeroSection() {
  const { data, isError, isLoading } = useHeroSettings();
  //  Hook'u erken dönüşün (early return) yukarısına taşıdık:
  const [query, setQuery] = useState("");

  // Hook'lar tanımlandıktan sonra artık güvenle erken dönüş yapabiliriz.
  if (isLoading) return <HeroSkeleton />;

  // Use live data when ready; fall back if the API errored or returned inactive.
  const hero: HeroSettings = data && data.isActive ? data : FALLBACK;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  // Split headline on literal \n (from DB) or JS newline
  const headlineLines = hero.headline.split(/\\n|\n/);
  const accentWord = hero.headlineAccent ?? "Marketplace";

  return (
    <section
      style={{
        position: "relative",
        minHeight: "88vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "3rem 0",
        background: hero.backgroundImageUrl
          ? `url(${hero.backgroundImageUrl}) center/cover no-repeat`
          : "var(--off-white)",
      }}
    >
      {/* Subtle background texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-5%",
            width: "45%",
            height: "70%",
            background:
              "radial-gradient(ellipse, rgba(200,16,46,0.04) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "-5%",
            width: "35%",
            height: "50%",
            background:
              "radial-gradient(ellipse, rgba(51,51,51,0.04) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "var(--border-light)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          maxWidth: 1300,
          margin: "0 auto",
          padding: "0 2rem",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}
          className="lg:grid-cols-2 grid-cols-1"
        >
          {/* ── Left: Text ── */}
          <div style={{ zIndex: 10 }}>
            {/* Badge */}
            {hero.badgeText && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--red-muted)",
                  color: "var(--red)",
                  border: "1px solid var(--red-subtle)",
                  borderRadius: 999,
                  padding: "4px 14px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  marginBottom: "2rem",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--red)",
                    display: "inline-block",
                  }}
                />
                {hero.badgeText}
              </div>
            )}

            {/* Dynamic headline — apply accent colour to the matching word */}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.75rem, 5vw, 4.5rem)",
                fontWeight: 400,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--charcoal)",
                marginBottom: "1.5rem",
              }}
            >
              {headlineLines.map((line, i) => {
                if (accentWord && line.includes(accentWord)) {
                  const parts = line.split(accentWord);
                  return (
                    <span key={i}>
                      {parts[0]}
                      <em style={{ color: "var(--red)", fontStyle: "italic" }}>
                        {accentWord}
                      </em>
                      {parts.slice(1).join(accentWord)}
                      {i < headlineLines.length - 1 && <br />}
                    </span>
                  );
                }
                return (
                  <span key={i}>
                    {line}
                    {i < headlineLines.length - 1 && <br />}
                  </span>
                );
              })}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                color: "var(--charcoal-soft)",
                lineHeight: 1.8,
                marginBottom: "2.5rem",
                maxWidth: 480,
              }}
            >
              {hero.subtitle}
            </p>

            {/* Search form */}
            <form
              onSubmit={handleSearch}
              style={{ marginBottom: "2rem", maxWidth: 500 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--white)",
                  border: "1.5px solid var(--border-mid)",
                  borderRadius: "0.75rem",
                  padding: "6px 6px 6px 16px",
                  boxShadow: "var(--shadow-sm)",
                  transition:
                    "border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)",
                }}
                className="focus-within:border-(--red)! focus-within:shadow-[0_0_0_3px_var(--red-muted)]"
              >
                <Search
                  style={{
                    color: "var(--charcoal-soft)",
                    flexShrink: 0,
                    marginRight: 8,
                  }}
                  size={16}
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={hero.searchPlaceholder}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9375rem",
                    color: "var(--charcoal)",
                    lineHeight: 1.5,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "var(--red)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    padding: "0.625rem 1.25rem",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(200,16,46,0.25)",
                    transition:
                      "background var(--duration-fast) var(--ease-out)",
                  }}
                >
                  {hero.primaryCtaText} <ArrowRight size={13} />
                </button>
              </div>
            </form>

            {/* Secondary CTA — optional */}
            {hero.secondaryCtaText && hero.secondaryCtaHref && (
              <Link
                href={hero.secondaryCtaHref}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "transparent",
                  border: "1.5px solid var(--border-mid)",
                  borderRadius: "0.5rem",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--charcoal)",
                  textDecoration: "none",
                  marginBottom: "2rem",
                }}
              >
                {hero.secondaryCtaText} <ArrowRight size={14} />
              </Link>
            )}

            {/* Quick-filter tags */}
            {hero.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap" as const,
                  gap: "0.5rem",
                }}
              >
                {hero.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/products?category=${encodeURIComponent(tag.toLowerCase())}`}
                    style={{
                      padding: "5px 14px",
                      background: "var(--white)",
                      border: "1.5px solid var(--border-light)",
                      borderRadius: 999,
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                      color: "var(--charcoal-soft)",
                      letterSpacing: "0.08em",
                      textDecoration: "none",
                      transition:
                        "border-color var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out)",
                    }}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Decorative cards (static visual — unchanged) ── */}
          <div
            className="hidden lg:flex"
            style={{
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
              height: 520,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 380,
                height: 380,
                borderRadius: "50%",
                background: "var(--off-white-2)",
                border: "1px solid var(--border-light)",
              }}
            />

            {/* Main product card */}
            <div
              style={{
                position: "relative",
                width: 320,
                background: "var(--white)",
                borderRadius: 24,
                boxShadow: "var(--shadow-lg)",
                border: "1px solid var(--border-light)",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              <div style={{ height: 3, background: "var(--red)" }} />
              <div
                style={{
                  height: 180,
                  background:
                    "linear-gradient(135deg, var(--off-white) 0%, var(--off-white-2) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 64,
                }}
              >
                📦
              </div>
              <div style={{ padding: "1.5rem" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase" as const,
                    color: "var(--red)",
                    marginBottom: "0.375rem",
                  }}
                >
                  Best Offer
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.25rem",
                    fontWeight: 500,
                    color: "var(--charcoal)",
                    marginBottom: "1rem",
                  }}
                >
                  iPhone 15 Pro
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border-light)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.5rem",
                      fontWeight: 500,
                      color: "var(--charcoal)",
                    }}
                  >
                    ₺72,499
                  </div>
                  <Link
                    href="/flash-sale"
                    style={{
                      background: "transparent",
                      border: "1.5px solid var(--border-mid)",
                      borderRadius: "0.5rem",
                      padding: "0.5rem 1rem",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--charcoal)",
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>

            {/* Tracking float card */}
            <div
              className="animate-float"
              style={{
                position: "absolute",
                top: 40,
                right: -10,
                zIndex: 30,
                background: "var(--white)",
                border: "1px solid var(--border-light)",
                borderRadius: 16,
                padding: "1rem 1.25rem",
                boxShadow: "var(--shadow-md)",
                minWidth: 210,
                animationDelay: "0s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: "var(--charcoal)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Truck size={16} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.625rem",
                      color: "var(--charcoal-soft)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      marginBottom: 2,
                    }}
                  >
                    Courier en route
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--charcoal)",
                    }}
                  >
                    Arriving in 3 mins
                  </div>
                  <div
                    style={{
                      width: "100%",
                      background: "var(--off-white-2)",
                      height: 3,
                      borderRadius: 999,
                      marginTop: 6,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "75%",
                        height: "100%",
                        background: "var(--red)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Store float card */}
            <Link
              href="/auth/apply-merchant"
              className="animate-float"
              style={{
                position: "absolute",
                bottom: 60,
                left: -20,
                zIndex: 30,
                background: "var(--white)",
                border: "1px solid var(--border-light)",
                borderRadius: 16,
                padding: "1rem 1.25rem",
                boxShadow: "var(--shadow-md)",
                transform: "rotate(-2deg)",
                animationDelay: "1.5s",
                textDecoration: "none",
                display: "block",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: "var(--red-muted)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Store size={16} color="var(--red)" />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.625rem",
                      color: "var(--charcoal-soft)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      marginBottom: 2,
                    }}
                  >
                    Seller Panel
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--charcoal)",
                    }}
                  >
                    Open Your Store
                  </div>
                </div>
                <ChevronRight size={14} color="var(--border-mid)" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Shape-matched skeleton — mirrors the real hero layout ─────────────────────

function HeroSkeleton() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "88vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "3rem 0",
        background: "var(--off-white)",
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "0 2rem",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}
          className="lg:grid-cols-2 grid-cols-1"
        >
          {/* Left — text skeleton */}
          <div className="space-y-5">
            <Skeleton className="h-6 w-40 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-4/5 rounded-lg" />
              <Skeleton className="h-12 w-3/5 rounded-lg" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
            <Skeleton className="h-12 w-full max-w-125 rounded-xl mt-2" />
            <div className="flex gap-2 pt-1">
              {[80, 64, 96, 72].map((w) => (
                <Skeleton
                  key={w}
                  className="h-7 rounded-full"
                  style={{ width: w }}
                />
              ))}
            </div>
          </div>

          {/* Right — visual placeholder */}
          <div
            className="hidden lg:flex items-center justify-center"
            style={{ height: 520 }}
          >
            <Skeleton className="w-80 h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
