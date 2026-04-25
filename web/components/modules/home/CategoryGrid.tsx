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
  color: string;
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    productCount: 4200,
    icon: <Cpu className="w-5 h-5" />,
    color: "#3b82f6", // Blue
  },
  {
    id: "2",
    name: "Fashion",
    slug: "fashion",
    productCount: 8900,
    icon: <Shirt className="w-5 h-5" />,
    color: "#ef4444", // Red
  },
  {
    id: "3",
    name: "Home & Living",
    slug: "home-living",
    productCount: 3100,
    icon: <Home className="w-5 h-5" />,
    color: "#10b981", // Emerald
  },
  {
    id: "4",
    name: "Quick Grocery",
    slug: "grocery",
    productCount: 1500,
    icon: <ShoppingBasket className="w-5 h-5" />,
    color: "#f59e0b", // Amber
  },
  {
    id: "5",
    name: "Cosmetics",
    slug: "cosmetics",
    productCount: 3800,
    icon: <Sparkles className="w-5 h-5" />,
    color: "#d946ef", // Fuchsia
  },
  {
    id: "6",
    name: "Gaming & Hobbies",
    slug: "gaming",
    productCount: 1900,
    icon: <Gamepad2 className="w-5 h-5" />,
    color: "#6366f1", // Indigo
  },
  {
    id: "7",
    name: "Baby & Kids",
    slug: "baby",
    productCount: 2700,
    icon: <Baby className="w-5 h-5" />,
    color: "#f97316", // Orange
  },
  {
    id: "8",
    name: "Logistics",
    slug: "logistics",
    productCount: 120,
    icon: <Truck className="w-5 h-5" />,
    color: "#000000", // Black
  },
];

export default function CategoryGrid({ categories = MOCK_CATEGORIES }) {
  return (
    <section className="py-20 lg:py-28 ">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[3px] text-blue-600 font-bold">
                Categories
              </span>
            </div>
            <h2 className="text-black text-3xl lg:text-4xl font-bold tracking-tight">
              Explore our ecosystem.
            </h2>
          </div>
          <Link
            href="/categories"
            className="flex items-center gap-2 text-sm font-bold text-black hover:opacity-70 transition-opacity group"
          >
            Browse all categories
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
      className="group relative bg-white border border-gray-100 rounded-[24px] p-8 transition-all duration-300 hover:border-black hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
    >
      <div className="flex justify-between items-start mb-10">
        {/* Icon Container */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${category.color}08`, // Very subtle background
            color: category.color,
          }}
        >
          {category.icon}
        </div>

        {/* Arrow Up Right */}
        <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-5 h-5 text-black" />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="font-bold text-black text-lg mb-1">
          {category.name}
        </h3>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          {category.productCount.toLocaleString("en-US")} Items
        </p>
      </div>

      {/* Decorative Index Number - Subtle */}
      <div className="absolute bottom-6 right-8 text-4xl font-black text-gray-50 select-none group-hover:text-gray-100/50 transition-colors">
        {String(index + 1).padStart(2, "0")}
      </div>
    </Link>
  );
}