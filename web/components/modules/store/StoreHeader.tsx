"use client";

import Link from "next/link";
import { ArrowLeft, Star, Package, MapPin, Clock } from "lucide-react";

interface StoreHeaderProps {
  store: {
    id: string;
    storeName: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    rating?: number;
    productCount?: number;
    location?: string;
    handlingHours?: number;
    memberSince?: string;
  };
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <div className="w-full">
      {/* Banner */}
      <div
        className="relative h-44 md:h-64 w-full overflow-hidden"
        style={
          store.bannerUrl
            ? {
                backgroundImage: `url(${store.bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background:
                  "linear-gradient(135deg, #1e1e1e 0%, #2e2e2e 50%, #3c3c3c 100%)",
              }
        }
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Red accent line at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{ height: "3px", background: "#c8102e" }}
        />

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link href="/">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors duration-150"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Marketplace
            </button>
          </Link>
        </div>
      </div>

      {/* Store info panel */}
      <div
        className="w-full border-b"
        style={{
          background: "#ffffff",
          borderColor: "rgba(30,30,30,0.1)",
          boxShadow:
            "0 1px 4px rgba(30,30,30,0.06), 0 1px 2px rgba(30,30,30,0.04)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 pb-5">
          {/* Logo + name row */}
          <div className="flex items-end gap-4 -mt-10 mb-4">
            {/* Logo */}
            <div
              className="h-20 w-20 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
              style={{
                background: "#ffffff",
                border: "3px solid #ffffff",
                boxShadow:
                  "0 4px 16px rgba(30,30,30,0.12), 0 2px 6px rgba(30,30,30,0.06)",
              }}
            >
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt={store.storeName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="text-2xl font-bold"
                  style={{ color: "#c8102e" }}
                >
                  {store.storeName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="mb-1 min-w-0 pt-10">
              <h1
                className="text-xl md:text-2xl font-bold truncate"
                style={{ color: "#1e1e1e", letterSpacing: "-0.01em" }}
              >
                {store.storeName}
              </h1>
              {store.description && (
                <p
                  className="text-sm line-clamp-1 mt-0.5"
                  style={{ color: "#747474" }}
                >
                  {store.description}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div
            className="w-full h-px mb-4"
            style={{ background: "rgba(30,30,30,0.06)" }}
          />

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            {store.rating !== undefined && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(200,16,46,0.07)",
                  border: "1px solid rgba(200,16,46,0.14)",
                }}
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span
                  className="text-xs font-bold"
                  style={{ color: "#1e1e1e" }}
                >
                  {store.rating.toFixed(1)}
                </span>
                <span className="text-xs" style={{ color: "#747474" }}>
                  rating
                </span>
              </div>
            )}

            {store.productCount !== undefined && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(30,30,30,0.04)",
                  border: "1px solid rgba(30,30,30,0.08)",
                }}
              >
                <Package className="h-3.5 w-3.5" style={{ color: "#747474" }} />
                <span
                  className="text-xs font-bold"
                  style={{ color: "#1e1e1e" }}
                >
                  {store.productCount}
                </span>
                <span className="text-xs" style={{ color: "#747474" }}>
                  products
                </span>
              </div>
            )}

            {store.location && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(30,30,30,0.04)",
                  border: "1px solid rgba(30,30,30,0.08)",
                }}
              >
                <MapPin className="h-3.5 w-3.5" style={{ color: "#747474" }} />
                <span className="text-xs" style={{ color: "#525252" }}>
                  {store.location}
                </span>
              </div>
            )}

            {store.handlingHours !== undefined && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(30,30,30,0.04)",
                  border: "1px solid rgba(30,30,30,0.08)",
                }}
              >
                <Clock className="h-3.5 w-3.5" style={{ color: "#747474" }} />
                <span className="text-xs" style={{ color: "#747474" }}>
                  Handling:
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: "#1e1e1e" }}
                >
                  {store.handlingHours}h
                </span>
              </div>
            )}

            {store.memberSince && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(30,30,30,0.04)",
                  border: "1px solid rgba(30,30,30,0.08)",
                }}
              >
                <span
                  className="text-xs"
                  style={{
                    fontFamily: "monospace",
                    color: "#9a9a9a",
                    letterSpacing: "0.06em",
                  }}
                >
                  member since {new Date(store.memberSince).getFullYear()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
