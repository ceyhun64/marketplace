"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProductCard } from "@/components/modules/store/ProductCard";
import type { Product } from "@/types/entities";

// Sabit mock UUID'ler — gerçek UUID formatında olduğu için WishlistButton
// API isteği yapmaz (backend'de bu ID'ler yoktur ama 500 hatası da vermez,
// çünkü WishlistButton artık sadece user giriş yapmışsa istek atar).
// API'den gerçek ürünler geldiğinde mock veriler zaten kullanılmaz.
const MOCK_PRODUCTS: Product[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "TechStore TR",
    merchantSlug: "techstore-tr",
    name: "Wireless Bluetooth Headphones Pro",
    description: "",
    categoryId: "",
    categoryName: "Electronics",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80"],
    tags: [],
    price: 899,
    stock: 45,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "Natural Wear",
    merchantSlug: "natural-wear",
    name: "Organic Cotton Athletic Set",
    description: "",
    categoryId: "",
    categoryName: "Fashion",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80"],
    tags: [],
    price: 249,
    stock: 120,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "Home Decor Plus",
    merchantSlug: "home-decor-plus",
    name: "Ceramic Coffee Cup Set",
    description: "",
    categoryId: "",
    categoryName: "Home & Living",
    images: ["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80"],
    tags: ["sale"],
    price: 349,
    stock: 28,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "SportLife",
    merchantSlug: "sportlife",
    name: "Professional Yoga Mat 6mm",
    description: "",
    categoryId: "",
    categoryName: "Sports",
    images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&q=80"],
    tags: [],
    price: 599,
    stock: 67,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "PC World",
    merchantSlug: "pc-world",
    name: "Mechanical Keyboard RGB Backlit",
    description: "",
    categoryId: "",
    categoryName: "Electronics",
    images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80"],
    tags: ["sale"],
    price: 1299,
    stock: 15,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "Nature Beauty",
    merchantSlug: "nature-beauty",
    name: "Natural Argan Oil Shampoo",
    description: "",
    categoryId: "",
    categoryName: "Cosmetics",
    images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80"],
    tags: [],
    price: 129,
    stock: 200,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "Toy World",
    merchantSlug: "toy-world",
    name: "Kids Wooden Puzzle Set",
    description: "",
    categoryId: "",
    categoryName: "Gaming & Hobbies",
    images: ["https://images.unsplash.com/photo-1596493575896-43e4e6a7b7d5?w=600&q=80"],
    tags: ["sale"],
    price: 189,
    stock: 53,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "Leather Craft",
    merchantSlug: "leather-craft",
    name: "Minimalist Leather Wallet",
    description: "",
    categoryId: "",
    categoryName: "Fashion",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80"],
    tags: [],
    price: 449,
    stock: 38,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
];

const TABS = [
  { value: "featured", label: "Featured" },
  { value: "bestsellers", label: "Best Sellers" },
  { value: "new", label: "New Arrivals" },
  { value: "deals", label: "Deals" },
];

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState("featured");

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["featured-products", activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "8", sort: "newest" });
      const { data } = await api.get(`/api/products?${params}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // API'den gelen ürünleri Product tipine dönüştür
  const apiProducts: Product[] = Array.isArray(apiData?.items)
    ? apiData.items.map(
        (p: any): Product => ({
          id: p.id,
          merchantId: p.merchantId ?? "",
          merchantStoreName: p.merchant?.storeName ?? p.merchantStoreName ?? "",
          merchantSlug: p.merchant?.slug ?? p.merchantSlug ?? "",
          name: p.name,
          description: p.description ?? "",
          categoryId: p.categoryId ?? "",
          categoryName: p.category?.name ?? p.categoryName ?? "",
          images: p.images ?? [],
          tags: p.tags ?? [],
          price: p.price,
          stock: p.stock,
          publishToMarket: p.publishToMarket ?? true,
          publishToStore: p.publishToStore ?? true,
          isApproved: p.isApproved ?? true,
          isDeleted: p.isDeleted ?? false,
          createdAt: p.createdAt ?? "",
          updatedAt: p.updatedAt,
        }),
      )
    : [];

  const products = apiProducts.length > 0 ? apiProducts : MOCK_PRODUCTS;

  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-[1300px] mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-6 h-px"
                style={{ background: "var(--red)" }}
              />
              <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--charcoal-soft)]">
                Curated Selection
              </span>
            </div>
            <h2
              className="text-[2.2rem] lg:text-[2.75rem] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--charcoal)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              What will you <em style={{ color: "var(--red)" }}>discover</em>{" "}
              today?
            </h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--charcoal)] hover:text-[var(--red)] transition-colors group"
            style={{ fontFamily: "var(--font-body)" }}
          >
            All Products
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-8 mb-10 border-b"
          style={{ borderColor: "rgba(51,51,51,0.08)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="relative pb-4 text-sm font-semibold transition-colors duration-200"
              style={{
                fontFamily: "var(--font-body)",
                color:
                  activeTab === tab.value
                    ? "var(--charcoal)"
                    : "var(--charcoal-soft)",
                background: "none",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: "var(--red)" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Products grid — tek ProductCard bileşeni kullanılır */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-gray-100 animate-pulse aspect-[3/4]"
                />
              ))
            : products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  context="marketplace"
                />
              ))}
        </div>

        {/* View All CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 border font-semibold text-sm transition-all duration-250 rounded-lg"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: "rgba(51,51,51,0.15)",
              color: "var(--charcoal)",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--red)";
              el.style.borderColor = "var(--red)";
              el.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "transparent";
              el.style.borderColor = "rgba(51,51,51,0.15)";
              el.style.color = "var(--charcoal)";
            }}
          >
            Explore Full Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
