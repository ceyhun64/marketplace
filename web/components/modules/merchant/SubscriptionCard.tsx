"use client";

import { useMySubscription, useUpgradePlan } from "@/queries/useSubscription";
import { PLAN_LABELS, PLAN_COLORS, PLAN_LIMITS } from "@/types/enums";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import type { PlanType } from "@/types/enums";

const PLAN_PRICES: Record<PlanType, string> = {
  BASIC: "Free",
  PRO: "$X / month",
  ENTERPRISE: "Custom Pricing",
};

const PLAN_FEATURES: Record<PlanType, string[]> = {
  BASIC: [
    "Independent E-Store (/store/slug)",
    "Up to 50 products",
    "Basic analytics",
  ],
  PRO: [
    "Unlimited products",
    "Marketplace publishing",
    "Custom subdomain (store.platform.com)",
    "Logo & banner upload",
    "Full analytics & reporting",
    "Plugin marketplace access",
  ],
  ENTERPRISE: [
    "All Pro features",
    "Full custom domain (mystore.com)",
    "Custom reports",
    "Priority support",
    "API access",
  ],
};

const PLAN_ACCENT: Record<PlanType, string> = {
  BASIC: "bg-(--charcoal-mist)",
  PRO: "bg-(--info)",
  ENTERPRISE: "bg-(--warning)",
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
    <div className="space-y-5">
      {/* Current plan badge */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-(--text-secondary)">Your current plan:</p>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_COLORS[currentPlan]}`}
        >
          {PLAN_LABELS[currentPlan]}
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan === currentPlan;
          const isUpgrade = plans.indexOf(plan) > plans.indexOf(currentPlan);

          return (
            <div
              key={plan}
              className={`bg-(--bg-surface) rounded-2xl border overflow-hidden transition-all ${
                isCurrent
                  ? "border-(--red) shadow-md shadow-[rgba(200,16,46,0.1)]"
                  : "border-(--border-light) hover:border-(--border-mid) hover:shadow-sm"
              }`}
            >
              {/* Accent top bar */}
              <div className={`h-1 ${PLAN_ACCENT[plan]}`} />

              <div className="p-5">
                {/* Plan name + price */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium text-(--text-tertiary) uppercase tracking-widest mb-0.5">
                      Plan
                    </p>
                    <h3 className="text-xl font-bold text-(--text-primary)">
                      {PLAN_LABELS[plan]}
                    </h3>
                  </div>
                  <p className="text-sm font-semibold text-(--text-secondary) mt-1">
                    {PLAN_PRICES[plan]}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {PLAN_FEATURES[plan].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-(--text-secondary)"
                    >
                      <Check className="w-3.5 h-3.5 text-(--success) shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="text-center py-2.5 rounded-xl border border-(--info-border) text-xs font-semibold text-(--info) uppercase tracking-wider">
                    Current Plan
                  </div>
                ) : isUpgrade ? (
                  <Button
                    onClick={() => upgradeMutation.mutate(plan)}
                    disabled={upgradeMutation.isPending}
                    className="w-full bg-(--charcoal) text-white hover:bg-(--charcoal-2)"
                  >
                    {upgradeMutation.isPending
                      ? "Processing..."
                      : `Upgrade to ${PLAN_LABELS[plan]}`}
                  </Button>
                ) : (
                  <div className="text-center py-2.5 rounded-xl bg-(--bg-sunken) text-xs text-(--text-tertiary)">
                    Below current plan
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
