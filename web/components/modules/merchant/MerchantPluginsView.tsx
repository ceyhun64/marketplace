"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Puzzle,
  Check,
  DollarSign,
  Zap,
  Package,
  Lock,
} from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  monthlyPrice: number;
  category: string;
  isSubscribed: boolean;
  subscribedAt: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  analytics: "bg-blue-50 text-blue-600",
  marketing: "bg-pink-50 text-pink-600",
  fulfillment: "bg-orange-50 text-orange-600",
  payment: "bg-green-50 text-green-600",
  inventory: "bg-purple-50 text-purple-600",
  crm: "bg-yellow-50 text-yellow-600",
};

export default function MerchantPluginsView() {
  const qc = useQueryClient();

  const { data: plugins, isLoading } = useQuery<Plugin[]>({
    queryKey: ["merchant-plugins"],
    queryFn: async () => {
      const res = await api.get("/plugins/available");
      return res.data;
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: (pluginId: string) =>
      api.post(`/plugins/${pluginId}/subscribe`),
    onSuccess: () => {
      toast.success("Plugin activated successfully");
      qc.invalidateQueries({ queryKey: ["merchant-plugins"] });
    },
    onError: () => toast.error("Failed to activate plugin"),
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (pluginId: string) =>
      api.delete(`/plugins/${pluginId}/subscribe`),
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
        <h1 className="text-2xl font-semibold text-gray-900">
          Plugin Marketplace
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Extend your store with powerful add-ons
        </p>
      </div>

      {/* Active Plugins */}
      {activePlugins.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-green-500" />
            Active Plugins ({activePlugins.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlugins.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-green-200 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Puzzle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {p.name}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[p.category] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {p.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {p.description}
                      </p>
                      {p.subscribedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Active since{" "}
                          {new Date(p.subscribedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-semibold text-green-600">
                        Active
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 rounded-lg border-red-200 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        if (
                          confirm(`Deactivate "${p.name}"?`)
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
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" />
          Available Plugins
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-5"
              >
                <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : availablePlugins.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
            <Puzzle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">
              You have activated all available plugins!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePlugins.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-gray-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Puzzle className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {p.name}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[p.category] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {p.monthlyPrice === 0
                            ? "Free"
                            : `$${p.monthlyPrice}/mo`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-xl text-xs h-7 bg-gray-900 hover:bg-gray-800 gap-1"
                        onClick={() => subscribeMutation.mutate(p.id)}
                        disabled={subscribeMutation.isPending}
                      >
                        <Zap className="w-3 h-3" />
                        Activate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan upsell banner */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 flex items-center gap-4">
        <Lock className="w-8 h-8 text-gray-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            Need access to more plugins?
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Upgrade to Pro or Enterprise to unlock the full Plugin Marketplace.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-gray-600 text-white hover:bg-gray-800 whitespace-nowrap"
          onClick={() => (window.location.href = "/merchant/subscription")}
        >
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
}
