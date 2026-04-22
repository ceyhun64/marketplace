// ─────────────────────────────────────────────────────────────────────────────
// types/entities.ts — Backend domain modelleriyle birebir eşleşen TS tipleri
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
  domainVerified: boolean;
  latitude: number;
  longitude: number;
  handlingHours: number;
  isSuspended: boolean;
  subscriptionPlan: PlanType;
  subscriptionId?: string;
  createdAt: string;
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
  productName: string; // snapshot — ürün silinse bile korunur
  productImage?: string;
  unitPrice: number; // snapshot
  quantity: number;
  lineTotal: number;
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
  merchantId: string;
  merchantStoreName?: string;
  source: OrderSource;
  status: OrderStatus;
  totalAmount: number;
  vatAmount: number;
  shippingCost: number;
  shippingRate: ShippingRate;
  shippingAddress: ShippingAddress | string; // API string(JSON) dönebilir
  paymentId?: string;
  invoiceId?: string;
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
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierVehicle?: string;
  status: ShipmentStatus;
  trackingNumber: string;
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
  description: string;
  iconUrl?: string;
  price: number;
  category: string;
  isActive: boolean;
}

export interface MerchantPlugin {
  id: string;
  merchantId: string;
  pluginId: string;
  plugin: Plugin;
  activatedAt: string;
  expiresAt?: string;
}
