"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

// -- Data ----------------------------------------------------------------------

const STATS = [
  { value: "120K+", label: "Happy Customers" },
  { value: "4,800+", label: "Active Sellers" },
  { value: "2.4M+", label: "Products Listed" },
  { value: "4.8", label: "Average Rating", isStar: true },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: "Ayşe Kaya",
    role: "Verified Buyer",
    avatar: "AK",
    rating: 5,
    product: "Electronics",
    text: "It arrived at my doorstep the very same day I ordered. The product was exactly as described and the prices are truly competitive. I do all my shopping here now.",
  },
  {
    id: 2,
    name: "Mehmet Demir",
    role: "Store Owner · TechZone",
    avatar: "MD",
    rating: 5,
    product: "Seller",
    text: "The platform's seller dashboard is incredibly user-friendly. I received over 200 orders in my first month. The support team helps instantly with any issue.",
  },
  {
    id: 3,
    name: "Zeynep Arslan",
    role: "Verified Buyer",
    avatar: "ZA",
    rating: 5,
    product: "Fashion",
    text: "Thanks to the 30-day money-back guarantee, I shop without any hesitation. Shipping is fast, packaging is meticulous. Way above my expectations!",
  },
  {
    id: 4,
    name: "Can Yıldız",
    role: "Verified Buyer",
    avatar: "CY",
    rating: 5,
    product: "Home & Living",
    text: "The order tracking system is amazing. Where is my order, when will it arrive — I can see everything instantly. This is exactly the kind of transparent platform I was looking for.",
  },
  {
    id: 5,
    name: "Selin Öztürk",
    role: "Store Owner · BeautyHub",
    avatar: "SÖ",
    rating: 5,
    product: "Seller",
    text: "Opening my store took only a few minutes. Product approvals are fast, commission rates are fair. My sales quadrupled in just 3 months.",
  },
  {
    id: 6,
    name: "Burak Çelik",
    role: "Verified Buyer",
    avatar: "BÇ",
    rating: 5,
    product: "Electronics",
    text: "Thanks to the price comparison feature, I can find the cheapest product. I never worry with the secure payment system.",
  },
];

// -- Responsive visible-count hook ---------------------------------------------
// Returns how many cards fit side by side for the current viewport width.
// Uses ResizeObserver so it responds to live resize without a scroll listener.
// Starts at 3 (server-safe) then corrects on the client inside useEffect.

function useVisibleCount(): number {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setVisible(1);
      else if (window.innerWidth < 1024) setVisible(2);
      else setVisible(3);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  return visible;
}

// -- Star row -----------------------------------------------------------------

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={13} fill="var(--red)" color="var(--red)" strokeWidth={0} />
      ))}
    </div>
  );
}

// -- Section -------------------------------------------------------------------

export default function TestimonialsSection() {
  const VISIBLE  = useVisibleCount();
  const total    = TESTIMONIALS.length;
  const maxIndex = Math.max(0, total - VISIBLE);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clamp index when VISIBLE changes (e.g. resize desktop → phone)
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  const startAutoplay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4_000);
  }, [maxIndex]);

  useEffect(() => {
    startAutoplay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startAutoplay]);

  const goTo = (dir: "prev" | "next") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) =>
      dir === "next" ? Math.min(prev + 1, maxIndex) : Math.max(prev - 1, 0)
    );
    startAutoplay();
    setTimeout(() => setIsAnimating(false), 350);
  };

  // Card width: (viewport% / VISIBLE) minus the share of gaps belonging to each card
  const cardPct    = 100 / VISIBLE;
  const gapOffset  = ((VISIBLE - 1) * 24) / VISIBLE; // gap = 1.5rem = 24px
  const translateX = activeIndex * (cardPct) + "% + " + activeIndex * 24 + "px";

  return (
    <section
      style={{
        background: "var(--off-white-2)",
        padding: "5rem 0 0",
        overflow: "hidden",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      {/*
       * px-4 sm:px-6 lg:px-8 — safe horizontal margins on every viewport.
       * Previously used  padding: "0 2rem"  inline which was 32px on 320px
       * screens, leaving only 256px for content, and didn't respond to
       * resize events.
       */}
      <div className="max-w-325 mx-auto px-4 sm:px-6 lg:px-8">

        {/* -- Header -------------------------------------------------------- */}
        <div className="flex flex-col items-center text-center mb-12 sm:mb-14">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block w-6 h-px" style={{ background: "var(--red)" }} />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "var(--charcoal-soft)" }}
            >
              Social Proof
            </span>
            <span className="inline-block w-6 h-px" style={{ background: "var(--red)" }} />
          </div>

          <h2
            className="font-normal leading-[1.1] tracking-tight mb-3"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.875rem, 4vw, 3rem)",
              color: "var(--charcoal)",
              letterSpacing: "-0.01em",
            }}
          >
            Trusted by{" "}
            <em style={{ color: "var(--red)", fontStyle: "italic" }}>thousands</em>{" "}
            every day
          </h2>

          <p
            className="text-[0.9375rem] leading-relaxed max-w-sm"
            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
          >
            Buyers and sellers share their experiences.
          </p>
        </div>

        {/* -- Carousel ------------------------------------------------------ */}
        <div className="relative">
          {/* overflow-hidden clips cards outside the viewport window */}
          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                gap: "1.5rem",
                // translateX moves the strip left by (one card + one gap) per step.
                // Using calc with both % and px is the only way to account for
                // both the percentage-based card width AND the fixed pixel gap.
                transform: `translateX(calc(-${translateX}))`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.id}
                  // shrink-0 prevents cards from compressing below their
                  // computed width — the root cause of the "vertical strip" bug
                  className="shrink-0 flex flex-col gap-5 relative"
                  style={{
                    // Each card occupies exactly 1/VISIBLE of the container
                    // minus the proportion of gap space belonging to it.
                    width: `calc(${cardPct}% - ${gapOffset}px)`,
                    minWidth: 0,
                    background: "var(--white)",
                    borderRadius: 20,
                    padding: "clamp(1.25rem, 5vw, 2rem)",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {/* Decorative quote mark */}
                  <div
                    className="absolute top-5 right-5 pointer-events-none"
                    style={{ color: "var(--red)", opacity: 0.12 }}
                  >
                    <Quote size={36} fill="var(--red)" strokeWidth={0} />
                  </div>

                  <StarRating count={t.rating} />

                  {/* Review text — break-words stops long words from overflowing */}
                  <p
                    className="flex-1 text-sm leading-relaxed wrap-break-word"
                    style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                  >
                    &ldquo;{t.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div
                    className="flex items-center gap-3 pt-4 flex-wrap"
                    style={{ borderTop: "1px solid var(--border-subtle)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-semibold tracking-wide text-white"
                      style={{ background: "var(--charcoal)" }}
                    >
                      {t.avatar}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[0.8125rem] font-bold leading-tight truncate"
                        style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                      >
                        {t.name}
                      </p>
                      <p
                        className="font-mono text-[10px] tracking-widest mt-0.5 truncate"
                        style={{ color: "var(--charcoal-soft)" }}
                      >
                        {t.role}
                      </p>
                    </div>

                    <span
                      className="shrink-0 font-mono text-[9px] tracking-widest uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        background: "var(--red-muted)",
                        border: "1px solid var(--red-subtle)",
                        color: "var(--red)",
                      }}
                    >
                      {t.product}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => goTo("prev")}
              disabled={activeIndex === 0}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 hover:border-(--charcoal) hover:bg-(--off-white-2)"
              style={{
                borderColor: "var(--border-mid)",
                background: "var(--white)",
                color: "var(--charcoal)",
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveIndex(i); startAutoplay(); }}
                  className="h-1.5 rounded-full border-none p-0 cursor-pointer transition-all duration-300"
                  style={{
                    width: i === activeIndex ? 20 : 6,
                    background: i === activeIndex ? "var(--red)" : "var(--border-mid)",
                  }}
                  aria-label={`Go to ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo("next")}
              disabled={activeIndex >= maxIndex}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all disabled:opacity-30 hover:border-(--charcoal) hover:bg-(--off-white-2)"
              style={{
                borderColor: "var(--border-mid)",
                background: "var(--white)",
                color: "var(--charcoal)",
              }}
              aria-label="Next"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* -- Stats bar ------------------------------------------------------ */}
        {/*
         * Mobile (< 640 px): grid-cols-2  → 2×2 layout
         * sm+              : grid-cols-4  → single row
         *
         * The previous flex + min-width approach wrapped unpredictably on
         * 320–375 px phones; a fixed grid is reliable at every breakpoint.
         */}
        <div
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 overflow-hidden"
          style={{
            background: "var(--charcoal)",
            borderRadius: "20px 20px 0 0",
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center py-6 sm:py-7 px-3 sm:px-4 text-center"
              style={{
                // Dividers: vertical between columns in the same row,
                // horizontal between the two rows on mobile.
                borderRight:
                  i % 2 === 0 && i !== STATS.length - 1
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "none",
                borderBottom:
                  i < 2
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
              }}
            >
              <div className="flex items-center justify-center gap-1 mb-1.5">
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.375rem, 3vw, 2.25rem)",
                    fontWeight: 500,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </span>
                {s.isStar && (
                  <Star size={16} fill="#fff" color="#fff" strokeWidth={0} style={{ marginTop: 2 }} />
                )}
              </div>
              <p
                className="font-mono uppercase tracking-[0.14em]"
                style={{
                  fontSize: "clamp(0.5rem, 1.5vw, 0.625rem)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
