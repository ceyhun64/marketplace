"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Search,
  ShoppingBag,
  Store,
  Tag,
  Zap,
  Package,
  Truck,
  Heart,
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  Home,
  Grid3x3,
  BookOpen,
  MessageCircle,
  Settings,
  Loader2,
  X,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useUI } from "@/hooks/use-ui";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/queries/useProducts";
import { useCategories } from "@/queries/useCategories";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/entities";

// -- Sabitler ------------------------------------------------------------------

const RECENT_KEY = "bazr_recent_v2";
const MAX_RECENT = 5;

const QUICK_NAV = [
  { label: "Home",         href: "/",            icon: Home,         hot: false },
  { label: "All Products", href: "/products",    icon: ShoppingBag,  hot: false },
  { label: "All Stores",   href: "/stores",      icon: Store,        hot: false },
  { label: "Categories",   href: "/categories",  icon: Grid3x3,      hot: false },
  { label: "Flash Sale",   href: "/flash-sale",  icon: Zap,          hot: true  },
  { label: "Deals",        href: "/deals",       icon: Tag,          hot: false },
  { label: "Bestsellers",  href: "/bestsellers", icon: TrendingUp,   hot: false },
  { label: "New Arrivals", href: "/new-arrivals",icon: Sparkles,     hot: false },
  { label: "Wishlist",     href: "/wishlist",    icon: Heart,        hot: false },
  { label: "Track Order",  href: "/track",       icon: Truck,        hot: false },
  { label: "Blog",         href: "/blog",        icon: BookOpen,     hot: false },
  { label: "Contact",      href: "/contact",     icon: MessageCircle,hot: false },
] as const;

const ACCOUNT_ITEMS = [
  { label: "My Orders",  href: "/orders",   icon: ClipboardList },
  { label: "My Profile", href: "/profile",  icon: Settings      },
  { label: "My Wishlist",href: "/wishlist", icon: Heart         },
] as const;

const MERCHANT_ITEMS = [
  { label: "Dashboard",   href: "/merchant",           icon: LayoutDashboard },
  { label: "My Products", href: "/merchant/catalogue", icon: Package         },
  { label: "My Orders",   href: "/merchant/orders",    icon: ClipboardList   },
  { label: "Analytics",   href: "/merchant/analytics", icon: TrendingUp      },
] as const;

// -- localStorage helpers ------------------------------------------------------

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); }
  catch { return []; }
}

function saveRecent(query: string) {
  const next = [query, ...loadRecent().filter((q) => q !== query)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function removeRecent(query: string) {
  const next = loadRecent().filter((q) => q !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

// -- Küçük yardımcı bileşenler -------------------------------------------------

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 pt-3 pb-1"
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.625rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--charcoal-mist)",
      }}
    >
      {children}
    </div>
  );
}

// -- Ana bileşen ---------------------------------------------------------------

export default function CommandMenu() {
  const router    = useRouter();
  const pathname  = usePathname();
  const { commandOpen, closeCommand, openCommand } = useUI();
  const { user }  = useAuth();
  const inputRef  = useRef<HTMLInputElement>(null);

  const [search,   setSearch]   = useState("");
  const [recent,   setRecent]   = useState<string[]>([]);
  const [mounted,  setMounted]  = useState(false);

  // Route değişince dialog'u her zaman kapat — tek kesin çözüm.
  // closeCommand() herhangi bir nedenle çağrılamamış olsa bile
  // bu effect sayfa geçişlerinde overlay'in kalmasını engeller.
  useEffect(() => {
    closeCommand();
    setSearch("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const hasQuery   = search.trim().length >= 1;
  const queryReady = search.trim().length >= 2;
  const isMerchant = user?.role === "Merchant";

  // Recentları client tarafında yükle (SSR/hydration uyuşmazlığını önle)
  useEffect(() => {
    setMounted(true);
    setRecent(loadRecent());
  }, []);

  // Açıldığında input'u odakla
  useEffect(() => {
    if (commandOpen) {
      setRecent(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [commandOpen]);

  // -- Veri -----------------------------------------------------------------
  const { data: productData, isFetching: productsLoading } = useProducts({
    search: queryReady ? search.trim() : undefined,
    limit: 5,
  });
  const { data: categories } = useCategories();

  const products = (productData?.items ?? []).slice(0, 5);
  const topCats  = (categories ?? []).filter((c) => !c.parentId).slice(0, 6);

  // -- Global kısayol --------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCommand]);

  // -- Navigasyon ------------------------------------------------------------
  const navigate = useCallback(
    (href: string, query?: string) => {
      if (query) saveRecent(query);
      router.push(href);
      closeCommand();
      setSearch("");
    },
    [router, closeCommand],
  );

  const handleSearchSubmit = useCallback(() => {
    const q = search.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`, q);
  }, [search, navigate]);

  const handleOpenChange = (open: boolean) => {
    if (!open) { closeCommand(); setSearch(""); }
  };

  const clearSearch = () => { setSearch(""); inputRef.current?.focus(); };

  // -- Render ----------------------------------------------------------------
  return (
    <Dialog open={commandOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] translate-y-0 p-0 overflow-hidden gap-0"
        style={{
          maxWidth: "min(640px, 94vw)",
          width: "100%",
          borderRadius: "1.25rem",
          border: "1px solid var(--border-light)",
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 24px 64px rgba(30,30,30,0.18), 0 4px 16px rgba(30,30,30,0.08)",
        }}
        aria-label="Search"
      >
        {/* Radix, DialogContent içinde bir DialogTitle (primitive) bekler.
            VisuallyHidden olmadan sr-only class yeterli değil — Radix bunu
            DOM üzerinden değil React context üzerinden takip ediyor. */}
        <DialogTitle className="sr-only">Search products and navigate pages</DialogTitle>
        <DialogDescription className="sr-only">
          Search for products, browse categories, or navigate to any page.
        </DialogDescription>

        {/*
         * cmdk'nın Command primitifi doğrudan kullanılıyor:
         * — shadcn CommandInput'un eklediği çift ikon ve InputGroup sarmalayıcısından kaçınır
         * — shouldFilter=false: sonuç görünürlüğünü kendimiz yönetiyoruz
         */}
        <Command
          shouldFilter={false}
          className="flex flex-col overflow-hidden"
          style={{ background: "transparent" }}
        >
          {/* -- Arama çubuğu -- */}
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            {productsLoading && queryReady ? (
              <Loader2
                className="w-4 h-4 shrink-0 animate-spin"
                style={{ color: "var(--charcoal-mist)" }}
              />
            ) : (
              <Search
                className="w-4 h-4 shrink-0"
                style={{ color: hasQuery ? "var(--charcoal)" : "var(--charcoal-mist)" }}
                strokeWidth={2}
              />
            )}

            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Search products, stores, pages…"
              className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
                caretColor: "var(--red)",
              }}
            />

            {hasQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-(--off-white-2)"
                style={{ color: "var(--charcoal-mist)" }}
                aria-label="Aramayı temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0"
                style={{
                  background: "var(--off-white-2)",
                  border: "1px solid var(--border-light)",
                  color: "var(--charcoal-mist)",
                }}
              >
                <span>⌘</span><span>K</span>
              </kbd>
            )}
          </div>

          {/* -- Sonuç listesi -- */}
          <Command.List
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: "min(440px, 55vh)" }}
          >
            {/* "X için ara" — sorgu varsa ilk öğe olarak */}
            {hasQuery && (
              <Command.Group>
                <Command.Item
                  value={`@@search:${search}`}
                  onSelect={handleSearchSubmit}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl mx-1.5 cursor-pointer transition-colors data-[selected=true]:bg-(--off-white-2)"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--charcoal)" }}
                  >
                    <Search className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="flex-1 text-sm min-w-0" style={{ fontFamily: "var(--font-body)" }}>
                    <span style={{ color: "var(--charcoal-soft)" }}>Search for </span>
                    <span className="font-bold" style={{ color: "var(--charcoal)" }}>
                      &ldquo;{search}&rdquo;
                    </span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--charcoal-mist)" }} />
                </Command.Item>
              </Command.Group>
            )}

            {/* -- Ürün sonuçları (API) -- */}
            {queryReady && (
              <>
                {products.length > 0 && (
                  <>
                    <GroupLabel>Products</GroupLabel>
                    <Command.Group>
                      {products.map((p: Product) => (
                        <Command.Item
                          key={p.id}
                          value={`@@product:${p.id}`}
                          onSelect={() => navigate(`/product/${p.id}`)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl mx-1.5 cursor-pointer transition-colors data-[selected=true]:bg-(--off-white-2)"
                        >
                          {/* Ürün görseli */}
                          <div
                            className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                            style={{
                              background: "var(--off-white-2)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4" style={{ color: "var(--charcoal-mist)" }} />
                            )}
                          </div>
                          {/* Bilgi */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold truncate leading-tight"
                              style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                            >
                              {p.name}
                            </p>
                            <p
                              className="text-[11px] truncate mt-0.5"
                              style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}
                            >
                              {p.merchantStoreName ?? "Marketplace"}
                            </p>
                          </div>
                          {/* Fiyat */}
                          <span
                            className="text-sm font-bold shrink-0 tabular-nums"
                            style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                          >
                            {formatPrice(p.price)}
                          </span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  </>
                )}

                {products.length === 0 && !productsLoading && (
                  <div className="py-10 text-center">
                    <Package
                      className="w-9 h-9 mx-auto mb-3"
                      style={{ color: "rgba(51,51,51,0.12)" }}
                      strokeWidth={1.5}
                    />
                    <p className="text-sm font-semibold" style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
                      No products for &ldquo;{search}&rdquo;
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}>
                      Try a different term or press ↵ to search all results
                    </p>
                  </div>
                )}
              </>
            )}

            {/* -- Idle state (sorgu yok) -- */}
            {!hasQuery && (
              <>
                {/* Son aramalar */}
                {mounted && recent.length > 0 && (
                  <>
                    <GroupLabel>Recent Searches</GroupLabel>
                    <Command.Group>
                      {recent.map((q) => (
                        <Command.Item
                          key={`@@recent:${q}`}
                          value={`@@recent:${q}`}
                          onSelect={() => {
                            setSearch(q);
                            setTimeout(() => inputRef.current?.focus(), 0);
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl mx-1.5 cursor-pointer transition-colors data-[selected=true]:bg-(--off-white-2) group"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "var(--off-white-2)" }}
                          >
                            <Clock className="w-3.5 h-3.5" style={{ color: "var(--charcoal-mist)" }} />
                          </div>
                          <span
                            className="flex-1 text-sm truncate"
                            style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}
                          >
                            {q}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecent(q);
                              setRecent(loadRecent());
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-(--off-white-3)"
                            style={{ color: "var(--charcoal-mist)" }}
                            aria-label={`Remove "${q}" from recent`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <div className="mx-3 my-1.5 h-px" style={{ background: "var(--border-subtle)" }} />
                  </>
                )}

                {/* Kategoriler */}
                {topCats.length > 0 && (
                  <>
                    <GroupLabel>Browse Categories</GroupLabel>
                    <Command.Group>
                      {topCats.map((cat) => (
                        <Command.Item
                          key={cat.id}
                          value={`@@cat:${cat.slug}`}
                          onSelect={() => navigate(`/category/${cat.slug}`)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl mx-1.5 cursor-pointer transition-colors data-[selected=true]:bg-(--off-white-2)"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "var(--red-muted)" }}
                          >
                            <Tag className="w-3.5 h-3.5" style={{ color: "var(--red)" }} />
                          </div>
                          <span
                            className="flex-1 text-sm"
                            style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                          >
                            {cat.name}
                          </span>
                          {cat.productCount != null && (
                            <span
                              className="text-[11px] tabular-nums shrink-0"
                              style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}
                            >
                              {cat.productCount}
                            </span>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <div className="mx-3 my-1.5 h-px" style={{ background: "var(--border-subtle)" }} />
                  </>
                )}
              </>
            )}

            {/* -- Hızlı gezinme -- */}
            <>
              <GroupLabel>Quick Navigation</GroupLabel>
              <Command.Group>
                <div className="grid grid-cols-2 gap-0">
                  {(hasQuery ? QUICK_NAV.slice(0, 4) : QUICK_NAV.slice(0, 8)).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.href}
                        value={`@@nav:${item.href}`}
                        onSelect={() => navigate(item.href)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl mx-1.5 cursor-pointer transition-colors data-[selected=true]:bg-(--off-white-2)"
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: "var(--off-white-2)" }}
                        >
                          <Icon
                            className="w-3 h-3"
                            style={{ color: item.hot ? "var(--red)" : "var(--charcoal-soft)" }}
                          />
                        </div>
                        <span
                          className="text-sm truncate"
                          style={{
                            color: item.hot ? "var(--red)" : "var(--charcoal)",
                            fontFamily: "var(--font-body)",
                            fontWeight: item.hot ? 600 : 400,
                          }}
                        >
                          {item.label}
                        </span>
                        {item.hot && (
                          <span
                            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              background: "rgba(200,16,46,0.1)",
                              color: "var(--red)",
                              fontFamily: "var(--font-mono)",
                              letterSpacing: "0.06em",
                            }}
                          >
                            LIVE
                          </span>
                        )}
                      </Command.Item>
                    );
                  })}
                </div>
              </Command.Group>
            </>

            {/* -- Hesap / Merchant kısayolları -- */}
            {user && (
              <>
                <div className="mx-3 my-1.5 h-px" style={{ background: "var(--border-subtle)" }} />
                <GroupLabel>{isMerchant ? "Merchant" : "Account"}</GroupLabel>
                <Command.Group>
                  {(isMerchant ? MERCHANT_ITEMS : ACCOUNT_ITEMS).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.href}
                        value={`@@acct:${item.href}`}
                        onSelect={() => navigate(item.href)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl mx-1.5 cursor-pointer transition-colors data-[selected=true]:bg-(--off-white-2)"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--off-white-2)" }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: "var(--charcoal-soft)" }} />
                        </div>
                        <span
                          className="text-sm"
                          style={{ color: "var(--charcoal)", fontFamily: "var(--font-body)" }}
                        >
                          {item.label}
                        </span>
                        <ArrowUpRight className="ml-auto w-3.5 h-3.5 shrink-0" style={{ color: "var(--charcoal-mist)" }} />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </>
            )}

            {/* cmdk'nın Empty state — hiç item render edilmediğinde gösterilir */}
            <Command.Empty>
              <div className="py-12 flex flex-col items-center gap-2.5">
                <Search className="w-8 h-8" style={{ color: "rgba(51,51,51,0.12)" }} strokeWidth={1.5} />
                <p className="text-sm font-semibold" style={{ color: "var(--charcoal-soft)", fontFamily: "var(--font-body)" }}>
                  No results for &ldquo;{search}&rdquo;
                </p>
                <p className="text-xs" style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-body)" }}>
                  Try a different search term
                </p>
              </div>
            </Command.Empty>
          </Command.List>

          {/* -- Alt kısayol çubuğu -- */}
          <div
            className="flex items-center justify-between px-4 py-2.5 shrink-0"
            style={{
              borderTop: "1px solid var(--border-subtle)",
              background: "var(--off-white)",
            }}
          >
            <div className="flex items-center gap-3">
              {[
                { keys: ["↑", "↓"], label: "navigate" },
                { keys: ["↵"], label: "select" },
                { keys: ["Esc"], label: "close" },
              ].map(({ keys, label }) => (
                <div key={label} className="flex items-center gap-1">
                  {keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{
                        background: "#fff",
                        border: "1px solid var(--border-light)",
                        color: "var(--charcoal-mist)",
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                  <span className="text-[10px]" style={{ color: "var(--charcoal-mist)", fontFamily: "var(--font-mono)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                style={{
                  background: "#fff",
                  border: "1px solid var(--border-light)",
                  color: "var(--charcoal-mist)",
                }}
              >
                ⌘K
              </kbd>
              <span className="text-[9px]" style={{ color: "var(--charcoal-mist)" }}>/</span>
              <kbd
                className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                style={{
                  background: "#fff",
                  border: "1px solid var(--border-light)",
                  color: "var(--charcoal-mist)",
                }}
              >
                Ctrl+K
              </kbd>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
