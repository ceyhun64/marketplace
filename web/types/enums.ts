// ─────────────────────────────────────────────────────────────────────────────
// types/enums.ts — Backend C# enum'larıyla birebir eşleşen TS string union'ları
// ─────────────────────────────────────────────────────────────────────────────

// ── UserRole ─────────────────────────────────────────────────────────────────

export type UserRole = "Admin" | "Merchant" | "Courier" | "Customer";

export const USER_ROLES: Record<UserRole, string> = {
  Admin: "Admin",
  Merchant: "Satıcı",
  Courier: "Kurye",
  Customer: "Müşteri",
};

// ── OrderStatus ──────────────────────────────────────────────────────────────

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
  PENDING: "Beklemede",
  PAYMENT_CONFIRMED: "Ödeme Onaylandı",
  LABEL_GENERATED: "Etiket Oluşturuldu",
  COURIER_ASSIGNED: "Kurye Atandı",
  PICKED_UP: "Kurye Teslim Aldı",
  IN_TRANSIT: "Yolda",
  OUT_FOR_DELIVERY: "Dağıtımda",
  DELIVERED: "Teslim Edildi",
  FAILED: "Başarısız",
  CANCELLED: "İptal Edildi",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAYMENT_CONFIRMED: "bg-blue-100 text-blue-800",
  LABEL_GENERATED: "bg-indigo-100 text-indigo-800",
  COURIER_ASSIGNED: "bg-purple-100 text-purple-800",
  PICKED_UP: "bg-orange-100 text-orange-800",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800",
  OUT_FOR_DELIVERY: "bg-teal-100 text-teal-800",
  DELIVERED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

/** Sipariş artık iptal edilemez mi? */
export const NON_CANCELLABLE_STATUSES: OrderStatus[] = [
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
];

// ── ShipmentStatus ────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | "PENDING"
  | "LABEL_GENERATED"
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED";

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: "Beklemede",
  LABEL_GENERATED: "Etiket Oluşturuldu",
  COURIER_ASSIGNED: "Kurye Atandı",
  PICKED_UP: "Kurye Teslim Aldı",
  IN_TRANSIT: "Yolda",
  OUT_FOR_DELIVERY: "Dağıtımda",
  DELIVERED: "Teslim Edildi",
  FAILED: "Başarısız",
};

export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  LABEL_GENERATED: "bg-indigo-100 text-indigo-800",
  COURIER_ASSIGNED: "bg-purple-100 text-purple-800",
  PICKED_UP: "bg-orange-100 text-orange-800",
  IN_TRANSIT: "bg-cyan-100 text-cyan-800",
  OUT_FOR_DELIVERY: "bg-teal-100 text-teal-800",
  DELIVERED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

// Tracking timeline'da tamamlanmış adımları belirlemek için sıra
export const SHIPMENT_STATUS_ORDER: ShipmentStatus[] = [
  "PENDING",
  "LABEL_GENERATED",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

// ── ShippingRate ──────────────────────────────────────────────────────────────

export type ShippingRate = "EXPRESS" | "REGULAR";

export const SHIPPING_RATE_LABELS: Record<ShippingRate, string> = {
  EXPRESS: "Ekspres (1-2 gün)",
  REGULAR: "Standart (3-5 gün)",
};

export const SHIPPING_COSTS: Record<ShippingRate, number> = {
  EXPRESS: 49.9,
  REGULAR: 19.9,
};

// ── OrderSource ───────────────────────────────────────────────────────────────

export type OrderSource = "MARKETPLACE" | "ESTORE";

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  MARKETPLACE: "Pazaryeri",
  ESTORE: "E-Mağaza",
};

// ── PlanType ─────────────────────────────────────────────────────────────────

export type PlanType = "BASIC" | "PRO" | "ENTERPRISE";

export const PLAN_LABELS: Record<PlanType, string> = {
  BASIC: "Başlangıç",
  PRO: "Pro",
  ENTERPRISE: "Kurumsal",
};

export const PLAN_COLORS: Record<PlanType, string> = {
  BASIC: "bg-gray-100 text-gray-800",
  PRO: "bg-blue-100 text-blue-800",
  ENTERPRISE: "bg-purple-100 text-purple-800",
};

export const PLAN_LIMITS: Record<
  PlanType,
  {
    maxProducts: number;
    canPublishToMarket: boolean;
    canUseCustomDomain: boolean;
    canUseSubdomain: boolean;
  }
> = {
  BASIC: {
    maxProducts: 50,
    canPublishToMarket: false,
    canUseCustomDomain: false,
    canUseSubdomain: false,
  },
  PRO: {
    maxProducts: Infinity,
    canPublishToMarket: true,
    canUseCustomDomain: false,
    canUseSubdomain: true,
  },
  ENTERPRISE: {
    maxProducts: Infinity,
    canPublishToMarket: true,
    canUseCustomDomain: true,
    canUseSubdomain: true,
  },
};
