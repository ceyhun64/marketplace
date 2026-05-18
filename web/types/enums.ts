// ─────────────────────────────────────────────────────────────────────────────
// types/enums.ts — TS string unions matching backend C# enums
// ─────────────────────────────────────────────────────────────────────────────

// ── UserRole ─────────────────────────────────────────────────────────────────

export type UserRole = "Admin" | "Merchant" | "Courier" | "Customer";

export const USER_ROLES: Record<UserRole, string> = {
  Admin: "Admin",
  Merchant: "Seller",
  Courier: "Courier",
  Customer: "Customer",
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

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-(--warning-bg) text-(--warning) border border-(--warning-border)",
  PAYMENT_CONFIRMED: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  LABEL_GENERATED: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  COURIER_ASSIGNED: "bg-(--warning-bg) text-(--warning) border border-(--warning-border)",
  PICKED_UP: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  IN_TRANSIT: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  OUT_FOR_DELIVERY: "bg-(--danger-bg) text-(--danger) border border-(--danger-border)",
  DELIVERED: "bg-(--success-bg) text-(--success) border border-(--success-border)",
  FAILED: "bg-(--danger-bg) text-(--danger) border border-(--danger-border)",
  CANCELLED: "bg-(--off-white-2) text-(--text-secondary) border border-(--border-light)",
};

/** Can the order no longer be cancelled? */
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
  PENDING: "Pending",
  LABEL_GENERATED: "Label Generated",
  COURIER_ASSIGNED: "Courier Assigned",
  PICKED_UP: "Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
};

export const SHIPMENT_STATUS_COLORS: Record<ShipmentStatus, string> = {
  PENDING: "bg-(--warning-bg) text-(--warning) border border-(--warning-border)",
  LABEL_GENERATED: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  COURIER_ASSIGNED: "bg-(--warning-bg) text-(--warning) border border-(--warning-border)",
  PICKED_UP: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  IN_TRANSIT: "bg-(--info-bg) text-(--info) border border-(--info-border)",
  OUT_FOR_DELIVERY: "bg-(--danger-bg) text-(--danger) border border-(--danger-border)",
  DELIVERED: "bg-(--success-bg) text-(--success) border border-(--success-border)",
  FAILED: "bg-(--danger-bg) text-(--danger) border border-(--danger-border)",
};

// Order for determining completed steps in the tracking timeline
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
  EXPRESS: "Express (1-2 days)",
  REGULAR: "Standard (3-5 days)",
};

// Note: SHIPPING_COSTS constant is defined in @/lib/constants. Import from there.

// ── OrderSource ───────────────────────────────────────────────────────────────

export type OrderSource = "MARKETPLACE" | "ESTORE";

export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  MARKETPLACE: "Marketplace",
  ESTORE: "E-Store",
};

// ── PlanType ─────────────────────────────────────────────────────────────────

export type PlanType = "BASIC" | "PRO" | "ENTERPRISE";

export const PLAN_LABELS: Record<PlanType, string> = {
  BASIC: "Starter",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export const PLAN_COLORS: Record<PlanType, string> = {
  BASIC:      "bg-(--off-white-2) text-(--text-secondary)",
  PRO:        "bg-(--info-bg) text-(--info)",
  ENTERPRISE: "bg-(--off-white-2) text-(--text-primary) border border-(--border-mid)",
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
