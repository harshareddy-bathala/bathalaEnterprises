# CLAUDE.md — Bathala Enterprises

Real-estate marketing site + admin CMS for Bathala Enterprises (Bangalore, India). Public site shows properties/services/testimonials; admin dashboard does CRUD against Supabase.

## Tech stack

- **Next.js ^16.2.2** (App Router, `src/` layout). Note: Next 16 — request interception lives in `src/proxy.ts` (the renamed middleware), not `middleware.ts`.
- **React 19.2**, **TypeScript 5.9** (strict), path alias `@/*` → `src/*`
- **Tailwind CSS 3.4** (v3 config-based, NOT v4) + `tailwindcss-animate`, `class-variance-authority`, `clsx`/`tailwind-merge` via `cn()` in `src/lib/utils.ts`
- **Supabase JS ^2.101** (`@supabase/supabase-js`) + **@supabase/ssr** (cookie-based sessions; browser client via `createBrowserClient`, middleware guard via `createServerClient`)
- **framer-motion 11**, **react-hook-form 7 + zod 3** (`@hookform/resolvers`), **Resend 6** (contact email), **@google/generative-ai** (chatbot, Gemini)
- Testing: **Playwright** QA suites (`tests/qa/`, `playwright.qa.config.ts`, `playwright.critical.config.ts`), **@axe-core/playwright**, **Lighthouse CI** (`.lighthouserc.*.json`)
- Fonts: Inter (`--font-body`) + Playfair Display (`--font-display`) via `next/font`; Material Symbols icon font loaded from gstatic in `globals.css`

## Commands

- `npm run dev` / `npm run build` / `npm start`
- `npm run lint:ci` (eslint on src), `npm run typecheck`
- `npm run test:critical-flows` (Playwright critical spec)
- `npm run check:predeploy` and other `check:*` scripts in `scripts/predeploy/`
- `npm run icons:subset` — regenerate the self-hosted Material Symbols subset in `public/fonts/` after adding an icon, then commit the `.woff2`

## Folder structure

```
src/app/(site)/        Public pages (route group; shares Navbar/Footer/chatbot layout)
src/app/admin/         Admin CMS pages (all client components, own layout)
src/app/api/           Route handlers: chat, contact, health, rum
src/app/maintenance/   Standalone maintenance page (outside both layouts)
src/components/        Public-site components (flat, kebab-case files)
src/components/ui/     Reusable primitives (button, input, card... shadcn-style, cva)
src/components/admin/  Admin-only components (forms, table, image upload)
src/components/admin/ui/  Admin primitives (admin-button, admin-card, status-badge)
src/lib/               Supabase clients/queries, auth, security, monitoring, formatters
src/types/tables.ts    All DB row TypeScript interfaces
src/proxy.ts           CSP middleware (production only)
src/favicon_io/        Icon source assets (also copied into public/)
public/                Static assets, sw.js (PWA service worker), dev-sw-cleanup.js
scripts/predeploy/     Node scripts for env/SSL/email/analytics verification
tests/qa/              Playwright QA specs (a11y, cross-browser, devices, perf)
docs/                  ARCHITECTURE.md, DEPLOYMENT.md, deployment-monitoring.md runbook
.github/workflows/     ci.yml, deploy.yml (Vercel CLI), lighthouse.yml
SUPABASE_UNIVERSAL_SETUP.sql       Canonical one-shot schema (source of truth for DB)
SUPABASE_FIX_MESSAGES_RLS.sql      Remediation script for messages RLS failures
SUPABASE_ADD_SLUGS.sql             Idempotent migration adding url slugs to properties/services (run on live DBs)
SUPABASE_ADD_BUSINESS_PROFILE.sql  Idempotent migration adding structured address/geo/GBP url to site_settings
```

## Supabase schema (from SUPABASE_UNIVERSAL_SETUP.sql — no migration tooling; the SQL files ARE the schema)

All tables have RLS **enabled**, `id UUID DEFAULT gen_random_uuid()`, `created_at`/`updated_at` with a shared `set_updated_at_timestamp()` trigger. Admin checks go through `public.is_admin_user()` (SECURITY DEFINER, checks `admin_users.is_active` for `auth.uid()`).

| Table | Purpose | RLS policy summary |
|---|---|---|
| `admin_users` | Admin registry. PK `user_id` → `auth.users(id)`, `is_active` | Self or admins can SELECT; admins manage |
| `properties` | Listings. `type` ∈ Rent/Lease/Sale, `status` ∈ active/inactive, `gallery_images JSONB`, price/bedrooms/sqft | anon SELECT where `status='active'`; admin full CRUD + sees inactive |
| `services` | Service catalog. `card_description`, `detailed_description`, `icon_name` (Material Symbols), `price_range`, `display_order`, `is_featured` | anon SELECT all; admin CRUD |
| `testimonials` | `rating` 1–5, `featured` (app caps featured at 3, enforced client-side in `supabase-queries.ts`, NOT in DB) | anon SELECT all; admin CRUD |
| `messages` | Contact-form submissions. `query_type` ∈ properties/services, `status` ∈ new/in-progress/resolved, `is_read`, `admin_notes` | anon INSERT only (must be status='new', is_read=false); admin SELECT/UPDATE/DELETE |
| `site_settings` | Singleton row: contact info, social URLs, `business_hours JSONB` | anon SELECT; admin ALL |
| `admin_notification_settings` | Per-user notification prefs, `UNIQUE(user_id)` | own-row SELECT/INSERT/UPDATE (by `auth.uid()`), not admin-gated |

- **Storage buckets** (public): `property-images`, `testimonial-avatars`. Public read; admin-only insert/delete via `is_admin_user()`.
- **Realtime** publication includes all app tables (admin dashboard subscribes for live updates).
- **Schema drift warning**: `src/types/tables.ts` includes `Property.amenities`, `Property.related_property_ids`, and `Service.is_active` which are NOT in the setup SQL. Query code defensively falls back when columns are missing (`isMissingColumnError`). Both SQL scripts now gate admin access on `is_admin_user()` (the JWT `user_metadata.is_admin` check was removed from the fix script — it was privilege-escalatable since users can edit their own user_metadata).
- **URL slugs**: `properties.slug` and `services.slug` are `TEXT UNIQUE`, format `<slugified title>-<first 6 hex of id>`. Written by the app on update and by the `set_*_slug` BEFORE-INSERT/UPDATE triggers. On an existing database run `SUPABASE_ADD_SLUGS.sql` — never the universal setup, which drops `services`. Query code tolerates the column being absent.
- Setup SQL **drops and recreates `services`** (`DROP TABLE ... CASCADE`) — do not re-run it blindly on a live DB.

## Authentication

- **Supabase Auth email/password only.** Login at `/admin/login` → `signInAdmin()` in `src/lib/admin-auth.ts`.
- Admin verification: tries `supabase.rpc("is_admin_user")`, falls back to direct `admin_users` table read. Non-admins are signed out immediately after login. Result cached in-memory 45 s.
- **Two-layer guarding**: `src/proxy.ts` (Next 16 middleware) enforces a server-side check on every `/admin/*` request except `/admin/login` — it validates the Supabase session cookie via `supabase.auth.getUser()` and requires `is_admin_user()` to return true, redirecting to `/admin/login` otherwise. Admin pages additionally call `getAdminUser()`/`checkAdminSession()` client-side. RLS remains the data-access enforcement boundary.
- Session persisted in **cookies** by the browser client (`src/lib/supabase-client.ts` uses `createBrowserClient` from `@supabase/ssr`) so the middleware can read it. (`@supabase/auth-helpers-nextjs` was removed.) Server code (API routes, ISR pages) uses anon-key clients — no per-request server sessions outside the middleware.
- `/api/contact` optionally uses the **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) as a fail-safe writer for `messages`; falls back to anon client + RLS insert policy.
- To grant admin: create user in Supabase Auth dashboard, then insert into `admin_users` (SQL snippet at bottom of `SUPABASE_UNIVERSAL_SETUP.sql`).

## Environment variables (names only)

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
Server-only: `SUPABASE_SERVICE_ROLE_KEY` (alias `NEXT_SUPABASE_SERVICE_ROLE_KEY`), `GOOGLE_AI_API_KEY`, `RESEND_API_KEY`, `CONTACT_EMAIL`, `SENDER_EMAIL`, `CONTACT_EMAIL_NOTIFICATIONS`, `CHAT_RATE_LIMIT_MAX`, `CHAT_RATE_LIMIT_WINDOW_MS`, `ERROR_TRACKING_WEBHOOK_URL`, `ERROR_TRACKING_WEBHOOK_TOKEN`, `LOG_INGEST_URL`, `LOG_INGEST_TOKEN`, `RUM_INGEST_URL`, `RUM_INGEST_TOKEN`, `SSL_MIN_DAYS`, `GOOGLE_SITE_VERIFICATION`
Client-exposed optional: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ENABLE_RUM`
SEO optional: `INDEXNOW_KEY`
CI secrets (GitHub Actions): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Routes

Public `(site)` group (all data pages are ISR, `revalidate = 60`):
`/` home, `/properties` listing, `/properties/[slug]` detail, `/services` listing, `/services/[slug]` detail, `/about`, `/contact`, `/privacy`, `/terms`, `/offline` (PWA fallback). Also `/maintenance`, `robots.ts`, `sitemap.ts`.

Detail URLs are keyword slugs (`3-bhk-villa-electronic-city-3f9a1c`), not UUIDs — see `src/lib/slug.ts`. Legacy paths 301 in production: `/all-properties` → `/properties`, `/all-services[/:id]` → `/services[/:id]`, `/home` → `/`. A UUID or a slug that is stale after a title edit still resolves and `permanentRedirect()`s to the canonical slug from inside the page.

Admin (all `"use client"`, CSR, no ISR): `/admin/login`, `/admin/dashboard`, `/admin/properties`, `/admin/services`, `/admin/testimonials`, `/admin/messages`, `/admin/settings`. Pages wrap content in `AdminLayout` (`src/components/admin/admin-layout.tsx`) which renders sidebar nav + handles sign-out. Admin CRUD calls the shared query helpers in `src/lib/supabase-queries.ts` directly from the browser (RLS enforces permissions).

API route handlers:
- `POST /api/contact` — zod-validated, sanitized (`src/lib/security.ts`), rate-limited 5/min/IP, inserts into `messages`, sends Resend notification email (HTML built inline), detailed RLS-failure diagnostics
- `POST /api/chat` — Gemini chatbot; builds context from cached (5 min) properties+services catalog; rate-limited (default 40/min) by `x-chat-client-id` header/IP
- `GET /api/health` — pings Supabase auth health, Google AI, Resend; returns ok/degraded/down
- `POST /api/rum` — receives web-vitals beacons, optionally forwards to `RUM_INGEST_URL`
- `POST /api/indexnow` — pushes changed listing URLs to Bing/Copilot; no-op unless `INDEXNOW_KEY` is set. Called fire-and-forget from the admin pages via `src/lib/notify-search-engines.ts`

Agent/machine-facing routes: `/llms.txt` (live catalogue + FAQ, `revalidate 3600`), `/feed.xml` (RSS of listings), `/.well-known/security.txt` (RFC 9116), `/indexnow-key.txt`, `/opengraph-image` plus per-route `opengraph-image.tsx` for property and service detail.

## Conventions to preserve (details in .claude/skills/bathala-conventions/SKILL.md)

- All Supabase access goes through `src/lib/supabase-queries.ts` / `settings-queries.ts` wrappers (timeout + retry + friendly error mapping). Reads return `[]`/`null` on failure, never throw; writes throw user-displayable `Error`s.
- API responses use `apiSuccess`/`apiError` from `src/lib/api-response.ts` with a `requestId`.
- **Icons**: Material Symbols is self-hosted and *subset* (`public/fonts/material-symbols-outlined-subset.woff2`, ~12 KB). After adding a new `material-symbols-outlined` icon anywhere, run `npm run icons:subset` and commit the regenerated font — an icon that is not in the subset renders as its raw ligature text (e.g. the literal word "menu"). Do not point the `@font-face` back at a gstatic URL: those are version-pinned and unsubsetted (the previous one was 3.2 MB).
- Page width comes from the `.bathala-container` class, not hand-written `mx-auto max-w-[1200px] px-…`.
- Above-the-fold entrance animation uses `.reveal-up-priority` (transform only, paints immediately); everything below the fold uses `.reveal-up` (fades from opacity 0). Never put `.reveal-up` on an LCP candidate.
- Design tokens are CSS variables in `src/app/globals.css` (`--color-gold-accent`, `--color-slate-primary`, etc.) mapped into Tailwind as `primary`, `bathala-*` colors; admin-specific tokens in `src/lib/admin-design-tokens.ts`.
- Errors reported via `reportError()` in `src/lib/monitoring.ts` (webhook sink, not Sentry).
- Business identity (name, phone, email, address, geo, social/GBP urls) resolves through `getResolvedPublicSiteSettings()` in `src/lib/public-site-settings.ts` — `site_settings` first, `src/lib/site-config.ts` as a per-field fallback. It is `React.cache()`d; do NOT reintroduce `unstable_noStore()` there, as the Footer calls it from the `(site)` layout and that opts every public page out of static rendering.
- FAQ copy lives once in `src/lib/faq-content.ts` and feeds `FAQPage` JSON-LD, the chatbot's grounding context and `/llms.txt`, so they cannot diverge.
