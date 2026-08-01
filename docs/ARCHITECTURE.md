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
   │      Supabase client (COOKIE session, via @supabase/ssr) does CRUD
   │      directly. src/proxy.ts verifies the session server-side on every
   │      /admin/* request; RLS (is_admin_user()) remains the data boundary
   │
   └── API routes: /api/contact writes messages (service-role fallback),
          /api/chat reads properties+services to build Gemini context
```

There is one Supabase client module, `src/lib/supabase-client.ts`, created with the **anon key** via `createBrowserClient` from `@supabase/ssr`, so the session lives in **cookies** and `src/proxy.ts` can verify it server-side. It is imported by both server code (ISR pages, chat API) and client code (admin pages, contact form). Server-rendered pages therefore only ever see rows the `anon` role can see (e.g. `properties` with `status='active'`). `/api/contact` builds its own clients: anon + optional service-role (`SUPABASE_SERVICE_ROLE_KEY`) used as a fail-safe writer and settings reader.

## Data-access layer

All reads/writes funnel through `src/lib/supabase-queries.ts` (properties/services/testimonials) and `src/lib/settings-queries.ts` (site_settings, notification settings):

- Every operation is wrapped in `runSupabaseOperation()` — timeout (9 s read / 12 s write in prod) + exponential-backoff retry on transient network errors + `reportError()` on final failure.
- **Reads degrade, writes throw.** Read helpers return `[]` or `null` on any error (missing table, timeout, RLS) so public pages render with empty sections instead of crashing. Write helpers throw `Error`s with user-displayable messages (`buildMutationError` maps RLS/permission/schema errors to actionable text).
- Legacy-schema tolerance: queries detect "missing column" errors (`status` on properties, `display_order` on services) and re-query without them, then filter in JS.
- Featured-testimonials cap (3) is enforced in the query layer (`enforceFeaturedTestimonialsLimit`), not the database.
- **Request-level deduplication**: the catalog reads and the by-id/by-slug resolvers are wrapped in `React.cache()`. Supabase calls are not `fetch`, so Next does not dedupe them; without this every detail render hit the database twice (page + `generateMetadata`) or three times once the `opengraph-image` route existed.
- **Column projection**: `getPropertyCatalogEntries()` / `getServiceCatalogEntries()` select only `id,title,slug,created_at,updated_at` for URL generation, so the sitemap does not pull descriptions and `gallery_images` JSON for every row.
- URL slugs: `properties.slug` / `services.slug` are `<kebab title>-<first 6 hex of id>`. `getPropertyBySlug()` accepts a slug **or** a bare UUID, and falls back to matching on the id suffix so links published before the migration — and slugs left stale by a title edit — still resolve; the page then `permanentRedirect()`s to the canonical slug.

## Rendering strategy per route

| Route | Strategy | Data |
|---|---|---|
| `/` | **ISR, revalidate 60 s** | services, active properties, featured testimonials (parallel `Promise.all`) |
| `/properties` | ISR 60 s | active properties → client component `all-properties-client.tsx` for filtering/pagination |
| `/properties/[slug]` | SSG + ISR 60 s | `generateStaticParams` pre-renders the catalog; unknown slugs render on demand |
| `/services`, `/services/[slug]` | SSG + ISR 60 s | services |
| `/all-properties`, `/all-services[/:id]` (legacy) | prod 301 → `/properties`, `/services[/:id]` |
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

## Machine-readable surface

Generated at request time from live data, not committed as static files:

| Route | Purpose | Revalidate |
|---|---|---|
| `/sitemap.xml` | Real `lastmod` from row timestamps; active listings only | per ISR |
| `/robots.txt` | Names 12 AI crawlers explicitly and allows them; silence is ambiguous and several treat it conservatively | per ISR |
| `/llms.txt` | Business details, key pages, the full catalogue with prices, and the FAQ — lets an agent understand the site from one fetch | 1 h |
| `/feed.xml` | RSS 2.0 of listings for aggregators | 1 h |
| `/.well-known/security.txt` | RFC 9116; a route so `Expires` never goes stale | 1 d |
| `/opengraph-image` + per-route `opengraph-image.tsx` | Social cards via `next/og`. Property cards render the listing photo, price and beds/sqft | — |
| `/indexnow-key.txt`, `POST /api/indexnow` | Pushes changed listings to Bing/Copilot. No-op unless `INDEXNOW_KEY` is set | — |

JSON-LD per page: `Organization` + `RealEstateAgent` sitewide, `WebPage` +
`BreadcrumbList` everywhere, `ItemList` on both listing pages, `FAQPage` on
`/about` and `/contact`, `RealEstateListing` (with `Offer`, INR) on property
detail, `Service` on service detail.

## Observability

- `src/lib/monitoring.ts` → `reportError()` posts to `ERROR_TRACKING_WEBHOOK_URL` (optional); `src/lib/logger.ts` can forward to `LOG_INGEST_URL`.
- `RumMonitor` beacons web-vitals to `/api/rum`, which optionally forwards to `RUM_INGEST_URL`.
- `GET /api/health` aggregates Supabase / Google AI / Resend reachability (used by uptime checks and predeploy scripts).

## Known gaps

Filled in during the production-readiness pass (Aug 2026). These are the things
a future change should know are *deliberately* unresolved.

- **Soft 404s on unknown detail slugs.** `notFound()` renders the correct
  not-found UI but returns HTTP 200, not 404. This is Next's streaming
  behaviour: once the shell flushes, the status is locked. Verified it is not
  caused by `loading.tsx`, `generateStaticParams`, or the root Suspense
  boundaries. Mitigated because those responses carry `noindex, nofollow`, so
  the URLs are never indexed; the residual cost is a "soft 404" report in
  Search Console. Forcing `dynamicParams = false` would fix the status but make
  any property added between deploys 404 until the next build.
- **`script-src 'unsafe-inline'` in the CSP.** Nonce-based CSP requires a fresh
  nonce per request, which forces dynamic rendering and would disable static
  optimization and ISR sitewide. See the long comment in `src/proxy.ts`.
- **19 `react-hooks` lint warnings**, almost all `set-state-in-effect` in admin
  CRUD pages. The rules were "off" and are now "warn"; fixing them changes when
  effects re-run, so each needs exercising against a live database.
- **`reorderServices` is not atomic.** N updates, no transaction. Not converted
  to an upsert because PostgREST upsert issues `INSERT .. ON CONFLICT` and the
  tuple would omit `title`, which is `NOT NULL`. A true fix is a
  `SECURITY DEFINER` function doing `UPDATE .. FROM (VALUES ..)`.
- **`enforceFeaturedTestimonialsLimit` is a read-then-write with no
  transaction**, so the "max 3 featured" cap is racy. The real fix is a DB
  constraint or trigger.
- **Schema drift**: `Property.amenities`, `Property.related_property_ids` and
  `Service.is_active` exist in `src/types/tables.ts` but not in the setup SQL.
  The query layer tolerates this via `isMissingColumnError` fallbacks.
- **`/properties` sends the whole active catalogue to the client**, which
  filters and paginates in the browser. Correct at ~50 listings and better UX
  than round-tripping; revisit past a few hundred with `.range()`.
- **`runSupabaseOperation<T = any>`** — rows are cast, not validated. Narrowing
  it means threading generated Supabase types through every helper.
- **~200 hardcoded arbitrary CSS values** (`text-[13.5px]`, `h-[47px]`) remain
  in px. The Tailwind scales and CSS tokens are rem, so scale-based utilities
  respond to browser text scaling, but these do not.
