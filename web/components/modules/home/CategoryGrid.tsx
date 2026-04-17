import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  icon: string;
  color: string;
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Elektronik",
    slug: "elektronik",
    productCount: 4200,
    icon: "⚡",
    color: "#1A4A6B",
  },
  {
    id: "2",
    name: "Moda & Giyim",
    slug: "moda",
    productCount: 8900,
    icon: "👗",
    color: "#C84B2F",
  },
  {
    id: "3",
    name: "Ev & Yaşam",
    slug: "ev-yasam",
    productCount: 3100,
    icon: "🏠",
    color: "#2D7A4F",
  },
  {
    id: "4",
    name: "Spor & Outdoor",
    slug: "spor",
    productCount: 2400,
    icon: "🏃",
    color: "#8B5E1A",
  },
  {
    id: "5",
    name: "Kitap & Kırtasiye",
    slug: "kitap",
    productCount: 5600,
    icon: "📚",
    color: "#1A4A6B",
  },
  {
    id: "6",
    name: "Kozmetik & Bakım",
    slug: "kozmetik",
    productCount: 3800,
    icon: "✨",
    color: "#C84B2F",
  },
  {
    id: "7",
    name: "Oyun & Hobi",
    slug: "oyun",
    productCount: 1900,
    icon: "🎮",
    color: "#2D7A4F",
  },
  {
    id: "8",
    name: "Bebek & Çocuk",
    slug: "bebek",
    productCount: 2700,
    icon: "🧸",
    color: "#8B5E1A",
  },
];

interface CategoryGridProps {
  categories?: Category[];
}

export default function CategoryGrid({
  categories = MOCK_CATEGORIES,
}: CategoryGridProps) {
  return (
    <section className="py-16 lg:py-20 bg-[#F5F2EB]">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-[2px] bg-[#0D0D0D]" />
              <span className="font-mono text-[10px] uppercase tracking-[3px] text-[#7A7060]">
                Kategoriler
              </span>
            </div>
            <h2 className="text-[#0D0D0D] text-[28px] lg:text-[36px] leading-tight font-serif">
              Ne arıyorsun?
            </h2>
          </div>
          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-[#7A7060] hover:text-[#C84B2F] transition-colors pb-1 border-b border-transparent hover:border-[#C84B2F]"
          >
            Tümünü gör
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 lg:gap-4">
          {categories.map((cat, index) => (
            <CategoryCard key={cat.id} category={cat} index={index} />
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[2px] text-[#7A7060] hover:text-[#C84B2F] transition-colors border-b border-[#0D0D0D]/20 pb-1"
          >
            Tüm kategoriler
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
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
      className="group relative bg-white border border-[#0D0D0D]/10 rounded-sm overflow-hidden hover:border-[#0D0D0D]/30 hover:shadow-[4px_4px_0_0_#0D0D0D08] transition-all duration-200"
    >
      <div
        className="h-[3px] w-full transition-all duration-300 group-hover:h-[4px]"
        style={{ backgroundColor: category.color }}
      />
      <div className="p-5">
        <div
          className="w-12 h-12 rounded-sm flex items-center justify-center text-2xl mb-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: `${category.color}12` }}
        >
          {category.icon}
        </div>
        <h3 className="font-semibold text-[#0D0D0D] text-[14px] mb-1 group-hover:text-[#C84B2F] transition-colors leading-snug">
          {category.name}
        </h3>
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#7A7060]">
          {category.productCount.toLocaleString("tr-TR")} ürün
        </div>
      </div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={category.color}
          strokeWidth="2.5"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
      <div
        className="absolute bottom-3 right-4 font-mono text-[32px] font-bold leading-none opacity-[0.04] select-none pointer-events-none"
        style={{ color: category.color }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
    </Link>
  );
}
