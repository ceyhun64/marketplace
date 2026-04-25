"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMySubscription, useUpgradePlan } from "@/queries/useSubscription";
import { CheckCircle, XCircle, Zap, Building2, Star } from "lucide-react";
import { toast } from "sonner";
import type { PlanType } from "@/types/enums";

// Subscription entity:
//   id, merchantId, plan (PlanType), isActive, startDate, endDate?, price

const FAQ_ITEMS = [
  {
    q: "Does a plan upgrade take effect immediately?",
    a: "Yes, the plan change is applied immediately after payment is confirmed.",
  },
  {
    q: "What happens to my products if I downgrade?",
    a: "If you downgrade to Basic and exceed the 50-product limit, you won't be able to add new products, but your existing products are kept.",
  },
  {
    q: "How does the Marketplace publishing feature work?",
    a: "On Pro and higher plans, use the 'Publish to Marketplace' toggle on the product page to list your products on the general marketplace.",
  },
];

const PLANS = [
  {
    key: "BASIC" as PlanType,
    label: "Basic",
    price: "Free",
    icon: Star,
    color: "text-gray-600",
    bg: "bg-gray-50",
    activeBorder: "border-gray-900",
    features: [
      { label: "Independent E-Store", ok: true },
      { label: "Up to 50 products", ok: true },
      { label: "Publish to Marketplace", ok: false },
      { label: "Custom subdomain", ok: false },
      { label: "Custom domain", ok: false },
      { label: "Plugin Marketplace", ok: false },
      { label: "Advanced analytics", ok: false },
    ],
  },
  {
    key: "PRO" as PlanType,
    label: "Pro",
    price: "$29/mo",
    icon: Zap,
    color: "text-blue-600",
    bg: "bg-blue-50",
    activeBorder: "border-blue-600",
    features: [
      { label: "Independent E-Store", ok: true },
      { label: "Unlimited products", ok: true },
      { label: "Publish to Marketplace", ok: true },
      { label: "Custom subdomain", ok: true },
      { label: "Custom domain", ok: false },
      { label: "Plugin Marketplace", ok: true },
      { label: "Advanced analytics", ok: true },
    ],
  },
  {
    key: "ENTERPRISE" as PlanType,
    label: "Enterprise",
    price: "Custom",
    icon: Building2,
    color: "text-violet-600",
    bg: "bg-violet-50",
    activeBorder: "border-violet-600",
    features: [
      { label: "Independent E-Store", ok: true },
      { label: "Unlimited products", ok: true },
      { label: "Publish to Marketplace", ok: true },
      { label: "Custom subdomain", ok: true },
      { label: "Custom domain", ok: true },
      { label: "Plugin Marketplace", ok: true },
      { label: "Advanced analytics + custom reports", ok: true },
    ],
  },
];

export default function MerchantSubscriptionView() {
  const { data: subscription, isLoading } = useMySubscription();
  const upgradePlan = useUpgradePlan();

  // Subscription.plan is PlanType enum; fall back to BASIC if not loaded
  const currentPlan: PlanType = subscription?.plan ?? "BASIC";

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === currentPlan) return;
    try {
      await upgradePlan.mutateAsync(plan);
      toast.success(`Plan upgraded to ${plan}`);
    } catch {
      toast.error("Upgrade failed. Please try again.");
    }
  };

  const currentPlanDef = PLANS.find((p) => p.key === currentPlan);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          My Subscription
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage your current plan
        </p>
      </div>

      {/* Current Plan Banner */}
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : (
        <Card className="border border-gray-100 shadow-none rounded-2xl bg-gray-900 text-white">
          <CardContent className="py-5 px-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Current Plan
              </p>
              <p className="text-xl font-bold mt-0.5">{currentPlan}</p>
              {/* Subscription uses endDate, not expiresAt */}
              {subscription?.endDate && (
                <p className="text-xs text-gray-400 mt-1">
                  Renews:{" "}
                  {new Date(subscription.endDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {currentPlanDef?.price ?? "—"}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                  subscription?.isActive
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-white/10 text-white"
                }`}
              >
                {subscription?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isActive = currentPlan === plan.key;
          const planOrder = PLANS.findIndex((p) => p.key === plan.key);
          const currentOrder = PLANS.findIndex((p) => p.key === currentPlan);
          const isDowngrade = currentOrder > planOrder;

          return (
            <Card
              key={plan.key}
              className={`border-2 shadow-none rounded-2xl relative ${
                isActive ? plan.activeBorder : "border-gray-100"
              }`}
            >
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Current
                  </span>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${plan.bg}`}>
                    <Icon className={`w-4 h-4 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900">
                    {plan.label}
                  </CardTitle>
                </div>
                <p className="text-2xl font-bold text-gray-900">{plan.price}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2">
                      {f.ok ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      )}
                      <span
                        className={`text-xs ${f.ok ? "text-gray-700" : "text-gray-400"}`}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.key === "ENTERPRISE" ? (
                  <button
                    className="w-full mt-2 px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() =>
                      toast.info("Contact us for Enterprise pricing")
                    }
                  >
                    Contact Sales
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={isActive || upgradePlan.isPending}
                    className={`w-full mt-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-400 cursor-default"
                        : isDowngrade
                          ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          : "bg-gray-900 text-white hover:bg-gray-700"
                    }`}
                  >
                    {isActive
                      ? "Current Plan"
                      : isDowngrade
                        ? "Downgrade"
                        : upgradePlan.isPending
                          ? "Processing..."
                          : "Upgrade"}
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* FAQ */}
      <Card className="border border-gray-100 shadow-none rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FAQ_ITEMS.map((item) => (
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
