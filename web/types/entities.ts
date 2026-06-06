// ─────────────────────────────────────────────────────────────────────────────
// types/entities.ts — TypeScript types that mirror the backend domain models
// ─────────────────────────────────────────────────────────────────────────────

import type {
  OrderStatus,
  ShipmentStatus,
  UserRole,
  PlanType,
  ShippingRate,
  OrderSource,
} from "./enums";

// ── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  merchantProfile?: MerchantProfile;
}

// ── MerchantProfile ──────────────────────────────────────────────────────────

export interface MerchantProfile {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  customDomain?: string;
  domainVerified?: boolean;
  latitude: number;
  longitude: number;
  handlingHours: number;
  isSuspended: boolean;
  isActive?: boolean;
  /** Canonical field name from backend MerchantResponse/MerchantProfileResponse */
  currentPlan?: string;
  /** Alias — mapped from currentPlan for backward compatibility */
  subscriptionPlan?: PlanType;
  subscriptionId?: string;
  planExpiresAt?: string;
  createdAt: string;
  productCount?: number;
  averageRating?: number | null;
  reviewCount?: number;
}

// ── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  iconUrl?: string;
  sortOrder: number;
  subCategories?: Category[];
  productCount?: number;
}

// ── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  merchantId: string;
  merchantStoreName?: string;
  merchantSlug?: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  images: string[];
  tags: string[];
  price: number;
  stock: number;
  publishToMarket: boolean;
  publishToStore: boolean;
  isApproved: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ── Order ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  /** Canonical field name — matches backend OrderItemDto.ProductImageUrl (camelCase: productImageUrl) */
  productImageUrl?: string;
  /** Alias kept for backward compatibility with components using productImage */
  productImage?: string;
  merchantId?: string;
  merchantStoreName?: string;
  unitPrice: number;
  quantity: number;
  /** Computed: unitPrice × quantity — always present in server responses */
  lineTotal: number;
  variantAttributes?: Record<string, string>;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district?: string;
  postalCode: string;
  country?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  /** Nullable — multi-merchant orders have items from multiple merchants */
  merchantId?: string | null;
  merchantStoreName?: string;
  source: OrderSource;
  status: OrderStatus;
  totalAmount: number;
  vatAmount: number;
  shippingCost: number;
  shippingRate: ShippingRate;
  shippingAddress: ShippingAddress;
  paymentId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  items: OrderItem[];
  shipment?: Shipment;
  createdAt: string;
  updatedAt?: string;
}

// ── Courier ──────────────────────────────────────────────────────────────────

export interface Courier {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  vehicleType?: string;
  vehiclePlate?: string;
  isAvailable: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  createdAt: string;
}

// ── Shipment ─────────────────────────────────────────────────────────────────

export interface ShipmentStatusEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  note?: string;
  location?: string;
  createdAt: string;
  createdByName?: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  /** Short reference number (first 8 chars of orderId) */
  orderNumber?: string;
  /** Customer full name — populated in admin/courier views */
  customerName?: string;
  /** Formatted delivery address — populated in admin/courier views */
  customerAddress?: string;
  /** Merchant store name — populated in admin/courier views */
  merchantName?: string;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierVehicle?: string;
  status: ShipmentStatus;
  trackingNumber: string;
  shippingRate?: ShippingRate | string;
  estimatedDelivery?: string;
  estimatedPickupStart?: string;
  estimatedPickupEnd?: string;
  estimatedDeliveryStart?: string;
  estimatedDeliveryEnd?: string;
  actualDeliveredAt?: string;
  labelUrl?: string;
  updatedAt?: string;
  events: ShipmentStatusEvent[];
}

// ── Invoice ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  merchantId: string;
  merchantStoreName?: string;
  customerId: string;
  customerName?: string;
  subTotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  pdfUrl?: string;
  issuedAt: string;
}

// ── Subscription ─────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  merchantId: string;
  plan: PlanType;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  price: number;
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export interface Plugin {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
  /** Monthly price — from backend PluginDto.MonthlyPrice */
  monthlyPrice: number;
  /** Backward compatibility alias */
  price?: number;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  minimumPlan: string;
  developerName?: string;
  documentationUrl?: string;
  /** Whether the current merchant has subscribed to this plugin */
  isSubscribed: boolean;
  createdAt: string;
}

export interface MerchantPlugin {
  id: string;
  pluginId: string;
  pluginName: string;
  pluginSlug: string;
  pluginIconUrl?: string;
  isActive: boolean;
  config?: string;
  subscribedAt: string;
  expiresAt?: string;
  autoRenew: boolean;
}

// ── AccountingEntry ───────────────────────────────────────────────────────────

export interface AccountingEntry {
  id: string;
  invoiceNumber: string;
  merchantStoreName: string;
  /** SALE | REFUND | ADJUSTMENT */
  entryType: "SALE" | "REFUND" | "ADJUSTMENT" | string;
  /** Positive = income, Negative = refund/adjustment */
  amount: number;
  description: string;
  paymentReference?: string;
  createdAt: string;
}
