"use client";

import { useState } from "react";
import { formatDate, formatPrice } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useMySubscription,
  useUpgradePlan,
  useCancelSubscription,
  useSubscriptionPlans,
} from "@/queries/useSubscription";
import { CheckCircle, XCircle, Zap, Building2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PLAN_LABELS, type PlanType } from "@/types/enums";

const FAQ_ITEMS = [
  {
    q: "Does a plan upgrade take effect immediately?",
    a: "Yes, the plan change is applied immediately after payment is confirmed.",
  },
  {
    q: "What happens to my products if I downgrade?",
    a: `If you downgrade to ${PLAN_LABELS.BASIC} and exceed the 50-product limit, you won't be able to add new products, but your existing products are kept.`,
  },
  {
    q: "How does the Marketplace publishing feature work?",
    a: "On Pro and higher plans, use the 'Publish to Marketplace' toggle on the product page to list your products on the general marketplace.",
  },
];

const PLANS = [
  {
    key: "BASIC" as PlanType,
    label: PLAN_LABELS.BASIC,
    icon: Star,
    color: "text-(--text-secondary)",
    bg: "bg-(--bg-sunken)",
    activeBorder: "border-(--charcoal)",
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
    label: PLAN_LABELS.PRO,
    icon: Zap,
    color: "text-(--info)",
    bg: "bg-(--info-bg)",
    activeBorder: "border-(--info)",
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
    label: PLAN_LABELS.ENTERPRISE,
    icon: Building2,
    color: "text-(--charcoal-mid)",
    bg: "bg-(--off-white-2)",
    activeBorder: "border-(--border-strong)",
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
  const { data: plans } = useSubscriptionPlans();
  const upgradePlan = useUpgradePlan();
  const cancelSubscription = useCancelSubscription();

  const [confirmDowngradeTo, setConfirmDowngradeTo] = useState<PlanType | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const currentPlan: PlanType = subscription?.planType ?? "BASIC";

  const planPrice = (key: PlanType): string => {
    const def = plans?.find((p) => p.planType === key);
    if (!def) return "—";
    return def.monthlyPrice === 0 ? "Free" : `${formatPrice(def.monthlyPrice)}/mo`;
  };

  const handleUpgrade = async (plan: PlanType) => {
    if (plan === currentPlan) return;
    try {
      await upgradePlan.mutateAsync(plan);
      toast.success(`Plan upgraded to ${PLAN_LABELS[plan]}`);
    } catch {
      toast.error("Upgrade failed. Please try again.");
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync();
      toast.success("Subscription cancelled.");
      setConfirmCancel(false);
    } catch {
      toast.error("Failed to cancel subscription. Please try again.");
    }
  };

  const currentPlanDef = PLANS.find((p) => p.key === currentPlan);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          My Subscription
        </h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          View and manage your current plan
        </p>
      </div>

      {/* Current Plan Banner */}
      {isLoading ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : (
        <Card
          className="border shadow-none rounded-2xl text-white"
          style={{
            background: "var(--charcoal)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <CardContent className="py-5 px-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-(--text-tertiary) uppercase tracking-widest">
                Current Plan
              </p>
              <p className="text-xl font-bold mt-0.5">{PLAN_LABELS[currentPlan]}</p>
              {subscription?.expiresAt && (
                <p className="text-xs text-(--text-tertiary) mt-1">
                  {subscription.isActive ? "Renews" : "Expires"}:{" "}
                  {formatDate(subscription.expiresAt)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                {currentPlanDef ? planPrice(currentPlanDef.key) : "—"}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                  subscription?.isActive
                    ? "bg-(--success)/20 text-(--success)"
                    : "bg-(--bg-surface)/10 text-white"
                }`}
              >
                {subscription?.isActive ? "Active" : "Inactive"}
              </span>
              {subscription?.isActive && currentPlan !== "BASIC" && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="block mt-2 text-xs text-(--text-tertiary) hover:text-white underline underline-offset-2 transition-colors"
                >
                  Cancel subscription
                </button>
              )}
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

          const activeBorderStyle = isActive
            ? { borderColor: "var(--red)" }
            : {};

          return (
            <Card
              key={plan.key}
              className={`border-2 shadow-none rounded-2xl ${
                isActive ? "" : "border-(--border-light)"
              }`}
              style={activeBorderStyle}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${plan.bg}`}>
                      <Icon className={`w-4 h-4 ${plan.color}`} />
                    </div>
                    <CardTitle className="text-base font-bold text-(--text-primary)">
                      {plan.label}
                    </CardTitle>
                  </div>
                  {isActive && (
                    <span
                      className="text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap"
                      style={{ background: "var(--red)" }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-(--text-primary)">{planPrice(plan.key)}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2">
                      {f.ok ? (
                        <CheckCircle className="w-3.5 h-3.5 text-(--success) shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-(--text-tertiary) shrink-0" />
                      )}
                      <span
                        className={`text-xs ${f.ok ? "text-(--text-secondary)" : "text-(--text-tertiary)"}`}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.key === "ENTERPRISE" ? (
                  <button
                    className="w-full mt-2 px-4 py-2 rounded-lg text-xs font-semibold border border-(--border-mid) text-(--text-secondary) hover:bg-(--bg-sunken) transition-colors"
                    onClick={() =>
                      toast.info("Contact us for Enterprise pricing")
                    }
                  >
                    Contact Sales
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      isDowngrade
                        ? setConfirmDowngradeTo(plan.key)
                        : handleUpgrade(plan.key)
                    }
                    disabled={isActive || upgradePlan.isPending}
                    className={`w-full mt-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-(--off-white-2) text-(--text-tertiary) cursor-default"
                        : isDowngrade
                          ? "border border-(--border-mid) text-(--text-secondary) hover:bg-(--bg-sunken)"
                          : "text-white"
                    }`}
                    style={
                      !isActive && !isDowngrade
                        ? { background: "var(--red)" }
                        : {}
                    }
                    onMouseEnter={(e) => {
                      if (!isActive && !isDowngrade)
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--red-dark)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive && !isDowngrade)
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--red)";
                    }}
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
      <Card className="border border-(--border-light) shadow-none rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-(--text-primary)">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.q}
              className="border-b border-(--border-light) pb-4 last:border-0 last:pb-0"
            >
              <p className="text-sm font-semibold text-(--text-primary)">{item.q}</p>
              <p className="text-sm text-(--text-secondary) mt-1">{item.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Downgrade confirmation */}
      <AlertDialog
        open={!!confirmDowngradeTo}
        onOpenChange={(o) => !o && setConfirmDowngradeTo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Downgrade to {PLANS.find((p) => p.key === confirmDowngradeTo)?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This takes effect immediately. You&apos;ll lose access to{" "}
              {currentPlanDef?.label} features such as marketplace publishing,
              the plugin marketplace, and custom domains, and your product
              limit will be reduced. Existing products beyond the new limit
              are kept but you won&apos;t be able to add new ones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Current Plan</AlertDialogCancel>
            <AlertDialogAction
              disabled={upgradePlan.isPending}
              onClick={async () => {
                if (confirmDowngradeTo) await handleUpgrade(confirmDowngradeTo);
                setConfirmDowngradeTo(null);
              }}
              className="gap-2"
            >
              {upgradePlan.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Confirm Downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel subscription confirmation */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              {subscription?.expiresAt
                ? `Your ${PLAN_LABELS[currentPlan]} plan will stay active until ${formatDate(subscription.expiresAt)}, then it won't renew and your store will revert to the ${PLAN_LABELS.BASIC} plan.`
                : `Your ${PLAN_LABELS[currentPlan]} plan will stop renewing and your store will revert to the ${PLAN_LABELS.BASIC} plan.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelSubscription.isPending}
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {cancelSubscription.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
