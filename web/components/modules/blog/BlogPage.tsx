"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, Tag, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["All", "Seller Tips", "Platform Updates", "Guides", "Trends"];

interface BlogPost {
  id: string | number;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  featured?: boolean;
  tag: string;
}

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

function useBlogPosts() {
  return useQuery<BlogPost[]>({
    queryKey: ["blog", "posts"],
    queryFn: async () => {
      const { data } = await api.get<BlogPost[]>("/api/blog/posts");
      return Array.isArray(data) ? data : (data as any)?.items ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

function PostCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white h-64" style={{ border: "1px solid rgba(51,51,51,0.07)" }}>
      <Skeleton className="h-36 w-full" />
      <div className="p-5 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: posts = [], isLoading } = useBlogPosts();

  const filtered =
    activeCategory === "All"
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  const featured = posts.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured || activeCategory !== "All");

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
            background: "radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-[1300px] mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" style={{ color: "var(--red)" }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[3px]"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Blog & Resources
            </span>
          </div>
          <h1
            className="text-[36px] lg:text-[56px] text-white leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Insights for{" "}
            <span style={{ color: "var(--red)" }}>Smarter Selling</span>
          </h1>
          <p
            className="text-sm max-w-lg"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            Tips, guides, and platform updates to help you grow your store and
            deliver better experiences.
          </p>
        </div>
      </div>

      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: activeCategory === cat ? "var(--charcoal)" : "white",
                color: activeCategory === cat ? "white" : "var(--charcoal-soft)",
                border: `1px solid ${activeCategory === cat ? "var(--charcoal)" : "rgba(51,51,51,0.12)"}`,
                fontFamily: "var(--font-body)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && (
          <>
            {/* Featured Post */}
            {activeCategory === "All" && featured && (
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
                        style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                      >
                        {featured.category}
                      </span>
                    </div>
                    <h2
                      className="text-[26px] lg:text-[32px] leading-tight mb-4 group-hover:text-[var(--red)] transition-colors"
                      style={{ fontFamily: "var(--font-display)", color: "var(--charcoal)" }}
                    >
                      {featured.title}
                    </h2>
                    <p
                      className="text-[0.9375rem] leading-relaxed mb-6"
                      style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
                    >
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-4">
                      <span
                        className="text-xs"
                        style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                      >
                        {featured.author} · {featured.date}
                      </span>
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
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
                    <TrendingUp className="w-10 h-10" style={{ color: "var(--charcoal-mist)" }} />
                  </div>
                </div>
              </Link>
            )}

            {/* Post Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
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
                      <BookOpen className="w-8 h-8" style={{ color: "var(--charcoal-mist)" }} />
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            background: TAG_COLORS[post.tag] ?? "rgba(51,51,51,0.06)",
                            color: TAG_TEXT[post.tag] ?? "var(--charcoal-soft)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          <Tag className="w-2.5 h-2.5 inline mr-1" />
                          {post.tag}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                        >
                          {post.category}
                        </span>
                      </div>

                      <h3
                        className="font-bold text-[0.9375rem] leading-snug mb-2 group-hover:text-[var(--red)] transition-colors flex-1"
                        style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                      >
                        {post.title}
                      </h3>

                      <p
                        className="text-xs leading-relaxed mb-4"
                        style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
                      >
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <span
                          className="flex items-center gap-1 text-[11px]"
                          style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                        >
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                        <span
                          className="flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-all"
                          style={{ color: "var(--red)", fontFamily: "var(--font-body)" }}
                        >
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <BookOpen
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: "rgba(51,51,51,0.15)" }}
                />
                <p style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
                  No posts in this category yet.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
