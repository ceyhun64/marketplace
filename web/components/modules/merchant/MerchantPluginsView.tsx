"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Puzzle, Check, DollarSign, Zap, Package, Lock } from "lucide-react";
import { useMySubscription } from "@/queries/useSubscription";
import { PLAN_LABELS, type PlanType } from "@/types/enums";

interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthlyPrice: number;
  category: string;
  isSubscribed: boolean;
  isActive: boolean;
  isFeatured: boolean;
  minimumPlan: PlanType;
  createdAt: string;
}

const PLAN_ORDER: Record<PlanType, number> = { BASIC: 0, PRO: 1, ENTERPRISE: 2 };

const CATEGORY_COLORS: Record<string, string> = {
  analytics: "bg-(--info-bg) text-(--info)",
  marketing: "bg-(--red-muted) text-(--red)",
  fulfillment: "bg-(--warning-bg) text-(--warning)",
  payment: "bg-(--success-bg) text-(--success)",
  inventory: "bg-(--off-white-2) text-(--charcoal-mid)",
  crm: "bg-(--warning-bg) text-(--warning)",
};

export default function MerchantPluginsView() {
  const qc = useQueryClient();

  const { data: subscription } = useMySubscription();
  const currentPlan: PlanType = subscription?.planType ?? "BASIC";

  const { data: plugins, isLoading } = useQuery<Plugin[]>({
    queryKey: ["merchant-plugins"],
    queryFn: async () => {
      const res = await api.get("/api/plugins/available");
      // Backend returns ApiResponse<List<PluginDto>>
      const body = res.data;
      return Array.isArray(body) ? body : (body?.data ?? []);
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: (pluginId: string) =>
      api.post(`/api/plugins/${pluginId}/subscribe`),
    onSuccess: () => {
      toast.success("Plugin activated successfully");
      qc.invalidateQueries({ queryKey: ["merchant-plugins"] });
    },
    onError: () => toast.error("Failed to activate plugin"),
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (pluginId: string) =>
      api.delete(`/api/plugins/${pluginId}/subscribe`),
    onSuccess: () => {
      toast.success("Plugin deactivated");
      qc.invalidateQueries({ queryKey: ["merchant-plugins"] });
    },
    onError: () => toast.error("Failed to deactivate plugin"),
  });

  const activePlugins = (plugins ?? []).filter((p) => p.isSubscribed);
  const availablePlugins = (plugins ?? []).filter((p) => !p.isSubscribed);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">
          Plugin Marketplace
        </h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          Extend your store with powerful add-ons
        </p>
      </div>

      {/* Active Plugins */}
      {activePlugins.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-(--text-secondary) mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-(--success)" />
            Active Plugins ({activePlugins.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlugins.map((p) => (
              <div
                key={p.id}
                className="bg-(--bg-surface) border border-(--success-border) rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-(--success-bg) flex items-center justify-center shrink-0">
                      <Puzzle className="w-5 h-5 text-(--success)" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-(--text-primary)">
                          {p.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[p.category] ?? "bg-(--off-white-2) text-(--text-secondary)"}`}
                        >
                          {p.category}
                        </span>
                      </div>
                      <p className="text-xs text-(--text-secondary) mt-1 line-clamp-2">
                        {p.description}
                      </p>
                      {p.createdAt && (
                        <p className="text-xs text-(--success) mt-1">
                          Active since{" "}
                          {formatDate(p.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-(--success)" />
                      <span className="text-xs font-semibold text-(--success)">
                        Active
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 rounded-lg border-red-200 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        if (
                          typeof window !== "undefined" &&
                          window.confirm(`Deactivate "${p.name}"?`)
                        ) {
                          unsubscribeMutation.mutate(p.id);
                        }
                      }}
                      disabled={unsubscribeMutation.isPending}
                    >
                      Deactivate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Plugins */}
      <div>
        <h2 className="text-sm font-semibold text-(--text-secondary) mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-(--text-tertiary)" />
          Available Plugins
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-(--bg-surface) border border-(--border-light) rounded-2xl p-5"
              >
                <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : availablePlugins.length === 0 ? (
          <div className="bg-(--bg-surface) border border-(--border-light) rounded-2xl p-12 text-center">
            <Puzzle className="w-10 h-10 mx-auto mb-3 text-(--text-tertiary)" />
            <p className="text-sm text-(--text-secondary)">
              You have activated all available plugins!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePlugins.map((p) => {
              const planLocked = PLAN_ORDER[currentPlan] < PLAN_ORDER[p.minimumPlan];
              return (
                <div
                  key={p.id}
                  className="bg-(--bg-surface) border border-(--border-light) rounded-2xl p-5 shadow-sm hover:border-(--border-mid) transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-(--off-white-2) flex items-center justify-center shrink-0">
                      <Puzzle className="w-5 h-5 text-(--text-secondary)" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-(--text-primary)">
                          {p.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[p.category] ?? "bg-(--off-white-2) text-(--text-secondary)"}`}
                        >
                          {p.category}
                        </span>
                        {p.minimumPlan !== "BASIC" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-(--off-white-2) text-(--text-tertiary) flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Requires {PLAN_LABELS[p.minimumPlan]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-(--text-secondary) mt-1 line-clamp-2">
                        {p.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-(--text-tertiary)" />
                          <span className="text-sm font-semibold text-(--text-primary)">
                            {p.monthlyPrice === 0
                              ? "Free"
                              : `$${p.monthlyPrice}/mo`}
                          </span>
                        </div>
                        {planLocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl text-xs h-7 gap-1 border-(--border-mid) text-(--text-secondary)"
                            onClick={() =>
                              (window.location.href = "/merchant/subscription")
                            }
                          >
                            <Lock className="w-3 h-3" />
                            Upgrade to {PLAN_LABELS[p.minimumPlan]}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-xl text-xs h-7 gap-1 text-white"
                            style={{ background: "var(--red)" }}
                            onClick={() => subscribeMutation.mutate(p.id)}
                            disabled={subscribeMutation.isPending}
                            onMouseEnter={(e) =>
                              ((e.currentTarget as HTMLElement).style.background =
                                "var(--red-dark)")
                            }
                            onMouseLeave={(e) =>
                              ((e.currentTarget as HTMLElement).style.background =
                                "var(--red)")
                            }
                          >
                            <Zap className="w-3 h-3" />
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan upsell banner */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "var(--charcoal)", color: "#fff" }}
      >
        <Lock
          className="w-8 h-8 shrink-0"
          style={{ color: "rgba(255,255,255,0.35)" }}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold">Need access to more plugins?</p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Upgrade to Pro or Enterprise to unlock the full Plugin Marketplace.
          </p>
        </div>
        <button
          className="rounded-xl text-xs font-semibold px-4 py-2 whitespace-nowrap transition-all text-white"
          style={{ background: "var(--red)" }}
          onClick={() => (window.location.href = "/merchant/subscription")}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--red-dark)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--red)")
          }
        >
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}
