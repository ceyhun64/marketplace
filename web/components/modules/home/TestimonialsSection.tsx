"use client";

import { useState, useEffect, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

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
    text: "Sipariş verdiğim gün kapıma geldi. Ürün tam açıklandığı gibiydi ve fiyatlar gerçekten rekabetçi. Artık tüm alışverişimi buradan yapıyorum.",
  },
  {
    id: 2,
    name: "Mehmet Demir",
    role: "Store Owner · TechZone",
    avatar: "MD",
    rating: 5,
    product: "Seller",
    text: "Platformun satıcı paneli inanılmaz kullanışlı. İlk ayımda 200'den fazla sipariş aldım. Destek ekibi her sorunda anında yardımcı oluyor.",
  },
  {
    id: 3,
    name: "Zeynep Arslan",
    role: "Verified Buyer",
    avatar: "ZA",
    rating: 5,
    product: "Fashion",
    text: "30 günlük iade garantisi sayesinde çekinmeden alışveriş yapıyorum. Gönderiler hızlı, paketleme özenli. Beklentilerimin çok üzerinde!",
  },
  {
    id: 4,
    name: "Can Yıldız",
    role: "Verified Buyer",
    avatar: "CY",
    rating: 5,
    product: "Home & Living",
    text: "Kargo takip sistemi harika. Siparişim nerede, ne zaman gelir — her şeyi anlık görüyorum. Böyle şeffaf bir platform aramıştım.",
  },
  {
    id: 5,
    name: "Selin Öztürk",
    role: "Store Owner · BeautyHub",
    avatar: "SÖ",
    rating: 5,
    product: "Seller",
    text: "Mağazamı açmak sadece birkaç dakika sürdü. Ürün onayları hızlı, komisyon oranları adil. Satışlarım 3 ayda 4 katına çıktı.",
  },
  {
    id: 6,
    name: "Burak Çelik",
    role: "Verified Buyer",
    avatar: "BÇ",
    rating: 5,
    product: "Electronics",
    text: "Fiyat karşılaştırma özelliği sayesinde en ucuz ürünü buluyorum. Güvenli ödeme sistemi ile hiç endişe etmiyorum.",
  },
];

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          size={13}
          fill="var(--red)"
          color="var(--red)"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

function StatCounter({
  value,
  label,
  isStar,
}: {
  value: string;
  label: string;
  isStar?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "1.75rem 2rem",
        borderRight: "1px solid rgba(30,30,30,0.08)",
        flex: 1,
      }}
      className="last:border-r-0"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.25rem",
          marginBottom: "0.375rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 500,
            color: "var(--charcoal)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {isStar && (
          <Star
            size={20}
            fill="var(--red)"
            color="var(--red)"
            strokeWidth={0}
            style={{ marginTop: 2 }}
          />
        )}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: "var(--charcoal-soft)",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const VISIBLE = 3;
  const total = TESTIMONIALS.length;

  const startAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (total - VISIBLE + 1));
    }, 4000);
  };

  useEffect(() => {
    startAutoplay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const goTo = (dir: "prev" | "next") => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => {
      const max = total - VISIBLE;
      if (dir === "next") return Math.min(prev + 1, max);
      return Math.max(prev - 1, 0);
    });
    startAutoplay();
    setTimeout(() => setIsAnimating(false), 350);
  };

  return (
    <section
      style={{
        background: "var(--off-white-2)",
        padding: "5rem 0 0",
        overflow: "hidden",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: "0 auto",
          padding: "0 2rem",
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "3.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
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
                fontSize: "0.6875rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase" as const,
                color: "var(--charcoal-soft)",
              }}
            >
              Social Proof
            </span>
            <span
              style={{
                display: "inline-block",
                width: 24,
                height: 1,
                background: "var(--red)",
              }}
            />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "var(--charcoal)",
              marginBottom: "0.75rem",
            }}
          >
            Trusted by{" "}
            <em style={{ color: "var(--red)", fontStyle: "italic" }}>
              thousands
            </em>{" "}
            every day
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.9375rem",
              color: "var(--charcoal-soft)",
              lineHeight: 1.7,
              maxWidth: 480,
            }}
          >
            Alıcılar ve satıcılar deneyimlerini paylaşıyor.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                transform: `translateX(calc(-${activeIndex * (100 / VISIBLE)}% - ${activeIndex * 8}px))`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.id}
                  style={{
                    flex: `0 0 calc(${100 / VISIBLE}% - ${(VISIBLE - 1) * 8}px)`,
                    background: "var(--white)",
                    borderRadius: 20,
                    padding: "2rem",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                    position: "relative",
                    minWidth: 0,
                  }}
                >
                  {/* Quote icon */}
                  <div
                    style={{
                      position: "absolute",
                      top: "1.5rem",
                      right: "1.5rem",
                      color: "var(--red)",
                      opacity: 0.12,
                    }}
                  >
                    <Quote size={40} fill="var(--red)" strokeWidth={0} />
                  </div>

                  {/* Rating */}
                  <StarRating count={t.rating} />

                  {/* Text */}
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.875rem",
                      color: "var(--charcoal)",
                      lineHeight: 1.75,
                      flex: 1,
                      margin: 0,
                    }}
                  >
                    "{t.text}"
                  </p>

                  {/* Author */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.875rem",
                      paddingTop: "1.25rem",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "var(--charcoal)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "#fff",
                        letterSpacing: "0.04em",
                        flexShrink: 0,
                      }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          color: "var(--charcoal)",
                          lineHeight: 1.3,
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.625rem",
                          letterSpacing: "0.1em",
                          color: "var(--charcoal-soft)",
                          marginTop: 2,
                        }}
                      >
                        {t.role}
                      </div>
                    </div>

                    {/* Product tag */}
                    <div
                      style={{
                        marginLeft: "auto",
                        padding: "3px 10px",
                        background: "var(--red-muted)",
                        border: "1px solid var(--red-subtle)",
                        borderRadius: 999,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.5625rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase" as const,
                        color: "var(--red)",
                        flexShrink: 0,
                      }}
                    >
                      {t.product}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              marginTop: "2rem",
            }}
          >
            <button
              onClick={() => goTo("prev")}
              disabled={activeIndex === 0}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1.5px solid var(--border-mid)",
                background: "var(--white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: activeIndex === 0 ? "default" : "pointer",
                opacity: activeIndex === 0 ? 0.35 : 1,
                transition: "border-color 0.2s, background 0.2s",
                color: "var(--charcoal)",
              }}
              aria-label="Previous"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>

            {/* Dots */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              {Array.from({ length: total - VISIBLE + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveIndex(i);
                    startAutoplay();
                  }}
                  style={{
                    width: i === activeIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 999,
                    border: "none",
                    background:
                      i === activeIndex ? "var(--red)" : "var(--border-mid)",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s, background 0.3s",
                  }}
                  aria-label={`Go to ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => goTo("next")}
              disabled={activeIndex === total - VISIBLE}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1.5px solid var(--border-mid)",
                background: "var(--white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: activeIndex === total - VISIBLE ? "default" : "pointer",
                opacity: activeIndex === total - VISIBLE ? 0.35 : 1,
                transition: "border-color 0.2s, background 0.2s",
                color: "var(--charcoal)",
              }}
              aria-label="Next"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div
          style={{
            marginTop: "4rem",
            background: "var(--charcoal)",
            borderRadius: "20px 20px 0 0",
            display: "flex",
            flexWrap: "wrap" as const,
            overflow: "hidden",
          }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                flex: "1 1 150px",
                textAlign: "center",
                padding: "2rem 1.5rem",
                borderRight:
                  i < STATS.length - 1
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                  marginBottom: "0.4rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                    fontWeight: 500,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </span>
                {s.isStar && (
                  <Star
                    size={18}
                    fill="#fff"
                    color="#fff"
                    strokeWidth={0}
                    style={{ marginTop: 2 }}
                  />
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase" as const,
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
