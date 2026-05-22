"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Percent,
  CreditCard,
  RefreshCw,
  Save,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Crown,
  Zap,
  Info,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommissionSettings {
  marketplaceFeePercent: number;
  paymentProcessingFeePercent: number;
  paymentProcessingFlatFee: number;
  subscriptionBasicMonthly: number;
  subscriptionProMonthly: number;
  subscriptionEnterpriseMonthly: number;
  refundFeePercent: number;
  currencyCode: string;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SettingRow({
  label,
  hint,
  value,
  onChange,
  suffix,
  prefix,
  readOnly = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange?: (v: string) => void;
  suffix?: string;
  prefix?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-(--text-primary)">{label}</p>
        {hint && (
          <p className="text-xs text-(--text-tertiary) mt-0.5">{hint}</p>
        )}
      </div>
      <div className="w-40 shrink-0">
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-(--text-tertiary) select-none pointer-events-none">
              {prefix}
            </span>
          )}
          <Input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={readOnly}
            className={`text-right text-sm h-9 border-(--border-mid) bg-(--bg-surface) focus:ring-1 focus:ring-(--charcoal)/20 focus:border-(--charcoal) ${prefix ? "pl-6" : ""} ${suffix ? "pr-7" : ""}`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--text-tertiary) select-none pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-(--border-light) bg-(--bg-sunken)/50">
        <div className="p-2 rounded-lg bg-(--off-white-2)">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-(--text-primary)">
            {title}
          </h3>
          <p className="text-xs text-(--text-tertiary)">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 divide-y divide-(--border-subtle)">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
          {label}
        </p>
        <div className="p-1.5 rounded-lg bg-(--off-white-2)">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-(--text-primary)">{value}</p>
      {sub && <p className="text-xs text-(--text-tertiary) mt-1">{sub}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminCommissionPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<CommissionSettings>({
    queryKey: ["admin-commission-settings"],
    queryFn: async () => {
      const res = await api.get("/api/admin/settings/commission");
      return res.data as CommissionSettings;
    },
  });

  // Local editable state — initialised from server data
  const [draft, setDraft] = useState<Partial<CommissionSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  const set = (key: keyof CommissionSettings, raw: string) => {
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      setDraft((prev) => ({ ...prev, [key]: num }));
      setIsDirty(true);
    }
  };

  const getValue = (key: keyof CommissionSettings): string => {
    const v = draft[key] ?? data?.[key];
    return v != null ? String(v) : "";
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/api/admin/settings/commission", draft);
      return data;
    },
    onSuccess: () => {
      toast.success("Commission settings saved", {
        description: "Changes are active immediately and will persist until overridden.",
      });
      setIsDirty(false);
      setDraft({});
      queryClient.invalidateQueries({ queryKey: ["admin-commission-settings"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save settings. Please try again.";
      toast.error(msg);
    },
  });

  // Derived metrics
  const effectiveMktFee = parseFloat(getValue("marketplaceFeePercent")) || 0;
  const effectiveProcFee =
    parseFloat(getValue("paymentProcessingFeePercent")) || 0;
  const effectiveFlat = parseFloat(getValue("paymentProcessingFlatFee")) || 0;
  const blendedFeeOnOrder100 =
    (100 * effectiveMktFee) / 100 +
    (100 * effectiveProcFee) / 100 +
    effectiveFlat;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary)">
            Commission & Fee Settings
          </h1>
          <p className="text-sm text-(--text-tertiary) mt-1">
            Platform-wide rate configuration — marketplace fees, payment
            processing, and subscription pricing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2 border-(--border-mid) text-(--text-secondary)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {isDirty && (
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2 bg-(--charcoal) hover:bg-(--charcoal-2) text-white"
            >
              <Save className="w-3.5 h-3.5" />
              {saveMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Alert — note about restart */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-(--border-mid) bg-(--bg-sunken)/60">
        <Info className="w-4 h-4 text-(--text-tertiary) mt-0.5 shrink-0" />
        <p className="text-xs text-(--text-secondary) leading-relaxed">
          Changes are saved to the live configuration store and take effect
          immediately — no restart required. Base defaults come from
          appsettings.json; values set here override those defaults.
        </p>
      </div>

      {/* Summary metrics */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
            >
              <Skeleton className="h-3 w-28 mb-3" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Marketplace Fee"
            value={`${effectiveMktFee}%`}
            sub="per completed order"
            icon={<Percent className="w-4 h-4 text-(--info)" />}
          />
          <StatCard
            label="Payment Processing"
            value={`${effectiveProcFee}% + ${data?.currencyCode ?? "TRY"} ${effectiveFlat.toFixed(2)}`}
            sub="per transaction"
            icon={<CreditCard className="w-4 h-4 text-(--warning)" />}
          />
          <StatCard
            label="Blended Fee ($100 order)"
            value={`${data?.currencyCode ?? "TRY"} ${blendedFeeOnOrder100.toFixed(2)}`}
            sub="marketplace + processing"
            icon={<TrendingUp className="w-4 h-4 text-(--success)" />}
          />
          <StatCard
            label="Currency"
            value={data?.currencyCode ?? "TRY"}
            sub="platform base currency"
            icon={<DollarSign className="w-4 h-4 text-(--text-tertiary)" />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketplace Fees */}
        <SectionCard
          icon={<Percent className="w-4 h-4 text-(--info)" />}
          title="Marketplace Fees"
          subtitle="Applied to every completed marketplace order"
        >
          {isLoading ? (
            <div className="py-4 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <SettingRow
                label="Marketplace Commission Rate"
                hint="Percentage deducted from each successfully paid order"
                value={getValue("marketplaceFeePercent")}
                onChange={(v) => set("marketplaceFeePercent", v)}
                suffix="%"
              />
              <SettingRow
                label="Refund Fee"
                hint="Additional fee applied on full or partial refunds"
                value={getValue("refundFeePercent")}
                onChange={(v) => set("refundFeePercent", v)}
                suffix="%"
              />
            </>
          )}
        </SectionCard>

        {/* Payment Processing */}
        <SectionCard
          icon={<CreditCard className="w-4 h-4 text-(--warning)" />}
          title="Payment Processing"
          subtitle="Stripe pass-through fees per transaction"
        >
          {isLoading ? (
            <div className="py-4 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <SettingRow
                label="Processing Fee (Percent)"
                hint="Stripe percentage component"
                value={getValue("paymentProcessingFeePercent")}
                onChange={(v) => set("paymentProcessingFeePercent", v)}
                suffix="%"
              />
              <SettingRow
                label="Processing Fee (Flat)"
                hint="Stripe flat per-transaction charge"
                value={getValue("paymentProcessingFlatFee")}
                onChange={(v) => set("paymentProcessingFlatFee", v)}
                prefix={data?.currencyCode ?? "$"}
              />
            </>
          )}
        </SectionCard>

        {/* Subscription Pricing */}
        <SectionCard
          icon={<ShieldCheck className="w-4 h-4 text-(--success)" />}
          title="Subscription Pricing"
          subtitle="Monthly plan prices charged to merchants"
        >
          {isLoading ? (
            <div className="py-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-9 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <SettingRow
                label="Basic Plan"
                hint="Free tier — e-store access only"
                value={getValue("subscriptionBasicMonthly")}
                onChange={(v) => set("subscriptionBasicMonthly", v)}
                prefix={data?.currencyCode ?? "$"}
                suffix="/mo"
              />
              <SettingRow
                label="Pro Plan"
                hint="Marketplace listing + plugins"
                value={getValue("subscriptionProMonthly")}
                onChange={(v) => set("subscriptionProMonthly", v)}
                prefix={data?.currencyCode ?? "$"}
                suffix="/mo"
              />
              <SettingRow
                label="Enterprise Plan"
                hint="Custom domain + priority support + SLA"
                value={getValue("subscriptionEnterpriseMonthly")}
                onChange={(v) => set("subscriptionEnterpriseMonthly", v)}
                prefix={data?.currencyCode ?? "$"}
                suffix="/mo"
              />
            </>
          )}
        </SectionCard>

        {/* Plan Feature Reference */}
        <SectionCard
          icon={<Crown className="w-4 h-4 text-(--text-tertiary)" />}
          title="Plan Feature Summary"
          subtitle="Read-only reference — edit in SubscriptionService"
        >
          <div className="py-4 space-y-5">
            {[
              {
                name: "Basic",
                icon: (
                  <ShieldCheck className="w-3.5 h-3.5 text-(--text-tertiary)" />
                ),
                features: [
                  "E-store page (/store/slug)",
                  "20 product limit",
                  "Basic analytics",
                ],
                highlight: false,
              },
              {
                name: "Pro",
                icon: <Zap className="w-3.5 h-3.5 text-(--info)" />,
                features: [
                  "Marketplace listing",
                  "500 products",
                  "Plugin access",
                  "Custom subdomain",
                ],
                highlight: true,
              },
              {
                name: "Enterprise",
                icon: <Crown className="w-3.5 h-3.5 text-(--warning)" />,
                features: [
                  "Unlimited products",
                  "Custom domain",
                  "Priority support",
                  "SLA guarantee",
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  {plan.icon}
                  <span className="text-xs font-semibold text-(--text-secondary)">
                    {plan.name}
                  </span>
                </div>
                <ul className="space-y-0.5 pl-5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="text-xs text-(--text-tertiary) list-disc"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
                <Separator className="mt-4 bg-(--border-subtle)" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Last updated */}
      {data?.updatedAt && (
        <p className="text-xs text-(--text-tertiary) text-right">
          Config snapshot taken:{" "}
          {new Date(data.updatedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
    </div>
  );
}
