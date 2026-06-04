"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Award,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { MerchantProfile } from "@/types/entities";

const CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Home & Living",
  "Sports",
  "Beauty",
  "Toys",
  "Books",
];

const SORT_OPTIONS = [
  { key: "featured", label: "Featured" },
  { key: "name", label: "A → Z" },
  { key: "rating", label: "Top Rated" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

// Skeleton card
function BrandCardSkeleton() {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--border-light)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Skeleton style={{ height: 100, width: "100%" }} />
      <div
        style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Skeleton
            style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <Skeleton style={{ height: 16, width: "70%" }} />
            <Skeleton style={{ height: 13, width: "45%" }} />
          </div>
        </div>
        <Skeleton style={{ height: 36, borderRadius: 100 }} />
      </div>
    </div>
  );
}

// Stable mock values computed once per brand ID, outside the render cycle
const _brandMockCache = new Map<string, { rating: number; productCount: number }>();
function getBrandMock(id: string) {
  if (!_brandMockCache.has(id)) {
    _brandMockCache.set(id, {
      rating: 4.2 + Math.random() * 0.7,
      productCount: 10 + Math.floor(Math.random() * 290),
    });
  }
  return _brandMockCache.get(id)!;
}

// Brand card
function BrandCard({ brand }: { brand: MerchantProfile }) {
  const { rating, productCount } = getBrandMock(brand.slug ?? brand.id ?? "");

  return (
    <Link
      href={`/store/${brand.slug}`}
      style={{
        background: "white",
        border: "1px solid var(--border-light)",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        display: "block",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      className="hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Banner */}
      <div
        style={{
          height: 90,
          background: "var(--off-white-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {brand.bannerUrl ? (
          <img
            src={brand.bannerUrl}
            alt={brand.storeName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, var(--charcoal) 0%, var(--charcoal-mid) 100%)",
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "0 1.25rem 1.25rem" }}>
        {/* Logo + name */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "0.75rem",
            marginTop: -24,
            marginBottom: "0.875rem",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: "white",
              border: "2px solid white",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              flexShrink: 0,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.storeName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "1.125rem",
                  color: "var(--charcoal)",
                }}
              >
                {brand.storeName?.charAt(0) ?? "B"}
              </span>
            )}
          </div>
          <div style={{ paddingBottom: "0.25rem" }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--charcoal)",
                lineHeight: 1.2,
              }}
            >
              {brand.storeName}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--charcoal-soft)",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Star
                style={{
                  width: 11,
                  height: 11,
                  color: "#eab308",
                  fill: "#eab308",
                }}
              />
              {rating.toFixed(1)} · {productCount} products
            </div>
          </div>
        </div>

        {brand.description && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--charcoal-soft)",
              lineHeight: 1.5,
              marginBottom: "0.875rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {brand.description}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            background: "var(--off-white-2)",
            borderRadius: 100,
            padding: "0.5rem 1rem",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--charcoal)",
          }}
        >
          Visit Store <ChevronRight style={{ width: 14, height: 14 }} />
        </div>
      </div>
    </Link>
  );
}

function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await api.get<MerchantProfile[]>(
        "/api/merchants?limit=48",
      );
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export default function BrandsPage() {
  const { data: brands, isLoading, isError } = useBrands();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("featured");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = brands ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.storeName?.toLowerCase().includes(q));
    }
    if (sortKey === "name") {
      list = [...list].sort((a, b) =>
        (a.storeName ?? "").localeCompare(b.storeName ?? "", "en"),
      );
    }
    return list;
  }, [brands, search, sortKey]);

  // Group by letter for A–Z mode
  const grouped = useMemo(() => {
    if (sortKey !== "name") return null;
    const map: Record<string, MerchantProfile[]> = {};
    filtered.forEach((b) => {
      const letter = (b.storeName ?? "#").charAt(0).toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(b);
    });
    return map;
  }, [filtered, sortKey]);

  const alphabet = grouped ? Object.keys(grouped).sort() : null;

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div
        style={{
          background: "var(--charcoal)",
          padding: "4rem 1.5rem 3rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(200,16,46,0.12) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 1300, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <Award
              style={{ width: 14, height: 14, color: "var(--red-light)" }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
              }}
            >
              All Brands
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              fontWeight: 600,
              color: "white",
              lineHeight: 1.1,
              marginBottom: "1rem",
            }}
          >
            Discover,{" "}
            <span style={{ color: "var(--red-light)" }}>Compare</span>, Buy
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "1.0625rem",
              maxWidth: 520,
              lineHeight: 1.65,
              marginBottom: "2rem",
            }}
          >
            Browse hundreds of brands on BAZR. Authentic products from
            verified sellers at competitive prices.
          </p>

          {/* Search */}
          <div style={{ maxWidth: 480, position: "relative" }}>
            <Search
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                width: 18,
                height: 18,
                color: "var(--charcoal-mist)",
              }}
            />
            <Input
              placeholder="Search brands…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: "2.75rem",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                borderRadius: 12,
                height: 48,
                fontSize: "0.9375rem",
              }}
            />
          </div>
        </div>
      </div>

      {/* Category filters + sort */}
      <div
        style={{
          background: "white",
          borderBottom: "1px solid var(--border-light)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            overflowX: "auto",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                flexShrink: 0,
                padding: "0.875rem 1rem",
                borderBottom: `2px solid ${activeCategory === cat ? "var(--red)" : "transparent"}`,
                background: "transparent",
                border: "none",
                color:
                  activeCategory === cat
                    ? "var(--red)"
                    : "var(--charcoal-soft)",
                fontWeight: activeCategory === cat ? 700 : 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}

          <div
            style={{
              marginLeft: "auto",
              flexShrink: 0,
              display: "flex",
              gap: "0.5rem",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                style={{
                  padding: "0.4rem 0.875rem",
                  borderRadius: 100,
                  border: "1px solid",
                  borderColor:
                    sortKey === opt.key ? "var(--red)" : "var(--border-light)",
                  background:
                    sortKey === opt.key ? "var(--red)" : "transparent",
                  color: sortKey === opt.key ? "white" : "var(--charcoal-soft)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{ maxWidth: 1300, margin: "0 auto", padding: "2.5rem 1.5rem" }}
      >
        {isError && (
          <div
            style={{
              textAlign: "center",
              padding: "5rem 0",
              color: "var(--red)",
              fontWeight: 600,
            }}
          >
            Failed to load brands. Please try again.
          </div>
        )}

        {isLoading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <BrandCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <Search
              style={{
                width: 56,
                height: 56,
                color: "var(--charcoal-mist)",
                margin: "0 auto 1rem",
                opacity: 0.4,
              }}
            />
            <p
              style={{
                fontWeight: 600,
                fontSize: "1.125rem",
                color: "var(--charcoal-soft)",
              }}
            >
              No brands found for &quot;{search}&quot;
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            {/* Result count */}
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--charcoal-soft)",
                marginBottom: "1.5rem",
              }}
            >
              <strong style={{ color: "var(--charcoal)" }}>
                {filtered.length}
              </strong>{" "}
              {filtered.length === 1 ? "brand" : "brands"}
            </p>

            {/* A–Z grouped view */}
            {sortKey === "name" && alphabet && grouped ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2.5rem",
                }}
              >
                {alphabet.map((letter) => (
                  <div key={letter}>
                    <div
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "var(--red)",
                        marginBottom: "1rem",
                        paddingBottom: "0.5rem",
                        borderBottom: "2px solid var(--border-light)",
                      }}
                    >
                      {letter}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: "1.25rem",
                      }}
                    >
                      {grouped[letter].map((b) => (
                        <BrandCard key={b.id} brand={b} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Regular grid */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "1.25rem",
                }}
              >
                {filtered.map((b) => (
                  <BrandCard key={b.id} brand={b} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Feature banner */}
        {!isLoading && (
          <div
            style={{
              marginTop: "4rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              {
                icon: TrendingUp,
                title: "Trending Brands",
                desc: "Trending brands and deals updated every week.",
                href: "/deals",
                color: "var(--red)",
              },
              {
                icon: Sparkles,
                title: "New Arrivals",
                desc: "Discover brands that recently joined our platform.",
                href: "/new",
                color: "#6366f1",
              },
              {
                icon: Star,
                title: "Best Sellers",
                desc: "The most popular brands among our customers.",
                href: "/bestsellers",
                color: "#eab308",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                style={{
                  background: "white",
                  border: "1px solid var(--border-light)",
                  borderRadius: 16,
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  textDecoration: "none",
                  transition: "box-shadow 0.2s",
                }}
                className="hover:shadow-md"
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: `${item.color}12`,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <item.icon
                    style={{ width: 22, height: 22, color: item.color }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      color: "var(--charcoal)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--charcoal-soft)",
                      lineHeight: 1.4,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
                <ChevronRight
                  style={{
                    width: 16,
                    height: 16,
                    color: "var(--charcoal-mist)",
                    marginLeft: "auto",
                    flexShrink: 0,
                  }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
