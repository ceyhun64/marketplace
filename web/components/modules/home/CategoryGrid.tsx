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
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  icon: React.ReactNode;
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    productCount: 4200,
    icon: <Cpu className="w-5 h-5" />,
  },
  {
    id: "2",
    name: "Fashion",
    slug: "fashion",
    productCount: 8900,
    icon: <Shirt className="w-5 h-5" />,
  },
  {
    id: "3",
    name: "Home & Living",
    slug: "home-living",
    productCount: 3100,
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "4",
    name: "Quick Grocery",
    slug: "grocery",
    productCount: 1500,
    icon: <ShoppingBasket className="w-5 h-5" />,
  },
  {
    id: "5",
    name: "Cosmetics",
    slug: "cosmetics",
    productCount: 3800,
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "6",
    name: "Gaming & Hobbies",
    slug: "gaming",
    productCount: 1900,
    icon: <Gamepad2 className="w-5 h-5" />,
  },
  {
    id: "7",
    name: "Baby & Kids",
    slug: "baby",
    productCount: 2700,
    icon: <Baby className="w-5 h-5" />,
  },
  {
    id: "8",
    name: "Logistics",
    slug: "logistics",
    productCount: 120,
    icon: <Truck className="w-5 h-5" />,
  },
];

export default function CategoryGrid({ categories = MOCK_CATEGORIES }) {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-px bg-red-600"
                style={{ background: "#c8102e" }}
              />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#6b6b6b]">
                Categories
              </span>
            </div>
            <h2
              className="font-serif text-[2.2rem] lg:text-[2.75rem] font-normal leading-[1.1] tracking-[-0.01em] text-[#333333]"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Explore our <em style={{ color: "#c8102e" }}>ecosystem.</em>
            </h2>
          </div>
          <Link
            href="/categories"
            className="flex items-center gap-2 text-sm font-semibold text-[#333333] hover:text-[#c8102e] transition-colors group"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Browse all categories
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, index) => (
            <CategoryCard key={cat.id} category={cat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative bg-white border border-[rgba(51,51,51,0.08)] rounded-2xl p-8 block overflow-hidden
        transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[rgba(200,16,46,0.2)]"
      style={{ boxShadow: "0 1px 3px rgba(51,51,51,0.06)" }}
    >
      {/* Red top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
        style={{ background: "#c8102e" }}
      />

      <div className="flex justify-between items-start mb-10">
        <div
          className="w-11 h-11 rounded-[10px] flex items-center justify-center"
          style={{ background: "rgba(200,16,46,0.08)", color: "#c8102e" }}
        >
          {category.icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-[#c8102e] opacity-40 group-hover:opacity-100 transition-opacity" />
      </div>

      <div>
        <h3
          className="font-bold text-[#333333] text-[1.0625rem] mb-1 leading-tight tracking-[-0.01em]"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {category.name}
        </h3>
        <p className="font-mono text-[11px] text-[#6b6b6b] uppercase tracking-[0.08em]">
          {category.productCount.toLocaleString("en-US")} items
        </p>
      </div>

      {/* Decorative index number */}
      <div
        className="absolute bottom-5 right-6 text-[3.5rem] font-light leading-none select-none pointer-events-none"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          color: "rgba(51,51,51,0.04)",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
    </Link>
  );
}
