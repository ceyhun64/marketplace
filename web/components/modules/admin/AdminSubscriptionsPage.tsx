"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  TrendingUp,
  Search,
  ShieldCheck,
  Crown,
  Zap,
  Building2,
} from "lucide-react";

type PlanType = "BASIC" | "PRO" | "ENTERPRISE";

interface MerchantSubscription {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  plan: PlanType;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  startDate: string;
  endDate?: string;
  monthlyRevenue: number;
}

const PLAN_CONFIG: Record<
  PlanType,
  { label: string; color: string; icon: React.ReactNode; price: string }
> = {
  BASIC: {
    label: "Basic",
    color: "bg-(--off-white-2) text-(--text-secondary)",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    price: "Free",
  },
  PRO: {
    label: "Pro",
    color: "bg-(--info-bg) text-(--info)",
    icon: <Zap className="w-3.5 h-3.5" />,
    price: "$X/mo",
  },
  ENTERPRISE: {
    label: "Enterprise",
    color: "bg-(--info-bg) text-(--info)",
    icon: <Crown className="w-3.5 h-3.5" />,
    price: "Custom",
  },
};

function PlanBadge({ plan }: { plan: PlanType }) {
  const cfg = PLAN_CONFIG[plan];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const { data: merchantsData, isLoading: loadingMerchants } = useQuery({
    queryKey: ["admin-merchants-subscriptions"],
    queryFn: async () => {
      const res = await api.get("/api/admin/merchants");
      const raw = res.data;
      const rawItems: any[] = raw?.items ?? (Array.isArray(raw) ? raw : []);
      const items: MerchantSubscription[] = rawItems.map((m: any) => ({
        id: m.id ?? m.merchantId ?? "",
        merchantId: m.id ?? m.merchantId ?? "",
        merchantName: m.storeName ?? m.merchantName ?? "",
        merchantEmail: m.email ?? m.merchantEmail ?? "",
        plan: (!m.plan || String(m.plan).toLowerCase() === "none" ? "BASIC" : String(m.plan).toUpperCase()) as PlanType,
        status: m.isActive ? "ACTIVE" : "CANCELLED",
        startDate: m.subscriptionStartDate ?? m.createdAt ?? "",
        endDate: m.subscriptionEndDate,
        monthlyRevenue: m.monthlyRevenue ?? 0,
      }));
      return { ...raw, items };
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({
      merchantId,
      plan,
    }: {
      merchantId: string;
      plan: PlanType;
    }) => {
      const res = await api.put(`/api/admin/merchants/${merchantId}`, { plan });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Plan updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin-merchants-subscriptions"],
      });
    },
    onError: () => toast.error("Failed to update plan"),
  });

  // Backend GET /api/admin/merchants → { total, page, limit, items: [...] }
  // camelCase dönüşümü interceptor tarafından yapılır, ApiResponse sarmalayıcı YOK → items doğrudan gelir
  const merchants: MerchantSubscription[] = merchantsData?.items || [];

  const filtered = merchants.filter(
    (m) =>
      (planFilter === "all" || m.plan === planFilter) &&
      (m.merchantName?.toLowerCase().includes(search.toLowerCase()) ||
        m.merchantEmail?.toLowerCase().includes(search.toLowerCase())),
  );

  const stats = {
    total: merchants.length,
    pro: merchants.filter((m) => m.plan === "PRO").length,
    enterprise: merchants.filter((m) => m.plan === "ENTERPRISE").length,
    mrr: merchants
      .filter((m) => m.plan !== "BASIC" && m.status === "ACTIVE")
      .reduce((sum, m) => sum + (m.monthlyRevenue || 0), 0),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">Subscriptions</h1>
        <p className="text-sm text-(--text-tertiary) mt-1">
          View and manage merchant subscription plans
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Merchants",
            value: stats.total,
            icon: Users,
            color: "text-(--text-secondary)",
            bg: "bg-(--off-white-2)",
          },
          {
            label: "Pro Members",
            value: stats.pro,
            icon: Zap,
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Enterprise",
            value: stats.enterprise,
            icon: Crown,
            color: "text-(--info)",
            bg: "bg-(--info-bg)",
          },
          {
            label: "Monthly Revenue",
            value: formatCurrency(stats.mrr),
            icon: TrendingUp,
            color: "text-(--success)",
            bg: "bg-(--success-bg)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-(--text-tertiary) font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-(--text-primary)">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            plan: "BASIC" as PlanType,
            features: [
              "E-store (/store/slug)",
              "50 product limit",
              "Basic analytics",
            ],
            count: merchants.filter((m) => m.plan === "BASIC").length,
          },
          {
            plan: "PRO" as PlanType,
            features: [
              "Marketplace listing",
              "Unlimited products",
              "Subdomain support",
              "Plugin marketplace",
              "Advanced analytics",
            ],
            count: merchants.filter((m) => m.plan === "PRO").length,
          },
          {
            plan: "ENTERPRISE" as PlanType,
            features: [
              "Custom domain",
              "Priority support",
              "Custom reports",
              "All Pro features",
            ],
            count: merchants.filter((m) => m.plan === "ENTERPRISE").length,
          },
        ].map(({ plan, features, count }) => {
          const cfg = PLAN_CONFIG[plan];
          return (
            <div
              key={plan}
              className="bg-(--bg-surface) rounded-xl border border-(--border-light) p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <PlanBadge plan={plan} />
                <span className="text-2xl font-bold text-(--text-primary)">
                  {count}
                </span>
              </div>
              <p className="text-xs font-semibold text-(--text-tertiary) mb-1">
                {cfg.price}
              </p>
              <ul className="space-y-1 mt-3">
                {features.map((f) => (
                  <li
                    key={f}
                    className="text-xs text-(--text-secondary) flex items-center gap-1.5"
                  >
                    <span className="text-(--success)">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
          <Input
            placeholder="Search by merchant name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-(--border-mid)"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-44 border-(--border-mid)">
            <SelectValue placeholder="Filter by plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="BASIC">Basic</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Merchants Table */}
      <div className="bg-(--bg-surface) rounded-xl border border-(--border-light) overflow-hidden overflow-x-auto">
        <div className="px-5 py-4 border-b border-(--border-light)">
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Merchant Subscriptions
            <span className="ml-2 text-sm font-normal text-(--text-tertiary)">
              ({filtered.length} records)
            </span>
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-(--bg-sunken) border-b border-(--border-light)">
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Merchant
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Current Plan
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                Start Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide">
                End Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-(--text-tertiary) uppercase tracking-wide text-right">
                Change Plan
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingMerchants ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-16 text-(--text-tertiary)"
                >
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No merchants found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((merchant) => (
                <TableRow
                  key={merchant.merchantId}
                  className="hover:bg-(--bg-sunken) border-b border-(--border-subtle)"
                >
                  <TableCell>
                    <p className="text-sm font-medium text-(--text-primary)">
                      {merchant.merchantName}
                    </p>
                    <p className="text-xs text-(--text-tertiary)">
                      {merchant.merchantEmail}
                    </p>
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={merchant.plan} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${merchant.status === "ACTIVE" ? "bg-(--success-bg) text-(--success)" : merchant.status === "CANCELLED" ? "bg-(--danger-bg) text-(--danger)" : "bg-(--off-white-2) text-(--text-secondary)"}`}
                    >
                      {merchant.status === "ACTIVE"
                        ? "Active"
                        : merchant.status === "CANCELLED"
                          ? "Cancelled"
                          : "Expired"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-(--text-tertiary)">
                    {merchant.startDate
                      ? formatDate(merchant.startDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-(--text-tertiary)">
                    {merchant.endDate
                      ? formatDate(merchant.endDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={merchant.plan}
                      onValueChange={(val) =>
                        changePlanMutation.mutate({
                          merchantId: merchant.merchantId,
                          plan: val as PlanType,
                        })
                      }
                    >
                      <SelectTrigger className="w-32 h-7 text-xs border-(--border-mid)">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
