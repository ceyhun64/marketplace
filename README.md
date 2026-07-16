# Marketplace & Fulfillment Platform

> Multi-tenant, multi-vendor marketplace with an integrated fulfillment/shipping
> workflow. A single Next.js frontend serves four role-scoped experiences
> (Consumer, Merchant, Courier, Admin) backed by an ASP.NET Core (.NET 10) Web API
> built with Clean Architecture and CQRS (MediatR).

This README is the authoritative documentation for the whole repository (API + Web).
It is written against the actual source. Where a detail could not be verified from
the code, it is called out explicitly rather than guessed.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Folder Structure](#4-folder-structure)
5. [Features](#5-features)
6. [Installation](#6-installation)
7. [Environment Variables](#7-environment-variables)
8. [Available Scripts](#8-available-scripts)
9. [Development & Docker](#9-development--docker)
10. [Build](#10-build)
11. [Deployment](#11-deployment)
12. [API Reference](#12-api-reference)
13. [Database](#13-database)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [Configuration](#15-configuration)
16. [Troubleshooting](#16-troubleshooting)
17. [Reference Documents](#17-reference-documents)
18. [License](#18-license)

---

## 1. Overview

The platform is a multi-tenant marketplace. The frontend uses route groups/segments
to serve distinct audiences from one Next.js app, and the API enforces role-based
access with JWT bearer tokens and named authorization policies.

| Audience | Frontend area (`web/app/`) | Purpose |
| -------- | -------------------------- | ------- |
| Consumer | `/`, `product`, `store`, `cart`, `checkout`, `orders`, `track`, `profile`, `wishlist`, `wallet`, … | Browse, buy, track orders, manage profile/wishlist/wallet |
| Merchant | `merchant/` | Catalogue, orders, analytics, store settings, subscription, plugins, invoices |
| Courier  | `courier/` | Shipment assignments, pickup/delivery confirmation, earnings |
| Admin    | `admin/` | Merchant/courier/product moderation, users, analytics, settings, withdrawals |

> Note: The exact set of role portals is inferred from the `web/app/` route
> segments and the API's authorization policies (`AdminOnly`, `MerchantOnly`,
> `CourierOnly`, `CustomerOnly`, `AdminOrMerchant`, `AdminOrCourier`). The frontend
> `proxy.ts` middleware additionally supports wildcard **store subdomains** (an
> e-store per merchant) by rewriting `*.<platform-domain>` requests.

---

## 2. Technology Stack

### API (`api/`) — verified from `api/api.csproj` and `Program.cs`

| Concern | Technology | Version (from `api.csproj`) |
| ------- | ---------- | --------------------------- |
| Runtime / framework | .NET / ASP.NET Core Web API | `net10.0` |
| Language | C# (nullable + implicit usings enabled) | — |
| ORM / DB provider | EF Core + Npgsql | 10.0.5 / 10.0.1 |
| Database | PostgreSQL | 16 (compose images) |
| Caching / SignalR backplane | Redis via StackExchange.Redis | 2.12.14 |
| CQRS / Mediator | MediatR | 14.1.0 |
| Validation | FluentValidation | 12.1.1 |
| Object mapping | AutoMapper | 16.1.1 |
| Auth | `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.0.5 |
| Password hashing | BCrypt.Net-Next | 4.1.0 |
| Background jobs | Hangfire + Hangfire.PostgreSql | 1.8.23 / 1.21.1 |
| Real-time | ASP.NET Core SignalR + StackExchange.Redis backplane | 10.0.7 |
| Payments | Stripe.net | 47.3.0 |
| Email | SendGrid | 9.29.3 |
| SMS | Twilio | 7.6.0 |
| PDF generation | QuestPDF | 2026.2.4 |
| QR codes | QRCoder | 1.8.0 |
| Rate limiting | AspNetCoreRateLimit | 5.0.0 |
| Logging | Serilog (Console + File sinks) | 10.0.0 |
| Health checks | AspNetCore.HealthChecks.NpgSql / .Redis | 9.0.0 |
| API docs | Swashbuckle (Swagger / OpenAPI) | 6.9.0 |

> There is also a second payment provider referenced by configuration keys
> (`IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`) in
> `appsettings.Development.json`. No Iyzico NuGet package is referenced, so this
> appears to be a raw-HTTP integration; the depth of the Iyzico path was not fully
> verified.

### Web (`web/`) — verified from `web/package.json`

| Concern | Technology | Version |
| ------- | ---------- | ------- |
| Framework | Next.js (App Router) | 16.2.3 |
| UI runtime | React / React DOM | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) + `tw-animate-css` | ^4 |
| UI primitives | `radix-ui`, `@base-ui/react`, `shadcn`, `cmdk`, `vaul`, `embla-carousel-react` | — |
| Server state | TanStack Query (+ devtools) | ^5.99 |
| Client state | Zustand | ^5.0 |
| Forms / validation | React Hook Form + `@hookform/resolvers` + Zod | ^7 / ^5 / ^4 |
| Payments (client) | `@stripe/stripe-js` + `@stripe/react-stripe-js` | ^9 / ^6 |
| Real-time | `@microsoft/signalr` | ^10 |
| Charts | Recharts | ^3 |
| Animations | Framer Motion | ^12 |
| Notifications | Sonner | ^2 |
| Image SDK | Cloudinary | ^2.9 |
| HTTP client | Axios | ^1.15 |
| Testing | Jest 30 + Testing Library + ts-jest | — |

---

## 3. Architecture

### Runtime topology (production — from `docker-compose.prod.yml` and `nginx/`)

```
                        Internet (80/443)
                             │
                       ┌─────────────┐
                       │    nginx     │  TLS (Let's Encrypt), gzip, security headers
                       │ (external)   │  routes by hostname
                       └──────┬───────┘
             web (yourplatform.com) │ api (api.yourplatform.com) │ *.yourplatform.com → store
                       ┌───────────┼──────────────┐
                       ▼           ▼              (wildcard store subdomains → web)
                 ┌──────────┐  ┌──────────┐
                 │  web     │  │   api     │
                 │ Next.js  │  │ .NET 10   │
                 │  :3000   │  │  :5000    │
                 └──────────┘  └────┬─────┘
                                    │  (internal network only)
                          ┌─────────┴─────────┐
                          ▼                   ▼
                    ┌──────────┐        ┌──────────┐
                    │ postgres │        │  redis    │
                    │   :5432  │        │  :6379    │
                    └──────────┘        └──────────┘
```

- Two Docker networks: `internal` (postgres/redis, not internet-facing) and
  `external` (nginx + web + api).
- `nginx/conf.d/marketplace.conf` routes three virtual hosts: the frontend, the
  API (`api.` subdomain), and a wildcard `*.<domain>` regex host that forwards a
  captured `store_slug` to the web app. It disables buffering for
  `/api/payments/webhook` (Stripe raw body) and holds `/hubs/` WebSocket
  connections open (SignalR).

### API — Clean Architecture + CQRS (confirmed)

The `api/` project is a single assembly organised into Clean Architecture layers.
CQRS is implemented with MediatR: requests flow through the pipeline below.

- `Domain/` — persistence-ignorant entities and enums.
- `Application/` — `Commands/`, `Queries/`, and `Behaviours/` (MediatR pipeline).
  Registered pipeline behaviours (see `Program.cs`):
  - `ValidationBehaviour` — runs FluentValidation validators on every request.
  - `CacheInvalidationBehaviour` — deletes Redis keys after commands that
    implement `IInvalidatesCache`.
  - `StockReservationBehaviour` — wraps order creation in a Redis distributed lock
    to prevent overselling.
- `Infrastructure/` — `Persistence/` (`AppDbContext`, `DataSeeder`), `Services/`,
  `Repositories/`, `Jobs/` (Hangfire), `Hubs/` (SignalR `TrackingHub`),
  `Middleware/`, `Webhooks/`.
- `Common/` — `DTOs/`, `Mappings/` (AutoMapper), `Validators/` (8 validators),
  `Serialization/`.
- `Controllers/` — thin HTTP controllers (29) that delegate to MediatR/services.

Enums are serialized to/from **SCREAMING_SNAKE_CASE** strings and JSON properties
use camelCase (configured in `Program.cs`), to match the frontend's TypeScript types.

---

## 4. Folder Structure

```
MarketPlace/
├── api/                      # ASP.NET Core (.NET 10) Web API
│   ├── Application/
│   │   ├── Behaviours/       # MediatR pipeline (validation, cache, stock lock)
│   │   ├── Commands/         # CQRS write handlers
│   │   └── Queries/          # CQRS read handlers
│   ├── Common/
│   │   ├── DTOs/  Mappings/  Serialization/
│   │   └── Validators/       # 8 FluentValidation classes
│   ├── Controllers/          # 29 controllers
│   ├── Domain/
│   │   ├── Entities/         # 33 EF Core entities
│   │   └── Enums/            # 8 enums
│   ├── Infrastructure/
│   │   ├── Hubs/  Jobs/  Middleware/  Persistence/  Repositories/
│   │   ├── Services/         # domain/application services (+ interfaces)
│   │   └── Webhooks/
│   ├── Migrations/           # EF Core migrations (7 migrations)
│   ├── appsettings.json      # committed, non-secret defaults
│   ├── Program.cs            # startup, DI, middleware, Hangfire jobs
│   ├── Dockerfile
│   └── api.csproj
├── api.Tests/                # xUnit + Moq + FluentAssertions + EF InMemory
├── web/                      # Next.js 16 frontend
│   ├── app/                  # App Router segments (admin/ merchant/ courier/ + public)
│   │   └── api/              # Route handlers: auth, health, revalidate, upload
│   ├── components/           # UI + feature components
│   ├── hooks/                # React hooks (cart, auth, checkout, SignalR tracking, …)
│   ├── lib/                  # api.ts, auth.ts, signalr.ts, cloudinary.ts, format.ts…
│   ├── queries/              # 19 TanStack Query hook files
│   ├── types/                # TypeScript types
│   ├── proxy.ts              # middleware: role guard + store-subdomain rewrite
│   ├── jest.config.ts / jest.setup.ts
│   ├── Dockerfile
│   └── package.json
├── nginx/conf.d/marketplace.conf   # reverse-proxy vhosts
├── docker-compose.yml              # DEV: postgres + redis ONLY
├── docker-compose.prod.yml         # PROD: postgres, redis, api, web, nginx
├── .github/workflows/deploy.yml    # CI/CD pipeline
├── marketplace.sln                 # includes api + api.Tests
├── style_design.html               # design/brand guide (standalone, see §17)
├── system_architecture.html        # technical plan doc (standalone, see §17)
└── README.md
```

> `project_tree.txt` also exists at the root; it is a stale snapshot — trust the
> live tree above.

---

## 5. Features

Only features with confirmed backing code are listed.

### 5.1 API capabilities (from controllers / `Program.cs`)

- JWT bearer auth with role policies; register (customer & merchant), login,
  refresh, logout, email verification, forgot/reset password (`AuthController`).
- Product catalogue, categories, product questions, reviews, wishlist.
- Orders and per-vendor orders, fulfillment workflow, shipments with status
  history, courier assignment and delivery confirmation.
- Payments via Stripe (checkout intent, confirm, refund, webhook) with a
  server-side confirm fallback path.
- Invoices (per vendor order) with QuestPDF generation.
- Merchant subscriptions (Basic/Pro/Enterprise), plugins, store settings.
- Wallets & escrow: merchant wallet, customer wallet, withdrawal requests
  (merchant + customer, admin approval), accounting entries, reconciliation.
- Coupons, referrals, returns/RMA, disputes.
- Analytics (merchant) and admin dashboards, audit log, site/hero settings.
- Background jobs (Hangfire, scheduled in `Program.cs`):
  `OrderStatusJob` (every 5 min), `NotificationJob` (every min),
  `DelayedShipmentJob` (hourly), `ShipmentStatusSyncJob` (every 30 min),
  `EscrowSettlementJob` (daily 02:00 UTC), `CourierDispatchJob` (every 2 min).
  Additional registered jobs: `PostPaymentSideEffectsJob`, `DataExportJob`,
  `AccountPurgeJob`.
- Real-time shipment tracking via SignalR `TrackingHub` at `/hubs/tracking`.
- Rate limiting on auth, payment, order, notification and product endpoints
  (in-memory per instance; see the note in `Program.cs`).
- Health endpoints: `/health` (liveness) and `/health/ready` (Postgres + Redis).
- Notifications via SendGrid (email) and Twilio (SMS); credentials optional —
  Twilio only initializes when SID/token are present.

### 5.2 Web capabilities (from `web/app`, `queries/`, `hooks/`)

- Role-scoped areas for admin, merchant, courier, plus a broad public storefront
  (search, product/store detail, cart, checkout, orders, tracking, wishlist,
  wallet, referral, returns, compare, deals, flash-sale, new-arrivals, and
  content pages such as about/blog/faq/help-center).
- Data fetching centralized in `web/queries/*` (TanStack Query) over an Axios
  client (`web/lib/api.ts`) with automatic camelCase mapping and token refresh.
- Real-time tracking through `@microsoft/signalr` (`web/lib/signalr.ts`,
  `hooks/use-signalr-tracking.ts`).
- Cloudinary image upload (`app/api/upload/route.ts`, `lib/cloudinary.ts`).

> No screenshots are included in this README because no committed screenshot image
> assets were found for it to reference.

---

## 6. Installation

### Prerequisites

| Tool | Version | Source of truth |
| ---- | ------- | --------------- |
| .NET SDK | 10.0.x | `api.csproj` (`net10.0`), CI `setup-dotnet` |
| Node.js | 20 | `web/Dockerfile` (`node:20-alpine`), CI `setup-node` |
| PostgreSQL | 16 | compose images |
| Redis | 7 | compose images |
| Docker | recent | optional, for compose |

The fastest way to get Postgres + Redis is the dev compose file (§9). You can then
run the API and Web on the host.

### 6.1 API

```bash
cd api
dotnet restore
# Apply EF Core migrations (the app also auto-migrates on startup — see Program.cs)
dotnet ef database update
dotnet run
```

Local dev URLs come from `api/Properties/launchSettings.json`:
`http://localhost:5010` and `https://localhost:7287`.
Swagger UI (Development only) is served at `/swagger`.

> `Program.cs` requires `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`
> and `STRIPE_SECRET_KEY`. In Development these come from
> `appsettings.Development.json` (git-ignored); in non-Development the app fails
> fast if any are missing.

### 6.2 Web

```bash
cd web
npm install
npm run dev        # plain `next dev` (no Turbopack flag configured)
```

Frontend runs on `http://localhost:3000`. It talks to the API via
`NEXT_PUBLIC_API_URL` (default in `lib/api.ts` is `http://localhost:5010`).

---

## 7. Environment Variables

Values are supplied through git-ignored files (`appsettings.Development.json`,
`appsettings.Production.json`, `web/.env*`, and `.env.prod` for prod compose).
**Never commit real secrets.** Only names and purposes are documented below.

### 7.1 API (read via `IConfiguration` in `Program.cs` / services)

| Variable | Purpose |
| -------- | ------- |
| `DATABASE_URL` | PostgreSQL connection (Npgsql keyword string **or** `postgresql://` URL; normalized in `Program.cs`) |
| `REDIS_URL` | Redis connection (`host:port[,password=…]` or `redis://` URL) |
| `JWT_SECRET` | HMAC signing key for JWT (≥ 32 chars) |
| `JWT_ISSUER` | Expected token issuer |
| `JWT_AUDIENCE` | Expected token audience |
| `JWT_EXPIRES_MINUTES` | Access-token lifetime |
| `REFRESH_EXPIRES_DAYS` | Refresh-token lifetime |
| `FRONTEND_URL` | Allowed CORS origin in non-Development; used in outbound links |
| `PLATFORM_URL` | Platform base URL |
| `STRIPE_SECRET_KEY` | Stripe API secret (set globally at startup) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret (**required in Production**) |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` / `SENDGRID_FROM_NAME` | Transactional email |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | SMS (optional — skipped if unset) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image hosting (also mirrored under a `Cloudinary` section in `appsettings.json`) |
| `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` / `IYZICO_BASE_URL` | Iyzico payment provider (present in dev config; integration depth unverified) |
| `WEBHOOK_URLS` | Outbound webhook targets (used by `WebhookService`) |

Non-secret tunables live in `appsettings.json` under `Serilog`, `Shipping`
(cost tiers, volumetric divisor), and `Commission` (`MarketplaceFeePercent` 8.0,
`PaymentProcessingFeePercent` 2.9, `PaymentProcessingFlatFee` 0.30, subscription
prices Basic 0 / Pro 299 / Enterprise 799, `CurrencyCode` USD).

### 7.2 Web (`NEXT_PUBLIC_*` are exposed to the browser)

| Variable | Purpose | Source |
| -------- | ------- | ------ |
| `NEXT_PUBLIC_API_URL` | Base URL of the API (browser side) | `lib/api.ts`, CI, prod compose |
| `NEXT_PUBLIC_SIGNALR_HUB` | SignalR tracking hub URL | CI, prod compose |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | prod compose |
| `NEXT_PUBLIC_PLATFORM_DOMAIN` | Root domain for store-subdomain detection | `proxy.ts` |
| `API_INTERNAL_URL` | Server-side API URL (in-cluster, avoids public roundtrip) | prod compose |
| `COOKIE_DOMAIN` | Cookie domain across subdomains | prod compose |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | Dockerfile / compose |

> The README's older env examples referenced `ConnectionStrings:DefaultConnection`
> and `NEXT_PUBLIC_SIGNALR_URL`; the code actually uses `DATABASE_URL`/`REDIS_URL`
> and `NEXT_PUBLIC_SIGNALR_HUB`. This section reflects the code.

---

## 8. Available Scripts

### Web (`web/package.json`)

| Script | Command | Purpose |
| ------ | ------- | ------- |
| `npm run dev` | `next dev` | Dev server on :3000 |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Serve the production build |
| `npm run lint` | `eslint` | Lint |
| `npm run test` | `jest` | Run tests |
| `npm run test:watch` | `jest --watch` | Watch mode |
| `npm run test:coverage` | `jest --coverage` | Coverage report |

### API (standard dotnet CLI)

| Command | Purpose |
| ------- | ------- |
| `dotnet restore` | Restore NuGet packages |
| `dotnet build marketplace.sln -c Release` | Build solution |
| `dotnet run --project api` | Run the API |
| `dotnet ef migrations add <Name> --project api` | Add a migration |
| `dotnet ef database update --project api` | Apply migrations |
| `dotnet test marketplace.sln` | Run the `api.Tests` suite |

---

## 9. Development & Docker

The **development** compose file starts **only** infrastructure (Postgres + Redis);
it does not build/run the API or Web. Run those on the host (§6).

```bash
docker compose up -d        # postgres:16 on :5432, redis:7 on :6379
docker compose down
```

The **production** compose file (`docker-compose.prod.yml`) runs the full stack —
postgres, redis, api, web, and nginx — using prebuilt images referenced by
`${API_IMAGE}` / `${WEB_IMAGE}` and secrets from `.env.prod`. It is intended for a
server deployment, not local development. It exposes only nginx (ports 80/443);
api/web/db/redis are reachable through the internal/external Docker networks.

---

## 10. Build

- API: `dotnet publish api/api.csproj -c Release` (the multi-stage `api/Dockerfile`
  restores with `--locked-mode`, publishes Release, and runs on the
  `mcr.microsoft.com/dotnet/aspnet:10.0` runtime as a non-root `app` user, exposing
  `:5000` with a `/health` HEALTHCHECK).
- Web: `npm run build` (the `web/Dockerfile` uses `npm ci`, builds with
  `output: 'standalone'`, and runs `node server.js` as non-root `nextjs`, exposing
  `:3000`).

---

## 11. Deployment

CI/CD is defined in `.github/workflows/deploy.yml` (single workflow, triggered on
push/PR to `main`). Verified jobs:

1. **build-api** — spins up Postgres + Redis service containers, restores/builds
   the solution, runs `dotnet ef database update` against a test DB, then
   `dotnet test`.
2. **build-web** — `npm ci`, `tsc --noEmit`, `npm run build`.
3. **docker** (push to `main` only) — builds and pushes API and Web images to
   GitHub Container Registry (`ghcr.io/<owner>/marketplace-api` and
   `-web`), tagged `latest` and the commit SHA.
4. **deploy** (push to `main` only) — SSHes to a VPS (`appleboy/ssh-action`), pulls
   the new images, rewrites image tags in `.env.prod`, performs a rolling
   `docker compose -f docker-compose.prod.yml up -d --no-deps` for api then web,
   prunes old images, and finishes with a `/health` curl check.

Production runtime topology is as described in §3 (nginx TLS termination via
Let's Encrypt certs mounted from `certbot_certs`). Secrets referenced by CI
(`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `API_DOMAIN`, `NEXT_PUBLIC_*`, etc.) are
GitHub Actions secrets and are not stored in the repo.

> `build-web` is labelled "Next.js 15" in the workflow, but the installed version
> is 16.2.3 — the label is cosmetic and does not affect the build.

---

## 12. API Reference

All routes are under `/api`. Base paths and authorization come from each
controller's `[Route]`/`[Authorize]` attributes. There are **29 controllers and
~213 endpoints**; the full, always-current surface is the Swagger document at
`/swagger` (Development). Controller-level summary. In the Authorization column,
**class-level** means every action requires that policy; **per-action** means the
controller has no class-level `[Authorize]` and applies authorization per endpoint
(so some reads are anonymous):

| Controller | Base route | Authorization | Endpoints |
| ---------- | ---------- | ------------- | --------- |
| AuthController | `api/auth` | per-action — anonymous by default; `[Authorize]` on `logout`/`me`/update | 10 |
| AccountController | `api/account` | class-level `[Authorize]` | 2 |
| ProductsController | `api/products` | per-action — mixed (AdminOnly / AdminOrMerchant / MerchantOnly; 2 public) | 21 |
| CategoriesController | `api/categories` | per-action — AdminOnly writes; public reads | 6 |
| ProductQuestionController | `api/questions` | per-action — authenticated / AdminOnly / AdminOrMerchant | 4 |
| ReviewController | `api/review` | per-action — authenticated; 1 public | 3 |
| WishlistController | `api/wishlist` | class-level `[Authorize]` | 5 |
| StoreController | `api/store` | per-action — MerchantOnly / authenticated; 1 public | 12 |
| OrdersController | `api/orders` | class-level `[Authorize]` | 11 |
| PaymentsController | `api/payments` | per-action — CustomerOnly / AdminOnly; 1 anonymous (webhook) | 5 |
| InvoiceController | `api/invoices` | class-level `[Authorize]` | 7 |
| FulfillmentController | `api/fulfillment` | class-level `[Authorize]` | 11 |
| CouriersController | `api/couriers` | class-level `AdminOnly` | 12 |
| MerchantsController | `api/merchants` | class-level `MerchantOnly` | 16 |
| AnalyticsController | `api/analytics` | per-action — MerchantOnly / AdminOnly | 8 |
| SubscriptionsController | `api/subscriptions` | per-action — MerchantOnly (mostly); AdminOnly; 1 public | 9 |
| PluginsController | `api/plugins` | per-action — MerchantOnly / AdminOnly; 2 public | 12 |
| WalletController | `api/wallet` | class-level `MerchantOnly` | 4 |
| CustomerWalletController | `api/customer/wallet` | class-level `[Authorize]` | 4 |
| CouponController | `api/coupon` | per-action — AdminOnly / authenticated | 4 |
| ReferralController | `api/referral` | class-level `[Authorize]` | 1 |
| ReturnRequestsController | `api/returns` | class-level `[Authorize]` | 7 |
| ContactController | `api/contact` | anonymous | 1 |
| SiteSettingsController | `api/site-settings` | anonymous | 2 |
| AdminController | `api/admin` | class-level `AdminOnly` | 22 |
| AdminSiteSettingsController | `api/admin/site-settings` | class-level `AdminOnly` | 7 |
| CustomerWithdrawalsAdminController | `api/admin/customer-withdrawals` | class-level `AdminOnly` | 3 |
| WithdrawalsAdminController | `api/admin/withdrawals` | class-level `AdminOnly` | 3 |
| ReconcilationController | `api/admin/reconciliation` | class-level `AdminOnly` | 1 |

> Consult Swagger or the controller source for exact per-action policies.

### AuthController (`api/auth`) — verified endpoints

| Method | Route | Purpose |
| ------ | ----- | ------- |
| POST | `/api/auth/register` | Register a customer |
| POST | `/api/auth/register-merchant` | Register a merchant application |
| POST | `/api/auth/login` | Log in, issue access + refresh tokens |
| POST | `/api/auth/refresh` | Rotate tokens using a refresh token |
| POST | `/api/auth/logout` | Invalidate the current session |
| GET | `/api/auth/me` | Current user profile |
| PUT | `/api/auth/me` | Update current user profile |
| POST | `/api/auth/forgot-password` | Start password reset |
| POST | `/api/auth/reset-password` | Complete password reset |
| POST | `/api/auth/verify-email` | Verify email address |

The frontend also exposes a few Next.js route handlers under `web/app/api/`:
`auth/refresh`, `auth/set-tokens`, `health`, `revalidate`, and `upload`.

---

## 13. Database

PostgreSQL via EF Core. Schema is managed by migrations in `api/Migrations/`
(baseline `20260604080556_InitialCreate`, then AddStoreFollows,
AddWalletCouponReferral, AddCustomerWithdrawalRequests, AddOrderCouponFields,
AddAuditLog, InvoicePerVendorOrder). The app auto-applies pending migrations on
startup and seeds data via `DataSeeder`.

### Entities (`api/Domain/Entities/`, 33)

- **Identity / merchant**: `User`, `MerchantProfile`, `Courier`
- **Catalogue**: `Category`, `Product`, `ProductVariant`, `ProductQuestion`,
  `Review`, `Wishlist`, `StoreFollow`
- **Ordering / fulfillment**: `Order`, `OrderItem`, `VendorOrder`, `Shipment`,
  `ShipmentStatusHistory`, `Invoice`, `ReturnRequest`, `Dispute`
- **Money / wallet**: `MerchantWallet`, `WalletTransaction`, `CustomerTransaction`,
  `CustomerWithdrawalRequest`, `WithDrawalRequest`, `AccountingEntry`,
  `CommissionRule`, `Coupon`, `Referral`
- **Monetization / config**: `Subscription`, `Plugin`, `MerchantPlugin`,
  `HeroSettings`, `AnnouncementItem`, `AuditLog`

### Enums (`api/Domain/Enums/`, 8) — values verified

| Enum | Values |
| ---- | ------ |
| `UserRole` | Admin, Merchant, Courier, Customer |
| `AccountStatus` | Active, PendingApproval, Rejected, Suspended |
| `OrderStatus` | Pending, PaymentConfirmed, Processing, Packed, LabelGenerated, Shipped, CourierAssigned, PickedUp, InTransit, OutForDelivery, Delivered, Failed, Cancelled |
| `ShipmentStatus` | Pending, LabelGenerated, CourierAssigned, PickedUp, InTransit, OutForDelivery, Delivered, Failed |
| `OrderSource` | Marketplace, EStore |
| `PlanType` | Basic, Pro, Enterprise |
| `ModerationStatus` | PendingReview, UnderReview, Approved, Rejected |
| `ShippingRate` | (shipping tier enum; see source) |

---

## 14. Authentication & Authorization

- **Scheme**: JWT bearer (`AddJwtBearer` in `Program.cs`), validating issuer,
  audience, lifetime and signing key, with `ClockSkew = 0`. Passwords are hashed
  with BCrypt.
- **Token flow**: access + refresh tokens issued by `TokenService`; lifetimes
  driven by `JWT_EXPIRES_MINUTES` / `REFRESH_EXPIRES_DAYS`. `/api/auth/refresh`
  rotates tokens.
- **SignalR**: the hub reads the token from the `access_token` query-string
  parameter for `/hubs` paths (browsers can't set Authorization headers on
  WebSockets).
- **Policies**: `AdminOnly`, `MerchantOnly`, `CourierOnly`, `CustomerOnly`
  (Customer/Merchant/Admin/Courier), `AdminOrMerchant`, `AdminOrCourier`.
- **Frontend token storage**: `web/lib/auth.ts` keeps tokens in memory +
  `localStorage` and sends them as `Authorization: Bearer` (it explicitly does not
  use cookies). `web/proxy.ts` middleware decodes the JWT role client-side to guard
  `/admin`, `/merchant`, `/courier`, `/orders`, `/checkout`, `/profile`.

---

## 15. Configuration

- **Rate limiting** (`AspNetCoreRateLimit`, in `Program.cs`): stricter limits on
  `/api/auth/*`, `/api/payments/*`, `/api/orders`, `/api/notifications/*`, product
  reads, and a global fallback (120/min). Counters are in-memory per instance —
  see the inline note about multi-pod deployments.
- **CORS**: `AllowAnyOrigin` in Development; restricted to `FRONTEND_URL` otherwise.
- **Uploads**: Kestrel + FormOptions cap request bodies at ~6 MB; nginx sets
  `client_max_body_size 7m` to match.
- **Logging**: Serilog with Console + rolling File sinks (7-day retention),
  configured from the `Serilog` section of `appsettings.json`.
- **nginx** (`nginx/conf.d/marketplace.conf`): HTTP→HTTPS redirect, TLS 1.2/1.3,
  HSTS and other security headers, gzip, long-lived `/hubs/` proxying, unbuffered
  Stripe webhook proxying, immutable caching for `/_next/static/`, and wildcard
  store-subdomain routing.
- **Vercel**: `web/vercel.json` exists (framework `nextjs`, security headers),
  indicating the web app can alternatively be deployed to Vercel.

---

## 16. Troubleshooting

| Symptom | Likely cause / fix |
| ------- | ------------------ |
| API exits at startup with "Required environment variable '…' is not set" | In non-Development, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`, `STRIPE_SECRET_KEY` (and `STRIPE_WEBHOOK_SECRET` in Production) must be set. |
| API can't reach the database | Ensure Postgres is up (`docker compose up -d`) and `DATABASE_URL` matches host/port/credentials. The app auto-migrates on startup. |
| Redis errors but app keeps running | `ToRedis` appends `abortConnect=false`, so the multiplexer connects lazily; individual cache ops still fail until Redis is reachable. |
| 401 on API calls from the browser | Token missing/expired in `localStorage`; the Axios interceptor attempts a refresh via `/api/auth/refresh`. |
| CORS error in Development | Should not occur (`AllowAnyOrigin`). In other environments set `FRONTEND_URL` to the exact web origin. |
| Frontend hits the wrong API | Set `NEXT_PUBLIC_API_URL`; the default in `lib/api.ts` is `http://localhost:5010`, matching `launchSettings.json`. |
| 429 Too Many Requests | Rate limits (esp. auth/payments) were hit; limits are relaxed in Development. |
| Swagger 404 | Swagger is only mapped in the Development environment. |
| Stripe webhook signature failures behind nginx | The provided nginx config disables buffering for `/api/payments/webhook`; keep that so the raw body reaches the verifier. |
| `docker compose up` doesn't start API/Web | Expected — the dev compose only runs Postgres + Redis. Use `docker-compose.prod.yml` for the full stack. |

---

## 17. Reference Documents

Two large standalone HTML files live at the repo root (they are design/planning
artifacts, not part of the running app):

- `style_design.html` — titled **"Style Design Guide — Brand Identity v2.0"**; a
  visual brand/design-system reference.
- `system_architecture.html` — titled **"Marketplace & Fulfillment – Tam Teknik
  Plan v4.0"** (a Turkish-language technical plan). Treat it as design intent; this
  README reflects the current code, which is the source of truth.

---

## 18. License

No `LICENSE` file is present in the repository, so the licensing terms are
unspecified.
