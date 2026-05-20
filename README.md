# Marketplace Platform

> **Enterprise-grade multi-vendor marketplace ecosystem** — a full-stack commerce platform supporting four distinct portals: Admin, Merchant, Courier, and Consumer. Built on .NET 10 and Next.js 15 with a clean, token-driven design system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Repository Directory Layout](#3-repository-directory-layout)
4. [Core Features Matrix](#4-core-features-matrix)
5. [Setup & Installation](#5-setup--installation)
6. [Environment Variables](#6-environment-variables)
7. [Docker (Recommended)](#7-docker-recommended)

---

## 1. Project Overview

This platform is a production-ready, multi-tenant marketplace with end-to-end commerce capabilities. It separates concerns across four independently scoped portals, each with its own authentication policy, data access layer, and purpose-built UI.

| Portal       | Path        | Audience           | Key Responsibilities                                                      |
| ------------ | ----------- | ------------------ | ------------------------------------------------------------------------- |
| **Consumer** | `/`         | Shoppers           | Browse products, place orders, track shipments, manage profile & wishlist |
| **Merchant** | `/merchant` | Sellers            | Manage catalogue, process orders, view analytics, configure e-store       |
| **Courier**  | `/courier`  | Delivery agents    | Accept assignments, confirm pickup/delivery, view earnings                |
| **Admin**    | `/admin`    | Platform operators | Approve merchants/products, manage users, audit logs, commission settings |

The system enforces **role-based access control (RBAC)** at the API layer via JWT Bearer tokens with claims-based policy evaluation (`AdminOnly`, `MerchantOnly`, `CourierOnly`, `CustomerOnly`). All inter-portal boundaries are hardened against IDOR and privilege-escalation vectors.

---

## 2. Tech Stack & Architecture

### 2.1 Frontend

| Concern                | Technology                                             | Version   |
| ---------------------- | ------------------------------------------------------ | --------- |
| **Framework**          | Next.js (App Router + Turbopack)                       | 16.2.x    |
| **UI Library**         | React                                                  | 19.2.x    |
| **Language**           | TypeScript (strict mode)                               | 5.x       |
| **Styling**            | Tailwind CSS v4 (canonical `bg-(--token)` syntax)      | 4.x       |
| **State Management**   | TanStack Query (server state) + Zustand (client state) | 5.x / 5.x |
| **Payments (client)**  | Stripe.js + `@stripe/react-stripe-js`                  | 9.x / 6.x |
| **Real-time**          | `@microsoft/signalr` (SignalR client)                  | 10.x      |
| **Forms / Validation** | Native controlled components + Zod                     | 4.x       |
| **Animations**         | Framer Motion                                          | 12.x      |
| **Charts**             | Recharts                                               | 3.x       |
| **Notifications**      | Sonner (toast)                                         | —         |
| **Image CDN**          | Cloudinary SDK                                         | 2.x       |
| **HTTP Client**        | Axios                                                  | 1.x       |

**Design System** — All components consume CSS custom properties (`var(--token)`) defined in the global stylesheet. The token set covers surfaces, text, borders, and semantic state colors (success, warning, danger, info). No hard-coded color values exist in component code.

**UI Primitive Layer** (`components/ui/`) — `Button`, `Input`, `Label`, `Select`, `Dialog`, `Table`, `Skeleton`, `Separator`, `Badge` — all built on Radix UI primitives with full keyboard navigation and ARIA compliance.

---

### 2.2 Backend

| Concern              | Technology                             | Version |
| -------------------- | -------------------------------------- | ------- |
| **Runtime**          | .NET                                   | 10.0    |
| **Web Framework**    | ASP.NET Core Web API                   | 10.0    |
| **Language**         | C# (nullable enabled, implicit usings) | 13      |
| **ORM**              | Entity Framework Core + Npgsql         | 10.0.x  |
| **Database**         | PostgreSQL                             | 16+     |
| **Caching / PubSub** | Redis (StackExchange.Redis)            | 2.x     |
| **CQRS / Mediator**  | MediatR                                | 14.x    |
| **Validation**       | FluentValidation                       | 12.x    |
| **Object Mapping**   | AutoMapper                             | 16.x    |
| **Auth**             | ASP.NET Core JWT Bearer                | —       |
| **Password Hashing** | BCrypt.Net-Next                        | 4.x     |
| **Background Jobs**  | Hangfire + Hangfire.PostgreSql         | 1.8.x   |
| **Real-time**        | ASP.NET Core SignalR (Redis backplane) | 10.0.x  |
| **Payments**         | Stripe.net                             | 47.x    |
| **Email**            | SendGrid                               | 9.x     |
| **SMS**              | Twilio                                 | 7.x     |
| **PDF Generation**   | QuestPDF                               | 2026.x  |
| **QR Codes**         | QRCoder                                | 1.x     |
| **Rate Limiting**    | AspNetCoreRateLimit                    | 5.x     |
| **Logging**          | Serilog                                | 10.x    |
| **API Docs**         | Swashbuckle (Swagger / OpenAPI)        | 6.x     |

**Architectural pattern** — Clean Architecture with CQRS. Commands and queries are separated under `Application/Commands/` and `Application/Queries/`, each handled by a dedicated `IRequestHandler<TRequest, TResponse>` registered via MediatR. The `Infrastructure/` layer owns all I/O (database, messaging, external services); the `Domain/` layer is persistence-ignorant.

**Transaction strategy** — Critical payment and stock-allocation paths run inside `IsolationLevel.RepeatableRead` transactions to prevent TOCTOU race conditions.

---

### 2.3 Infrastructure & Deployment

| Concern              | Technology                                               |
| -------------------- | -------------------------------------------------------- |
| **Containerisation** | Docker + Docker Compose (dev & prod variants)            |
| **Reverse Proxy**    | Nginx (`nginx/` configuration)                           |
| **CI/CD**            | GitHub Actions (`.github/workflows/`)                    |
| **Solution**         | `marketplace.sln` (multi-project Visual Studio solution) |

---

## 3. Repository Directory Layout

```
marketplace/
├── api/                              # .NET 10 Web API
│   ├── Application/
│   │   ├── Commands/                 # MediatR write-side handlers
│   │   │   ├── Admin/
│   │   │   ├── Auth/                 # Register, Login, ForgotPassword, RefreshToken
│   │   │   ├── Fulfillment/
│   │   │   ├── Merchants/
│   │   │   ├── Orders/
│   │   │   ├── Plugins/
│   │   │   └── Products/
│   │   └── Queries/                  # MediatR read-side handlers
│   │       ├── Admin/
│   │       ├── Analytics/
│   │       ├── Couriers/
│   │       ├── Fulfillment/
│   │       ├── Orders/
│   │       ├── Plugins/
│   │       └── Products/
│   ├── Common/
│   │   ├── DTOs/                     # Request / response data transfer objects
│   │   ├── Mappings/                 # AutoMapper profiles
│   │   └── Validators/               # FluentValidation validators (8 files)
│   ├── Controllers/                  # 17 API controllers
│   │   ├── AdminController.cs
│   │   ├── AnalyticsController.cs
│   │   ├── AuthController.cs
│   │   ├── CategoriesController.cs
│   │   ├── CouriersController.cs
│   │   ├── FulfillmentController.cs
│   │   ├── InvoiceController.cs
│   │   ├── MerchantsController.cs
│   │   ├── OrdersController.cs
│   │   ├── PaymentsController.cs
│   │   ├── PluginsController.cs
│   │   ├── ProductQuestionController.cs
│   │   ├── ProductsController.cs
│   │   ├── ReviewController.cs
│   │   ├── StoreController.cs
│   │   ├── SubscriptionsController.cs
│   │   └── WishlistController.cs
│   ├── Domain/
│   │   ├── Entities/                 # 17 EF Core entity classes
│   │   └── Enums/                    # 7 C# enum definitions
│   ├── Infrastructure/
│   │   ├── Hubs/                     # SignalR hubs (TrackingHub)
│   │   ├── Jobs/                     # Hangfire background jobs
│   │   │   ├── DelayedShipmentJob.cs
│   │   │   ├── NotificationJob.cs
│   │   │   ├── OrderStatusJob.cs
│   │   │   └── ShipmentStatusSyncJob.cs
│   │   ├── Middleware/               # Error handling, request logging
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs       # EF Core DbContext
│   │   │   └── DataSeeder.cs        # Seed data
│   │   ├── Repositories/
│   │   ├── Services/                 # 12 domain services + interfaces
│   │   └── Webhooks/                 # Stripe webhook handler
│   ├── Migrations/                   # EF Core migration history
│   ├── api.csproj
│   └── appsettings.json
│
├── api.Tests/                        # xUnit test project
│
├── web/                              # Next.js 16 frontend
│   ├── app/                          # App Router pages (~40 route segments)
│   │   ├── (public)/                 # Consumer-facing routes
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── product/[slug]/
│   │   │   ├── store/[slug]/
│   │   │   ├── search/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── track/
│   │   │   └── profile/
│   │   ├── admin/                    # Admin portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── merchants/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   ├── users/
│   │   │   ├── analytics/
│   │   │   ├── commission/
│   │   │   └── logs/
│   │   ├── merchant/                 # Merchant portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── catalogue/
│   │   │   ├── orders/
│   │   │   ├── analytics/
│   │   │   ├── shipments/
│   │   │   ├── store-settings/
│   │   │   ├── subscription/
│   │   │   ├── invoices/
│   │   │   ├── plugins/
│   │   │   └── reviews/
│   │   ├── courier/                  # Courier portal
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── shipments/
│   │   │   ├── earnings/
│   │   │   └── profile/
│   │   └── auth/                     # Auth flows
│   ├── components/
│   │   ├── layout/                   # Header, Footer, Sidebar, Nav
│   │   ├── modules/                  # 42 feature-specific component sets
│   │   ├── providers/                # QueryClientProvider, AuthProvider
│   │   └── ui/                       # Base primitives (Button, Input, Dialog…)
│   ├── hooks/                        # 10 custom React hooks
│   ├── lib/                          # api.ts, auth.ts, format.ts, constants.ts…
│   ├── queries/                      # 16 TanStack Query hook files
│   ├── types/                        # api.ts, entities.ts, enums.ts
│   └── package.json
│
├── nginx/                            # Reverse proxy configuration
├── docker-compose.yml                # Development stack
├── docker-compose.prod.yml           # Production stack
├── marketplace.sln
└── README.md
```

---

## 4. Core Features Matrix

### 4.1 Security & Data Integrity

| Feature                     | Implementation                                                                  |
| --------------------------- | ------------------------------------------------------------------------------- |
| JWT Bearer authentication   | HS256 tokens, 15-minute expiry, `ITokenService`                                 |
| Refresh token rotation      | New token issued on every refresh; old token invalidated                        |
| IDOR prevention in payments | `orderId` derived from Stripe-signed `PaymentIntent.Metadata`, not request body |
| TOCTOU race prevention      | `IsolationLevel.RepeatableRead` transactions on `IsPaid` stock allocation       |
| Double-shipment guard       | Existence check before `_db.Shipments.Add`                                      |
| Stock restoration on cancel | Iterates order items and increments `product.Stock` on cancellation             |
| Account status gate         | Login rejected for `Suspended`, `Rejected`, `PendingApproval` accounts          |
| Rate limiting               | `AspNetCoreRateLimit` middleware on sensitive endpoints                         |
| CORS policy                 | `AllowAnyOrigin` in Development only; `FRONTEND_URL` env var in Production      |
| Soft deletes                | `IsDeleted` global query filter on `Product`; inactive merchant filter          |
| FluentValidation            | All 8 validator classes with English error messages                             |

### 4.2 Admin Portal

| Feature                                   | Route / Component                                               |
| ----------------------------------------- | --------------------------------------------------------------- | ------- |
| KPI dashboard                             | `GET /api/admin/dashboard` → `AdminDashboardPage`               |
| Merchant application approval / rejection | `POST /api/admin/merchants/{id}/approve                         | reject` |
| Merchant CRUD & plan management           | `AdminMerchantsPage`, `AdminCouriersPage`                       |
| Product moderation queue                  | `GET /api/admin/products/pending`                               |
| Order management with status override     | `AdminOrdersPage` (safe `data?.pagination?.total` guard)        |
| User management with role filter          | `GET /api/admin/users`                                          |
| Analytics (daily/weekly/monthly)          | `AdminAnalyticsPage` with `ComparisonChart`                     |
| Commission & fee settings                 | `GET /api/admin/settings/commission` → `AdminCommissionPage`    |
| Audit log (derived, paginated)            | `GET /api/admin/logs` → `AdminAuditLogsPage` (30s auto-refresh) |
| Subscription management                   | `AdminSubscriptionsPage`                                        |

### 4.3 Merchant Portal

| Feature                                     | Route / Component                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| Product catalogue (CRUD)                    | `MerchantCatalogueView` — `<Dialog>`-based create/edit/delete                |
| Incoming order fulfillment                  | `MerchantOrdersView` — pack action transitions order to `LabelGenerated`     |
| Sales analytics                             | `MerchantAnalyticsDashboard` — KPIs, `MerchantSalesChart`, `ComparisonChart` |
| Channel comparison (Marketplace vs E-Store) | `useMerchantComparison` → revenue, orders, avg order, conversion rate        |
| Top products ranking                        | `useMerchantTopProducts`                                                     |
| Shipment tracking                           | `MerchantShipmentsView`                                                      |
| Store settings (logo, banner, slug, domain) | `StoreSettingsForm`                                                          |
| Subdomain / custom domain                   | Controlled by `PlanType` (`PRO` → subdomain, `ENTERPRISE` → custom domain)   |
| Subscription management                     | `MerchantSubscriptionView` — `SubscriptionCard` per plan                     |
| Plugin marketplace                          | `MerchantPluginsView`                                                        |
| Invoice history                             | `InvoicesTable` with PDF download                                            |
| Review management                           | `MerchantReviewsView`                                                        |

### 4.4 Courier Portal

| Feature                                   | Route / Component                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| Dashboard with live stats                 | `CourierDashboardPage` — active, pending pickup, in-transit, today delivered |
| Availability toggle (online/offline)      | `useToggleCourierAvailability`                                               |
| Shipment list with search & status filter | `CourierShipmentsPage`                                                       |
| Pickup confirmation                       | `usePickupConfirm` → `ShipmentStatus.PickedUp`                               |
| Delivery confirmation with recipient name | `useDelivered` + `ActionDialog`                                              |
| Shipment detail page                      | `CourierShipmentDetailPage`                                                  |
| Earnings history & summary                | `CourierEarningsPage` — total, monthly, pending payout, weekly deliveries    |
| Courier profile                           | `CourierProfilePage`                                                         |

### 4.5 Consumer Portal

| Feature                                   | Route / Component                                                   |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Product discovery (search, filter, sort)  | `SearchPage` — fully wired add-to-cart with stock guard             |
| Product detail (images, reviews, Q&A)     | `product/[slug]`                                                    |
| Shopping cart (persistent)                | `use-cart.ts` (Zustand)                                             |
| Multi-step checkout                       | `CheckoutPage` — per-field validation, `<Loader2>` on submit        |
| Stripe payment flow                       | `PaymentCheckoutRequestDto` → `PaymentIntent` → `ConfirmPaymentDto` |
| Order history & status tracking           | `OrdersPage`, `OrdersController`                                    |
| Real-time shipment tracking               | `useSignalRTracking` → `TrackingHub`                                |
| Wishlist (authenticated + local fallback) | `useWishlist`, `useHybridWishlist`                                  |
| User profile                              | `ProfilePage` — orders, addresses, wishlist tab, password change    |
| Notifications centre                      | `NotificationsPage` — filter by type, mark-all-read, delete         |
| Store pages                               | `store/[slug]` with merchant products                               |
| Product comparison                        | `/compare`                                                          |
| Deals, Flash Sale, New Arrivals           | Dedicated listing pages                                             |

### 4.6 Payments & Notifications

| Feature                    | Detail                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Stripe PaymentIntent flow  | Create → frontend `confirmCardPayment` → server-side confirm                       |
| Stripe webhook handler     | `payment_intent.succeeded` auto-confirms order; signature verified                 |
| Refund API                 | `POST /api/payments/{id}/refund` → Stripe `RefundService`                          |
| PDF invoice generation     | QuestPDF + auto-email on payment confirmation                                      |
| Email notifications        | SendGrid — verification, password reset, approval, invoice, order status           |
| SMS notifications          | Twilio — shipment status changes, courier assignment                               |
| Background jobs (Hangfire) | `OrderStatusJob`, `ShipmentStatusSyncJob`, `NotificationJob`, `DelayedShipmentJob` |
| SignalR real-time updates  | `TrackingHub` — shipment group push on every status transition                     |

### 4.7 Subscription & Monetisation

| Plan           | Price        | Product Limit | Marketplace Listing | Subdomain | Custom Domain |
| -------------- | ------------ | ------------- | ------------------- | --------- | ------------- |
| **Basic**      | Free         | 50            | No                  | No        | No            |
| **Pro**        | $299 / month | Unlimited     | Yes                 | Yes       | No            |
| **Enterprise** | $799 / month | Unlimited     | Yes                 | Yes       | Yes           |

Platform commission: **8%** marketplace fee + **2.9% + $0.30** payment processing fee.

---

## 5. Setup & Installation

### Prerequisites

| Tool              | Minimum Version |
| ----------------- | --------------- |
| .NET SDK          | 10.0            |
| Node.js           | 20 LTS          |
| PostgreSQL        | 16              |
| Redis             | 7               |
| Docker (optional) | 24+             |

---

### 5.1 Backend (API)

```bash
# Navigate to the API project
cd api

# Restore NuGet packages
dotnet restore

# Apply database migrations
dotnet ef database update

# Run in development
dotnet run
```

The API starts on **`https://localhost:5001`** (HTTPS) and **`http://localhost:5000`** (HTTP) by default.

Swagger UI is available at: `https://localhost:5001/swagger`

---

### 5.2 Frontend (Web)

```bash
# Navigate to the web project
cd web

# Install dependencies
npm install

# Start development server (Turbopack)
npm run dev
```

The frontend starts on **`http://localhost:3000`** by default.

---

### 5.3 Run both concurrently (from repo root)

```bash
# Terminal 1 — API
cd api && dotnet run

# Terminal 2 — Frontend
cd web && npm run dev
```

---

## 6. Environment Variables

### Backend (`api/appsettings.Development.json` or environment)

```jsonc
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=marketplace;Username=postgres;Password=yourpassword",
  },
  "Redis": {
    "ConnectionString": "localhost:6379",
  },
  "JWT_SECRET": "your-256-bit-secret-key",
  "JWT_EXPIRES_MINUTES": "15",
  "REFRESH_EXPIRES_DAYS": "7",
  "STRIPE_SECRET_KEY": "sk_test_...",
  "STRIPE_PUBLISHABLE_KEY": "pk_test_...",
  "STRIPE_WEBHOOK_SECRET": "whsec_...",
  "STRIPE_CURRENCY": "try",
  "SENDGRID_API_KEY": "SG...",
  "SENDGRID_FROM_EMAIL": "noreply@yourdomain.com",
  "SENDGRID_FROM_NAME": "Marketplace",
  "TWILIO_ACCOUNT_SID": "AC...",
  "TWILIO_AUTH_TOKEN": "...",
  "TWILIO_FROM_NUMBER": "+1...",
  "FRONTEND_URL": "http://localhost:3000",
  "Cloudinary": {
    "CloudName": "...",
    "ApiKey": "...",
    "ApiSecret": "...",
  },
}
```

### Frontend (`web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_SIGNALR_URL=http://localhost:5000
```

---

## 7. Docker (Recommended)

The repository ships with pre-configured Compose files that bring up the full stack — PostgreSQL, Redis, API, and web — with a single command.

### Development

```bash
# Build and start all services
docker compose up --build

# Stop all services
docker compose down
```

### Production

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Service endpoints when running via Docker:

| Service            | URL                              |
| ------------------ | -------------------------------- |
| Frontend           | `http://localhost:3000`          |
| API                | `http://localhost:5000`          |
| Swagger            | `http://localhost:5000/swagger`  |
| Hangfire Dashboard | `http://localhost:5000/hangfire` |
| PostgreSQL         | `localhost:5432`                 |
| Redis              | `localhost:6379`                 |

---

## Contributing

1. Branch naming: `feature/<scope>`, `fix/<scope>`, `chore/<scope>`
2. All API changes must include a corresponding EF Core migration if the data model changes.
3. All new endpoints must have a corresponding FluentValidation validator.
4. Frontend components must consume design tokens exclusively — no hard-coded color values.
5. Run `dotnet test` and `npm run build` before opening a pull request.

---

_Built with .NET 10 · Next.js 16 · PostgreSQL · Redis · Stripe · SignalR_
