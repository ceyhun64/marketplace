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
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  icon: React.ReactNode;
  color: string;
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    productCount: 4200,
    icon: <Cpu className="w-6 h-6" />,
    color: "#1A4A6B",
  },
  {
    id: "2",
    name: "Fashion & Clothing",
    slug: "fashion",
    productCount: 8900,
    icon: <Shirt className="w-6 h-6" />,
    color: "#C84B2F",
  },
  {
    id: "3",
    name: "Home & Living",
    slug: "home-living",
    productCount: 3100,
    icon: <Home className="w-6 h-6" />,
    color: "#2D7A4F",
  },
  {
    id: "4",
    name: "Quick Grocery",
    slug: "grocery",
    productCount: 1500,
    icon: <ShoppingBasket className="w-6 h-6" />,
    color: "#EAB308",
  },
  {
    id: "5",
    name: "Cosmetics",
    slug: "cosmetics",
    productCount: 3800,
    icon: <Sparkles className="w-6 h-6" />,
    color: "#D946EF",
  },
  {
    id: "6",
    name: "Gaming & Hobbies",
    slug: "gaming",
    productCount: 1900,
    icon: <Gamepad2 className="w-6 h-6" />,
    color: "#6366F1",
  },
  {
    id: "7",
    name: "Baby & Kids",
    slug: "baby",
    productCount: 2700,
    icon: <Baby className="w-6 h-6" />,
    color: "#F97316",
  },
  {
    id: "8",
    name: "Courier / Logistics",
    slug: "logistics",
    productCount: 120,
    icon: <Truck className="w-6 h-6" />,
    color: "#0D0D0D",
  },
];

export default function CategoryGrid({ categories = MOCK_CATEGORIES }) {
  return (
    <section className="py-16 lg:py-24 bg-[#F5F2EB]">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#C84B2F]" />
              <span className="font-mono text-[10px] uppercase tracking-[4px] text-[#7A7060] font-bold">
                Explore the Ecosystem
              </span>
            </div>
            <h2 className="text-[#0D0D0D] text-4xl lg:text-5xl font-serif font-bold tracking-tight">
              What are you looking for?
            </h2>
          </div>
          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#0D0D0D] hover:text-[#C84B2F] transition-all group"
          >
            All Categories
            <div className="w-8 h-8 rounded-full border border-black/5 flex items-center justify-center group-hover:bg-[#C84B2F] group-hover:text-white transition-all">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      className="group relative bg-white/60 backdrop-blur-sm border border-black/[0.03] rounded-[32px] p-8 transition-all duration-500 hover:bg-white hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 overflow-hidden"
    >
      {/* Icon Container */}
      <div
        className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm"
        style={{
          backgroundColor: `${category.color}10`,
          color: category.color,
        }}
      >
        {category.icon}
        <div
          className="absolute inset-0 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full"
          style={{ backgroundColor: category.color }}
        />
      </div>

      <div className="relative z-10">
        <h3 className="font-bold text-[#0D0D0D] text-xl mb-2 group-hover:text-[#C84B2F] transition-colors">
          {category.name}
        </h3>
        <p className="text-[#7A7060] text-sm font-medium opacity-80">
          {category.productCount.toLocaleString("en-US")} Products Listed
        </p>
      </div>

      {/* Arrow */}
      <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: category.color }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
      </div>

      {/* Background number decoration */}
      <div
        className="absolute -bottom-4 -right-2 font-serif text-[80px] font-bold leading-none opacity-[0.02] group-hover:opacity-[0.05] transition-opacity select-none pointer-events-none italic"
        style={{ color: category.color }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
    </Link>
  );
}
