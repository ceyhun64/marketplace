// web/lib/fetch.ts
// Sadece Server Components ve Route Handlers'ta kullan
// Client Components'te bu dosyayı IMPORT ETME

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5010";

type FetchOptions = RequestInit & {
  revalidate?: number | false;
  tags?: string[];
};

/**
 * ISR fetch — statik sayfalar için (kategori listesi, ürün listesi vb.)
 * revalidate: 60 → 60 saniyede bir arka planda yeniler
 */
export async function fetchISR<T>(
  path: string,
  options?: FetchOptions,
): Promise<T> {
  const { revalidate = 60, tags, ...rest } = options ?? {};

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    next: {
      revalidate,
      ...(tags ? { tags } : {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch ISR failed: ${res.status} ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * SSR fetch — her istekte taze veri gereken sayfalar için
 * (sipariş detayı, profil, admin paneli vb.)
 */
export async function fetchSSR<T>(
  path: string,
  token?: string,
  options?: RequestInit,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Fetch SSR failed: ${res.status} ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Static fetch — hiç değişmeyen veriler (plan listesi, plugin listesi vb.)
 * Build time'da bir kez çekilir
 */
export async function fetchStatic<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "force-cache",
  });

  if (!res.ok) {
    throw new Error(`Fetch Static failed: ${res.status} ${path}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Server Fetch Helper — mağaza ve ürün verisi için
 */
export const serverFetch = {
  product: (id: string) => fetchISR(`/api/products/${id}`),
  storeProducts: (slug: string) => fetchISR(`/api/store/${slug}/products`),
};
