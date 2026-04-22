// ─────────────────────────────────────────────────────────────────────────────
// lib/constants.ts — Uygulama genelinde sabit değerler
// ─────────────────────────────────────────────────────────────────────────────

// ── API ───────────────────────────────────────────────────────────────────────

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5010";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const SIGNALR_HUB_URL =
  process.env.NEXT_PUBLIC_SIGNALR_HUB ?? `${API_URL}/hubs/tracking`;

// ── Auth ──────────────────────────────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const ACCESS_TOKEN_EXPIRY_DAYS = 1;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// ── Pagination ────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const PRODUCT_PAGE_SIZE = 24;
export const ORDER_PAGE_SIZE = 15;

// ── Shipping ──────────────────────────────────────────────────────────────────

export const SHIPPING_COSTS = {
  EXPRESS: 49.9,
  REGULAR: 19.9,
} as const;

/** Haversine ETA hesabında kullanılan ortalama hız (km/saat) */
export const AVG_COURIER_SPEED_KMH = {
  EXPRESS: 60,
  REGULAR: 40,
} as const;

/** ETA'ya eklenen trafik/bekleme buffer'ı (%) */
export const ETA_BUFFER_PERCENT = 20;

// ── KDV ──────────────────────────────────────────────────────────────────────

export const DEFAULT_VAT_RATE = 0.2; // %20

// ── Cloudinary ───────────────────────────────────────────────────────────────

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD ?? "";
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? "marketplace-unsigned";

/** Maksimum yüklenebilir görsel boyutu (bytes) — 5 MB */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 6;

// ── Stale Time (TanStack Query) ───────────────────────────────────────────────

export const STALE_TIME = {
  /** Hiç değişmez — build time'da bir kez */
  STATIC: Infinity,
  /** Yavaş değişen veriler (kategoriler, ürün detayları) */
  LONG: 1000 * 60 * 10, // 10 dakika
  /** Orta hızlı (liste sayfaları) */
  MEDIUM: 1000 * 60 * 2, // 2 dakika
  /** Hızlı değişen (sipariş durumu, stok) */
  SHORT: 1000 * 30, // 30 saniye
  /** Anlık (tracking polling) */
  REALTIME: 0,
} as const;

// ── Routes ────────────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  UNAUTHORIZED: "/unauthorized",

  SEARCH: "/search",
  CATEGORY: (slug: string) => `/category/${slug}`,
  PRODUCT: (id: string) => `/product/${id}`,
  STORE: (slug: string) => `/store/${slug}`,
  STORE_PRODUCT: (slug: string, id: string) => `/store/${slug}/product/${id}`,
  TRACK: (trackingNo: string) => `/track/${trackingNo}`,

  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  ORDER_TRACKING: (id: string) => `/orders/${id}/tracking`,
  PROFILE: "/profile",

  ADMIN: {
    ROOT: "/admin",
    MERCHANTS: "/admin/merchants",
    MERCHANT_SETUP: (id: string) => `/admin/merchants/${id}/store-setup`,
    PRODUCTS: "/admin/products",
    PRODUCTS_PENDING: "/admin/products/pending",
    CATEGORIES: "/admin/categories",
    ORDERS: "/admin/orders",
    COURIERS: "/admin/couriers",
    FULFILLMENT: "/admin/fulfillment",
    ANALYTICS: "/admin/analytics",
    SUBSCRIPTIONS: "/admin/subscription",
  },

  MERCHANT: {
    ROOT: "/merchant",
    CATALOGUE: "/merchant/catalogue",
    ORDERS: "/merchant/orders",
    STORE_SETTINGS: "/merchant/store-settings",
    ANALYTICS: "/merchant/analytics",
    INVOICES: "/merchant/invoices",
    SUBSCRIPTION: "/merchant/subscription",
  },

  COURIER: {
    ROOT: "/courier",
    SHIPMENTS: "/courier/shipments",
    SHIPMENT: (id: string) => `/courier/shipments/${id}`,
  },
} as const;

// ── Query Cache Tags (next.js revalidateTag) ──────────────────────────────────

export const CACHE_TAGS = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  STORE: (slug: string) => `store-${slug}`,
  PRODUCT: (id: string) => `product-${id}`,
} as const;
