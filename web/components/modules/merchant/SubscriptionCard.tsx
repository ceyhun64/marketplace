"use client";

import { useMySubscription, useUpgradePlan } from "@/queries/useSubscription";
import { PLAN_LABELS, PLAN_COLORS, PLAN_LIMITS } from "@/types/enums";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { PlanType } from "@/types/enums";

const PLAN_PRICES: Record<PlanType, string> = {
  BASIC: "Ücretsiz",
  PRO: "$X/ay",
  ENTERPRISE: "Özel Fiyat",
};

const PLAN_FEATURES: Record<PlanType, string[]> = {
  BASIC: [
    "Bağımsız E-Mağaza (/store/slug)",
    "50 ürün limiti",
    "Temel analitikler",
  ],
  PRO: [
    "Sınırsız ürün",
    "Pazaryerinde yayınlama",
    "Özel subdomain (mağaza.platform.com)",
    "Logo & banner yükleme",
    "Tam analitik & raporlama",
    "Plugin marketplace erişimi",
  ],
  ENTERPRISE: [
    "Tüm Pro özellikleri",
    "Tam özel domain (mymağaza.com)",
    "Özel raporlar",
    "Öncelikli destek",
    "API erişimi",
  ],
};

export default function SubscriptionCard() {
  const { data: subscription, isLoading } = useMySubscription();
  const upgradeMutation = useUpgradePlan();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  const currentPlan = subscription?.plan ?? "BASIC";

  const plans: PlanType[] = ["BASIC", "PRO", "ENTERPRISE"];

  return (
    <div className="space-y-6">
      {/* Current plan badge */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-[#7A7060]">Mevcut planınız:</p>
        <span
          className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${PLAN_COLORS[currentPlan]}`}
        >
          {PLAN_LABELS[currentPlan]}
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan === currentPlan;
          const isUpgrade = plans.indexOf(plan) > plans.indexOf(currentPlan);
          const limits = PLAN_LIMITS[plan];

          return (
            <div
              key={plan}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                isCurrent
                  ? "border-[#1A4A6B] shadow-[0_0_0_3px_rgba(26,74,107,0.1)]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Top bar */}
              <div
                className={`h-1.5 ${
                  plan === "BASIC"
                    ? "bg-gray-400"
                    : plan === "PRO"
                      ? "bg-[#1A4A6B]"
                      : "bg-[#8B5E1A]"
                }`}
              />

              <div className="p-5">
                {/* Plan name + price */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-[#7A7060]">
                      Plan
                    </p>
                    <h3 className="text-xl font-bold font-serif text-[#0D0D0D] mt-0.5">
                      {PLAN_LABELS[plan]}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0D0D0D]">
                      {PLAN_PRICES[plan]}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {PLAN_FEATURES[plan].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-[#7A7060]"
                    >
                      <span className="text-[#2D7A4F] shrink-0 mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="text-center py-2.5 rounded-xl border border-[#1A4A6B] text-sm font-medium text-[#1A4A6B] font-mono text-xs uppercase tracking-wider">
                    Mevcut Plan
                  </div>
                ) : isUpgrade ? (
                  <Button
                    onClick={() => upgradeMutation.mutate(plan)}
                    disabled={upgradeMutation.isPending}
                    className="w-full bg-[#1A4A6B] text-white hover:bg-[#1A4A6B]/80"
                  >
                    {upgradeMutation.isPending
                      ? "İşleniyor..."
                      : `${PLAN_LABELS[plan]}'a Geç`}
                  </Button>
                ) : (
                  <div className="text-center py-2.5 rounded-xl bg-gray-50 text-xs text-[#7A7060] font-mono">
                    Mevcut plandan düşük
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
