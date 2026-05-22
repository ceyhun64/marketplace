/**
 * JSON-LD structured data components for Google Rich Results.
 *
 * Usage (Server Component):
 *   <ProductJsonLd product={...} />
 *   <BreadcrumbJsonLd items={[...]} />
 *
 * The <script> tags are rendered in the <head> via React's special handling
 * of dangerouslySetInnerHTML inside Server Components.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProductJsonLdProps {
  id: string;
  name: string;
  description: string;
  image: string | string[];
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
  sku?: string;
  ratingValue?: number;
  reviewCount?: number;
  url: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

// ── Components ─────────────────────────────────────────────────────────────────

/**
 * Emits a schema.org/Product JSON-LD block.
 * Enables price, availability, and rating rich snippets in Google Search.
 */
export function ProductJsonLd({
  id,
  name,
  description,
  image,
  price,
  currency = "USD",
  availability = "InStock",
  brand,
  sku,
  ratingValue,
  reviewCount,
  url,
}: ProductJsonLdProps) {
  const images = Array.isArray(image) ? image : [image];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    name,
    description,
    image: images,
    url,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url,
    },
  };

  if (sku)   schema.sku   = sku;
  if (brand) schema.brand = { "@type": "Brand", name: brand };

  if (ratingValue !== undefined && reviewCount !== undefined) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Emits a schema.org/BreadcrumbList JSON-LD block.
 * Enables breadcrumb path display in Google Search results.
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Emits a schema.org/WebSite JSON-LD block for sitelinks search box.
 * Place once in the root layout.
 */
export function WebSiteJsonLd({ name, url }: { name: string; url: string }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
