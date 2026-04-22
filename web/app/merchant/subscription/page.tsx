"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Crown,
  Zap,
  Shield,
  AlertCircle,
  Calendar,
} from "lucide-react";

type PlanType = "BASIC" | "PRO" | "ENTERPRISE";

interface CurrentSubscription {
  plan: PlanType;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  startDate?: string;
  endDate?: string;
  daysLeft?: number;
}

const PLANS = [
  {
    id: "BASIC" as PlanType,
    name: "Basic",
    price: "Ücretsiz",
    priceNote: "Sonsuza kadar",
    icon: Shield,
    iconColor: "text-gray-500",
    iconBg: "bg-gray-100",
    borderColor: "border-gray-200",
    activeBorder: "border-gray-400",
    activeBg: "bg-gray-50",
    features: [
      { label: "Bağımsız E-Mağaza (/store/slug)", included: true },
      { label: "50 ürün limiti", included: true },
      { label: "Temel analitik", included: true },
      { label: "Marketplace'e publish", included: false },
      { label: "Özel subdomain", included: false },
      { label: "Özel domain", included: false },
      { label: "Plugin marketplace", included: false },
      { label: "Logo/banner yükleme", included: false },
      { label: "Gelişmiş analitik", included: false },
    ],
  },
  {
    id: "PRO" as PlanType,
    name: "Pro",
    price: "$29",
    priceNote: "/ay",
    icon: Zap,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    borderColor: "border-blue-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50/30",
    badge: "Popüler",
    badgeColor: "bg-blue-600",
    features: [
      { label: "Bağımsız E-Mağaza (/store/slug)", included: true },
      { label: "Sınırsız ürün", included: true },
      { label: "Marketplace'e publish", included: true },
      { label: "Özel subdomain desteği", included: true },
      { label: "Plugin marketplace erişimi", included: true },
      { label: "Logo/banner yükleme", included: true },
      { label: "Gelişmiş analitik & raporlama", included: true },
      { label: "Özel domain", included: false },
      { label: "Öncelikli destek", included: false },
    ],
  },
  {
    id: "ENTERPRISE" as PlanType,
    name: "Enterprise",
    price: "Özel",
    priceNote: "fiyatlandırma",
    icon: Crown,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    borderColor: "border-purple-200",
    activeBorder: "border-purple-500",
    activeBg: "bg-purple-50/30",
    features: [
      { label: "Tüm Pro özellikleri", included: true },
      { label: "Tam özel domain (mymağaza.com)", included: true },
      { label: "Öncelikli destek", included: true },
      { label: "Özel raporlar", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "SLA garantisi", included: true },
    ],
  },
];

export default function MerchantSubscriptionPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["merchant-subscription"],
    queryFn: async () => {
      const res = await api.get("/subscriptions/current");
      return res.data;
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan: PlanType) => {
      const res = await api.post("/subscriptions/subscribe", { plan });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.paymentUrl) {
        window.location.href = data.data.paymentUrl;
      } else {
        toast.success("Abonelik güncellendi");
        queryClient.invalidateQueries({ queryKey: ["merchant-subscription"] });
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Abonelik işlemi başarısız",
      );
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/subscriptions/cancel");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Abonelik iptal edildi");
      queryClient.invalidateQueries({ queryKey: ["merchant-subscription"] });
    },
    onError: () => toast.error("İptal işlemi başarısız"),
  });

  const subscription: CurrentSubscription | null = data?.data || null;
  const currentPlan = subscription?.plan || "BASIC";

  if (isLoading) {
    return (
      <div className="p-6 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonelik Planım</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mevcut planınızı görüntüleyin ve yükseltin
        </p>
      </div>

      {/* Current Plan Status */}
      {subscription && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {(() => {
                  const plan = PLANS.find((p) => p.id === currentPlan);
                  if (!plan) return null;
                  return (
                    <>
                      <div className={`p-3 rounded-xl ${plan.iconBg}`}>
                        <plan.icon className={`w-6 h-6 ${plan.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          Mevcut Plan
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {plan.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              subscription.status === "ACTIVE"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {subscription.status === "ACTIVE"
                              ? "Aktif"
                              : "Pasif"}
                          </span>
                          {subscription.endDate && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(
                                subscription.endDate,
                              ).toLocaleDateString("tr-TR")}
                              {subscription.daysLeft !== undefined && (
                                <span
                                  className={`ml-1 font-medium ${
                                    subscription.daysLeft <= 7
                                      ? "text-red-500"
                                      : "text-gray-600"
                                  }`}
                                >
                                  ({subscription.daysLeft} gün kaldı)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              {currentPlan !== "BASIC" && subscription.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (
                      confirm(
                        "Aboneliğinizi iptal etmek istediğinize emin misiniz?",
                      )
                    ) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  Aboneliği İptal Et
                </Button>
              )}
            </div>

            {subscription.daysLeft !== undefined &&
              subscription.daysLeft <= 7 &&
              subscription.daysLeft > 0 && (
                <div className="mt-4 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-700">
                    Aboneliğiniz <strong>{subscription.daysLeft} gün</strong>{" "}
                    içinde sona erecek. Kesintisiz erişim için yenileyin.
                  </p>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`border-2 shadow-sm relative transition-all ${
                isActive
                  ? `${plan.activeBorder} ${plan.activeBg}`
                  : `${plan.borderColor} hover:shadow-md`
              }`}
            >
              {plan.badge && !isActive && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1 rounded-full font-semibold ${plan.badgeColor}`}
                >
                  {plan.badge}
                </div>
              )}
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Mevcut Plan
                </div>
              )}
              <CardContent className="p-6">
                {/* Plan Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${plan.iconBg}`}>
                    <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        {plan.priceNote}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.label}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      {feature.included ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included ? "text-gray-700" : "text-gray-400"
                        }
                      >
                        {feature.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isActive ? (
                  <Button className="w-full" variant="outline" disabled>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    Mevcut Planınız
                  </Button>
                ) : plan.id === "ENTERPRISE" ? (
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      toast.info(
                        "Enterprise plan için lütfen bizimle iletişime geçin.",
                      );
                    }}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    İletişime Geç
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={subscribeMutation.isPending}
                    onClick={() => subscribeMutation.mutate(plan.id)}
                  >
                    {subscribeMutation.isPending
                      ? "İşleniyor..."
                      : currentPlan === "BASIC"
                        ? `${plan.name}'e Geç`
                        : currentPlan === "PRO" && plan.id === "BASIC"
                          ? "Düşür"
                          : `${plan.name}'e Yükselt`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Sık Sorulan Sorular
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              q: "Plan yükseltme anında aktif olur mu?",
              a: "Evet, ödeme onaylandıktan sonra plan değişikliği anında uygulanır.",
            },
            {
              q: "Plan düşürürsem ürünlerime ne olur?",
              a: "Basic'e geçişte 50 ürün limitini aşarsanız yeni ürün ekleyemezsiniz, mevcut ürünler korunur.",
            },
            {
              q: "Marketplace'e publish özelliği nasıl çalışır?",
              a: "Pro ve üzeri planlarda ürün sayfasındaki 'Marketplace'e Yayınla' toggle'ı ile ürünlerinizi genel pazara açabilirsiniz.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <p className="text-sm font-semibold text-gray-900">{item.q}</p>
              <p className="text-sm text-gray-500 mt-1">{item.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
