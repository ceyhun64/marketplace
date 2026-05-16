// components/modules/blog/BlogDetailPage.tsx
// Usage: app/blog/[slug]/page.tsx → import BlogDetailPage from "@/components/modules/blog/BlogDetailPage"
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Share2,
  BookOpen,
  ArrowRight,
} from "lucide-react";

// In production, this would be fetched from the API or CMS.
// For now we export a static map keyed by slug.
const POSTS: Record<
  string,
  {
    title: string;
    category: string;
    tag: string;
    author: string;
    authorRole: string;
    date: string;
    readTime: string;
    excerpt: string;
    content: string[];
  }
> = {
  "how-to-write-product-descriptions-that-sell": {
    title: "How to Write Product Descriptions That Actually Sell",
    category: "Seller Tips",
    tag: "conversion",
    author: "Selin Arslan",
    authorRole: "Head of Product",
    date: "May 14, 2026",
    readTime: "6 min read",
    excerpt:
      "Most sellers underestimate how much a great description moves the needle. We analyzed 10,000 listings and found the patterns that consistently convert.",
    content: [
      "Every seller knows a great product photo helps. Far fewer realize that the description immediately below it is doing just as much work — sometimes more. After analyzing over 10,000 listings on our platform, we found clear patterns that separate the top-converting product pages from the rest.",
      '**Lead with the outcome, not the feature.** Buyers do not want to read a spec sheet. They want to know what the product will do for them. Instead of "Stainless steel thermos with double-wall insulation", try "Keeps your coffee hot for 12 hours — no reheating, no compromises." The second version answers the first question every buyer has: "What does this do for me?"',
      "**Use sensory language.** Words that activate the senses — smooth, crisp, velvety, lightweight — create a mental experience of the product that plain descriptors cannot match. Combine these with dimensions, weights, and materials to give buyers both emotion and facts.",
      "**Structure beats walls of text.** Our data shows listings with 3–5 bullet points alongside a short paragraph get 22% more add-to-cart clicks than listings using paragraphs alone. Use bullets for key features and benefits; use a short paragraph for the story or the use-case.",
      "**Answer the objections before they're raised.** Every product category has common buyer hesitations. For electronics it's compatibility; for clothing it's sizing; for food it's ingredients and allergens. Address these proactively. Buyers who find their objection answered in the description are 3× more likely to convert.",
      "Finally, **keep updating**. The best sellers on our platform treat their descriptions as living documents. Read your reviews, identify what questions buyers are still asking after purchasing, and fold those answers back into the listing. The description that converts best in January might not be the best one in July when seasonal context shifts.",
    ],
  },
};

interface BlogDetailPageProps {
  slug: string;
}

export default function BlogDetailPage({ slug }: BlogDetailPageProps) {
  const post = POSTS[slug];

  if (!post) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--off-white)" }}
      >
        <div className="text-center">
          <BookOpen
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: "rgba(51,51,51,0.15)" }}
          />
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--charcoal)",
            }}
          >
            Article Not Found
          </h1>
          <p
            className="text-sm mb-6"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            This article may have been moved or removed.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: "var(--red)", fontFamily: "var(--font-body)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </main>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div className="max-w-[860px] mx-auto relative z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold mb-8"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
              style={{
                background: "rgba(200,16,46,0.15)",
                color: "var(--red)",
                fontFamily: "var(--font-body)",
              }}
            >
              <Tag className="w-2.5 h-2.5 inline mr-1" />
              {post.tag}
            </span>
            <span
              className="text-xs"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              {post.category}
            </span>
          </div>
          <h1
            className="text-[32px] lg:text-[48px] text-white leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {post.title}
          </h1>
          <p
            className="text-base leading-relaxed mb-8 max-w-2xl"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <span
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {post.author.charAt(0)}
                </span>
              </div>
              <div>
                <p
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {post.author}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: "var(--charcoal-mist)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {post.authorRole}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Calendar className="w-3.5 h-3.5" /> {post.date}
              </span>
              <span
                className="flex items-center gap-1.5 text-xs"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Clock className="w-3.5 h-3.5" /> {post.readTime}
              </span>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="max-w-[860px] mx-auto px-4 lg:px-8 py-14">
        <article
          className="rounded-2xl p-8 lg:p-12 space-y-6"
          style={{
            background: "var(--white)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {post.content.map((para, i) => {
            // Bold markdown-like (**text**)
            const parts = para.split(/\*\*(.*?)\*\*/g);
            return (
              <p
                key={i}
                className="text-[0.9375rem] leading-relaxed"
                style={{
                  color: "var(--charcoal-soft)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {parts.map((part, j) =>
                  j % 2 === 1 ? (
                    <strong
                      key={j}
                      style={{ color: "var(--charcoal)", fontWeight: 700 }}
                    >
                      {part}
                    </strong>
                  ) : (
                    part
                  ),
                )}
              </p>
            );
          })}
        </article>

        {/* Author card */}
        <div
          className="mt-10 rounded-2xl p-6 flex items-start gap-5"
          style={{
            background: "var(--white)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
            style={{
              background: "var(--charcoal)",
              fontFamily: "var(--font-display)",
            }}
          >
            {post.author.charAt(0)}
          </div>
          <div>
            <p
              className="font-bold text-sm mb-0.5"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
            >
              {post.author}
            </p>
            <p
              className="text-xs mb-2"
              style={{
                color: "var(--red)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              {post.authorRole} · BAZR Marketplace
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{
                color: "var(--charcoal-soft)",
                fontFamily: "var(--font-body)",
              }}
            >
              Member of the BAZR core team, focused on helping sellers grow
              through data-driven product decisions.
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-10 flex justify-between items-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{
              color: "var(--charcoal-soft)",
              fontFamily: "var(--font-body)",
            }}
          >
            <ArrowLeft className="w-4 h-4" /> All Articles
          </Link>
          <Link
            href="/seller-guide"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
          >
            Seller Guide <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
