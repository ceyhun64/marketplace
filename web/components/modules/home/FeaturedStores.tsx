"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Store } from "lucide-react";
import { useStoreList } from "@/queries/useStore";
import { Skeleton } from "@/components/ui/skeleton";
import type { MerchantProfile } from "@/types/entities";

function getStoreEmoji(storeName: string): string {
  const name = storeName.toLowerCase();
  if (name.includes("tech") || name.includes("elektron")) return "⚡";
  if (name.includes("beauty") || name.includes("kozmet")) return "🌿";
  if (name.includes("home") || name.includes("ev")) return "🏠";
  if (name.includes("sport") || name.includes("spor")) return "🏃";
  if (name.includes("fashion") || name.includes("giyim")) return "👗";
  if (name.includes("food") || name.includes("yemek")) return "🍽️";
  if (name.includes("book") || name.includes("kitap")) return "📚";
  return "🛍️";
}

function StoreCardSkeleton() {
  return (
    <div
      style={{
        background: "var(--white)",
        borderRadius: "var(--radius-lg)",
        padding: "1.75rem",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <Skeleton className="w-[52px] h-[52px] rounded-xl" />
        <Skeleton className="w-16 h-7 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-5" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
    </div>
  );
}

function StoreCard({ store }: { store: MerchantProfile }) {
  const emoji = getStoreEmoji(store.storeName);
  return (
    <Link
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
            overflow: "hidden",
            transition:
              "background var(--dur-base), transform var(--dur-base) var(--ease-spring)",
          }}
          className="group-hover:bg-[var(--red-subtle)] group-hover:scale-105"
        >
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.storeName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 24 }}>{emoji}</span>
          )}
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
          <CheckCircle2 size={11} style={{ color: "var(--red)" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--charcoal)",
            }}
          >
            Verified
          </span>
        </div>
      </div>
      <div style={{ marginBottom: "1.25rem" }}>
        <h3
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: "var(--charcoal)",
            letterSpacing: "-0.01em",
            marginBottom: "0.5rem",
            transition: "color var(--dur-fast)",
          }}
          className="group-hover:text-[var(--red)]"
        >
          {store.storeName}
        </h3>
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
          {store.description ??
            "Discover quality products from this verified seller."}
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        {[
          {
            label: "Plan",
            value:
              store.subscriptionPlan === "BASIC"
                ? "Starter"
                : (store.subscriptionPlan ?? "Active"),
          },
          { label: "Handling", value: `${store.handlingHours}h` },
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
  );
}

export default function FeaturedStores() {
  const { data: stores, isLoading, isError } = useStoreList(4);

  return (
    <section
      style={{
        padding: "5rem 0 6rem",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-325 mx-auto px-4 sm:px-8">
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
            }}
            className="hover:text-[var(--red)]"
          >
            All Stores <ArrowUpRight size={15} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Grid — Tailwind controls columns; NO inline gridTemplateColumns.
            Same class-vs-inline-style conflict that broke HeroSection was
            present here: repeat(4,1fr) always produced 4 columns on mobile. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <StoreCardSkeleton key={i} />
            ))}
          {isError && (
            <div
              className="col-span-4 text-center py-12"
              style={{ color: "var(--charcoal-soft)" }}
            >
              <Store className="mx-auto mb-3 opacity-20" size={40} />
              <p>Stores could not be loaded.</p>
            </div>
          )}
          {!isLoading &&
            !isError &&
            (stores ?? []).map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
        </div>

        {/* Merchant CTA banner —
            padding: "3rem 3.5rem" was 56 px each side on 320 px phones
            (leaving only 208 px for content). Replaced with responsive
            Tailwind padding that breathes properly on all screen sizes. */}
        <div
          className="flex flex-wrap items-center justify-between gap-6 sm:gap-8 relative overflow-hidden px-5 py-10 sm:px-10 sm:py-12 lg:px-14"
          style={{
            borderRadius: "var(--radius-xl)",
            background: "var(--charcoal)",
          }}
        >
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
              textDecoration: "none",
              background: "var(--white)",
              color: "var(--charcoal)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--red)";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--white)";
              (e.currentTarget as HTMLElement).style.color = "var(--charcoal)";
            }}
          >
            Start Selling Now <ArrowUpRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
