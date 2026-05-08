"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Filter,
  ChevronDown,
  Flag,
  TrendingUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  authorName: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  reply?: string;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<number, number>; // { 5: 120, 4: 80, ... }
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useMerchantReviews(filter: string) {
  return useQuery<Review[]>({
    queryKey: ["merchant-reviews", filter],
    queryFn: async () => {
      const { data } = await api.get("/api/merchant/reviews", {
        params: { rating: filter === "all" ? undefined : filter, limit: 50 },
      });
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

function useMerchantReviewStats() {
  return useQuery<ReviewStats>({
    queryKey: ["merchant-review-stats"],
    queryFn: async () => {
      const { data } = await api.get("/api/merchant/reviews/stats");
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const px = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${px} ${
            s <= rating ? "text-yellow-400" : "text-black/10"
          }`}
          fill={s <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

const RATING_FILTERS = [
  { key: "all", label: "All" },
  { key: "5", label: "5 ★" },
  { key: "4", label: "4 ★" },
  { key: "3", label: "3 ★" },
  { key: "2", label: "2 ★" },
  { key: "1", label: "1 ★" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function MerchantReviewsView() {
  const [filter, setFilter] = useState("all");
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [openReply, setOpenReply] = useState<string | null>(null);

  const { data: reviews, isLoading, isError } = useMerchantReviews(filter);
  const { data: stats } = useMerchantReviewStats();

  // Optimistic mock stats while API loads
  const safeStats: ReviewStats = stats ?? {
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  };

  const handleReplySubmit = async (reviewId: string) => {
    const text = replyDraft[reviewId];
    if (!text?.trim()) return;
    try {
      await api.post(`/api/merchant/reviews/${reviewId}/reply`, {
        reply: text,
      });
      setOpenReply(null);
    } catch {
      // toast handled globally
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
          <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[var(--charcoal)]">
            Product Reviews
          </h1>
          <p className="text-[13px] text-[var(--charcoal-soft)]">
            Manage customer feedback on your products
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {/* Average rating */}
        <div className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
          <p className="text-[12px] font-semibold text-[var(--charcoal-soft)] uppercase tracking-wide mb-2">
            Average Rating
          </p>
          <div className="flex items-end gap-2">
            <span className="text-[40px] font-bold text-[var(--charcoal)] leading-none">
              {safeStats.average > 0 ? safeStats.average.toFixed(1) : "–"}
            </span>
            <div className="mb-1">
              <Stars rating={Math.round(safeStats.average)} size="sm" />
            </div>
          </div>
        </div>

        {/* Total reviews */}
        <div className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
          <p className="text-[12px] font-semibold text-[var(--charcoal-soft)] uppercase tracking-wide mb-2">
            Total Reviews
          </p>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--red)]" />
            <span className="text-[32px] font-bold text-[var(--charcoal)] leading-none">
              {safeStats.total}
            </span>
          </div>
        </div>

        {/* Distribution */}
        <div className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
          <p className="text-[12px] font-semibold text-[var(--charcoal-soft)] uppercase tracking-wide mb-3">
            Distribution
          </p>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = safeStats.distribution[star] ?? 0;
              const pct =
                safeStats.total > 0
                  ? Math.round((count / safeStats.total) * 100)
                  : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-[12px]">
                  <span className="w-4 shrink-0 text-[var(--charcoal-soft)] font-medium">
                    {star}★
                  </span>
                  <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[var(--charcoal-soft)]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <Filter className="w-4 h-4 text-[var(--charcoal-soft)]" />
        {RATING_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
              filter === f.key
                ? "bg-[var(--charcoal)] text-white"
                : "bg-black/5 text-[var(--charcoal-soft)] hover:bg-black/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-black/5 p-5"
            >
              <div className="flex gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-20 text-[var(--red)] font-semibold">
          Failed to load reviews. Please try again.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && (!reviews || reviews.length === 0) && (
        <div className="text-center py-20">
          <Star className="w-14 h-14 text-black/10 mx-auto mb-4" />
          <p className="text-[var(--charcoal-soft)] font-semibold">
            No reviews yet for this filter.
          </p>
        </div>
      )}

      {/* Review list */}
      {!isLoading && !isError && reviews && reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {/* Product image */}
                <div className="w-12 h-12 rounded-xl bg-black/5 shrink-0 overflow-hidden">
                  {review.productImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.productImage}
                      alt={review.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-black/20" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-[13px] font-bold text-[var(--charcoal)] truncate">
                        {review.productName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars rating={review.rating} />
                        <span className="text-[12px] text-[var(--charcoal-soft)]">
                          by{" "}
                          <span className="font-semibold">
                            {review.authorName}
                          </span>
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[var(--charcoal-soft)]">
                        {new Date(review.createdAt).toLocaleDateString("en-GB")}
                      </span>
                      <button
                        title="Report review"
                        className="text-black/20 hover:text-[var(--red)] transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[13.5px] text-[var(--charcoal-soft)] leading-relaxed mt-2">
                    {review.comment}
                  </p>

                  {/* Existing reply */}
                  {review.reply && (
                    <div className="mt-3 bg-[var(--off-white)] rounded-xl px-4 py-3 border-l-2 border-[var(--red)]">
                      <p className="text-[11px] font-bold text-[var(--red)] mb-1">
                        Your reply
                      </p>
                      <p className="text-[13px] text-[var(--charcoal)]">
                        {review.reply}
                      </p>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1 text-[12px] text-[var(--charcoal-soft)]">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {review.helpfulCount} helpful
                    </div>
                    {!review.reply && (
                      <button
                        onClick={() =>
                          setOpenReply(
                            openReply === review.id ? null : review.id
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--red)] hover:underline"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Reply
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            openReply === review.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Reply box */}
                  {openReply === review.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={3}
                        placeholder="Write a professional, helpful reply…"
                        value={replyDraft[review.id] ?? ""}
                        onChange={(e) =>
                          setReplyDraft((prev) => ({
                            ...prev,
                            [review.id]: e.target.value,
                          }))
                        }
                        className="w-full border border-input rounded-xl px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--red)]/30"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReplySubmit(review.id)}
                          className="bg-[var(--charcoal)] text-white text-[13px] font-bold px-5 py-2 rounded-full hover:bg-[var(--charcoal)]/90 transition-colors"
                        >
                          Submit Reply
                        </button>
                        <button
                          onClick={() => setOpenReply(null)}
                          className="text-[13px] font-semibold text-[var(--charcoal-soft)] px-4 py-2 rounded-full hover:bg-black/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
