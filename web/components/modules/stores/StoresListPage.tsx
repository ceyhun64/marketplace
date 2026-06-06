"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  Clock,
  Package,
  Star,
  ChevronDown,
  ArrowRight,
  X,
  CheckCircle2,
  Heart,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { MerchantProfile } from "@/types/entities";
import { useStoreList } from "@/queries/useStore";
import { useStoreFollowStatus, useFollowStore } from "@/queries/useStoreFollow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "popular" | "newest" | "name";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Most Popular" },
  { key: "newest",  label: "Newest" },
  { key: "name",    label: "A – Z" },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/6">
      <Skeleton className="h-28 w-full" />
      <div className="px-4 pt-10 pb-5 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-9 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ── Store Card ────────────────────────────────────────────────────────────────
function CardFollowButton({ slug, storeName }: { slug: string; storeName: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data } = useStoreFollowStatus(slug);
  const { isLoggedIn, isPending, toggle } = useFollowStore(slug);
  const isFollowing = mounted && (data?.isFollowing ?? false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please sign in to follow stores.", {
        action: { label: "Sign in", onClick: () => { window.location.href = "/auth/login"; } },
      });
      return;
    }
    toggle();
    if (!isFollowing) toast.success(`Following ${storeName}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={isFollowing ? "Unfollow" : "Follow store"}
      className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-150"
      style={{
        border: `1.5px solid ${isFollowing ? "rgba(200,16,46,0.3)" : "var(--border-mid)"}`,
        background: isFollowing ? "rgba(200,16,46,0.06)" : "var(--off-white)",
      }}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--charcoal-soft)" }} />
      ) : (
        <Heart
          className="w-3.5 h-3.5 transition-all duration-150"
          style={{
            color: isFollowing ? "var(--red)" : "var(--charcoal-mist)",
            fill: isFollowing ? "var(--red)" : "none",
          }}
        />
      )}
    </button>
  );
}

function StoreCard({ store }: { store: MerchantProfile }) {
  const memberYear = store.createdAt
    ? new Date(store.createdAt).getFullYear()
    : null;
  const initials = store.storeName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const isVerified = (store.averageRating ?? 0) >= 4.5;

  return (
    <div className="group bg-white rounded-2xl overflow-visible border border-black/6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Banner — no overflow-hidden here so the logo isn't clipped by translate-y */}
      <Link href={`/store/${store.slug}`} className="relative block h-28 rounded-t-2xl">
        {/* Image/gradient clipped inside its own wrapper */}
        <div className="absolute inset-0 rounded-t-2xl overflow-hidden">
          {store.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.bannerUrl}
              alt={store.storeName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background:
                  "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 40%, #2a1a1a 100%)",
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center select-none"
                style={{
                  background:
                    "radial-gradient(circle at 70% 50%, rgba(200,16,46,0.2) 0%, transparent 60%)",
                }}
              >
                <span
                  className="font-black opacity-10 select-none"
                  style={{ fontSize: "5rem", color: "white", letterSpacing: "-0.05em" }}
                >
                  {initials}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Red accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-0.75 z-1"
          style={{ background: "#c8102e" }}
        />

        {/* Logo — outside the overflow-hidden wrapper so translate-y is not clipped */}
        <div className="absolute bottom-0 left-4 translate-y-1/2 z-10">
          <div
            className="w-14 h-14 rounded-xl bg-white overflow-hidden flex items-center justify-center"
            style={{ boxShadow: "0 0 0 3px white, 0 4px 14px rgba(0,0,0,0.14)" }}
          >
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.storeName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="font-black text-lg"
                style={{ color: "#c8102e" }}
              >
                {initials}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="px-4 pt-10 pb-5 flex flex-col flex-1">
        {/* Name + verified */}
        <div className="flex items-start gap-1.5 mb-0.5">
          <h3
            className="font-bold text-[15px] leading-tight truncate group-hover:text-(--red) transition-colors duration-150 flex-1"
            style={{ color: "var(--charcoal)" }}
          >
            {store.storeName}
          </h3>
          {isVerified && (
            <CheckCircle2
              className="w-4 h-4 shrink-0 mt-0.5"
              style={{ color: "#c8102e" }}
              aria-label="Verified seller"
            />
          )}
        </div>

        {/* Slug */}
        <p
          className="text-[11px] mb-3"
          style={{ fontFamily: "var(--font-jetbrains)", color: "var(--charcoal-mist)" }}
        >
          @{store.slug}
        </p>

        {/* Description */}
        {store.description && (
          <p
            className="text-[13px] leading-relaxed line-clamp-2 mb-4"
            style={{ color: "var(--charcoal-soft)" }}
          >
            {store.description}
          </p>
        )}

        {/* Stats */}
        <div
          className="flex items-center gap-3 mb-4 text-xs flex-wrap"
          style={{ color: "var(--charcoal-mist)" }}
        >
          {store.averageRating != null && (
            <>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-semibold" style={{ color: "var(--charcoal)" }}>
                  {store.averageRating.toFixed(1)}
                </span>
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span className="font-semibold" style={{ color: "var(--charcoal)" }}>
              {store.productCount ?? 0}
            </span>{" "}
            products
          </span>
          {store.handlingHours > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Ships in{" "}
                <span className="font-semibold" style={{ color: "var(--charcoal)" }}>
                  {store.handlingHours}h
                </span>
              </span>
            </>
          )}
          {memberYear && (
            <>
              <span aria-hidden>·</span>
              <span>Since {memberYear}</span>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto flex gap-2">
          <Link
            href={`/store/${store.slug}`}
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-[13px] font-bold transition-all duration-150"
            style={{ background: "var(--charcoal)", color: "white" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "#c8102e")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.background = "var(--charcoal)")
            }
          >
            Visit Store
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <CardFollowButton slug={store.slug} storeName={store.storeName} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StoresListPage() {
  const { data: stores, isLoading, isError } = useStoreList();
  const [query, setQuery]   = useState("");
  const [sort, setSort]     = useState<SortKey>("popular");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = (stores ?? []).filter(
      (s) =>
        s.storeName.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.description?.toLowerCase().includes(q) ?? false),
    );
    if (sort === "name") {
      list = [...list].sort((a, b) =>
        a.storeName.localeCompare(b.storeName, "en"),
      );
    }
    return list;
  }, [stores, query, sort]);

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden py-14 px-4"
        style={{ background: "var(--charcoal)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(200,16,46,0.12) 0%, transparent 55%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Store
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--charcoal-soft)" }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[3px]"
                  style={{
                    color: "var(--charcoal-soft)",
                    fontFamily: "var(--font-jetbrains)",
                  }}
                >
                  Independent Stores
                </span>
              </div>

              <h1
                className="text-white leading-tight mb-2"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  fontWeight: 600,
                }}
              >
                All Stores
                {!isLoading && !isError && stores && (
                  <span
                    className="ml-3 font-normal"
                    style={{
                      color: "var(--red-light)",
                      fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                    }}
                  >
                    ({filtered.length})
                  </span>
                )}
              </h1>
              <p
                className="text-[15px]"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Discover unique stores from our trusted sellers.
              </p>
            </div>

            {/* Become a Seller CTA */}
            <Link
              href="/auth/apply-merchant"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-[14px] font-bold transition-all shrink-0"
              style={{ background: "#c8102e" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "#a00d24")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "#c8102e")
              }
            >
              Open Your Store
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-md mt-7">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--charcoal-soft)" }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full transition-colors"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search stores…"
              className="w-full h-12 pl-10 pr-10 rounded-xl text-[15px] text-white outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <div
        className="bg-white sticky top-0 z-10 px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="text-sm" style={{ color: "var(--charcoal-soft)" }}>
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <span>
                <span className="font-semibold" style={{ color: "var(--charcoal)" }}>
                  {filtered.length.toLocaleString()}
                </span>{" "}
                {filtered.length === 1 ? "store" : "stores"}
                {query && (
                  <>
                    {" for "}
                    <span className="font-semibold" style={{ color: "var(--red)" }}>
                      &ldquo;{query}&rdquo;
                    </span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-auto text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {/* Error */}
        {isError && (
          <div className="text-center py-20">
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
            >
              Failed to load stores. Please try again.
            </div>
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <StoreCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(30,30,30,0.05)" }}
            >
              <Store className="w-6 h-6" style={{ color: "var(--charcoal-mist)" }} />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: "var(--charcoal)" }}>
              {query ? `No stores match "${query}"` : "No stores found"}
            </p>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ background: "rgba(200,16,46,0.08)", color: "var(--red)" }}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Cards */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}

        {/* Become a Seller banner */}
        {!isLoading && !isError && (
          <div
            className="mt-16 rounded-3xl px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
            style={{ background: "var(--charcoal)" }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 80% 50%, rgba(200,16,46,0.15) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <h2
                className="text-2xl font-semibold text-white mb-2"
                style={{ fontFamily: "var(--font-cormorant)" }}
              >
                Ready to sell on BAZR?
              </h2>
              <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                Join hundreds of sellers — no hidden fees, set up in minutes.
              </p>
            </div>
            <Link
              href="/auth/apply-merchant"
              className="relative shrink-0 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-[15px] transition-all"
              style={{ background: "#c8102e" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "#a00d24")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "#c8102e")
              }
            >
              Become a Seller
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
