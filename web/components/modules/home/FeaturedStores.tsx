"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Star } from "lucide-react";

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryFocus: string;
  productCount: number;
  rating: number;
  reviewCount: number;
  emoji: string;
  featured: boolean;
}

const MOCK_STORES: Store[] = [
  {
    id: "1",
    name: "TechStore TR",
    slug: "techstore-tr",
    description: "Best price guarantee on the latest electronics.",
    categoryFocus: "Electronics",
    productCount: 1240,
    rating: 4.8,
    reviewCount: 2340,
    emoji: "⚡",
    featured: true,
  },
  {
    id: "2",
    name: "Nature Beauty",
    slug: "nature-beauty",
    description: "100% natural, cruelty-free skin and hair care.",
    categoryFocus: "Cosmetics",
    productCount: 340,
    rating: 4.9,
    reviewCount: 1890,
    emoji: "🌿",
    featured: true,
  },
  {
    id: "3",
    name: "Home Decor Plus",
    slug: "home-decor-plus",
    description: "Modern and minimalist home decoration solutions.",
    categoryFocus: "Home & Living",
    productCount: 890,
    rating: 4.7,
    reviewCount: 956,
    emoji: "🏠",
    featured: true,
  },
  {
    id: "4",
    name: "SportLife",
    slug: "sportlife",
    description: "Equipment for professional and amateur athletes.",
    categoryFocus: "Sports",
    productCount: 670,
    rating: 4.6,
    reviewCount: 1240,
    emoji: "🏃",
    featured: false,
  },
];

export default function FeaturedStores() {
  return (
    <section
      style={{
        padding: "5rem 0 6rem",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 2rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "3.5rem",
            flexWrap: "wrap" as const,
            gap: "1.5rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 1,
                  background: "var(--red)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase" as const,
                  color: "var(--charcoal-soft)",
                }}
              >
                Elite Partners
              </span>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: "var(--charcoal)",
              }}
            >
              Trusted sellers,{" "}
              <em style={{ color: "var(--red)", fontStyle: "italic" }}>
                verified quality.
              </em>
            </h2>
          </div>
          <Link
            href="/stores"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              color: "var(--charcoal-mid)",
              textDecoration: "none",
              transition: "color var(--dur-fast)",
            }}
            className="hover:text-[var(--red)]"
          >
            All Stores
            <ArrowUpRight size={15} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
          className="lg:grid-cols-4 md:grid-cols-2 grid-cols-1"
        >
          {MOCK_STORES.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.slug}`}
              style={{
                position: "relative",
                display: "block",
                background: "var(--white)",
                borderRadius: "var(--radius-lg)",
                padding: "1.75rem",
                textDecoration: "none",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-xs)",
                overflow: "hidden",
                transition:
                  "transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)",
              }}
              className="group hover:-translate-y-1 hover:shadow-md hover:!border-[rgba(200,16,46,0.2)]"
            >
              {/* Top accent */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "var(--red)",
                  transformOrigin: "left",
                  transform: "scaleX(0)",
                  transition: "transform var(--dur-base) var(--ease-out)",
                }}
                className="group-hover:!scale-x-100"
              />

              {/* Store header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "var(--radius-md)",
                    background: "var(--red-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    transition:
                      "background var(--dur-base), transform var(--dur-base) var(--ease-spring)",
                  }}
                  className="group-hover:bg-[var(--red-subtle)] group-hover:scale-105"
                >
                  {store.emoji}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "var(--off-white)",
                    borderRadius: "var(--radius-md)",
                    padding: "4px 10px",
                  }}
                >
                  <Star
                    size={11}
                    style={{ fill: "var(--red)", color: "var(--red)" }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                      color: "var(--charcoal)",
                    }}
                  >
                    {store.rating}
                  </span>
                </div>
              </div>

              {/* Name + desc */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: "0.5rem",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-base)",
                      fontWeight: 700,
                      color: "var(--charcoal)",
                      letterSpacing: "-0.01em",
                      transition: "color var(--dur-fast)",
                    }}
                    className="group-hover:text-[var(--red)]"
                  >
                    {store.name}
                  </h3>
                  {store.featured && (
                    <CheckCircle2
                      size={14}
                      style={{ color: "var(--red)", flexShrink: 0 }}
                    />
                  )}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-sm)",
                    color: "var(--charcoal-soft)",
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}
                >
                  {store.description}
                </p>
              </div>

              {/* Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                {[
                  { label: "Products", value: `${store.productCount}+` },
                  {
                    label: "Reviews",
                    value: store.reviewCount.toLocaleString(),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: "var(--off-white)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.625rem 0.875rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-2xs)",
                        color: "var(--charcoal-mist)",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.1em",
                        marginBottom: 2,
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "var(--text-sm)",
                        fontWeight: 700,
                        color: "var(--charcoal)",
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "1.125rem",
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    color: "var(--charcoal-mid)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Visit Store
                </span>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: "var(--off-white-2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition:
                      "background var(--dur-fast), transform var(--dur-fast) var(--ease-spring)",
                  }}
                  className="group-hover:!bg-[var(--red-muted)] group-hover:scale-110"
                >
                  <ArrowUpRight
                    size={13}
                    style={{ color: "var(--charcoal-mid)" }}
                    className="group-hover:text-[var(--red)]"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Merchant CTA banner */}
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            padding: "3rem 3.5rem",
            background: "var(--charcoal)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "2rem",
            flexWrap: "wrap" as const,
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 320,
              height: 320,
              borderRadius: "50%",
              border: "60px solid rgba(200,16,46,0.08)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -50,
              left: 200,
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: "30px solid rgba(200,16,46,0.05)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.16em",
                color: "rgba(200,16,46,0.7)",
                display: "block",
                marginBottom: "0.875rem",
              }}
            >
              Merchant Program
            </span>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 400,
                color: "var(--white)",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                maxWidth: 480,
              }}
            >
              Open your store and reach{" "}
              <em style={{ color: "var(--red)", fontStyle: "italic" }}>
                millions of customers.
              </em>
            </h3>
          </div>
          <Link
            href="/auth/register?role=merchant"
            style={{
              position: "relative",
              zIndex: 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "1rem 2rem",
              borderRadius: "var(--radius-lg)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              fontWeight: 700,
              letterSpacing: "0.02em",
              textDecoration: "none",
              background: "var(--white)",
              color: "var(--charcoal)",
              flexShrink: 0,
              boxShadow: "0 8px 32px rgba(200,16,46,0.2)",
              transition:
                "background var(--dur-fast), color var(--dur-fast), transform var(--dur-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--red)";
              (e.currentTarget as HTMLElement).style.color = "#fff";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--white)";
              (e.currentTarget as HTMLElement).style.color = "var(--charcoal)";
              (e.currentTarget as HTMLElement).style.transform =
                "translateY(0)";
            }}
          >
            Start Selling Now
            <ArrowUpRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
