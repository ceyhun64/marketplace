"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Route → human-readable label map
const ROUTE_LABELS: Record<string, string> = {
  products: "Products",
  product: "Product",
  categories: "Categories",
  category: "Category",
  cart: "Cart",
  checkout: "Checkout",
  orders: "Orders",
  wishlist: "Wishlist",
  search: "Search Results",
  stores: "Stores",
  store: "Store",
  deals: "Deals",
  bestsellers: "Best Sellers",
  new: "New Arrivals",
  compare: "Compare",
  blog: "Blog",
  about: "About Us",
  contact: "Contact",
  faq: "FAQ",
  "help-center": "Help Center",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
  returns: "Returns",
  "gift-cards": "Gift Cards",
  "seller-guide": "Seller Guide",
  subscriptions: "Subscriptions",
  plugins: "Plugins",
  track: "Track Order",
  profile: "My Profile",
  notifications: "Notifications",
};

function segmentToLabel(segment: string): string {
  // If it looks like an ID (UUID or numeric), skip with "..."
  if (/^[0-9a-f-]{20,}$/i.test(segment) || /^\d+$/.test(segment)) {
    return "Detail";
  }
  return ROUTE_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface BreadcrumbsProps {
  /** Override auto-generated items with custom ones */
  items?: BreadcrumbItem[];
  /** Custom class for the container */
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname() || "/";

  const crumbs: BreadcrumbItem[] = items ?? (() => {
    const segments = pathname.split("/").filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
    let path = "";
    for (let i = 0; i < segments.length; i++) {
      path += `/${segments[i]}`;
      result.push({
        label: segmentToLabel(segments[i]),
        href: i < segments.length - 1 ? path : undefined,
      });
    }
    return result;
  })();

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={className}
      style={{
        maxWidth: 1300,
        margin: "0 auto",
        padding: "0.875rem 2rem",
      }}
    >
      <ol
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.25rem",
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li
              key={i}
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              {i > 0 && (
                <ChevronRight
                  size={13}
                  style={{ color: "var(--border-mid)", flexShrink: 0 }}
                />
              )}
              {i === 0 && crumb.href ? (
                <Link
                  href={crumb.href}
                  aria-label="Home"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "var(--charcoal-mist)",
                    transition: "color 0.15s ease",
                  }}
                  className="hover:text-[var(--charcoal)]"
                >
                  <Home size={13} />
                </Link>
              ) : crumb.href ? (
                <Link
                  href={crumb.href}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8125rem",
                    color: "var(--charcoal-soft)",
                    textDecoration: "none",
                    transition: "color 0.15s ease",
                  }}
                  className="hover:text-[var(--charcoal)]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.8125rem",
                    fontWeight: isLast ? 600 : 400,
                    color: isLast ? "var(--charcoal)" : "var(--charcoal-soft)",
                    maxWidth: 220,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((crumb, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: crumb.label,
              ...(crumb.href ? { item: crumb.href } : {}),
            })),
          }),
        }}
      />
    </nav>
  );
}
