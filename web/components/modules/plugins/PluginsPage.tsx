"use client";

import Link from "next/link";
import { Puzzle, ArrowRight, Star, Zap, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Plugin } from "@/types/entities";

function usePublicPlugins() {
  return useQuery({
    queryKey: ["plugins", "public"],
    queryFn: async () => {
      const { data } = await api.get<Plugin[]>("/api/plugins");
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

const PLUGIN_CATEGORIES = [
  "All",
  "Analytics",
  "Marketing",
  "Shipping",
  "Payments",
  "Inventory",
];

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  BASIC: { bg: "rgba(51,51,51,0.08)", text: "var(--charcoal-soft)" },
  PRO: { bg: "rgba(59,130,246,0.1)", text: "#2563eb" },
  ENTERPRISE: { bg: "rgba(139,92,246,0.1)", text: "#7c3aed" },
};

function PluginSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-black/5">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-3/4 mb-6" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

export default function PluginsPage() {
  const { data: plugins, isLoading, isError } = usePublicPlugins();

  const featured = plugins?.filter((p) => p.isFeatured) ?? [];
  const rest = plugins?.filter((p) => !p.isFeatured) ?? [];

  return (
    <main className="min-h-screen" style={{ background: "var(--off-white)" }}>
      {/* Hero */}
      <div className="bg-[var(--charcoal)] py-14 px-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 border-[20px] border-[var(--red)]/10 rounded-full pointer-events-none" />
        <div className="max-w-325 mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Puzzle className="w-4 h-4 text-[var(--red)]" />
            <span className="font-mono text-[10px] uppercase tracking-[3px] text-[var(--charcoal-soft)]">
              Extend Your Store
            </span>
          </div>
          <h1
            className="text-[var(--off-white)] text-[36px] lg:text-[48px] leading-tight mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Plugin <span className="text-[var(--red)]">Marketplace</span>
          </h1>
          <p className="text-[var(--charcoal-soft)] text-[15px] mb-8 max-w-xl">
            Power up your store with integrations for analytics, marketing,
            shipping, and more.
          </p>
          <Link
            href="/auth/apply-merchant"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "var(--red)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#a00d24")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--red)")
            }
          >
            Become a Seller to Access Plugins
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-325 mx-auto px-4 lg:px-8 py-12">
        {/* Featured plugins */}
        {(isLoading || featured.length > 0) && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Featured Plugins
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <PluginSkeleton key={i} />
                  ))
                : featured.map((plugin) => (
                    <PluginCard key={plugin.id} plugin={plugin} />
                  ))}
            </div>
          </div>
        )}

        {/* All plugins */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--red)" }}
            />
            <span
              className="font-mono text-[11px] tracking-[0.18em] uppercase"
              style={{ color: "var(--charcoal-soft)" }}
            >
              All Plugins
            </span>
          </div>

          {isError && (
            <div className="text-center py-16">
              <Puzzle
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "rgba(51,51,51,0.15)" }}
              />
              <p className="text-[var(--charcoal-soft)]">
                Could not load plugins. Please try again.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <PluginSkeleton key={i} />
                ))
              : rest.map((plugin) => (
                  <PluginCard key={plugin.id} plugin={plugin} />
                ))}
          </div>

          {!isLoading && !isError && plugins?.length === 0 && (
            <div className="text-center py-16">
              <Puzzle
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "rgba(51,51,51,0.15)" }}
              />
              <p className="text-[var(--charcoal-soft)]">
                No plugins available yet. Check back soon.
              </p>
            </div>
          )}
        </div>

        {/* CTA — Become a seller */}
        <div
          className="mt-16 rounded-3xl p-10 text-center relative overflow-hidden"
          style={{ background: "var(--charcoal)" }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 border-[30px] border-white/5 rounded-full pointer-events-none" />
          <Zap
            className="w-10 h-10 mx-auto mb-4"
            style={{ color: "var(--red)" }}
          />
          <h2
            className="text-white font-normal text-3xl mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to <em style={{ color: "var(--red)" }}>supercharge</em> your
            store?
          </h2>
          <p className="text-[var(--charcoal-soft)] mb-6 max-w-md mx-auto text-sm">
            Plugins are available to all registered merchants. Apply today and
            start selling in minutes.
          </p>
          <Link
            href="/auth/apply-merchant"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-[2px] text-white transition-all"
            style={{ background: "var(--red)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#a00d24")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--red)")
            }
          >
            Apply as a Seller
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function PluginCard({ plugin }: { plugin: Plugin }) {
  const planColor = PLAN_COLORS[plugin.minimumPlan] ?? PLAN_COLORS.BASIC;
  return (
    <div
      className="bg-white rounded-2xl p-6 flex flex-col transition-all duration-200"
      style={{
        border: "1px solid rgba(51,51,51,0.08)",
        boxShadow: "0 1px 4px rgba(51,51,51,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 8px 32px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(200,16,46,0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 1px 4px rgba(51,51,51,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(51,51,51,0.08)";
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: "var(--off-white)" }}
        >
          {plugin.iconUrl ? (
            <img
              src={plugin.iconUrl}
              alt={plugin.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Puzzle
              className="w-6 h-6"
              style={{ color: "var(--charcoal-soft)" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-bold text-[var(--charcoal)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {plugin.name}
            </h3>
            {plugin.isFeatured && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold text-white"
                style={{ background: "var(--red)" }}
              >
                <Star className="w-2.5 h-2.5" /> Featured
              </span>
            )}
          </div>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full font-mono text-[9px] font-bold"
            style={{ background: planColor.bg, color: planColor.text }}
          >
            <Lock className="w-2.5 h-2.5 inline mr-0.5" />
            {plugin.minimumPlan} plan
          </span>
        </div>
      </div>

      <p className="text-[0.8125rem] leading-relaxed text-[var(--charcoal-soft)] flex-1 mb-4">
        {plugin.description}
      </p>

      <div
        className="flex items-center justify-between mt-auto pt-4"
        style={{ borderTop: "1px solid rgba(51,51,51,0.06)" }}
      >
        <div>
          <span
            className="text-xl font-bold text-[var(--charcoal)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            ${plugin.monthlyPrice.toFixed(2)}
          </span>
          <span className="font-mono text-[10px] text-[var(--charcoal-soft)] ml-1">
            /mo
          </span>
        </div>
        <Link
          href="/merchant/plugins"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "var(--charcoal)", color: "#fff" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "var(--red)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "var(--charcoal)")
          }
        >
          Install <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
