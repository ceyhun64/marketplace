"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Truck,
  Zap,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/api";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

interface Offer {
  id: string;
  price: number;
  stock: number;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  rating: number | null;
  eta: string;
  shippingRate: string;
}

interface OtherSellersProps {
  productId: string;
  productName: string;
  productImage: string;
  /** Mevcut sayfanın gösterdiği merchant slug'ı — listeden çıkarılır */
  currentMerchantSlug?: string;
}

export default function OtherSellers({
  productId,
  productName,
  productImage,
  currentMerchantSlug,
}: OtherSellersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    api
      .get<{ data: Offer[] }>(`/api/products/${productId}/offers`)
      .then(({ data }) => {
        const list: Offer[] = (data as any)?.data ?? (data as any) ?? [];
        // Mevcut merchant'ı filtrele
        const others = currentMerchantSlug
          ? list.filter((o) => o.merchantSlug !== currentMerchantSlug)
          : list;
        setOffers(others);
      })
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [productId, currentMerchantSlug]);

  if (loading || offers.length === 0) return null;

  const VISIBLE_DEFAULT = 3;
  const visible = expanded ? offers : offers.slice(0, VISIBLE_DEFAULT);
  const hasMore = offers.length > VISIBLE_DEFAULT;

  const handleAddToCart = (offer: Offer) => {
    addItem({
      offerId: offer.id,
      productId,
      productName,
      productImage,
      price: offer.price,
      merchantId: offer.merchantId,
      merchantStoreName: offer.merchantName,
      merchantSlug: offer.merchantSlug,
      stock: offer.stock,
      source: "MARKETPLACE",
    });
    toast.success(`${offer.merchantName} satıcısından sepete eklendi`);
  };

  return (
    <div
      className="mt-8 pt-8"
      style={{ borderTop: "1px solid rgba(30,30,30,0.06)" }}
    >
      {/* Başlık */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="p-2 rounded-lg"
          style={{ background: "rgba(200,16,46,0.07)" }}
        >
          <Store size={18} style={{ color: "#c8102e" }} />
        </div>
        <div>
          <h3
            className="text-sm font-extrabold uppercase tracking-tight"
            style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif", letterSpacing: "-0.01em" }}
          >
            Diğer Satıcılar
          </h3>
          <p
            className="text-[10px] uppercase tracking-widest mt-0.5"
            style={{ color: "#9a9a9a", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {offers.length} satıcı bu ürünü satıyor
          </p>
        </div>
      </div>

      {/* Tablo başlığı */}
      <div
        className="hidden md:grid grid-cols-12 gap-3 px-4 pb-2 mb-1"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: "#9a9a9a",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          borderBottom: "1px solid rgba(30,30,30,0.07)",
        }}
      >
        <span className="col-span-4">Satıcı</span>
        <span className="col-span-2 text-center">Fiyat</span>
        <span className="col-span-2 text-center">Kargo</span>
        <span className="col-span-2 text-center">Teslimat</span>
        <span className="col-span-2 text-right">İşlem</span>
      </div>

      {/* Satıcı listesi */}
      <div className="flex flex-col gap-2">
        {visible.map((offer, i) => {
          const isCheapest = i === 0;
          const isFreeShipping = offer.shippingRate === "FREE" || offer.price >= 500;

          return (
            <div
              key={offer.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl transition-all duration-150"
              style={{
                background: isCheapest
                  ? "rgba(13,122,78,0.04)"
                  : "#ffffff",
                border: isCheapest
                  ? "1.5px solid rgba(13,122,78,0.2)"
                  : "1px solid rgba(30,30,30,0.09)",
                boxShadow: "0 1px 3px rgba(30,30,30,0.04)",
              }}
            >
              {/* Satıcı adı */}
              <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                <div
                  className="flex-none w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{
                    background: isCheapest
                      ? "rgba(13,122,78,0.1)"
                      : "rgba(30,30,30,0.06)",
                    color: isCheapest ? "#0d7a4e" : "#525252",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {offer.merchantName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/store/${offer.merchantSlug}`}
                    className="text-sm font-bold truncate flex items-center gap-1 hover:underline"
                    style={{ color: "#1e1e1e" }}
                  >
                    {offer.merchantName}
                    <ExternalLink size={10} style={{ color: "#9a9a9a", flexShrink: 0 }} />
                  </Link>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isCheapest && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(13,122,78,0.12)",
                          color: "#0d7a4e",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        En Ucuz
                      </span>
                    )}
                    {offer.stock <= 5 && offer.stock > 0 && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(200,16,46,0.08)",
                          color: "#c8102e",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Son {offer.stock} adet
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fiyat */}
              <div className="md:col-span-2 flex md:justify-center">
                <span
                  className="text-base font-black"
                  style={{
                    color: isCheapest ? "#0d7a4e" : "#1e1e1e",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {offer.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs font-semibold" style={{ color: "#9a9a9a" }}>USD</span>
                </span>
              </div>

              {/* Kargo */}
              <div className="md:col-span-2 flex md:justify-center items-center gap-1.5">
                {isFreeShipping ? (
                  <>
                    <Truck size={13} style={{ color: "#0d7a4e" }} />
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: "#0d7a4e", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Ücretsiz
                    </span>
                  </>
                ) : (
                  <>
                    <Truck size={13} style={{ color: "#747474" }} />
                    <span
                      className="text-[11px]"
                      style={{ color: "#747474", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      29.90 USD
                    </span>
                  </>
                )}
              </div>

              {/* Teslimat */}
              <div className="md:col-span-2 flex md:justify-center items-center gap-1.5">
                <Zap size={12} style={{ color: "#9a9a9a" }} />
                <span
                  className="text-[10px]"
                  style={{ color: "#747474", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {offer.eta || "2–4 iş günü"}
                </span>
              </div>

              {/* Sepete Ekle */}
              <div className="md:col-span-2 flex md:justify-end">
                <button
                  onClick={() => handleAddToCart(offer)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95"
                  style={{
                    background: isCheapest ? "#0d7a4e" : "#1e1e1e",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.88";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <ShoppingCart size={13} />
                  Sepete Ekle
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daha fazla / daha az */}
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-2 text-xs font-semibold transition-colors"
          style={{
            color: "#747474",
            fontFamily: "'JetBrains Mono', monospace",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 0",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#c8102e";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#747474";
          }}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} /> Daha az göster
            </>
          ) : (
            <>
              <ChevronDown size={14} /> {offers.length - VISIBLE_DEFAULT} satıcı daha göster
            </>
          )}
        </button>
      )}

      {/* Güvence notu */}
      <div
        className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: "rgba(27,94,168,0.05)",
          border: "1px solid rgba(27,94,168,0.12)",
        }}
      >
        <ShieldCheck size={13} style={{ color: "#1b5ea8", flexShrink: 0 }} />
        <p
          className="text-[10px] leading-relaxed"
          style={{ color: "#525252", fontFamily: "'JetBrains Mono', monospace" }}
        >
          Tüm satıcılar platformumuz tarafından onaylanmıştır. Satın almalarınız alıcı koruma güvencesi kapsamındadır.
        </p>
      </div>
    </div>
  );
}