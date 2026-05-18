"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  MessageSquare,
  Filter,
  ChevronDown,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";

interface MerchantProduct {
  id: string;
  name: string;
  images?: string[];
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  customerName: string;
}

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
          className={`${px} ${s <= rating ? "text-[var(--warning)]" : "text-[var(--border-mid)]"}`}
          fill={s <= rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

export default function MerchantReviewsView() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openReply, setOpenReply] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  // Fetch merchant products
  const { data: catalogueData, isLoading: catalogueLoading } = useQuery({
    queryKey: ["merchant-products-for-reviews"],
    queryFn: async () => {
      const res = await api.get("/api/merchants/catalogue", {
        params: { limit: 100, page: 1 },
      });
      const raw = res.data;
      const items = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);
      return items as MerchantProduct[];
    },
  });

  const products: MerchantProduct[] = catalogueData ?? [];

  // Fetch reviews for each product
  const { data: reviewsMap, isLoading: reviewsLoading } = useQuery({
    queryKey: ["merchant-all-reviews", products.map((p) => p.id).join(",")],
    enabled: products.length > 0,
    queryFn: async () => {
      const results: Record<string, Review[]> = {};
      await Promise.allSettled(
        products.map(async (product) => {
          try {
            const res = await api.get(`/api/review/${product.id}`);
            const raw = res.data;
            results[product.id] = Array.isArray(raw)
              ? raw
              : (raw?.items ?? raw?.data ?? []);
          } catch {
            results[product.id] = [];
          }
        }),
      );
      return results;
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      api.post(`/api/review/${reviewId}/reply`, { reply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-all-reviews"] });
      setOpenReply(null);
    },
  });

  const isLoading = catalogueLoading || reviewsLoading;

  // Merge all product + review data
  const allReviews = products.flatMap((product) =>
    (reviewsMap?.[product.id] ?? []).map((r) => ({ ...r, product })),
  );

  // Filtrele
  const filteredReviews = allReviews.filter((r) => {
    const matchRating =
      ratingFilter === "all" || r.rating === parseInt(ratingFilter);
    const matchSearch =
      !search ||
      r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase()) ||
      r.product.name?.toLowerCase().includes(search.toLowerCase());
    return matchRating && matchSearch;
  });

  const totalReviews = allReviews.length;
  const globalAvg =
    totalReviews > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / totalReviews
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
  }));

  const productsWithReviews = products.filter(
    (p) => (reviewsMap?.[p.id] ?? []).length > 0,
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Product Reviews
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Customer feedback across all your products
          </p>
        </div>
        <button
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["merchant-all-reviews"],
            })
          }
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] border border-[var(--border-mid)] rounded-lg px-3 py-2 hover:bg-[var(--bg-sunken)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-5">
            <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-3">
              Average Rating
            </p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-[var(--text-primary)] leading-none">
                {totalReviews > 0 ? globalAvg.toFixed(1) : "—"}
              </span>
              <div className="mb-1">
                <Stars rating={Math.round(globalAvg)} />
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-5">
            <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-3">
              Total Reviews
            </p>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[var(--info)]" />
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {totalReviews}
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Across {productsWithReviews} product
              {productsWithReviews !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-5">
            <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-wider mb-3">
              Rating Distribution
            </p>
            <div className="space-y-1.5">
              {distribution.map(({ star, count }) => {
                const pct =
                  totalReviews > 0
                    ? Math.round((count / totalReviews) * 100)
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-[var(--text-secondary)] font-medium shrink-0">
                      {star}★
                    </span>
                    <div className="flex-1 h-1.5 bg-[var(--off-white-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--warning) rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[var(--text-tertiary)]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search reviews or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--bg-surface)] border border-[var(--border-mid)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
          <div className="flex gap-1">
            {["all", "5", "4", "3", "2", "1"].map((f) => (
              <button
                key={f}
                onClick={() => setRatingFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ratingFilter === f
                    ? "bg-[var(--charcoal)] text-white"
                    : "bg-[var(--bg-surface)] border border-[var(--border-mid)] text-[var(--text-secondary)] hover:border-[var(--border-mid)]"
                }`}
              >
                {f === "all" ? "All" : `${f} ★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-5"
            >
              <div className="flex gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
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

      {/* Empty state */}
      {!isLoading && filteredReviews.length === 0 && (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] flex flex-col items-center justify-center py-20">
          <Star className="w-12 h-12 text-[var(--border-mid)] mb-4" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {totalReviews === 0
              ? "No reviews yet"
              : "No reviews match your filter"}
          </p>
          {totalReviews === 0 && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Reviews will appear here once customers rate your products
            </p>
          )}
          {totalReviews > 0 && (
            <button
              onClick={() => {
                setRatingFilter("all");
                setSearch("");
              }}
              className="mt-3 text-xs text-[var(--info)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Review list */}
      {!isLoading && filteredReviews.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-tertiary)] font-medium">
            Showing {filteredReviews.length} review
            {filteredReviews.length !== 1 ? "s" : ""}
          </p>
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-light)] p-5 hover:border-[var(--border-mid)] transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--off-white-2)] shrink-0 overflow-hidden flex items-center justify-center">
                  {review.product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.product.images[0]}
                      alt={review.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-[var(--text-tertiary)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] mb-0.5">
                        {review.product.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          by {review.customerName}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {review.title && (
                    <p className="text-sm font-semibold text-[var(--text-primary)] mt-2">
                      {review.title}
                    </p>
                  )}

                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-1">
                    {review.comment}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() =>
                        setOpenReply(openReply === review.id ? null : review.id)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reply
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          openReply === review.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {openReply === review.id && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={3}
                        placeholder="Write a helpful, professional reply..."
                        value={replyDraft[review.id] ?? ""}
                        onChange={(e) =>
                          setReplyDraft((prev) => ({
                            ...prev,
                            [review.id]: e.target.value,
                          }))
                        }
                        className="w-full border border-[var(--border-mid)] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            replyMutation.mutate({
                              reviewId: review.id,
                              reply: replyDraft[review.id] ?? "",
                            })
                          }
                          disabled={
                            !replyDraft[review.id]?.trim() ||
                            replyMutation.isPending
                          }
                          className="bg-[var(--charcoal)] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[var(--charcoal-2)] disabled:opacity-40 transition-colors"
                        >
                          {replyMutation.isPending
                            ? "Sending..."
                            : "Submit Reply"}
                        </button>
                        <button
                          onClick={() => setOpenReply(null)}
                          className="text-xs text-[var(--text-secondary)] px-3 py-2 rounded-lg hover:bg-[var(--off-white-2)] transition-colors"
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
