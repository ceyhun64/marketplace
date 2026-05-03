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

/** Haversine ETA hesabında kullanılan ortalama hız (km/hours) */
export const AVG_COURIER_SPEED_KMH = {
  EXPRESS: 60,
  REGULAR: 40,
} as const;

/** ETA'ya eklenen trafik/bekleme buffer'ı (%) */
export const ETA_BUFFER_PERCENT = 20;

/**
 * Türkiye'deki şehirlerin yaklaşık koordinatları.
 * Checkout'ta adres girişinde şehir adından koordinat çözümlemesi için kullanılır.
 * Gerçek ETA hesabı backend /api/fulfillment/calculate-eta endpoint'inden gelir.
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Büyük şehirler
  istanbul: { lat: 41.0082, lng: 28.9784 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  izmir: { lat: 38.4237, lng: 27.1428 },
  bursa: { lat: 40.1885, lng: 29.061 },
  antalya: { lat: 36.8969, lng: 30.7133 },
  adana: { lat: 37.0, lng: 35.3213 },
  konya: { lat: 37.8746, lng: 32.4932 },
  gaziantep: { lat: 37.0662, lng: 37.3833 },
  mersin: { lat: 36.8, lng: 34.6333 },
  kayseri: { lat: 38.7225, lng: 35.4875 },
  // Diğer iller
  eskişehir: { lat: 39.7767, lng: 30.5206 },
  diyarbakır: { lat: 37.9144, lng: 40.2306 },
  şanlıurfa: { lat: 37.1591, lng: 38.7969 },
  samsun: { lat: 41.2867, lng: 36.33 },
  denizli: { lat: 37.7765, lng: 29.0864 },
  kocaeli: { lat: 40.7654, lng: 29.9408 },
  "i̇zmit": { lat: 40.7654, lng: 29.9408 },
  hatay: { lat: 36.4018, lng: 36.3498 },
  kahramanmaraş: { lat: 37.5858, lng: 36.9371 },
  trabzon: { lat: 41.0015, lng: 39.7178 },
  van: { lat: 38.4891, lng: 43.4089 },
  malatya: { lat: 38.3552, lng: 38.3095 },
  erzurum: { lat: 39.9043, lng: 41.2679 },
  tekirdağ: { lat: 40.9833, lng: 27.5167 },
  aydın: { lat: 37.8444, lng: 27.8458 },
  sakarya: { lat: 40.6966, lng: 30.4357 },
  muğla: { lat: 37.2153, lng: 28.3636 },
  manisa: { lat: 38.6191, lng: 27.4289 },
  balıkesir: { lat: 39.6484, lng: 27.8826 },
  rize: { lat: 41.0201, lng: 40.5234 },
  ordu: { lat: 40.9862, lng: 37.8797 },
  çorum: { lat: 40.5506, lng: 34.9556 },
  yozgat: { lat: 39.82, lng: 34.8147 },
  siirt: { lat: 37.9333, lng: 41.9500 },
  mardin: { lat: 37.3212, lng: 40.7245 },
  batman: { lat: 37.8812, lng: 41.1351 },
  aksaray: { lat: 38.3687, lng: 34.0370 },
  niğde: { lat: 37.9667, lng: 34.6833 },
  nevşehir: { lat: 38.6939, lng: 34.6857 },
  sivas: { lat: 39.7477, lng: 37.0179 },
  tokat: { lat: 40.3167, lng: 36.5544 },
  giresun: { lat: 40.9128, lng: 38.3895 },
  uşak: { lat: 38.6823, lng: 29.4082 },
  afyonkarahisar: { lat: 38.7507, lng: 30.5567 },
  kütahya: { lat: 39.4167, lng: 29.9833 },
  bolu: { lat: 40.735, lng: 31.6061 },
  çanakkale: { lat: 40.1553, lng: 26.4142 },
  edirne: { lat: 41.6771, lng: 26.5557 },
  kırklareli: { lat: 41.7352, lng: 27.2253 },
  zonguldak: { lat: 41.4564, lng: 31.7987 },
  karabük: { lat: 41.2061, lng: 32.6204 },
  kastamonu: { lat: 41.3887, lng: 33.7827 },
  sinop: { lat: 42.0231, lng: 35.1531 },
  artvin: { lat: 41.1828, lng: 41.8183 },
  erzincan: { lat: 39.75, lng: 39.5000 },
  ağrı: { lat: 39.7191, lng: 43.0503 },
  bitlis: { lat: 38.4000, lng: 42.1000 },
  hakkari: { lat: 37.5744, lng: 43.7408 },
  şırnak: { lat: 37.5164, lng: 42.4611 },
  bingöl: { lat: 38.8854, lng: 40.4983 },
  elazığ: { lat: 38.6810, lng: 39.2264 },
  muş: { lat: 38.7432, lng: 41.5064 },
  tunceli: { lat: 39.1079, lng: 39.5479 },
  adıyaman: { lat: 37.7648, lng: 38.2786 },
  kilis: { lat: 36.7184, lng: 37.1212 },
  osmaniye: { lat: 37.0742, lng: 36.2464 },
  düzce: { lat: 40.8438, lng: 31.1565 },
  yalova: { lat: 40.6500, lng: 29.2667 },
  bartın: { lat: 41.6344, lng: 32.3375 },
  ardahan: { lat: 41.1105, lng: 42.7022 },
  iğdır: { lat: 39.9167, lng: 44.0333 },
  karaman: { lat: 37.1759, lng: 33.2287 },
  gümüşhane: { lat: 40.4386, lng: 39.5086 },
  bayburt: { lat: 40.2552, lng: 40.2249 },
  kırşehir: { lat: 39.1425, lng: 34.1709 },
  kırıkkale: { lat: 39.8468, lng: 33.5153 },
  çankırı: { lat: 40.6013, lng: 33.6134 },
  amasya: { lat: 40.6499, lng: 35.8353 },
  bilecik: { lat: 40.1509, lng: 29.9792 },
  burdur: { lat: 37.7265, lng: 30.2908 },
  isparta: { lat: 37.7648, lng: 30.5566 },
  "bodrum": { lat: 37.034, lng: 27.4305 },
  "fethiye": { lat: 36.6221, lng: 29.1165 },
  "marmaris": { lat: 36.8554, lng: 28.2725 },
};

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
