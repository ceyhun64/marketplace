"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
    color: "bg-gray-100 text-gray-700",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    price: "Free",
  },
  PRO: {
    label: "Pro",
    color: "bg-blue-100 text-blue-700",
    icon: <Zap className="w-3.5 h-3.5" />,
    price: "$X/mo",
  },
  ENTERPRISE: {
    label: "Enterprise",
    color: "bg-violet-100 text-violet-700",
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
      return res.data;
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

  const merchants: MerchantSubscription[] = merchantsData?.data || [];

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
        <h1 className="text-2xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and manage merchant subscription plans
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Merchants",
            value: stats.total,
            icon: Users,
            color: "text-gray-600",
            bg: "bg-gray-100",
          },
          {
            label: "Pro Members",
            value: stats.pro,
            icon: Zap,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Enterprise",
            value: stats.enterprise,
            icon: Crown,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Monthly Revenue",
            value: `$${stats.mrr.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {s.label}
              </p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plan Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
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
              className="bg-white rounded-xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <PlanBadge plan={plan} />
                <span className="text-2xl font-bold text-gray-900">
                  {count}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-500 mb-1">
                {cfg.price}
              </p>
              <ul className="space-y-1 mt-3">
                {features.map((f) => (
                  <li
                    key={f}
                    className="text-xs text-gray-600 flex items-center gap-1.5"
                  >
                    <span className="text-emerald-500">✓</span> {f}
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by merchant name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-200"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-44 border-gray-200">
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
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Merchant Subscriptions
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} records)
            </span>
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-100">
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Merchant
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Current Plan
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Start Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                End Date
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
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
                  className="text-center py-16 text-gray-400"
                >
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No merchants found</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((merchant) => (
                <TableRow
                  key={merchant.merchantId}
                  className="hover:bg-gray-50 border-b border-gray-50"
                >
                  <TableCell>
                    <p className="text-sm font-medium text-gray-900">
                      {merchant.merchantName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {merchant.merchantEmail}
                    </p>
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={merchant.plan} />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium ${merchant.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : merchant.status === "CANCELLED" ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-600"}`}
                    >
                      {merchant.status === "ACTIVE"
                        ? "Active"
                        : merchant.status === "CANCELLED"
                          ? "Cancelled"
                          : "Expired"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {merchant.startDate
                      ? new Date(merchant.startDate).toLocaleDateString("en-US")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {merchant.endDate
                      ? new Date(merchant.endDate).toLocaleDateString("en-US")
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
                      <SelectTrigger className="w-32 h-7 text-xs border-gray-200">
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
