"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  MessageSquare,
  Filter,
  Package,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  customerName: string;
  product: { id: string; name: string; images?: string[] };
}

interface ReviewsResponse {
  data: Review[];
  pagination: { page: number; limit: number; total: number };
  stats: {
    totalReviews: number;
    averageRating: number;
    productsWithReviews: number;
    distribution: { star: number; count: number }[];
  };
}

const PAGE_SIZE = 20;

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
          className={`${px} ${s <= rating ? "text-(--warning)" : "text-(--border-mid)"}`}
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input before it hits the query key
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [ratingFilter, debouncedSearch]);

  const queryKey = [
    "merchant-reviews",
    page,
    ratingFilter,
    debouncedSearch,
  ] as const;

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<ReviewsResponse>("/api/merchants/reviews", {
        params: {
          page,
          limit: PAGE_SIZE,
          rating: ratingFilter === "all" ? undefined : Number(ratingFilter),
          search: debouncedSearch || undefined,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });

  const reviews = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;
  const totalReviews = stats?.totalReviews ?? 0;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            Product Reviews
          </h1>
          <p className="text-sm text-(--text-secondary) mt-1">
            Customer feedback across all your products
          </p>
        </div>
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["merchant-reviews"] })
          }
          className="flex items-center gap-2 text-sm text-(--text-secondary) border border-(--border-mid) rounded-lg px-3 py-2 hover:bg-(--bg-sunken) transition-colors"
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
          <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
            <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider mb-3">
              Average Rating
            </p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-(--text-primary) leading-none">
                {totalReviews > 0 ? (stats?.averageRating ?? 0).toFixed(1) : "—"}
              </span>
              <div className="mb-1">
                <Stars rating={Math.round(stats?.averageRating ?? 0)} />
                <p className="text-xs text-(--text-tertiary) mt-1">
                  {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
            <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider mb-3">
              Total Reviews
            </p>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-(--info)" />
              <span className="text-3xl font-bold text-(--text-primary)">
                {totalReviews}
              </span>
            </div>
            <p className="text-xs text-(--text-tertiary) mt-2">
              Across {stats?.productsWithReviews ?? 0} product
              {stats?.productsWithReviews !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
            <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider mb-3">
              Rating Distribution
            </p>
            <div className="space-y-1.5">
              {(stats?.distribution ?? []).map(({ star, count }) => {
                const pct =
                  totalReviews > 0
                    ? Math.round((count / totalReviews) * 100)
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-(--text-secondary) font-medium shrink-0">
                      {star}★
                    </span>
                    <div className="flex-1 h-1.5 bg-(--off-white-2) rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--warning) rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-(--text-tertiary)">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search reviews or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-(--bg-surface) border border-(--border-mid) rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-(--text-tertiary)" />
          <div className="flex gap-1">
            {["all", "5", "4", "3", "2", "1"].map((f) => (
              <button
                key={f}
                onClick={() => setRatingFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ratingFilter === f
                    ? "bg-(--charcoal) text-white"
                    : "bg-(--bg-surface) border border-(--border-mid) text-(--text-secondary) hover:border-(--border-mid)"
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
              className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
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
      {!isLoading && reviews.length === 0 && (
        <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) flex flex-col items-center justify-center py-20">
          <Star className="w-12 h-12 text-(--border-mid) mb-4" />
          <p className="text-sm font-medium text-(--text-secondary)">
            {ratingFilter === "all" && !debouncedSearch
              ? "No reviews yet"
              : "No reviews match your filter"}
          </p>
          {ratingFilter === "all" && !debouncedSearch ? (
            <p className="text-xs text-(--text-tertiary) mt-1">
              Reviews will appear here once customers rate your products
            </p>
          ) : (
            <button
              onClick={() => {
                setRatingFilter("all");
                setSearch("");
              }}
              className="mt-3 text-xs text-(--info) hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Review list */}
      {!isLoading && reviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-(--text-tertiary) font-medium">
              Showing {reviews.length} of {pagination?.total ?? reviews.length} review
              {(pagination?.total ?? reviews.length) !== 1 ? "s" : ""}
              {isFetching && " · refreshing…"}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-(--border-mid) text-(--text-secondary) hover:bg-(--bg-sunken) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-(--text-tertiary)">
                  Page {page} of {totalPages}
                </span>
                <button
                  aria-label="Next page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-(--border-mid) text-(--text-secondary) hover:bg-(--bg-sunken) disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5 hover:border-(--border-mid) transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-(--off-white-2) shrink-0 overflow-hidden flex items-center justify-center">
                  {review.product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.product.images[0]}
                      alt={review.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-(--text-tertiary)" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-xs text-(--text-tertiary) mb-0.5">
                        {review.product.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-xs font-semibold text-(--text-secondary)">
                          by {review.customerName}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-(--text-tertiary) shrink-0">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  {review.title && (
                    <p className="text-sm font-semibold text-(--text-primary) mt-2">
                      {review.title}
                    </p>
                  )}

                  <p className="text-sm text-(--text-secondary) leading-relaxed mt-1">
                    {review.comment}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
