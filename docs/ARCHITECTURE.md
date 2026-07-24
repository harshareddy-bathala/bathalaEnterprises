# Architecture

How data moves from Supabase to the screen, per-route rendering strategy, and image sourcing.

## High-level shape

```
Supabase (Postgres + RLS + Storage + Realtime)
   │
   ├── Server side (build/ISR): (site) pages call src/lib/supabase-queries.ts
   │      using the SHARED anon-key client (src/lib/supabase-client.ts)
   │      → HTML rendered on server, revalidated every 60 s
   │
   ├── Client side (admin): /admin/* pages are "use client"; the browser
   │      Supabase client (localStorage session) does CRUD directly;
   │      RLS policies (is_admin_user()) are the authorization boundary
   │
   └── API routes: /api/contact writes messages (service-role fallback),
          /api/chat reads properties+services to build Gemini context
```

There is one Supabase client module, `src/lib/supabase-client.ts`, created with the **anon key** and `persistSession: true`. It is imported by both server code (ISR pages, chat API) and client code (admin pages, contact form). Server-rendered pages therefore only ever see rows the `anon` role can see (e.g. `properties` with `status='active'`). `/api/contact` builds its own clients: anon + optional service-role (`SUPABASE_SERVICE_ROLE_KEY`) used as a fail-safe writer and settings reader.

## Data-access layer

All reads/writes funnel through `src/lib/supabase-queries.ts` (properties/services/testimonials) and `src/lib/settings-queries.ts` (site_settings, notification settings):

- Every operation is wrapped in `runSupabaseOperation()` — timeout (9 s read / 12 s write in prod) + exponential-backoff retry on transient network errors + `reportError()` on final failure.
- **Reads degrade, writes throw.** Read helpers return `[]` or `null` on any error (missing table, timeout, RLS) so public pages render with empty sections instead of crashing. Write helpers throw `Error`s with user-displayable messages (`buildMutationError` maps RLS/permission/schema errors to actionable text).
- Legacy-schema tolerance: queries detect "missing column" errors (`status` on properties, `display_order` on services) and re-query without them, then filter in JS.
- Featured-testimonials cap (3) is enforced in the query layer (`enforceFeaturedTestimonialsLimit`), not the database.

## Rendering strategy per route

| Route | Strategy | Data |
|---|---|---|
| `/` | **ISR, revalidate 60 s** | services, active properties, featured testimonials (parallel `Promise.all`) |
| `/all-properties` | ISR 60 s | active properties → client component `all-properties-client.tsx` for filtering/pagination |
| `/properties` (legacy) | ISR 60 s | same; prod redirect → `/all-properties` |
| `/properties/[id]` | ISR 60 s, params fetched on demand (no `generateStaticParams`) | single property + related |
| `/all-services`, `/all-services/[id]` | ISR 60 s | services |
| `/services`, `/services/[id]` (legacy) | prod redirect → `/all-services` |
| `/about`, `/privacy`, `/terms` | Static (no data fetch) |
| `/contact` | Static shell; form is a client component POSTing to `/api/contact` |
| `/offline`, `/maintenance` | Static |
| `/admin/*` | **Pure CSR** (`"use client"`, no server data). Client-side auth guard + direct Supabase CRUD from the browser; dashboard uses Supabase Realtime subscriptions |
| `/api/*` | Dynamic route handlers (Node runtime) |
| `robots.ts`, `sitemap.ts` | Built by Next metadata routes |

Home-page sections are `next/dynamic` imports with `ssr: true` and fixed-height skeleton placeholders — this is code-splitting, not client-only rendering.

`src/proxy.ts` (Next 16's middleware) runs in production only: generates a per-request nonce and sets the Content-Security-Policy header on all non-static routes. Additional security/cache headers and legacy-path redirects live in `next.config.mjs` (also production-only).

## Frontend composition pattern

- Server page fetches data → passes plain arrays/objects as props into client components (`services-grid`, `properties-carousel`, `testimonials-section`).
- Root layout (`src/app/layout.tsx`): fonts, metadata/OG, GA (`AnalyticsTracking`) and web-vitals RUM (`RumMonitor` → `POST /api/rum`).
- `(site)` layout: Navbar, Footer, PageTransition (framer-motion), deferred chatbot widget, PWA install prompt, connection-status indicator, JSON-LD (Organization + LocalBusiness). SEO structured data comes from `src/lib/structured-data.ts`.
- PWA: `public/sw.js` service worker with an `/offline` fallback page; `dev-sw-cleanup.js` unregisters it in dev.

## Where images come from

1. **Supabase Storage** (primary for CMS content): public buckets `property-images` and `testimonial-avatars`. Admin uploads go through `src/lib/image-upload.ts` — MIME allow-list (jpeg/png/webp), 5 MB cap, magic-byte validation, crypto-random filenames — and the resulting public URL is stored in `properties.image_url` / `gallery_images` / `testimonials.avatar_url`.
2. **Unsplash** (`images.unsplash.com`): fallback/decorative imagery (hero, placeholders).
3. **Local `/public`**: favicons, PWA icons, OG image.

Both remote hosts are whitelisted in `next.config.mjs` `images.remotePatterns` and in the CSP `img-src`. `next/image` optimization (AVIF/WebP, 1-year cache TTL) is enabled in production only (`unoptimized: true` in dev).

## Observability

- `src/lib/monitoring.ts` → `reportError()` posts to `ERROR_TRACKING_WEBHOOK_URL` (optional); `src/lib/logger.ts` can forward to `LOG_INGEST_URL`.
- `RumMonitor` beacons web-vitals to `/api/rum`, which optionally forwards to `RUM_INGEST_URL`.
- `GET /api/health` aggregates Supabase / Google AI / Resend reachability (used by uptime checks and predeploy scripts).

## Known gaps

<!-- To be filled in during the production readiness pass -->

-
