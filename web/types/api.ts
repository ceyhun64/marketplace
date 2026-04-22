// ─────────────────────────────────────────────────────────────────────────────
// types/api.ts — API response sarmalayıcıları ve ortak request/response tipleri
// ─────────────────────────────────────────────────────────────────────────────

// ── Generic Wrappers ─────────────────────────────────────────────────────────

/** Backend'in ResponseDTOs.cs'indeki ApiResponse<T> karşılığı */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Backend'in PagedResult<T> karşılığı */
export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Auth DTOs ─────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    merchantId?: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ── Product DTOs ──────────────────────────────────────────────────────────────

export interface CreateProductRequest {
  name: string;
  description: string;
  categoryId: string;
  images: string[];
  tags: string[];
  price: number;
  stock: number;
  publishToMarket?: boolean;
  publishToStore?: boolean;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface PublishToggleRequest {
  publishToMarket?: boolean;
  publishToStore?: boolean;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  tags?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
}

// ── Category DTOs ─────────────────────────────────────────────────────────────

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  parentId?: string;
  iconUrl?: string;
  sortOrder?: number;
}

// ── Order DTOs ────────────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  items: { productId: string; quantity: number }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine: string;
    city: string;
    district?: string;
    postalCode: string;
  };
  shippingRate: "EXPRESS" | "REGULAR";
  source: "MARKETPLACE" | "ESTORE";
  merchantSlug?: string; // ESTORE siparişi için
}

export interface CreateOrderResponse {
  orderId: string;
  paymentToken: string; // iyzico checkout token
  paymentPageUrl?: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}

// ── Fulfillment DTOs ──────────────────────────────────────────────────────────

export interface AssignCourierRequest {
  shipmentId: string;
  courierId: string;
}

export interface UpdateShipmentStatusRequest {
  status: string;
  note?: string;
  location?: string;
}

export interface CalculateEtaRequest {
  merchantLatitude: number;
  merchantLongitude: number;
  customerLatitude: number;
  customerLongitude: number;
  shippingRate: "EXPRESS" | "REGULAR";
  handlingHours?: number;
}

export interface CalculateEtaResponse {
  distanceKm: number;
  handlingHours: number;
  transitHours: number;
  totalHours: number;
  estimatedPickupStart: string;
  estimatedPickupEnd: string;
  estimatedDeliveryStart: string;
  estimatedDeliveryEnd: string;
}

// ── Payment DTOs ──────────────────────────────────────────────────────────────

export interface CheckoutRequest {
  orderId: string;
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  callbackUrl: string;
}

export interface CheckoutResponse {
  paymentToken: string;
  checkoutFormContent?: string; // iyzico HTML form
  status: "SUCCESS" | "FAILURE";
  errorMessage?: string;
}

// ── Analytics DTOs ────────────────────────────────────────────────────────────

export type AnalyticsPeriod = "daily" | "weekly" | "monthly";

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orderCount: number;
  source?: "MARKETPLACE" | "ESTORE";
}

export interface MerchantStatsResponse {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  marketplaceRevenue: number;
  estoreRevenue: number;
  salesChart: SalesDataPoint[];
}

export interface AdminOverviewResponse {
  totalGmv: number;
  totalOrders: number;
  totalMerchants: number;
  totalCustomers: number;
  averageDeliveryHours: number;
  fulfillmentSuccessRate: number;
  revenueChart: SalesDataPoint[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  productImage?: string;
  totalRevenue: number;
  totalQuantity: number;
  marketplaceRevenue: number;
  estoreRevenue: number;
}

export interface ComparisonData {
  marketplace: { revenue: number; orders: number; conversionRate: number };
  estore: { revenue: number; orders: number; conversionRate: number };
}

// ── Store DTOs ────────────────────────────────────────────────────────────────

export interface UpdateStoreSettingsRequest {
  storeName?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  handlingHours?: number;
}

export interface SetDomainRequest {
  domain: string;
  isSubdomain: boolean;
}

// ── Merchant DTOs ─────────────────────────────────────────────────────────────

export interface CreateMerchantRequest {
  userId: string;
  storeName: string;
  slug: string;
  latitude: number;
  longitude: number;
  handlingHours?: number;
}

// ── Courier DTOs ──────────────────────────────────────────────────────────────

export interface CreateCourierRequest {
  userId: string;
  vehicleType?: string;
  vehiclePlate?: string;
}
