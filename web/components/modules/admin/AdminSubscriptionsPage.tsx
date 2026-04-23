"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CreditCard,
  Users,
  TrendingUp,
  Search,
  ShieldCheck,
  ShieldX,
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
    price: "Ücretsiz",
  },
  PRO: {
    label: "Pro",
    color: "bg-blue-100 text-blue-700",
    icon: <Zap className="w-3.5 h-3.5" />,
    price: "$X/ay",
  },
  ENTERPRISE: {
    label: "Enterprise",
    color: "bg-purple-100 text-purple-700",
    icon: <Crown className="w-3.5 h-3.5" />,
    price: "Özel",
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

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", planFilter],
    queryFn: async () => {
      const res = await api.get("/api/subscriptions/plans");
      return res.data;
    },
  });

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
      toast.success("Plan güncellendi");
      queryClient.invalidateQueries({
        queryKey: ["admin-merchants-subscriptions"],
      });
    },
    onError: () => toast.error("Plan güncellenemedi"),
  });

  const merchants: MerchantSubscription[] = merchantsData?.data || [];
  const plans = data?.data || [];

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonelik Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Merchant abonelik planlarını görüntüle ve yönet
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Merchant",
            value: stats.total,
            icon: Users,
            color: "text-gray-600",
            bg: "bg-gray-50",
          },
          {
            label: "Pro Üyeler",
            value: stats.pro,
            icon: Zap,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Enterprise",
            value: stats.enterprise,
            icon: Crown,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Aylık Gelir",
            value: `$${stats.mrr.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            plan: "BASIC" as PlanType,
            features: [
              "E-mağaza (/store/slug)",
              "50 ürün limiti",
              "Temel analitik",
            ],
            count: merchants.filter((m) => m.plan === "BASIC").length,
          },
          {
            plan: "PRO" as PlanType,
            features: [
              "Marketplace publish",
              "Sınırsız ürün",
              "Subdomain desteği",
              "Plugin marketplace",
              "Gelişmiş analitik",
            ],
            count: merchants.filter((m) => m.plan === "PRO").length,
          },
          {
            plan: "ENTERPRISE" as PlanType,
            features: [
              "Özel domain",
              "Öncelikli destek",
              "Özel raporlar",
              "Tüm Pro özellikleri",
            ],
            count: merchants.filter((m) => m.plan === "ENTERPRISE").length,
          },
        ].map(({ plan, features, count }) => {
          const cfg = PLAN_CONFIG[plan];
          return (
            <Card key={plan} className="border-0 shadow-sm">
              <CardContent className="p-5">
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
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Merchant adı veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Plan filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Planlar</SelectItem>
            <SelectItem value="BASIC">Basic</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Merchants Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Merchant Abonelikleri
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered.length} kayıt)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs">Merchant</TableHead>
                  <TableHead className="text-xs">Mevcut Plan</TableHead>
                  <TableHead className="text-xs">Durum</TableHead>
                  <TableHead className="text-xs">Başlangıç</TableHead>
                  <TableHead className="text-xs">Bitiş</TableHead>
                  <TableHead className="text-xs text-right">
                    Plan Değiştir
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
                      className="text-center py-12 text-gray-400"
                    >
                      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Merchant bulunamadı</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((merchant) => (
                    <TableRow
                      key={merchant.merchantId}
                      className="hover:bg-gray-50/50"
                    >
                      <TableCell>
                        <p className="text-sm font-medium">
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
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            merchant.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : merchant.status === "CANCELLED"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {merchant.status === "ACTIVE"
                            ? "Aktif"
                            : merchant.status === "CANCELLED"
                              ? "İptal"
                              : "Süresi Doldu"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {merchant.startDate
                          ? new Date(merchant.startDate).toLocaleDateString(
                              "tr-TR",
                            )
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {merchant.endDate
                          ? new Date(merchant.endDate).toLocaleDateString(
                              "tr-TR",
                            )
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
                          <SelectTrigger className="w-32 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BASIC">Basic</SelectItem>
                            <SelectItem value="PRO">Pro</SelectItem>
                            <SelectItem value="ENTERPRISE">
                              Enterprise
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
