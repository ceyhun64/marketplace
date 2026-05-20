"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Fragment } from "react";
import {
  Search,
  ShoppingBag,
  Store,
  Tag,
  Zap,
  Star,
  Package,
  Truck,
  Heart,
  LayoutDashboard,
  ClipboardList,
  Settings,
  BookOpen,
  MessageCircle,
  TrendingUp,
  Home,
  Grid3x3,
  Loader2,
} from "lucide-react";
import { useUI } from "@/hooks/use-ui";
import { useAuth } from "@/hooks/use-auth";
import { useProducts } from "@/queries/useProducts";
import { useCategories } from "@/queries/useCategories";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/entities";

// ── Static data ───────────────────────────────────────────────────────────────

const QUICK_NAV = [
  { label: "Home", href: "/", icon: Home, hot: false },
  { label: "All Products", href: "/products", icon: ShoppingBag, hot: false },
  { label: "All Stores", href: "/stores", icon: Store, hot: false },
  { label: "Categories", href: "/categories", icon: Grid3x3, hot: false },
  { label: "Flash Sale", href: "/flash-sale", icon: Zap, hot: true },
  { label: "Deals", href: "/deals", icon: Tag, hot: false },
  { label: "Bestsellers", href: "/bestsellers", icon: TrendingUp, hot: false },
  { label: "New Arrivals", href: "/new-arrivals", icon: Package, hot: false },
  { label: "Wishlist", href: "/wishlist", icon: Heart, hot: false },
  { label: "Track Order", href: "/track", icon: Truck, hot: false },
  { label: "Blog", href: "/blog", icon: BookOpen, hot: false },
  { label: "Contact", href: "/contact", icon: MessageCircle, hot: false },
] as const;

const ACCOUNT_ITEMS = [
  { label: "My Orders", href: "/orders", icon: ClipboardList },
  { label: "My Profile", href: "/profile", icon: Settings },
  { label: "My Wishlist", href: "/wishlist", icon: Heart },
];

const MERCHANT_ITEMS = [
  { label: "Dashboard", href: "/merchant", icon: LayoutDashboard },
  { label: "My Products", href: "/merchant/catalogue", icon: Package },
  { label: "My Orders", href: "/merchant/orders", icon: ClipboardList },
  { label: "Analytics", href: "/merchant/analytics", icon: TrendingUp },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommandMenu() {
  const router = useRouter();
  const { commandOpen, closeCommand, openCommand } = useUI();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState("");

  const hasQuery = search.trim().length >= 1;
  const queryLong = search.trim().length >= 2; // threshold for API search
  const isMerchant = user?.role === "Merchant";

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: productData, isFetching: productsLoading } = useProducts({
    search: queryLong ? search.trim() : undefined,
    limit: 6,
  });
  const { data: categories } = useCategories();

  const products = (productData?.items ?? []).slice(0, 5);
  const topCats = (categories ?? []).filter((c) => !c.parentId).slice(0, 6);
  const showProducts = queryLong;
  const showCats = !showProducts;

  // ── Global keyboard shortcut ──────────────────────────────────────────────
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

  // ── Navigation helper ─────────────────────────────────────────────────────
  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      closeCommand();
      setSearch("");
      setHighlighted("");
    },
    [router, closeCommand],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeCommand();
      setSearch("");
      setHighlighted("");
    }
  };

  // ── Enter key: fallback when no item is highlighted ───────────────────────
  // Primary path: cmdk fires onSelect on the auto-highlighted "Search for X" item.
  // Fallback: if somehow no item is highlighted and Enter is pressed in the input,
  // we navigate directly (guards against edge-cases like slow renders).
  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    if (!hasQuery) return;

    // Only fire the fallback when no cmdk item is highlighted.
    // If an item IS highlighted, cmdk handles Enter by firing its onSelect.
    if (!highlighted) {
      e.preventDefault();
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <Dialog open={commandOpen} onOpenChange={handleOpenChange}>
      {/* Screen-reader title — required by the Dialog primitive */}
      <DialogHeader className="sr-only">
        <DialogTitle>Command palette</DialogTitle>
        <DialogDescription>
          Search products, navigate pages, or run commands.
        </DialogDescription>
      </DialogHeader>

      <DialogContent
        className="top-[20%] translate-y-0 overflow-hidden p-0 shadow-2xl"
        showCloseButton={false}
        style={{
          borderRadius: "1.5rem",
          maxWidth: "min(640px, 92vw)",
          width: "100%",
          border: "1px solid rgba(51,51,51,0.1)",
          background: "#fff",
        }}
      >
        {/*
         * Command is the cmdk context provider.
         * shouldFilter=false: we manage result visibility ourselves
         * (API-driven product results + conditional group rendering).
         * Letting cmdk filter by default would hide items whose `value`
         * doesn't fuzzy-match the typed query.
         */}
        <Command
          shouldFilter={false}
          value={highlighted}
          onValueChange={setHighlighted}
          onKeyDown={handleCommandKeyDown}
          className="flex flex-col overflow-hidden"
          style={{ background: "transparent" }}
        >
          {/* ── Search input ── */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(51,51,51,0.07)" }}
          >
            <Search
              className="w-4 h-4 shrink-0"
              style={{ color: "var(--charcoal-mist)" }}
              strokeWidth={2}
            />
            <CommandInput
              placeholder="Search products, stores, pages…"
              value={search}
              onValueChange={setSearch}
              className="flex-1 text-sm outline-none bg-transparent border-0 p-0 h-auto focus:ring-0"
              style={{
                color: "var(--charcoal)",
                fontFamily: "var(--font-body)",
              }}
            />
            {productsLoading && queryLong && (
              <Loader2
                className="w-3.5 h-3.5 shrink-0 animate-spin"
                style={{ color: "var(--charcoal-mist)" }}
              />
            )}
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-(--off-white-2) transition-colors"
                style={{ color: "var(--charcoal-mist)" }}
                aria-label="Clear search"
              >
                <span className="text-xs leading-none">✕</span>
              </button>
            )}
          </div>

          {/* ── Results ── */}
          <CommandList
            className="overflow-y-auto"
            style={{ maxHeight: "min(460px, 60vh)" }}
          >
            {/* Empty state — only shown by cmdk when NO CommandItem renders */}
            <CommandEmpty>
              <div className="py-12 text-center space-y-2">
                <Search
                  className="w-8 h-8 mx-auto"
                  style={{ color: "rgba(51,51,51,0.15)" }}
                  strokeWidth={1.5}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--charcoal-soft)" }}
                >
                  No results for &ldquo;{search}&rdquo;
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--charcoal-mist)" }}
                >
                  Try a different term or browse categories below.
                </p>
              </div>
            </CommandEmpty>

            {/* ── PRIMARY: "Search all results for X"
                Always rendered first when there is a query so it receives
                auto-focus → Enter immediately navigates to /search?q=… ── */}
            {hasQuery && (
              <CommandGroup>
                <CommandItem
                  value={`@@search:${search}`}
                  onSelect={() =>
                    navigate(`/search?q=${encodeURIComponent(search.trim())}`)
                  }
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--charcoal)" }}
                  >
                    <Search
                      className="w-3.5 h-3.5 text-white"
                      strokeWidth={2}
                    />
                  </div>
                  <span
                    className="flex-1 text-sm"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <span style={{ color: "var(--charcoal-soft)" }}>
                      Search for{" "}
                    </span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--charcoal)" }}
                    >
                      &ldquo;{search}&rdquo;
                    </span>
                  </span>
                  <CommandShortcut>
                    <kbd
                      className="px-1.5 py-0.5 text-[10px] rounded font-mono"
                      style={{
                        background: "var(--off-white-2)",
                        border: "1px solid rgba(51,51,51,0.12)",
                        color: "var(--charcoal-mist)",
                      }}
                    >
                      ↵
                    </kbd>
                  </CommandShortcut>
                </CommandItem>
              </CommandGroup>
            )}

            {/* ── Product results (API-driven) ── */}
            {showProducts && (
              <CommandGroup
                heading={
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      color: "var(--charcoal-mist)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Products
                  </span>
                }
              >
                {products.length === 0 && !productsLoading && (
                  <div
                    className="px-4 py-3 text-xs"
                    style={{
                      color: "var(--charcoal-mist)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    No products match &ldquo;{search}&rdquo;
                  </div>
                )}
                {products.map((p: Product) => (
                  <CommandItem
                    key={p.id}
                    value={`@@product:${p.id}`}
                    onSelect={() => navigate(`/product/${p.id}`)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{
                        background: "var(--off-white-2)",
                        border: "1px solid rgba(51,51,51,0.07)",
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
                        <Package
                          className="w-4 h-4"
                          style={{ color: "var(--charcoal-mist)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate leading-tight"
                        style={{ color: "var(--charcoal)" }}
                      >
                        {p.name}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "var(--charcoal-mist)" }}
                      >
                        {p.merchantStoreName ?? "Marketplace"}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold shrink-0 tabular-nums"
                      style={{ color: "var(--charcoal)" }}
                    >
                      {formatPrice(p.price)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* ── Categories (idle state) ── */}
            {showCats && topCats.length > 0 && (
              <>
                <CommandGroup
                  heading={
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        color: "var(--charcoal-mist)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      Browse Categories
                    </span>
                  }
                >
                  {topCats.map((cat) => (
                    <CommandItem
                      key={cat.id}
                      value={`@@cat:${cat.slug}`}
                      onSelect={() => navigate(`/category/${cat.slug}`)}
                      className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "var(--off-white-2)" }}
                      >
                        <Tag
                          className="w-3.5 h-3.5"
                          style={{ color: "var(--charcoal-soft)" }}
                        />
                      </div>
                      <span
                        className="flex-1 text-sm"
                        style={{
                          color: "var(--charcoal)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {cat.name}
                      </span>
                      {cat.productCount != null && (
                        <span
                          className="text-[11px] tabular-nums"
                          style={{
                            color: "var(--charcoal-mist)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {cat.productCount}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator
                  style={{ background: "rgba(51,51,51,0.06)" }}
                />
              </>
            )}

            {/* ── Quick navigation ── */}
            <CommandGroup
              heading={
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    color: "var(--charcoal-mist)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Quick Navigation
                </span>
              }
            >
              {QUICK_NAV.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={`@@nav:${item.href}`}
                    onSelect={() => navigate(item.href)}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--off-white-2)" }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--charcoal-soft)" }}
                      />
                    </div>
                    <span
                      className="flex-1 text-sm"
                      style={{
                        color: "var(--charcoal)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {item.label}
                    </span>
                    {item.hot && (
                      <Badge
                        className="text-[9px] font-bold px-1.5 py-0 h-4 border-0"
                        style={{
                          background: "rgba(200,16,46,0.1)",
                          color: "var(--red)",
                        }}
                      >
                        Live
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* ── Account / Merchant shortcuts (signed-in only) ── */}
            {user && (
              <>
                <CommandSeparator
                  style={{ background: "rgba(51,51,51,0.06)" }}
                />
                <CommandGroup
                  heading={
                    <span
                      className="text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        color: "var(--charcoal-mist)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {isMerchant ? "Merchant" : "Account"}
                    </span>
                  }
                >
                  {(isMerchant ? MERCHANT_ITEMS : ACCOUNT_ITEMS).map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.href}
                        value={`@@acct:${item.href}`}
                        onSelect={() => navigate(item.href)}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--off-white-2)" }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: "var(--charcoal-soft)" }}
                          />
                        </div>
                        <span
                          className="text-sm"
                          style={{
                            color: "var(--charcoal)",
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          {item.label}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>

          {/* ── Footer keyboard hint ── */}
          <div
            className="px-4 py-2.5 flex items-center justify-between shrink-0"
            style={{
              borderTop: "1px solid rgba(51,51,51,0.07)",
              background: "var(--off-white-2)",
            }}
          >
            <span
              className="text-[10px]"
              style={{
                color: "var(--charcoal-mist)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ↑↓ navigate · ↵ select · Esc close
            </span>
            <div className="flex items-center gap-1.5">
              {(["⌘K", "Ctrl+K"] as const).map((label, i) => (
                <Fragment key={label}>
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                    style={{
                      background: "#fff",
                      border: "1px solid rgba(51,51,51,0.12)",
                      color: "var(--charcoal-mist)",
                    }}
                  >
                    {label}
                  </kbd>
                  {i === 0 && (
                    <span
                      className="text-[9px]"
                      style={{ color: "var(--charcoal-mist)" }}
                    >
                      /
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
