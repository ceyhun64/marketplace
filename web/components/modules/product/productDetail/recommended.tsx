"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import { ProductCard } from "@/components/modules/store/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axiosApi from "@/lib/api";
import type { Product } from "@/types/entities";

const MOCK_PRODUCTS: Product[] = [
  {
    id: "00000000-0000-0000-0001-000000000001",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "SpeedStore",
    merchantSlug: "speedstore",
    name: "Adidas Ultraboost 24",
    description: "",
    categoryId: "",
    categoryName: "Ayakkabı",
    images: ["https://placehold.co/400x400?text=Adidas+Ultraboost"],
    tags: [],
    price: 4299,
    stock: 30,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0001-000000000002",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "RunTech",
    merchantSlug: "runtech",
    name: "Nike Air Zoom Pegasus",
    description: "",
    categoryId: "",
    categoryName: "Ayakkabı",
    images: ["https://placehold.co/400x400?text=Nike+Pegasus"],
    tags: [],
    price: 3799,
    stock: 15,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0001-000000000003",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "ActiveWear",
    merchantSlug: "activewear",
    name: "Under Armour HOVR Phantom",
    description: "",
    categoryId: "",
    categoryName: "Ayakkabı",
    images: ["https://placehold.co/400x400?text=UA+HOVR"],
    tags: [],
    price: 3599,
    stock: 22,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
  {
    id: "00000000-0000-0000-0001-000000000004",
    merchantId: "00000000-0000-0000-0000-000000000000",
    merchantStoreName: "SportMax",
    merchantSlug: "sportmax",
    name: "New Balance Fresh Foam X",
    description: "",
    categoryId: "",
    categoryName: "Ayakkabı",
    images: ["https://placehold.co/400x400?text=New+Balance"],
    tags: [],
    price: 2999,
    stock: 40,
    publishToMarket: true,
    publishToStore: true,
    isApproved: true,
    isDeleted: false,
    createdAt: "",
  },
];

const CarouselSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="aspect-[3/4] w-full bg-slate-200/60 rounded-xl" />
        <Skeleton className="h-4 w-2/3 bg-slate-200/60" />
      </div>
    ))}
  </div>
);

export default function ÖnerilenÜrünlerCarousel() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrent(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    onSelect();
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, onSelect]);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["recommended-products"],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "8", sort: "newest" });
      const { data } = await axiosApi.get(`/api/products?${params}`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const products: Product[] =
    apiData?.items?.length > 0 ? apiData.items : MOCK_PRODUCTS;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20">
        <CarouselSkeleton />
      </div>
    );
  }

  return (
    <section className="bg-slate-50 py-8 md:py-16 border-t border-slate-100 overflow-hidden max-w-[1400px] mx-auto px-6">
      <div className="container">
        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-8 md:mb-14 gap-4">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-2"
            >
              <Activity className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-orange-600">
                Performans Serisi
              </span>
            </motion.div>
            <h2 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 leading-none uppercase">
              ÖNERİLEN
              <br />
              <span className="text-orange-600">ÜRÜNLER</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => carouselApi?.scrollPrev()}
              className="group rounded-sm flex items-center justify-center w-9 h-9 md:w-11 md:h-11 border border-slate-200 bg-white hover:bg-slate-950 transition-all duration-300 active:scale-95"
              aria-label="Geri"
            >
              <ChevronLeft
                className="text-slate-900 group-hover:text-white transition-colors"
                size={18}
              />
            </button>
            <button
              onClick={() => carouselApi?.scrollNext()}
              className="group rounded-sm flex items-center justify-center w-9 h-9 md:w-11 md:h-11 border border-slate-200 bg-white hover:bg-slate-950 transition-all duration-300 active:scale-95"
              aria-label="İleri"
            >
              <ChevronRight
                className="text-slate-900 group-hover:text-white transition-colors"
                size={18}
              />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              dragFree: true,
            }}
            setApi={setCarouselApi}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <div className="h-full py-2">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Progress Bar & Counter */}
          <div className="mt-10 md:mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200 pt-8">
            <div className="flex items-center gap-6 w-full sm:w-auto">
              <div className="flex flex-col min-w-[60px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Aşama
                </span>
                <div className="text-xl font-mono font-bold text-slate-950 flex items-baseline">
                  <span>0{current + 1}</span>
                  <span className="text-slate-300 mx-2 text-sm">/</span>
                  <span className="text-slate-400 text-sm">
                    0{products.length}
                  </span>
                </div>
              </div>

              <div className="relative h-[2px] flex-1 sm:w-48 bg-slate-200 overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    width: `${((current + 1) / products.length) * 100}%`,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 h-full bg-orange-600"
                />
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.3em] bg-slate-100 px-4 py-2 rounded-full hidden md:block">
              Saha Testleri Tamamlandı — v.2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
