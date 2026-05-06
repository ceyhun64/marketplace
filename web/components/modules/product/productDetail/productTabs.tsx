"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import api from "@/lib/api";
import {
  Star,
  ArrowRight,
  ShieldCheck,
  Info,
  CreditCard,
  MessageSquare,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface Comment {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  customerName?: string;
}

interface ProductTabsProps {
  productId: string;
  productTitle: string;
  productPrice: number;
  productDescription?: string;
}

export default function ProductTabs({
  productId,
  productPrice,
  productDescription,
  productTitle,
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "info" | "comments" | "installments" | "suggestions"
  >("info");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const [suggestion, setSuggestion] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) {
      toast.error("Please write a suggestion.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: ["ispoolofficial@gmail.com"],
          subject: `New Product Suggestion: ${productTitle}`,
          message: suggestion,
        }),
      });

      if (response.ok) {
        toast.success("Your suggestion has been sent to our design team.");
        setSuggestion("");
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      toast.error("An error occurred, please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const installmentRates = [
    { name: "Maximum", logo: "/cards/maximum.svg" },
    { name: "Axess", logo: "/cards/axess.svg" },
    { name: "Paraf", logo: "/cards/paraf.svg" },
    { name: "Bonus", logo: "/cards/bonus.svg" },
    { name: "World", logo: "/cards/world.svg" },
    { name: "Bankkart Combo", logo: "/cards/bankkartcombo.svg" },
  ];

  const rates = [
    { label: "Single Payment", count: 1, rate: 0 },
    { label: "2 Installments", count: 2, rate: 3.5 },
    { label: "3 Installments", count: 3, rate: 5.2 },
    { label: "6 Installments", count: 6, rate: 9.8 },
    { label: "9 Installments", count: 9, rate: 13.5 },
    { label: "12 Installments", count: 12, rate: 17.0 },
  ];

  useEffect(() => {
    if (productId) fetchComments();
  }, [productId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/api/review/${productId}`);
      setComments(data ?? []);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error(error);
      }
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/review", {
        productId,
        rating,
        title: title.trim() || null,
        comment: commentText.trim() || null,
      });
      toast.success("Your review has been published.");
      setIsReviewModalOpen(false);
      setRating(0);
      setHoverRating(0);
      setTitle("");
      setCommentText("");
      fetchComments();
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      if (error?.response?.status === 409) {
        toast.error(msg ?? "You have already reviewed this product.");
      } else if (error?.response?.status === 401) {
        toast.error("You must be signed in to leave a review.");
      } else {
        toast.error(msg ?? "An error occurred, please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateInstallment = (price: number, rate: number, count: number) => {
    const total = price + (price * rate) / 100;
    const monthly = total / count;
    return {
      monthly: monthly.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      total: total.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  };

  const tabs = [
    { id: "info", label: "Details", icon: <Info size={14} /> },
    {
      id: "comments",
      label: "Reviews",
      icon: <MessageSquare size={14} />,
      count: comments.length,
    },
    {
      id: "installments",
      label: "Installments",
      icon: <CreditCard size={14} />,
    },
    {
      id: "suggestions",
      label: "Suggest",
      icon: <BadgeCheck size={14} />,
    },
  ];

  return (
    <section className="mt-12 md:mt-24 max-w-6xl mx-auto px-0 sm:px-6 overflow-hidden">
      {/* MOBILE-FRIENDLY SCROLLABLE NAVIGATION */}
      <nav
        className="flex items-center justify-start lg:justify-center mb-8 md:mb-12 overflow-x-auto scrollbar-hide"
        style={{ borderBottom: "1px solid rgba(30,30,30,0.1)" }}
      >
        <div className="flex shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 pb-4 px-3 md:px-5 text-[10px] md:text-[11px] uppercase tracking-wider transition-all relative whitespace-nowrap font-bold"
              style={{
                color: activeTab === tab.id ? "#c8102e" : "#747474",
                transition: "color 140ms cubic-bezier(0.16,1,0.3,1)",
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id)
                  e.currentTarget.style.color = "#1e1e1e";
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id)
                  e.currentTarget.style.color = "#747474";
              }}
            >
              <span
                className="p-1.5 transition-colors hidden sm:block"
                style={{
                  background:
                    activeTab === tab.id ? "rgba(200,16,46,0.07)" : "#efeeec",
                  color: activeTab === tab.id ? "#c8102e" : "#9a9a9a",
                  borderRadius: "4px",
                }}
              >
                {tab.icon}
              </span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="ml-1 text-[9px] px-1.5 py-0.5"
                  style={{
                    background: "#efeeec",
                    color: "#747474",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 w-full h-0.5 animate-in fade-in duration-300"
                  style={{ background: "#c8102e" }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="min-h-[300px] md:min-h-[400px]">
        {/* 1. TECHNICAL DETAILS */}
        {activeTab === "info" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 order-2 lg:order-1">
              {productDescription ? (
                <div
                  className="prose prose-slate max-w-none leading-relaxed text-sm
                            [&>ul]:list-none [&>ul]:p-0 [&>ul>li]:flex [&>ul>li]:items-start [&>ul>li]:gap-2 [&>ul>li]:before:content-['✓'] [&>ul>li]:before:font-bold"
                  style={{
                    color: "#747474",
                  }}
                  dangerouslySetInnerHTML={{ __html: productDescription }}
                />
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-12 md:py-20 border-2 border-dashed"
                  style={{ borderColor: "rgba(30,30,30,0.1)" }}
                >
                  <Info
                    size={40}
                    className="mb-4"
                    style={{ color: "#e6e4e1" }}
                  />
                  <p className="italic text-sm" style={{ color: "#9a9a9a" }}>
                    Technical documentation is being prepared.
                  </p>
                </div>
              )}
            </div>
            {/* Side Info Card */}
            <div className="lg:col-span-4 order-1 lg:order-2">
              <div
                className="p-6 sticky top-24"
                style={{
                  background: "#1e1e1e",
                  color: "#ffffff",
                  borderRadius: "14px",
                  boxShadow:
                    "0 12px 40px rgba(30,30,30,0.11), 0 4px 12px rgba(30,30,30,0.06)",
                }}
              >
                <ShieldCheck
                  size={32}
                  className="mb-4"
                  style={{ color: "#c8102e" }}
                />
                <h4
                  className="text-xs font-bold uppercase tracking-widest mb-2"
                  style={{ color: "#fafafa" }}
                >
                  Safety Standards
                </h4>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "#747474" }}
                >
                  This product fully complies with CE and EN ISO occupational
                  safety standards. It has successfully passed field tests.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. REVIEWS */}
        {activeTab === "comments" && (
          <div className="animate-in fade-in duration-500 space-y-8 md:space-y-12">
            <div
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-6"
              style={{ borderBottom: "1px solid rgba(30,30,30,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <h3
                  className="text-lg md:text-xl font-bold uppercase tracking-tighter"
                  style={{
                    color: "#1e1e1e",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  Field Experiences
                </h3>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#9a9a9a" }}
                >
                  ({comments.length})
                </span>
              </div>
              {currentUser && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 text-[10px] uppercase tracking-widest font-black transition-all"
                  style={{
                    background: "#c8102e",
                    color: "#ffffff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(200,16,46,0.2)",
                    transition:
                      "background 140ms cubic-bezier(0.16,1,0.3,1), box-shadow 140ms cubic-bezier(0.16,1,0.3,1)",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#a00d24";
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(200,16,46,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#c8102e";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(200,16,46,0.2)";
                  }}
                >
                  Share Your Experience
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2
                  size={28}
                  className="animate-spin"
                  style={{ color: "#c8102e" }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-5 md:p-6 transition-shadow"
                      style={{
                        background: "#ffffff",
                        border: "1px solid rgba(30,30,30,0.1)",
                        borderRadius: "14px",
                        boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 4px 16px rgba(30,30,30,0.08), 0 2px 6px rgba(30,30,30,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 1px 4px rgba(30,30,30,0.06)";
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              fill={i < comment.rating ? "#c8102e" : "none"}
                              color={i < comment.rating ? "#c8102e" : "#e6e4e1"}
                            />
                          ))}
                        </div>
                        <span
                          className="text-[9px] font-bold uppercase tracking-tighter"
                          style={{
                            color: "#9a9a9a",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {new Date(comment.createdAt).toLocaleDateString(
                            "en-US",
                          )}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div
                          className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                          style={{ color: "#1e1e1e" }}
                        >
                          <div
                            className="w-6 h-6 flex items-center justify-center text-[8px] shrink-0"
                            style={{
                              background: "#efeeec",
                              borderRadius: "4px",
                              color: "#525252",
                            }}
                          >
                            {comment.customerName?.[0] ?? "?"}
                          </div>
                          <span className="truncate">
                            {comment.customerName ?? "Anonymous"}
                          </span>
                        </div>
                        {comment.title && (
                          <p
                            className="text-[11px] font-bold"
                            style={{ color: "#1e1e1e" }}
                          >
                            {comment.title}
                          </p>
                        )}
                        {comment.comment && (
                          <p
                            className="text-sm leading-relaxed font-medium italic"
                            style={{ color: "#747474" }}
                          >
                            "{comment.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    className="col-span-full text-center py-12 text-sm italic"
                    style={{ color: "#9a9a9a" }}
                  >
                    No reviews yet. Be the first to share your experience!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. INSTALLMENTS */}
        {activeTab === "installments" && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
              {installmentRates.map((bank) => (
                <div
                  key={bank.name}
                  className="p-3 md:p-6 overflow-hidden"
                  style={{
                    border: "1px solid rgba(30,30,30,0.1)",
                    background: "#ffffff",
                    borderRadius: "14px",
                    boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="relative w-16 md:w-20 h-8">
                      <Image
                        src={bank.logo}
                        alt={bank.name}
                        fill
                        sizes="80px"
                        className="object-contain object-left"
                      />
                    </div>
                    <span
                      className="text-[8px] md:text-[9px] font-black uppercase tracking-widest"
                      style={{
                        color: "#9a9a9a",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {bank.name}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[280px]">
                      <thead>
                        <tr
                          className="text-[8px] md:text-[9px] font-black tracking-widest uppercase"
                          style={{
                            color: "#9a9a9a",
                            borderBottom: "1px solid rgba(30,30,30,0.06)",
                          }}
                        >
                          <th className="py-2 md:py-3">Plan</th>
                          <th className="py-2 md:py-3 text-right">Monthly</th>
                          <th className="py-2 md:py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rates.map((r) => {
                          const { monthly, total } = calculateInstallment(
                            productPrice,
                            r.rate,
                            r.count,
                          );
                          return (
                            <tr
                              key={r.count}
                              className="text-[10px] md:text-[11px] transition-colors"
                              style={{
                                borderBottom: "1px solid rgba(30,30,30,0.04)",
                              }}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = "#fafafa";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as HTMLElement
                                ).style.background = "";
                              }}
                            >
                              <td
                                className="py-2 md:py-3 font-bold"
                                style={{ color: "#525252" }}
                              >
                                {r.label}
                              </td>
                              <td
                                className="py-2 md:py-3 text-right font-black"
                                style={{ color: "#1e1e1e" }}
                              >
                                {monthly} USD
                              </td>
                              <td
                                className="py-2 md:py-3 text-right font-medium"
                                style={{ color: "#9a9a9a" }}
                              >
                                {total} USD
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left"
              style={{
                background: "rgba(200,16,46,0.07)",
                border: "1px solid rgba(200,16,46,0.18)",
                borderRadius: "8px",
              }}
            >
              <ShieldCheck
                size={18}
                className="shrink-0"
                style={{ color: "#c8102e" }}
              />
              <p
                className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider leading-relaxed"
                style={{ color: "#c8102e" }}
              >
                Secure Payment: Your card data is protected by 256-bit SSL
                certified iyzico infrastructure.
              </p>
            </div>
          </div>
        )}

        {/* 4. SUGGESTIONS */}
        {activeTab === "suggestions" && (
          <div
            className="animate-in zoom-in-95 duration-500 max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-8 text-center"
            style={{
              background: "#efeeec",
              border: "1px solid rgba(30,30,30,0.1)",
              borderRadius: "14px",
            }}
          >
            <div className="mb-8">
              <div
                className="inline-flex p-3 md:p-4 mb-6"
                style={{
                  background: "#ffffff",
                  borderRadius: "8px",
                  boxShadow: "0 1px 4px rgba(30,30,30,0.06)",
                }}
              >
                <BadgeCheck size={28} style={{ color: "#c8102e" }} />
              </div>
              <h3
                className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-3"
                style={{
                  color: "#1e1e1e",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Professional Feedback
              </h3>
              <p
                className="text-[13px] md:text-sm font-medium leading-relaxed"
                style={{ color: "#747474" }}
              >
                We shape our workwear around your real-world needs.{" "}
                <br className="hidden sm:block" />
                Share your suggestion with our design team.
              </p>
            </div>

            <div className="relative mb-6 md:mb-8">
              <textarea
                className="w-full p-4 md:p-6 text-sm outline-none min-h-[120px] resize-none transition-all"
                placeholder="Example: Extra knee reinforcement or reflector placement..."
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                disabled={isSending}
                style={{
                  background: "#ffffff",
                  border: "1.5px solid rgba(30,30,30,0.18)",
                  borderRadius: "8px",
                  color: "#1e1e1e",
                  fontFamily: "'Manrope', sans-serif",
                  boxShadow: "0 1px 2px rgba(30,30,30,0.05)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#c8102e";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(200,16,46,0.18)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(30,30,30,0.18)";
                  e.currentTarget.style.boxShadow =
                    "0 1px 2px rgba(30,30,30,0.05)";
                }}
              />
            </div>

            <button
              onClick={handleSendSuggestion}
              disabled={isSending}
              className={cn(
                "w-full sm:w-auto px-8 md:px-10 py-3 md:py-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 mx-auto transition-all",
                isSending && "opacity-50 cursor-not-allowed",
              )}
              style={{
                background: "#1e1e1e",
                color: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(30,30,30,0.08)",
                fontFamily: "'Manrope', sans-serif",
                transition:
                  "background 140ms cubic-bezier(0.16,1,0.3,1), box-shadow 140ms cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={(e) => {
                if (!isSending) {
                  e.currentTarget.style.background = "#c8102e";
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(200,16,46,0.22)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSending) {
                  e.currentTarget.style.background = "#1e1e1e";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(30,30,30,0.08)";
                }
              }}
            >
              {isSending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Submit Suggestion
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent
          className="w-[95vw] max-w-md border-none p-6 md:p-8"
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            boxShadow:
              "0 24px 64px rgba(30,30,30,0.14), 0 8px 20px rgba(30,30,30,0.08)",
          }}
        >
          <DialogHeader className="text-center">
            <DialogTitle
              className="text-lg md:text-xl font-bold uppercase tracking-tighter"
              style={{ color: "#1e1e1e", fontFamily: "'Manrope', sans-serif" }}
            >
              Share Your Field Experience
            </DialogTitle>
            <DialogDescription
              className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest"
              style={{
                color: "#9a9a9a",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Your feedback improves our product quality.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform active:scale-90"
                  disabled={isSubmitting}
                >
                  <Star
                    size={28}
                    fill={n <= (hoverRating || rating) ? "#c8102e" : "none"}
                    color={n <= (hoverRating || rating) ? "#c8102e" : "#e6e4e1"}
                    className="transition-colors"
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p
                className="text-center text-[10px] font-bold uppercase tracking-widest -mt-2"
                style={{
                  color: "#9a9a9a",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {["", "Very Poor", "Poor", "Fair", "Good", "Excellent"][rating]}
              </p>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label
                  className="text-[9px] font-black uppercase tracking-widest ml-1"
                  style={{
                    color: "#9a9a9a",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Subject <span style={{ color: "#e6e4e1" }}>(Optional)</span>
                </label>
                <input
                  placeholder="e.g.: Trouser Durability"
                  className="w-full px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "#fafafa",
                    border: "1.5px solid rgba(30,30,30,0.1)",
                    borderRadius: "8px",
                    color: "#1e1e1e",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#c8102e";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(200,16,46,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.borderColor = "rgba(30,30,30,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div className="space-y-1">
                <label
                  className="text-[9px] font-black uppercase tracking-widest ml-1"
                  style={{
                    color: "#9a9a9a",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Your Review{" "}
                  <span style={{ color: "#e6e4e1" }}>(Optional)</span>
                </label>
                <textarea
                  placeholder="How did the product perform in your work environment?"
                  className="w-full px-4 py-3 text-sm outline-none transition-all min-h-[100px] resize-none"
                  style={{
                    background: "#fafafa",
                    border: "1.5px solid rgba(30,30,30,0.1)",
                    borderRadius: "8px",
                    color: "#1e1e1e",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmitting}
                  onFocus={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#c8102e";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(200,16,46,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.background = "#fafafa";
                    e.currentTarget.style.borderColor = "rgba(30,30,30,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting || rating === 0}
              className={cn(
                "w-full py-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all",
                (isSubmitting || rating === 0) &&
                  "opacity-50 cursor-not-allowed",
              )}
              style={{
                background: "#c8102e",
                color: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(200,16,46,0.2)",
                fontFamily: "'Manrope', sans-serif",
                transition:
                  "background 140ms cubic-bezier(0.16,1,0.3,1), box-shadow 140ms cubic-bezier(0.16,1,0.3,1)",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && rating > 0) {
                  e.currentTarget.style.background = "#a00d24";
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(200,16,46,0.22)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && rating > 0) {
                  e.currentTarget.style.background = "#c8102e";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(200,16,46,0.2)";
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                "Publish Review"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
