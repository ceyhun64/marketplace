"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Truck,
  Package,
  Store,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const HERO_TAGS = ["Electronics", "Fashion", "Home & Living", "Fast Delivery"];

export default function HeroSection() {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

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
        {/* Decorative line */}
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
          maxWidth: 1100,
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
          {/* Left: Text content */}
          <div style={{ zIndex: 10 }}>
            {/* Section label */}
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
              Next-Gen Commerce
            </div>

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
              Premium{" "}
              <em style={{ color: "var(--red)", fontStyle: "italic" }}>
                Marketplace
              </em>
              <br />
              Meets Fast Delivery.
            </h1>

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
              We redefine digital commerce with independent stores and an
              integrated courier engine — everything under one roof.
            </p>

            {/* Search */}
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
                className="focus-within:!border-[var(--red)] focus-within:shadow-[0_0_0_3px_var(--red-muted)]"
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
                  placeholder="Search products, stores..."
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
                    transition:
                      "background var(--duration-fast) var(--ease-out)",
                    boxShadow: "0 2px 8px rgba(200,16,46,0.25)",
                  }}
                >
                  Search <ArrowRight size={13} />
                </button>
              </div>
            </form>

            {/* Tags */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap" as const,
                gap: "0.5rem",
              }}
            >
              {HERO_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/products?category=${tag.toLowerCase()}`}
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
          </div>

          {/* Right: Visual cards */}
          <div
            className="hidden lg:flex"
            style={{
              position: "relative",
              alignItems: "center",
              justifyContent: "center",
              height: 520,
            }}
          >
            {/* Background circle */}
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
              {/* Red top accent */}
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
                  <button
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
                      transition:
                        "border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)",
                    }}
                  >
                    View Details
                  </button>
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

            {/* Store card */}
            <div
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
