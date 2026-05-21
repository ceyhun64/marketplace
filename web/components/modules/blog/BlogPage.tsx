"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ArrowRight,
  Tag,
  TrendingUp,
  Search,
  X,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Seller Tips",
  "Platform Updates",
  "Guides",
  "Trends",
];

// Static blog posts — replace with API call when endpoint is ready
const STATIC_POSTS = [
  {
    id: 1,
    slug: "how-to-write-product-descriptions-that-sell",
    category: "Seller Tips",
    title: "How to Write Product Descriptions That Actually Sell",
    excerpt:
      "Most sellers underestimate how much a great description moves the needle. We analyzed 10,000 listings and found the patterns that consistently convert.",
    author: "Selin Arslan",
    date: "May 14, 2026",
    readTime: "6 min read",
    featured: true,
    tag: "conversion",
  },
  {
    id: 2,
    slug: "bazr-introduces-bulk-listing-import",
    category: "Platform Updates",
    title: "New: Bulk Product Import via CSV — List 500 Products in Minutes",
    excerpt:
      "We're rolling out a long-requested feature: import your entire catalogue with a single CSV upload. Here's everything you need to know.",
    author: "BAZR Team",
    date: "May 10, 2026",
    readTime: "3 min read",
    featured: false,
    tag: "new",
  },
  {
    id: 3,
    slug: "shipping-carrier-guide-2026",
    category: "Guides",
    title: "Choosing the Right Shipping Carrier for Your Store in 2026",
    excerpt:
      "Yurtiçi, Aras, MNG — each carrier has different strengths. This side-by-side comparison helps you pick the right one for your order volume and product type.",
    author: "Mert Öztürk",
    date: "May 6, 2026",
    readTime: "8 min read",
    featured: false,
    tag: "shipping",
  },
  {
    id: 4,
    slug: "e-commerce-trends-summer-2026",
    category: "Trends",
    title: "5 E-Commerce Trends Shaping Summer 2026",
    excerpt:
      "From social commerce to AI-driven recommendations — here's what the data says about where online retail is heading this season.",
    author: "Alp Kaya",
    date: "April 28, 2026",
    readTime: "7 min read",
    featured: false,
    tag: "trends",
  },
  {
    id: 5,
    slug: "seo-for-marketplace-sellers",
    category: "Seller Tips",
    title: "SEO for Marketplace Sellers: Rank Higher in Platform Search",
    excerpt:
      "BAZR's internal search algorithm considers more than just the title. Learn how to optimize tags, descriptions, and category placement to outrank competitors.",
    author: "Selin Arslan",
    date: "April 20, 2026",
    readTime: "9 min read",
    featured: false,
    tag: "seo",
  },
  {
    id: 6,
    slug: "handling-returns-gracefully",
    category: "Seller Tips",
    title: "How Top Sellers Handle Returns Without Hurting Their Rating",
    excerpt:
      "Returns are inevitable. The difference between a 4.7 and a 4.9 rating often comes down to how sellers respond, not whether returns happen at all.",
    author: "Mert Öztürk",
    date: "April 12, 2026",
    readTime: "5 min read",
    featured: false,
    tag: "returns",
  },
];

const TAG_COLORS: Record<string, string> = {
  conversion: "rgba(200,16,46,0.08)",
  new: "rgba(34,197,94,0.08)",
  shipping: "rgba(59,130,246,0.08)",
  trends: "rgba(168,85,247,0.08)",
  seo: "rgba(234,179,8,0.08)",
  returns: "rgba(249,115,22,0.08)",
};
const TAG_TEXT: Record<string, string> = {
  conversion: "#c8102e",
  new: "#16a34a",
  shipping: "#2563eb",
  trends: "#7c3aed",
  seo: "#ca8a04",
  returns: "#ea580c",
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let posts = STATIC_POSTS;
    if (activeCategory !== "All") {
      posts = posts.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    return posts;
  }, [activeCategory, search]);

  const featured = STATIC_POSTS.find((p) => p.featured);
  const rest = filtered.filter(
    (p) => !p.featured || activeCategory !== "All" || search.trim(),
  );

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-325 mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" style={{ color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Blog & Resources
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1
                className="text-[36px] lg:text-[56px] text-white leading-tight mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Insights for{" "}
                <span style={{ color: "var(--red)" }}>Smarter Selling</span>
              </h1>
              <p
                className="text-sm max-w-lg"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Tips, guides, and platform updates to help you grow your store
                and deliver better experiences.
              </p>
            </div>
            {/* Search bar */}
            <div className="relative max-w-xs w-full lg:w-auto flex-shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white",
                  fontFamily: "var(--font-body)",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X
                    className="w-3.5 h-3.5"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-325 mx-auto px-4 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background:
                  activeCategory === cat ? "var(--charcoal)" : "white",
                color:
                  activeCategory === cat ? "white" : "var(--charcoal-soft)",
                border: `1px solid ${activeCategory === cat ? "var(--charcoal)" : "rgba(51,51,51,0.12)"}`,
                fontFamily: "var(--font-body)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search result label */}
        {search.trim() && (
          <div className="mb-6 flex items-center gap-2">
            <span
              className="text-sm"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "
              <strong style={{ color: "var(--charcoal)" }}>{search}</strong>"
            </span>
            <button
              onClick={() => setSearch("")}
              className="text-xs underline"
              style={{
                color: "var(--charcoal-mist)",
                fontFamily: "var(--font-body)",
              }}
            >
              Clear
            </button>
          </div>
        )}

        {/* Featured Post — only when no search and category is All */}
        {activeCategory === "All" && !search.trim() && featured && (
          <Link href={`/blog/${featured.slug}`} className="block mb-10 group">
            <div
              className="rounded-2xl overflow-hidden bg-white p-8 lg:p-10 flex flex-col lg:flex-row gap-8 items-center transition-shadow"
              style={{
                border: "1px solid rgba(51,51,51,0.07)",
                boxShadow: "0 1px 6px rgba(51,51,51,0.04)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 24px rgba(51,51,51,0.10)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.boxShadow =
                  "0 1px 6px rgba(51,51,51,0.04)")
              }
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
                    style={{
                      background: "rgba(200,16,46,0.08)",
                      color: "var(--red)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Featured
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: "var(--charcoal-mist)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {featured.category}
                  </span>
                </div>
                <h2
                  className="text-[26px] lg:text-[32px] leading-tight mb-4 group-hover:text-[var(--red)] transition-colors"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--charcoal)",
                  }}
                >
                  {featured.title}
                </h2>
                <p
                  className="text-[0.9375rem] leading-relaxed mb-6"
                  style={{
                    color: "var(--charcoal-soft)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-4">
                  <span
                    className="text-xs"
                    style={{
                      color: "var(--charcoal-mist)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {featured.author} · {featured.date}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{
                      color: "var(--charcoal-mist)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    {featured.readTime}
                  </span>
                </div>
              </div>
              <div
                className="w-full lg:w-56 h-36 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: "var(--off-white-2)" }}
              >
                <TrendingUp
                  className="w-10 h-10"
                  style={{ color: "var(--charcoal-mist)" }}
                />
              </div>
            </div>
          </Link>
        )}

        {/* Post Grid */}
        {filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <div
                  className="rounded-2xl overflow-hidden bg-white h-full flex flex-col transition-shadow"
                  style={{
                    border: "1px solid rgba(51,51,51,0.07)",
                    boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.boxShadow =
                      "0 6px 20px rgba(51,51,51,0.10)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.boxShadow =
                      "0 1px 4px rgba(51,51,51,0.04)")
                  }
                >
                  <div
                    className="h-36 flex items-center justify-center"
                    style={{ background: "var(--off-white-2)" }}
                  >
                    <BookOpen
                      className="w-8 h-8"
                      style={{ color: "var(--charcoal-mist)" }}
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          background:
                            TAG_COLORS[post.tag] ?? "rgba(51,51,51,0.06)",
                          color: TAG_TEXT[post.tag] ?? "var(--charcoal-soft)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        <Tag className="w-2.5 h-2.5 inline mr-1" />
                        {post.tag}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{
                          color: "var(--charcoal-mist)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {post.category}
                      </span>
                    </div>
                    <h3
                      className="font-bold text-[0.9375rem] leading-snug mb-2 group-hover:text-[var(--red)] transition-colors flex-1"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {post.title}
                    </h3>
                    <p
                      className="text-xs leading-relaxed mb-4"
                      style={{
                        color: "var(--charcoal-soft)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span
                          className="text-[11px] block"
                          style={{
                            color: "var(--charcoal-soft)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {post.author}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[11px]"
                          style={{
                            color: "var(--charcoal-mist)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <Clock className="w-3 h-3" />
                          {post.readTime} · {post.date}
                        </span>
                      </div>
                      <span
                        className="flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-all"
                        style={{
                          color: "var(--red)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "rgba(51,51,51,0.15)" }}
            />
            <p
              className="font-semibold mb-1"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
            >
              No articles found
            </p>
            <p
              className="text-sm"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              Try a different keyword or category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="mt-4 text-sm font-semibold underline"
              style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
