# Marketplace — Web (Next.js frontend)

This is the Next.js 16 (App Router) frontend for the Marketplace & Fulfillment
platform. It serves the Consumer, Merchant, Courier, and Admin experiences from a
single app and talks to the ASP.NET Core API in `../api`.

> The authoritative, full-stack documentation (architecture, environment
> variables, API reference, deployment) lives in the repository root
> [`../README.md`](../README.md). This file only covers running the web app.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 (plain `next dev`)
```

Set `NEXT_PUBLIC_API_URL` to the API base URL (default in `lib/api.ts` is
`http://localhost:5010`, matching the API's `launchSettings.json`).

## Scripts

| Script | Command | Purpose |
| ------ | ------- | ------- |
| `npm run dev` | `next dev` | Development server |
| `npm run build` | `next build` | Production build (`output: 'standalone'`) |
| `npm run start` | `next start` | Serve the production build |
| `npm run lint` | `eslint` | Lint |
| `npm run test` | `jest` | Run tests |
| `npm run test:watch` | `jest --watch` | Watch mode |
| `npm run test:coverage` | `jest --coverage` | Coverage |

## Key directories

- `app/` — App Router segments (`admin/`, `merchant/`, `courier/`, public storefront) and `app/api/` route handlers (`auth`, `health`, `revalidate`, `upload`).
- `queries/` — TanStack Query hooks (one file per domain area).
- `lib/` — `api.ts` (Axios client + token refresh), `auth.ts` (token storage), `signalr.ts`, `cloudinary.ts`, formatting/utilities.
- `hooks/` — cart, auth, checkout, compare, SignalR tracking, etc.
- `proxy.ts` — middleware: JWT role guard for protected areas + `*.<domain>` store-subdomain rewrite.
- `__tests__/` — Jest + Testing Library tests.

## Environment variables

See the root [`../README.md`](../README.md) (section "Environment Variables →
Web") for the full list. The public ones are `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_SIGNALR_HUB`, `NEXT_PUBLIC_SITE_URL`, and
`NEXT_PUBLIC_PLATFORM_DOMAIN`.
