# Web Eksik Dosyalar — Yerleştirme Kılavuzu

## Yapılacaklar (kopyalama sırası önemli)

### 1. Query Hooks → `web/queries/`

| Dosya                    | Hedef                        | Not                            |
| ------------------------ | ---------------------------- | ------------------------------ |
| `queries/useInvoices.ts` | `web/queries/useInvoices.ts` | YENİ                           |
| `queries/useAdmin.ts`    | `web/queries/useAdmin.ts`    | YENİ                           |
| `queries/usePayments.ts` | `web/queries/usePayments.ts` | YENİ                           |
| `queries/useShipping.ts` | `web/queries/useShipping.ts` | YENİ                           |
| `queries/useProducts.ts` | `web/queries/useProducts.ts` | GÜNCELLEME — eskisini değiştir |
| `queries/useOrders.ts`   | `web/queries/useOrders.ts`   | GÜNCELLEME — eskisini değiştir |

### 2. Components

| Dosya                                        | Hedef                                                                                       | Not  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- | ---- |
| `components/checkout/ShippingRateSelect.tsx` | `web/components/modules/checkout/ShippingRateSelect.tsx`                                    | YENİ |
| `components/checkout/PaymentForm.tsx`        | `web/components/modules/checkout/PaymentForm.tsx`                                           | YENİ |
| `components/marketplace/ProductCard.tsx`     | `web/components/modules/home/ProductCard.tsx`                                               | YENİ |
| `components/marketplace/TagFilter.tsx`       | `web/components/modules/home/TagFilter.tsx` veya `web/components/marketplace/TagFilter.tsx` | YENİ |
| `components/fulfillment/ShipmentLabel.tsx`   | `web/components/modules/fulfillment/ShipmentLabel.tsx`                                      | YENİ |
| `components/store/StoreSetupForm.tsx`        | `web/components/modules/admin/StoreSetupForm.tsx`                                           | YENİ |

### 3. Sayfa

| Dosya                                  | Hedef                                          |
| -------------------------------------- | ---------------------------------------------- |
| `app/store/slug/category/cat/page.tsx` | `web/app/store/[slug]/category/[cat]/page.tsx` |

> Klasörü elle oluştur: `web/app/store/[slug]/category/[cat]/`

---

## Bağımlılık Kontrolleri

### `ShippingRateSelect` için gerekli

```bash
# date-fns zaten kuruluysa atla
npm install date-fns
```

### `StoreSetupForm` için gerekli

```bash
# react-hook-form + zod zaten kuruluysa atla
npm install react-hook-form @hookform/resolvers zod
```

### `PaymentForm` bağımlılığı

- `hooks/use-cart.ts` mevcut olmalı (`useCart` export eder)
- `queries/usePayments.ts` (bu pakette mevcut)

---

## useProducts.ts Değişiklikleri (özet)

Eski dosyaya göre yeni olanlar:

- `useSearchProducts(q, filters?)` — `/api/products/search` için
- `useStoreProducts(slug, filters?)` — mağaza ürünleri
- `useStoreProduct(slug, productId)` — mağaza ürün detayı
- `useMerchantProducts(filters?)` — merchant kendi ürünleri
- `useDeleteProduct()` — soft-delete
- `useTogglePublish()` — publishToMarket/publishToStore toggle
- `filters.subcategory` ve `filters.tags[]` desteği eklendi

## useOrders.ts Değişiklikleri (özet)

Eski dosyaya göre yeni olanlar:

- `useCancelOrder()` — müşteri iptal
- `useMerchantIncomingOrders(status?)` — endpoint düzeltildi (`/api/orders/merchant/incoming`)
- `useAdminOrders(filters?)` — admin tüm siparişler
- `useUpdateOrderStatus()` — admin durum güncelle
- `usePublicTracking(trackingNo)` — QR erişimli takip (auth gerektirmez)
- `OrderStatus` tipi `@/types/enums`'dan import edildi (tekrar tanımlanmıyor)
