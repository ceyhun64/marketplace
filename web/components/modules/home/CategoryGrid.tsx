"use client";

import Link from "next/link";
import {
  Cpu,
  Shirt,
  Home,
  Gamepad2,
  Baby,
  Sparkles,
  Truck,
  ShoppingBasket,
  BookOpen,
  Dumbbell,
  ArrowRight,
  ArrowUpRight,
  Tag,
} from "lucide-react";
import { useCategories } from "@/queries/useCategories";
import type { Category } from "@/types/entities";

// Slug'a göre ikon eşlemesi — API'den gelen kategorilerle uyumlu
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  elektronik: <Cpu className="w-5 h-5" />,
  giyim: <Shirt className="w-5 h-5" />,
  "ev-yasam": <Home className="w-5 h-5" />,
  spor: <Dumbbell className="w-5 h-5" />,
  kitap: <BookOpen className="w-5 h-5" />,
  kozmetik: <Sparkles className="w-5 h-5" />,
  oyuncak: <Gamepad2 className="w-5 h-5" />,
  grocery: <ShoppingBasket className="w-5 h-5" />,
  baby: <Baby className="w-5 h-5" />,
  logistics: <Truck className="w-5 h-5" />,
};

function getIcon(slug: string): React.ReactNode {
  return CATEGORY_ICONS[slug] ?? <Tag className="w-5 h-5" />;
}

export default function CategoryGrid() {
  const { data, isLoading } = useCategories();

  // Yalnızca üst düzey kategorileri göster (parentId olmayan)
  const categories: Category[] = Array.isArray(data)
    ? data.filter((c: Category) => !c.parentId)
    : [];

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-px bg-red-600"
                style={{ background: "var(--red)" }}
              />
              <span
                className="font-mono text-[11px] tracking-[0.18em] uppercase"
                style={{ color: "var(--charcoal-soft)" }}
              >
                Categories
              </span>
            </div>
            <h2
              className="font-heading text-[2.2rem] lg:text-[2.75rem] font-normal leading-[1.1] tracking-[-0.01em]"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--charcoal)",
              }}
            >
              Explore our <em style={{ color: "var(--red)" }}>ecosystem.</em>
            </h2>
          </div>
          <Link
            href="/categories"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors group"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Browse all categories
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-gray-100 animate-pulse h-44"
                />
              ))
            : categories.map((cat, index) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  index={index}
                  icon={getIcon(cat.slug)}
                />
              ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  index,
  icon,
}: {
  category: Category;
  index: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative bg-white border border-[rgba(51,51,51,0.08)] rounded-2xl p-8 block overflow-hidden
        transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[rgba(200,16,46,0.2)]"
      style={{ boxShadow: "0 1px 3px rgba(51,51,51,0.06)" }}
    >
      {/* Red top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: "var(--red)" }}
      />

      <div className="flex justify-between items-start mb-10">
        <div
          className="w-11 h-11 rounded-[10px] flex items-center justify-center"
          style={{ background: "var(--red-muted)", color: "var(--red)" }}
        >
          {icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-[var(--red)] opacity-40 group-hover:opacity-100 transition-opacity" />
      </div>

      <div>
        <h3
          className="font-bold text-[var(--charcoal)] text-[1.0625rem] mb-1 leading-tight tracking-[-0.01em]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {category.name}
        </h3>
        {category.productCount != null && (
          <p className="font-mono text-[11px] text-[var(--charcoal-soft)] uppercase tracking-[0.08em]">
            {category.productCount.toLocaleString("en-US")} items
          </p>
        )}
      </div>

      {/* Decorative index number */}
      <div
        className="absolute bottom-5 right-6 text-[3.5rem] font-light leading-none select-none pointer-events-none"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--border-light)",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
    </Link>
  );
}
