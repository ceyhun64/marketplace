"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Star,
  ArrowRight,
  ShieldCheck,
  Info,
  CreditCard,
  MessageSquare,
  BadgeCheck,
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

interface Comment {
  id: number;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  user?: { id: number; name: string; surname: string };
}

interface ProductTabsProps {
  productId: number;
  productTitle: string;
  productPrice: number;
  productDescription?: string;
}

export default function ProductTabs({
  productId,
  productPrice,
  productDescription,
  productTitle
}: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "info" | "comments" | "installments" | "suggestions"
  >("info");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  // State'lerin yanına ekle
  const [suggestion, setSuggestion] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) {
      toast.error("Lütfen bir öneri yazın.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: ["ispoolofficial@gmail.com"], // Mailin gideceği adres
          subject: `Yeni Ürün Önerisi: ${productTitle}`,
          message: suggestion,
        }),
      });

      if (response.ok) {
        toast.success("Öneriniz tasarım ekibimize başarıyla iletildi.");
        setSuggestion(""); // Formu temizle
      } else {
        throw new Error("Mail gönderilemedi");
      }
    } catch (error) {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
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
    { label: "Tek Çekim", count: 1, rate: 0 },
    { label: "2 Taksit", count: 2, rate: 3.5 },
    { label: "3 Taksit", count: 3, rate: 5.2 },
    { label: "6 Taksit", count: 6, rate: 9.8 },
    { label: "9 Taksit", count: 9, rate: 13.5 },
    { label: "12 Taksit", count: 12, rate: 17.0 },
  ];

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/account/check");
        const data = await res.json();
        if (data.user) setCurrentUser(data.user);
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (productId) fetchComments();
  }, [productId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/review/${productId}`);
      const data = await res.json();
      setComments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateInstallment = (price: number, rate: number, count: number) => {
    const total = price + (price * rate) / 100;
    const monthly = total / count;
    return {
      monthly: monthly.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      total: total.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  };

  const tabs = [
    { id: "info", label: "Detaylar", icon: <Info size={14} /> },
    {
      id: "comments",
      label: "Yorumlar",
      icon: <MessageSquare size={14} />,
      count: comments.length,
    },
    {
      id: "installments",
      label: "Taksitler",
      icon: <CreditCard size={14} />,
    },
    {
      id: "suggestions",
      label: "Öneri",
      icon: <BadgeCheck size={14} />,
    },
  ];

  return (
    <section className="mt-12 md:mt-24 max-w-6xl mx-auto px-0 sm:px-6 overflow-hidden">
      {/* MOBİL UYUMLU KAYDIRILABİLİR NAVİGASYON */}
      <nav className="flex items-center justify-start lg:justify-center border-b border-slate-200 mb-8 md:mb-12 overflow-x-auto scrollbar-hide">
        <div className="flex shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 pb-4 px-3 md:px-5 text-[10px] md:text-[11px] uppercase tracking-wider transition-all relative whitespace-nowrap font-bold",
                activeTab === tab.id
                  ? "text-orange-600"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <span
                className={cn(
                  "p-1.5 transition-colors hidden sm:block",
                  activeTab === tab.id
                    ? "bg-orange-50 text-orange-600"
                    : "bg-slate-50 text-slate-400",
                )}
              >
                {tab.icon}
              </span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 text-[9px] bg-slate-100 px-1.5 py-0.5 text-slate-500">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 animate-in fade-in duration-300" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <div className="min-h-[300px] md:min-h-[400px]">
        {/* 1. TEKNİK DETAYLAR */}
        {activeTab === "info" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 order-2 lg:order-1">
              {productDescription ? (
                <div
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm 
                            [&>ul]:list-none [&>ul]:p-0 [&>ul>li]:flex [&>ul>li]:items-start [&>ul>li]:gap-2 [&>ul>li]:before:content-['✓'] [&>ul>li]:before:text-orange-600 [&>ul>li]:before:font-bold"
                  dangerouslySetInnerHTML={{ __html: productDescription }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 border-2 border-dashed border-slate-100">
                  <Info className="text-slate-200 mb-4" size={40} />
                  <p className="italic text-slate-400 text-sm">
                    Teknik dökümantasyon hazırlanıyor.
                  </p>
                </div>
              )}
            </div>
            {/* Yan Bilgi Kartı */}
            <div className="lg:col-span-4 order-1 lg:order-2">
              <div className="bg-slate-900 text-white p-6 shadow-xl sticky top-24">
                <ShieldCheck className="text-orange-500 mb-4" size={32} />
                <h4 className="text-xs font-bold uppercase tracking-widest mb-2">
                  Güvenlik Standartları
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bu ürün CE ve EN ISO iş güvenliği standartlarına tam uyumluluk
                  göstermektedir. Saha testlerinden başarıyla geçmiştir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. YORUMLAR */}
        {activeTab === "comments" && (
          <div className="animate-in fade-in duration-500 space-y-8 md:space-y-12">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-tighter">
                  Saha Deneyimleri
                </h3>
                <span className="text-xs font-medium text-slate-400">
                  ({comments.length})
                </span>
              </div>
              {currentUser && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="w-full sm:w-auto bg-orange-600 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-black hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                >
                  Deneyimini Paylaş
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className={cn(
                              i < comment.rating
                                ? "fill-orange-500 text-orange-500"
                                : "text-slate-200",
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        {new Date(comment.createdAt).toLocaleDateString(
                          "tr-TR",
                        )}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 flex items-center justify-center text-[8px] shrink-0">
                          {comment.user?.name[0]}
                        </div>
                        <span className="truncate">
                          {comment.user?.name} {comment.user?.surname}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                        "{comment.comment}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-slate-400 text-sm italic">
                  Henüz yorum yapılmamış. İlk yorumu siz yapın!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. TAKSİTLER */}
        {activeTab === "installments" && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
              {installmentRates.map((bank) => (
                <div
                  key={bank.name}
                  className="border border-slate-100 p-3 md:p-6 bg-white shadow-sm overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="relative w-16 md:w-20 h-8">
                      <Image
                        src={bank.logo}
                        alt={bank.name}
                        fill
                        className="object-contain object-left"
                      />
                    </div>
                    <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest">
                      {bank.name}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[280px]">
                      <thead>
                        <tr className="text-slate-400 uppercase text-[8px] md:text-[9px] font-black tracking-widest border-b border-slate-50">
                          <th className="py-2 md:py-3">Taksit</th>
                          <th className="py-2 md:py-3 text-right">Aylık</th>
                          <th className="py-2 md:py-3 text-right">Toplam</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {rates.map((r) => {
                          const { monthly, total } = calculateInstallment(
                            productPrice,
                            r.rate,
                            r.count,
                          );
                          return (
                            <tr
                              key={r.count}
                              className="hover:bg-slate-50/50 transition-colors text-[10px] md:text-[11px]"
                            >
                              <td className="py-2 md:py-3 font-bold text-slate-700">
                                {r.label}
                              </td>
                              <td className="py-2 md:py-3 text-right font-black text-slate-900">
                                {monthly} TL
                              </td>
                              <td className="py-2 md:py-3 text-right text-slate-400 font-medium">
                                {total} TL
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
            <div className="bg-orange-50/50 border border-orange-100 p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <ShieldCheck className="text-orange-600 shrink-0" size={18} />
              <p className="text-[9px] md:text-[10px] text-orange-800 font-bold uppercase tracking-wider leading-relaxed">
                Güvenli Ödeme: 256-Bit SSL Sertifikalı iyzico Altyapısı ile kart
                verileriniz korunur.
              </p>
            </div>
          </div>
        )}

        {/* 4. ÖNERİLER */}
        {activeTab === "suggestions" && (
          <div className="animate-in zoom-in-95 duration-500 max-w-2xl mx-auto py-8 md:py-12 px-4 md:px-8 bg-slate-50 text-center border border-slate-100">
            <div className="mb-8">
              <div className="inline-flex p-3 md:p-4 bg-white shadow-sm mb-6">
                <BadgeCheck className="text-orange-600" size={28} />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tighter mb-3">
                Profesyonel Görüşünüz
              </h3>
              <p className="text-slate-500 text-[13px] md:text-sm font-medium leading-relaxed">
                İş kıyafetlerimizi sahadaki ihtiyaçlarınıza göre
                şekillendiriyoruz. <br className="hidden sm:block" />
                Tasarım ekibimize önerinizi iletin.
              </p>
            </div>

            <div className="relative mb-6 md:mb-8 shadow-sm">
              <textarea
                className="w-full bg-white border border-slate-200 p-4 md:p-6 text-sm outline-none focus:ring-2 ring-orange-100 transition-all min-h-[120px] resize-none"
                placeholder="Örneğin: Diz bölgelerine ekstra takviye veya reflektör konumu..."
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                disabled={isSending}
              />
            </div>

            <button
              onClick={handleSendSuggestion}
              disabled={isSending}
              className={cn(
                "w-full sm:w-auto bg-slate-900 rounded-sm text-white px-8 md:px-10 py-3 md:py-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 mx-auto hover:bg-orange-600 transition-all shadow-xl shadow-slate-200",
                isSending && "opacity-50 cursor-not-allowed",
              )}
            >
              {isSending ? "Gönderiliyor..." : "Öneriyi Gönder"}
              {!isSending && <ArrowRight size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* YORUM MODALI */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="w-[95vw] max-w-md bg-white border-none shadow-2xl p-6 md:p-8 rounded-lg">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg md:text-xl font-bold uppercase tracking-tighter text-slate-900">
              Saha Deneyimini Paylaş
            </DialogTitle>
            <DialogDescription className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Görüşleriniz üretim kalitemizi artırır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="transition-transform active:scale-90"
                >
                  <Star
                    size={24}
                    className={cn(
                      "transition-colors",
                      n <= rating
                        ? "fill-orange-500 text-orange-500"
                        : "text-slate-100",
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Konu Başlığı
                </label>
                <input
                  placeholder="Örn: Pantolon Dayanıklılığı"
                  className="w-full bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-1 ring-orange-200 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Yorumunuz
                </label>
                <textarea
                  placeholder="Ürün çalışma ortamınızda nasıl bir performans gösterdi?"
                  className="w-full bg-slate-50 border border-slate-100 px-4 py-3 text-sm outline-none focus:bg-white focus:ring-1 ring-orange-200 transition-all min-h-[100px] resize-none"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={() => {
                toast.success("Raporunuz başarıyla iletildi.");
                setIsReviewModalOpen(false);
              }}
              className="w-full bg-orange-600 text-white py-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-lg shadow-orange-100"
            >
              Yorumu Yayınla
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
