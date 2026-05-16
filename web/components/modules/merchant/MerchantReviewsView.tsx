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
          className={`${px} ${s <= rating ? "text-yellow-400" : "text-gray-200"}`}
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

  // Merchant'ın ürünlerini çek
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

  // Her ürün için yorumları çek
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

  // Tüm ürün+yorum verilerini birleştir
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
          <h1 className="text-2xl font-semibold text-gray-900">
            Product Reviews
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customer feedback across all your products
          </p>
        </div>
        <button
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ["merchant-all-reviews"],
            })
          }
          className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
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
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
              Average Rating
            </p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-gray-900 leading-none">
                {totalReviews > 0 ? globalAvg.toFixed(1) : "—"}
              </span>
              <div className="mb-1">
                <Stars rating={Math.round(globalAvg)} />
                <p className="text-xs text-gray-400 mt-1">
                  {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
              Total Reviews
            </p>
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <span className="text-3xl font-bold text-gray-900">
                {totalReviews}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Across {productsWithReviews} product
              {productsWithReviews !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
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
                    <span className="w-4 text-gray-500 font-medium shrink-0">
                      {star}★
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-gray-400">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {["all", "5", "4", "3", "2", "1"].map((f) => (
              <button
                key={f}
                onClick={() => setRatingFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  ratingFilter === f
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
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
              className="bg-white rounded-xl border border-gray-100 p-5"
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
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center py-20">
          <Star className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">
            {totalReviews === 0
              ? "No reviews yet"
              : "No reviews match your filter"}
          </p>
          {totalReviews === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Reviews will appear here once customers rate your products
            </p>
          )}
          {totalReviews > 0 && (
            <button
              onClick={() => {
                setRatingFilter("all");
                setSearch("");
              }}
              className="mt-3 text-xs text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Review list */}
      {!isLoading && filteredReviews.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium">
            Showing {filteredReviews.length} review
            {filteredReviews.length !== 1 ? "s" : ""}
          </p>
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {review.product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.product.images[0]}
                      alt={review.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        {review.product.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="text-xs font-semibold text-gray-600">
                          by {review.customerName}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {review.title && (
                    <p className="text-sm font-semibold text-gray-800 mt-2">
                      {review.title}
                    </p>
                  )}

                  <p className="text-sm text-gray-600 leading-relaxed mt-1">
                    {review.comment}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() =>
                        setOpenReply(openReply === review.id ? null : review.id)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
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
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
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
                          className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
                        >
                          {replyMutation.isPending
                            ? "Sending..."
                            : "Submit Reply"}
                        </button>
                        <button
                          onClick={() => setOpenReply(null)}
                          className="text-xs text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
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
