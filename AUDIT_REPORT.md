# Marketplace — Full-Stack Integration Audit Report
**Tarih:** 2026-05-26  
**Kapsam:** `web/` (Next.js 15 + React Query) ↔ `api/` (.NET 10, CQRS, EF Core)  
**Yöntem:** Satır satır dosya okuması — gerçek proje dosyaları ve satır numaraları referans alınmıştır.

---

## Öncelik Sıralaması

| Seviye | Renk | Anlamı |
|---|---|---|
| **P0 — KRİTİK** | 🔴 | Kullanıcıya görünen işlevselliği tamamen kırar |
| **P1 — YÜKSEK** | 🟠 | Önemli veriyi yanlış döndürür / mutasyon hiç çalışmaz |
| **P2 — ORTA** | 🟡 | UI stale kalır, cache güncellenmez |
| **P3 — DÜŞÜK** | 🔵 | Teknik borç / savunmasız kod |

---

## BÖLÜM 1 — KUSURSUZ ÇALIŞMAYAN / RİSKLİ AKSİYONLAR

---

### 🔴 P0-1 — `PATCH /api/orders/{id}/status` HER ZAMAN "Invalid order status" Döndürür

**Dosya:** `api/Controllers/OrdersController.cs:623`

```csharp
// Mevcut kod:
if (!Enum.TryParse<OrderStatus>(dto.Status, out var newStatus))
    return BadRequest(new { message = "Invalid order status." });
```

**Frontend (`web/queries/useOrders.ts:283`) şunu gönderir:**

```typescript
api.patch(`/api/orders/${id}/status`, { status })
// → body: { status: "PAYMENT_CONFIRMED" }   ← SCREAMING_SNAKE_CASE
```

**Sorun:** `Enum.TryParse<OrderStatus>("PAYMENT_CONFIRMED", ...)` — varsayılan olarak **büyük/küçük harf duyarlıdır** ve `false` döndürür; C# enum üyesinin adı `PaymentConfirmed`'dir.  
**Sonuç:** Admin order status güncelleme mutasyonu her zaman 400 Bad Request alır. `useUpdateOrderStatus()` asla başarılı olamaz.

---

### 🔴 P0-2 — Sipariş Durum Filtreleri Sessizce Görmezden Gelinir (4 Endpoint)

**Dosya:** `api/Controllers/OrdersController.cs` — Satırlar: **65, 266, 407, 550**

```csharp
// Hatalı kullanım (4 yerde tekrarlanıyor):
if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, out var ps))
    query = query.Where(o => o.Status == ps);
```

**Etkilenen endpoint'ler:**
| Endpoint | Satır |
|---|---|
| `GET /api/orders?status=PAYMENT_CONFIRMED` | 65 |
| `GET /api/orders/admin/all?status=PAYMENT_CONFIRMED` | 266 |
| `GET /api/orders/merchant/vendor-orders?status=PAYMENT_CONFIRMED` | 407 |
| `GET /api/orders/merchant/incoming?status=PAYMENT_CONFIRMED` | 550 |

**Sorun:** Frontend `SCREAMING_SNAKE_CASE` gönderir, backend `PascalCase` bekler, `ignoreCase: true` verilmediği için parse başarısız olur → `if` bloğuna girilmez → filtre **sessizce atlanır** → tüm siparişler döner.  
**Sonuç:** Admin / merchant panelindeki tüm durum filtreleri (Bekleyen, Onaylandı, Teslim Edildi vb.) çalışmaz.

---

### 🔴 P0-3 — Takip Endpoint'i Shipment Yokken PascalCase Status Döndürür

**Dosya:** `api/Controllers/OrdersController.cs:143`

```csharp
// Mevcut (shipment null iken):
return Ok(new
{
    orderId = id,
    orderStatus = order.Status.ToString(),   // ← "PaymentConfirmed" döner
    shipment = (object?)null,
});

// Shipment varken (OrderTrackingDto içinde):
OrderStatus = order.Status.ToApiString(),   // ← "PAYMENT_CONFIRMED" döner (doğru)
```

**Sorun:** Ödeme yeni tamamlanmış bir sipariş için — henüz sevkiyat oluşturulmadan — müşteri takip sayfasını açtığında `orderStatus: "PaymentConfirmed"` gelir.  
**Frontend (`web/queries/useOrders.ts:128-130`):**  
```typescript
orderStatus: raw.orderStatus as string,  // "PaymentConfirmed"
```
`ORDER_STATUS_LABELS["PaymentConfirmed"]` → **`undefined`** → badge boş görünür.

---

### 🔴 P0-4 — `GetMerchantVendorOrders` Raw Enum Integer / PascalCase Status Döndürür

**Dosya:** `api/Controllers/OrdersController.cs:424, 452`

```csharp
// Line 424 — raw enum:
vo.Status,          // → integer (0,1,2,...) eğer JsonStringEnumConverter yoksa

// Line 452 — PascalCase string:
Status = vo.Order.Shipment.Status.ToString(),   // → "CourierAssigned"
```

**Sorun 1:** `vo.Status` doğrudan serialize edilir. `JsonStringEnumConverter` global olarak yapılandırılmamışsa frontend `0`, `1`, `2` sayıları alır.  
**Sorun 2:** Shipment status'u `.ToApiString()` yerine `.ToString()` ile serialize edilir → `"CourierAssigned"` gelir, frontend `"COURIER_ASSIGNED"` bekler → `SHIPMENT_STATUS_LABELS["CourierAssigned"]` → **`undefined`**.

---

### 🔴 P0-5 — Backend `OrderStatus` Enum'unda Frontend'in Tanımadığı 3 Değer Var

**Dosya:** `api/Domain/Enums/OrderStatus.cs`

```csharp
public enum OrderStatus
{
    Pending,
    PaymentConfirmed,
    Processing,        // ← Frontend bilmiyor
    Packed,            // ← Frontend bilmiyor
    LabelGenerated,
    Shipped,           // ← Frontend bilmiyor
    CourierAssigned,
    ...
}
```

**Frontend (`web/types/enums.ts:18-28`):**

```typescript
export type OrderStatus =
  | "PENDING" | "PAYMENT_CONFIRMED" | "LABEL_GENERATED"
  | "COURIER_ASSIGNED" | "PICKED_UP" | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "CANCELLED";
// PROCESSING, PACKED, SHIPPED → YOK
```

**Sorun:** Backend `Processing`, `Packed`, veya `Shipped` durumuna geçen bir sipariş için:
- `ORDER_STATUS_LABELS["PROCESSING"]` → **`undefined`** → Status badge boş
- `ORDER_STATUS_COLORS["PROCESSING"]` → **`undefined`** → CSS class yok, Tailwind patlar
- TypeScript tip hatası (`"PROCESSING"` type union'da yok)

---

### 🟠 P1-1 — `usePackOrder` Eski Order-Level Endpoint'i Hedefler (Multi-Vendor'da Yanlış)

**Dosya:** `web/queries/useOrders.ts:216`

```typescript
export function usePackOrder() {
  return useMutation({
    mutationFn: (orderId: string) => api.patch(`/api/orders/${orderId}/pack`),
    // ...
  });
}
```

**Backend'deki iki endpoint:**
```
PATCH /api/orders/{id}/pack
    → OrdersController.cs:576 — Tüm order'ı "LabelGenerated" yapar
    → Sibling VendorOrder kontrolü YOKTUR

PATCH /api/orders/merchant/vendor-orders/{id}/pack
    → OrdersController.cs:478 — VendorOrder bazlı pack
    → Tüm sibling'lar LabelGenerated olduğunda parent Order'ı günceller ✓
```

**Sorun:** Multi-vendor sepetlerde (2+ merchant ürünü) merchant yalnızca kendi sub-order'ını pack etmeli. Eski endpoint tüm siparişi `LabelGenerated` yapar, diğer merchant'ların henüz pack etmediği ürünler yanlış duruma geçer.

---

### 🟠 P1-2 — `useMyOrders` Backend Response Shape'i ile Uyumsuz

**Dosya:** `web/queries/useOrders.ts:64-76`

```typescript
queryFn: async () => {
  const { data } = await api.get<PaginatedOrdersResponse>(`/api/orders${params}`);
  if (!Array.isArray(data?.data)) {
    throw new Error(`Unexpected orders response shape: ...`);
  }
  return data.data;   // ← data.data
},
```

**API interceptor (`web/lib/api.ts:79-98`) davranışı:**

Interceptor `{ data: T[], pagination: {...} }` şeklindeki yanıtlarda `"pagination"` key'i PAGINATION_KEYS listesinde olduğu için **unwrap YAPMAZ**. Yani `data` değişkeni `{ data: orders[], pagination: {...} }` içerir. `data.data` dizi döner → doğru.

**Ancak:** Backend `GetMyOrders` endpoint'i `{ data: ..., pagination: ... }` dönerken, `OrderTrackingDto` yanıtı gibi farklı shape'ler dönen endpoint'lerin interceptor'ı nasıl ele aldığı test edilmeli.

---

### 🟠 P1-3 — `PLAN_LIMITS.BASIC.canPublishToMarket` Hâlâ `false` — Backend Gate Kaldırıldı

**Dosya:** `web/types/enums.ts:153`

```typescript
BASIC: {
  maxProducts: 50,
  canPublishToMarket: false,   // ← STALE! Backend gate önceki session'da kaldırıldı
  canUseCustomDomain: false,
  canUseSubdomain: false,
},
```

**Sorun:** `PLAN_LIMITS[plan].canPublishToMarket` kontrolü yapan herhangi bir bileşen Basic plan merchant'ın marketplace'e yayın yapmasını hâlâ engeller. `MerchantsController` artık bu kontrolü yapmıyor ama frontend bunu biliyor mu?

**Kontrol edilmesi gereken bileşenler:** `ProductFormModal.tsx`, `MerchantCatalogueView.tsx`, `SubscriptionPage.tsx`

---

## BÖLÜM 2 — TİPİK VE ADLANDIRMA HATALARI

---

### 🟠 Enum Serializasyon Uyumsuzluk Tablosu

#### `OrderStatus` — Durum Sütunu

| TS Frontend | C# Backend | `.ToApiString()` Çıktısı | Uyumlu? | Not |
|---|---|---|---|---|
| `PENDING` | `Pending` | `PENDING` | ✅ | |
| `PAYMENT_CONFIRMED` | `PaymentConfirmed` | `PAYMENT_CONFIRMED` | ✅ | |
| `LABEL_GENERATED` | `LabelGenerated` | `LABEL_GENERATED` | ✅ | |
| `COURIER_ASSIGNED` | `CourierAssigned` | `COURIER_ASSIGNED` | ✅ | |
| `PICKED_UP` | `PickedUp` | `PICKED_UP` | ✅ | |
| `IN_TRANSIT` | `InTransit` | `IN_TRANSIT` | ✅ | |
| `OUT_FOR_DELIVERY` | `OutForDelivery` | `OUT_FOR_DELIVERY` | ✅ | |
| `DELIVERED` | `Delivered` | `DELIVERED` | ✅ | |
| `FAILED` | `Failed` | `FAILED` | ✅ | |
| `CANCELLED` | `Cancelled` | `CANCELLED` | ✅ | |
| ❌ Yok | `Processing` | `PROCESSING` | ❌ | Frontend bilmiyor |
| ❌ Yok | `Packed` | `PACKED` | ❌ | Frontend bilmiyor |
| ❌ Yok | `Shipped` | `SHIPPED` | ❌ | Frontend bilmiyor |

> **Not:** Enum değerleri `.ToApiString()` kullanıldığında uyumlu, ancak `Enum.TryParse` (ters dönüşüm) case-insensitive çağrılmadığı için ters yönde (frontend → backend filter) çalışmıyor.

#### `ShippingRate` — Serializasyon Doğru, Ters Parse Riskli

| TS Frontend | C# Backend | `.ToApiString()` | `Enum.TryParse` (case-sensitive) |
|---|---|---|---|
| `EXPRESS` | `Express` | `EXPRESS` ✅ | `"EXPRESS"` → ❌ FAIL |
| `REGULAR` | `Regular` | `REGULAR` ✅ | `"REGULAR"` → ❌ FAIL |

> Response'ta `ToApiString()` kullanıldığı için okuma doğru. Ancak `CreateOrderCommandHandler` içinde `Enum.TryParse<ShippingRate>(dto.ShippingRate, ...)` case-sensitive çağrılırsa sipariş oluşturma bozulur.

#### `UserRole` — PascalCase Tutuluyor, Doğru

| TS Frontend | C# Backend | Uyumlu? |
|---|---|---|
| `"Admin"` | `Admin` | ✅ |
| `"Merchant"` | `Merchant` | ✅ |
| `"Courier"` | `Courier` | ✅ |
| `"Customer"` | `Customer` | ✅ |

> `UserRole` enum'u SCREAMING_SNAKE_CASE değil PascalCase tutulmuş — hem frontend hem backend uyumlu.

---

### 🟡 Request Body camelCase → Backend'e Direkt Gönderiliyor

**Dosya:** `web/lib/api.ts:33-41`

```typescript
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  // ← camelCase → PascalCase dönüşümü YOK
});
```

Frontend `{ shippingAddress: { fullName: "..." } }` gönderir, backend `{ ShippingAddress: { FullName: "..." } }` bekler. ASP.NET Core'un varsayılan JSON deserializer'ı **case-insensitive** çalıştığından şu an çalışıyor. Ancak:
- Konfigürasyon `PropertyNameCaseInsensitive = false` yapılırsa tüm formlar anında bozulur
- `[FromBody]` record'larındaki required alanlar parse edilemez

---

## BÖLÜM 3 — EKSİK REACT QUERY INVALIDASYONLARI

---

### 🟠 `useUpdateOrderStatus` — Detail ve Tracking Invalidasyonu Eksik

**Dosya:** `web/queries/useOrders.ts:279-288`

```typescript
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.adminAll() });
      // ← orderKeys.detail(id) EKSİK → sipariş detay sayfası stale kalır
      // ← orderKeys.tracking(id) EKSİK → takip sayfası stale kalır
      // ← orderKeys.myOrders() EKSİK → müşterinin sipariş listesi güncellenmez
    },
  });
}
```

**Sonuç:** Admin bir siparişi `DELIVERED` yapar, sipariş detay sayfası yenilenene kadar `IN_TRANSIT` göstermeye devam eder.

---

### 🟡 `useTogglePublish` — Marketplace Listing Invalidasyonu Eksik

**Dosya:** `web/queries/useProducts.ts:329-333`

```typescript
onSettled: (_data, _err, { id }) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
  // ← productKeys.lists() EKSİK → marketplace listeleri stale kalır
  // ← productKeys.featured() EKSİK → öne çıkan ürünler güncellenmez
},
```

**Sonuç:** Merchant ürünü marketplace'e yayınlar, kendi dashboard'u anında güncellenir ama `/marketplace` sayfasındaki liste 60 saniye eski veriyi gösterir.

---

### 🟡 `useUpdateProduct` — Public Cache Invalidasyonu Eksik

**Dosya:** `web/queries/useProducts.ts:242-247`

```typescript
onSuccess: (_, { id }) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
  // ← productKeys.lists() EKSİK
  // ← productKeys.featured() EKSİK
},
```

**Sonuç:** Merchant fiyatı günceller, ürün detay sayfası yenilenir ama arama sonuçları ve öne çıkan ürünler eski fiyatı göstermeye devam eder.

---

### 🟡 `useCreateProduct` — Featured Invalidasyonu Eksik

**Dosya:** `web/queries/useProducts.ts:227-234`

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
  // ← productKeys.featured() EKSİK
},
```

---

### 🔵 `useDeleteProduct` — `productKeys.lists()` Doğru Temizleniyor, Featured Eksik

**Dosya:** `web/queries/useProducts.ts:273-276`

```typescript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
  // ← productKeys.featured() EKSİK
},
```

---

## BÖLÜM 4 — DÜZELTME REÇETESİ

---

### FIX-1 🔴 Enum.TryParse — `ignoreCase: true` Ekle (P0-1, P0-2)

**Dosya:** `api/Controllers/OrdersController.cs` — Satırlar: 65, 266, 407, 550, 623

**Tüm occurrences için (replace_all):**

```csharp
// ÖNCE:
Enum.TryParse<OrderStatus>(status, out var ps)

// SONRA:
Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var ps)
```

```csharp
// ÖNCE (line 623):
if (!Enum.TryParse<OrderStatus>(dto.Status, out var newStatus))

// SONRA:
if (!Enum.TryParse<OrderStatus>(dto.Status, ignoreCase: true, out var newStatus))
```

---

### FIX-2 🔴 Tracking Endpoint'i — Null Shipment Path'ini Düzelt (P0-3)

**Dosya:** `api/Controllers/OrdersController.cs:143`

```csharp
// ÖNCE:
return Ok(new
{
    orderId = id,
    orderStatus = order.Status.ToString(),
    shipment = (object?)null,
});

// SONRA:
return Ok(new
{
    orderId = id,
    orderStatus = order.Status.ToApiString(),
    shipment = (object?)null,
});
```

---

### FIX-3 🔴 `GetMerchantVendorOrders` Raw Enum Düzelt (P0-4)

**Dosya:** `api/Controllers/OrdersController.cs:420-453`

```csharp
// ÖNCE (line 420):
data = vendorOrders.Select(vo => new
{
    vo.Id,
    vo.OrderId,
    vo.Status,        // ← raw enum
    ...
    Shipment = vo.Order.Shipment == null ? null : new
    {
        vo.Order.Shipment.TrackingNumber,
        Status = vo.Order.Shipment.Status.ToString(),   // ← PascalCase
    },
    ...
})

// SONRA:
data = vendorOrders.Select(vo => new
{
    vo.Id,
    vo.OrderId,
    Status = vo.Status.ToApiString(),   // ← SCREAMING_SNAKE_CASE
    ...
    Shipment = vo.Order.Shipment == null ? null : new
    {
        vo.Order.Shipment.TrackingNumber,
        Status = vo.Order.Shipment.Status.ToApiString(),   // ← SCREAMING_SNAKE_CASE
    },
    ...
})
```

---

### FIX-4 🔴 `OrderStatus` Enum — Eksik Değerleri Frontend'e Ekle (P0-5)

**Dosya:** `web/types/enums.ts`

```typescript
// ÖNCE:
export type OrderStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "LABEL_GENERATED"
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  LABEL_GENERATED: "Label Generated",
  COURIER_ASSIGNED: "Courier Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

// SONRA:
export type OrderStatus =
  | "PENDING"
  | "PAYMENT_CONFIRMED"
  | "PROCESSING"           // ← EKLENDİ
  | "PACKED"               // ← EKLENDİ
  | "LABEL_GENERATED"
  | "SHIPPED"              // ← EKLENDİ
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "CANCELLED";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAYMENT_CONFIRMED: "Payment Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  LABEL_GENERATED: "Label Generated",
  SHIPPED: "Shipped",
  COURIER_ASSIGNED: "Courier Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-(--warning-bg) text-(--warning) border border-(--warning-border)",
  PAYMENT_CONFIRMED: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  PROCESSING: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  PACKED: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  LABEL_GENERATED: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  SHIPPED: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  COURIER_ASSIGNED: "bg-(--warning-bg) text-(--warning) border border-(--warning-border)",
  PICKED_UP: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  IN_TRANSIT: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  OUT_FOR_DELIVERY: "bg-(--danger-bg) text-(--danger) border border-(--danger-border)",
  DELIVERED: "bg-(--success-bg) text-(--success) border border-(--success-border)",
  FAILED: "bg-(--danger-bg) text-(--danger) border border-(--danger-border)",
  CANCELLED: "bg-(--off-white-2) text-(--text-secondary) border border-(--border-light)",
};

export const NON_CANCELLABLE_STATUSES: OrderStatus[] = [
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
];
```

---

### FIX-5 🟠 `useUpdateOrderStatus` — Eksik Invalidasyonlar (P1)

**Dosya:** `web/queries/useOrders.ts:279-288`

```typescript
// ÖNCE:
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.adminAll() });
    },
  });
}

// SONRA:
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.adminAll() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.tracking(id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.myOrders() });
    },
  });
}
```

---

### FIX-6 🟠 `PLAN_LIMITS` — Stale Flag Düzelt (P1-3)

**Dosya:** `web/types/enums.ts:148-174`

```typescript
// ÖNCE:
BASIC: {
  maxProducts: 50,
  canPublishToMarket: false,   // ← stale, backend gate kaldırıldı
  canUseCustomDomain: false,
  canUseSubdomain: false,
},
PRO: {
  maxProducts: Infinity,
  canPublishToMarket: true,
  canUseCustomDomain: false,
  canUseSubdomain: true,
},

// SONRA:
BASIC: {
  maxProducts: 50,
  canPublishToMarket: true,   // ← backend gate kaldırıldığı için artık herkes yayınlayabilir
  canUseCustomDomain: false,
  canUseSubdomain: false,
},
PRO: {
  maxProducts: Infinity,
  canPublishToMarket: true,
  canUseCustomDomain: false,
  canUseSubdomain: true,
},
```

---

### FIX-7 🟡 `useTogglePublish` — Marketplace Cache Invalidasyonu Ekle

**Dosya:** `web/queries/useProducts.ts:329-333`

```typescript
// ÖNCE:
onSettled: (_data, _err, { id }) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
},

// SONRA:
onSettled: (_data, _err, { id }) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  queryClient.invalidateQueries({ queryKey: productKeys.featured() });
},
```

---

### FIX-8 🟡 `useUpdateProduct` — Public Cache Invalidasyonu Ekle

**Dosya:** `web/queries/useProducts.ts:242-247`

```typescript
// ÖNCE:
onSuccess: (_, { id }) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
},

// SONRA:
onSuccess: (_, { id }) => {
  queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  queryClient.invalidateQueries({ queryKey: productKeys.merchantProducts() });
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  queryClient.invalidateQueries({ queryKey: productKeys.featured() });
},
```

---

### FIX-9 🟠 `usePackOrder` — VendorOrder Endpoint'ine Geçir

**Dosya:** `web/queries/useOrders.ts:213-245`

```typescript
// ÖNCE:
export function usePackOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.patch(`/api/orders/${orderId}/pack`),
    onMutate: async (orderId) => {
      // ... optimistic update with orderId ...
    },
    onSettled: (_data, _err, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.merchantIncoming() });
    },
  });
}

// SONRA:
export function usePackVendorOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vendorOrderId: string) =>
      api.patch(`/api/orders/merchant/vendor-orders/${vendorOrderId}/pack`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.merchantIncoming() });
    },
  });
}
```

> **Not:** Bu değişiklik bileşenlerde çağrı noktasını güncelleyi gerektirir — `orderId` yerine `vendorOrderId` kullanılmalı.

---

## ÖZET TABLO

| ID | Seviye | Dosya | Satır | Sorun | Düzeltme |
|---|---|---|---|---|---|
| P0-1 | 🔴 KRİTİK | `OrdersController.cs` | 623 | `PATCH /status` her zaman 400 döner | `ignoreCase: true` ekle |
| P0-2 | 🔴 KRİTİK | `OrdersController.cs` | 65,266,407,550 | Status filtreler sessizce görmezden geliniyor | `ignoreCase: true` ekle |
| P0-3 | 🔴 KRİTİK | `OrdersController.cs` | 143 | Tracking null-shipment path PascalCase döner | `.ToString()` → `.ToApiString()` |
| P0-4 | 🔴 KRİTİK | `OrdersController.cs` | 424,452 | VendorOrders raw enum / PascalCase Status | `.ToApiString()` ekle |
| P0-5 | 🔴 KRİTİK | `enums.ts` | 18-28 | PROCESSING/PACKED/SHIPPED bilinmiyor | Type union ve label/color map'e ekle |
| P1-1 | 🟠 YÜKSEK | `useOrders.ts` | 216 | usePackOrder eski endpoint'i hedefler | VendorOrder endpoint'e geçir |
| P1-2 | 🟠 YÜKSEK | `useOrders.ts` | 279 | useUpdateOrderStatus eksik invalidasyon | `detail(id)`, `tracking(id)`, `myOrders()` ekle |
| P1-3 | 🟠 YÜKSEK | `enums.ts` | 153 | `PLAN_LIMITS.BASIC.canPublishToMarket: false` stale | `true` yap |
| P2-1 | 🟡 ORTA | `useProducts.ts` | 329 | useTogglePublish marketplace cache güncellemiyor | `lists()`, `featured()` invalidate et |
| P2-2 | 🟡 ORTA | `useProducts.ts` | 242 | useUpdateProduct public cache güncellemiyor | `lists()`, `featured()` invalidate et |
| P2-3 | 🟡 ORTA | `useProducts.ts` | 227 | useCreateProduct featured cache güncellemiyor | `featured()` invalidate et |
| P3-1 | 🔵 DÜŞÜK | `api.ts` | 33 | Request body camelCase → backend case-insensitive | PascalCase transform ekle (risk mitigation) |

---

## Uygulama Önceliği

```
P0 (Hemen) → FIX-1, FIX-2, FIX-3, FIX-4
P1 (Bu Sprint) → FIX-5, FIX-6, FIX-9
P2 (Sonraki Sprint) → FIX-7, FIX-8
P3 (Tech Debt) → P3-1
```
