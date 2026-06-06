"use client";

import { useState } from "react";
import { Star, Package, MapPin, Clock, Heart, Share2, CheckCircle2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useStoreFollowStatus, useFollowStore } from "@/queries/useStoreFollow";

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
  const [copied, setCopied] = useState(false);

  const { data: followStatus } = useStoreFollowStatus(store.slug);
  const { isLoggedIn, isPending, toggle } = useFollowStore(store.slug);

  const isFollowing = followStatus?.isFollowing ?? false;
  const followerCount = followStatus?.followerCount ?? null;

  function handleFollow() {
    if (!isLoggedIn) {
      toast.error("Please sign in to follow stores.", {
        action: { label: "Sign in", onClick: () => (window.location.href = "/auth/login") },
      });
      return;
    }
    toggle();
    if (!isFollowing) {
      toast.success(`Following ${store.storeName}`);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    const shareData = { title: store.storeName, url };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — no need to show error
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link.");
    }
  }

  const initials = store.storeName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const memberYear = store.memberSince
    ? new Date(store.memberSince).getFullYear()
    : null;

  return (
    <div className="w-full">
      {/* -- Banner — no overflow-hidden so logo translate-y isn't clipped ---- */}
      <div className="relative h-52 md:h-72">
        {/* Image/gradient clipped inside its own wrapper */}
        <div className="absolute inset-0 overflow-hidden">
          {store.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.bannerUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 30%, #2a1a1a 60%, #1e0a0a 100%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 50%, rgba(200,16,46,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(200,16,46,0.2) 0%, transparent 40%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                <span
                  className="font-black"
                  style={{
                    fontSize: "clamp(120px, 25vw, 260px)",
                    color: "rgba(255,255,255,0.03)",
                    letterSpacing: "-0.05em",
                  }}
                >
                  {initials}
                </span>
              </div>
            </div>
          )}

          {/* bottom gradient for readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* red accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.75 z-1" style={{ background: "#c8102e" }} />

        {/* Logo — outside the overflow-hidden wrapper so translate-y is not clipped */}
        <div className="absolute bottom-0 translate-y-1/2 left-4 md:left-8 z-10">
          <div
            className="h-20 w-20 md:h-24 md:w-24 rounded-2xl overflow-hidden flex items-center justify-center bg-white"
            style={{
              boxShadow: "0 0 0 4px #ffffff, 0 8px 24px rgba(0,0,0,0.18)",
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
                className="text-2xl md:text-3xl font-black"
                style={{ color: "#c8102e" }}
              >
                {initials}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* -- Info panel ------------------------------------------------------- */}
      <div className="bg-white border-b" style={{ borderColor: "rgba(30,30,30,0.1)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Name + actions row — pt must clear the logo overlap */}
          <div className="flex items-start justify-between gap-4 pt-14 md:pt-16 pb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-xl md:text-2xl font-bold truncate"
                  style={{ color: "#1e1e1e", letterSpacing: "-0.02em" }}
                >
                  {store.storeName}
                </h1>
                {store.rating !== undefined && store.rating >= 4.0 && (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0"
                    style={{ color: "#c8102e" }}
                    aria-label="Verified seller"
                  />
                )}
              </div>
              {store.description && (
                <p
                  className="text-sm mt-1 line-clamp-2 max-w-xl"
                  style={{ color: "#747474" }}
                >
                  {store.description}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              <button
                onClick={handleFollow}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
                style={
                  isFollowing
                    ? {
                        background: "rgba(200,16,46,0.08)",
                        color: "#c8102e",
                        border: "1.5px solid rgba(200,16,46,0.3)",
                      }
                    : {
                        background: "#c8102e",
                        color: "#ffffff",
                        border: "1.5px solid #c8102e",
                      }
                }
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart
                    className="h-3.5 w-3.5"
                    style={isFollowing ? { fill: "#c8102e" } : {}}
                  />
                )}
                <span className="hidden sm:inline">
                  {isFollowing ? "Following" : "Follow"}
                </span>
                {followerCount !== null && followerCount > 0 && (
                  <span
                    className="hidden sm:inline text-xs font-mono opacity-75"
                  >
                    {followerCount >= 1000
                      ? `${(followerCount / 1000).toFixed(1)}k`
                      : followerCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-150"
                style={{
                  background: copied ? "rgba(34,197,94,0.1)" : "rgba(30,30,30,0.05)",
                  border: `1.5px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(30,30,30,0.1)"}`,
                  color: copied ? "#16a34a" : "#747474",
                }}
                title={copied ? "Copied!" : "Share store"}
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div
            className="flex items-center flex-wrap gap-x-4 gap-y-1.5 pb-4 text-sm"
            style={{ color: "#747474" }}
          >
            {store.rating !== undefined && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold" style={{ color: "#1e1e1e" }}>
                  {store.rating.toFixed(1)}
                </span>
                <span>rating</span>
              </span>
            )}

            {store.productCount !== undefined && (
              <>
                {store.rating !== undefined && (
                  <span className="hidden sm:inline" aria-hidden>·</span>
                )}
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  <span className="font-semibold" style={{ color: "#1e1e1e" }}>
                    {store.productCount.toLocaleString()}
                  </span>
                  <span>products</span>
                </span>
              </>
            )}

            {followerCount !== null && (
              <>
                <span className="hidden sm:inline" aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-semibold" style={{ color: "#1e1e1e" }}>
                    {followerCount >= 1000
                      ? `${(followerCount / 1000).toFixed(1)}k`
                      : followerCount}
                  </span>
                  <span>followers</span>
                </span>
              </>
            )}

            {store.location && (
              <>
                <span className="hidden sm:inline" aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {store.location}
                </span>
              </>
            )}

            {store.handlingHours !== undefined && (
              <>
                <span className="hidden sm:inline" aria-hidden>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Ships within{" "}
                  <span className="font-semibold" style={{ color: "#1e1e1e" }}>
                    {store.handlingHours}h
                  </span>
                </span>
              </>
            )}

            {memberYear && (
              <>
                <span className="hidden sm:inline" aria-hidden>·</span>
                <span>Seller since {memberYear}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
