---
name: bathala-conventions
description: Coding conventions for the Bathala Enterprises codebase — component patterns, naming, Supabase query structure, and design tokens. Use whenever writing or modifying code in this repo so changes stay consistent with existing patterns.
---

# Bathala Enterprises conventions

## File & naming conventions

- **Files**: kebab-case everywhere (`property-gallery-lightbox.tsx`, `admin-auth.ts`). Components are PascalCase inside the file.
- **Exports**: page-level and composite components use `export default`; `src/components/ui/` primitives use named exports (`export { Button, buttonVariants }`); lib modules use named exports only.
- **Types**: all DB row interfaces live in `src/types/tables.ts` (`Property`, `Service`, `Testimonial`, `Message`, `SiteSettings`). Union string types for enums (`PropertyType = "Rent" | "Lease" | "Sale"`). Don't redefine row shapes locally — import from `@/types/tables` (or re-exported from `@/lib/supabase-queries`).
- **Imports**: always the `@/` alias, never relative `../../`.
- Constants are SCREAMING_SNAKE module-level `const`s with units in the name (`SUPABASE_READ_TIMEOUT_MS`, `CONTACT_RATE_LIMIT_MAX`).

## Component patterns

- **Public pages** (`src/app/(site)/`) are async server components with `export const revalidate = 60`. They fetch via `Promise.all` over the query helpers and pass plain data down as props. Interactivity lives in `"use client"` child components (`all-properties-client.tsx`, `contact-form.tsx`).
- Home-page sections are `next/dynamic` imports with `ssr: true` and a fixed-height div skeleton as `loading` — keep placeholder heights matched to the real section to avoid CLS.
- **Admin pages** (`src/app/admin/`) are entirely `"use client"`. Standard skeleton:
  1. `useEffect` guard: `const adminUser = await getAdminUser(); if (!adminUser) router.replace("/admin/login")`
  2. Wrap content in `<AdminLayout title="..." description="..." action={...}>` from `@/components/admin/admin-layout` (also exports `AdminCard`, `ErrorAlert`, `InfoBanner`, `LoadingState`).
  3. Call CRUD helpers from `@/lib/supabase-queries` directly; show thrown `Error.message` to the user (messages are pre-written to be user-facing).
- **UI primitives** (`src/components/ui/`) follow the shadcn recipe: `cva()` variants + `cn()` from `@/lib/utils`, `React.forwardRef`, `asChild` via Radix `Slot`. Buttons support `loading`/`loadingText` with a built-in spinner and `aria-busy`.
- Forms: **react-hook-form + zodResolver**, zod schema defined next to the component, statuses tracked as `"idle" | "loading" | "error" | "success"` state.
- Icons are **Material Symbols** ligature spans: `<span className="material-symbols-outlined">home_work</span>`. `services.icon_name` stores the ligature name.
- Animations use framer-motion; always respect reduced motion (`@/lib/use-reduced-motion`, global `prefers-reduced-motion` CSS kill-switch exists).

## Supabase query conventions

All data access lives in `src/lib/supabase-queries.ts` and `src/lib/settings-queries.ts` — never call `supabase.from()` ad hoc in components (admin pages import the helpers).

- Import the singleton: `import { supabase } from "@/lib/supabase-client"` — it can be `null` when env vars are missing, so every helper starts with a null check.
- Wrap every operation in `runSupabaseOperation(() => query, { context: "helperName", timeoutMs, isWrite })` — gives timeout, transient-error retry with backoff, and `reportError()` on final failure. `context` is the helper's name (used in logs).
- **Reads never throw**: log a warning/error and return `[]` or `null` so ISR pages render empty sections. **Writes always throw** friendly errors via `buildMutationError(action, entity, error)` which maps RLS → "You do not have permission…", missing tables → "Run SUPABASE_UNIVERSAL_SETUP.sql…".
- Mutations chain `.select().single()` (create) or `.select().maybeSingle()` (update/delete); a `null` row after no error means not-found-or-no-access → throw `buildNotFoundOrAccessError`.
- Validate UUIDs with the shared `UUID_PATTERN` before querying by id; return `null` early on mismatch.
- Tolerate legacy schemas: catch missing-column errors (`isMissingColumnError`) and fall back to a query without that column, filtering in JS (see `getPropertiesFromSupabase`, `getServicesFromSupabase`).
- Business rules enforced in this layer, not the DB: max 3 featured testimonials; `display_order` auto-assigned as max+1 on service create.

## API route conventions (`src/app/api/*`)

- Responses via `apiSuccess(data, { requestId })` / `apiError(code, message, status, { requestId, ... })` from `@/lib/api-response`; create `requestId` first thing with `createRequestId("routename")`.
- Validate bodies with zod `safeParse`; map issues with `zodIssuesToFieldErrors`. Sanitize inputs through `@/lib/security` (`sanitizeString`, `sanitizeEmail`, `normalizeIndianPhone`).
- Rate-limit with `checkRateLimit({ namespace, key: ip, maxRequests, windowMs })` from `@/lib/rate-limit` before doing work; return 429 with `retryAfterMs`.
- Wrap external calls in `withTimeout` + `retryWithExponentialBackoff` (from `@/lib/async-utils`) with `shouldRetry: isTransientNetworkError`. Report failures with `reportError(error, { route, requestId, stage })`.

## Tailwind & design tokens

- Source of truth is CSS variables in `src/app/globals.css` ("Bathala design tokens sourced from Figma"): background `#f8f6f2`, surface `#ffffff`, border `#e8e4dc`, slate primary `#2c3340`, gold accent `#b89a5e` (light `#d4b87a`, deep `#9f8450`), text `#1a1f2e`, muted `#6b7280`; radius/spacing/shadow scales as `--radius-*`, `--space-*`, `--shadow-soft|medium|strong|gold`.
- `tailwind.config.ts` maps them: `primary` / `primary-hover` / `gold` = gold accent, `bathala-bg|surface|border|ink|muted|slate|slate-soft`, shadows `brand-soft|medium|strong|gold`. **Use these token classes or `[var(--…)]` arbitrary values — don't hardcode new hex colors.** (Existing code does use raw hex in places; prefer tokens for new code.)
- Custom breakpoints: `xs 360 / sm 480 / md 768 / lg 1024 / xl 1280 / 2xl 1440` — note `sm` is 480px, not Tailwind's default 640px.
- Fonts: `font-sans` = Inter (`--font-body`), `font-display` = Playfair Display; display headings often via the `headline-display` utility class.
- Admin surfaces have their own token module `src/lib/admin-design-tokens.ts` (`SPACING`, `TRANSITION`, `SHADOWS`, `STATUS_COLORS`, `INTERACTION_CLASSES`, `ADMIN_COLORS`) plus `bathala-admin-bg` / `bathala-panel-strong` CSS classes — use these for admin UI instead of the public-site tokens.
- Dark mode is configured (`darkMode: ["class"]`) but not used; `color-scheme: light` is forced.

## Other conventions

- SEO: every public page renders `<JsonLd data={...} />` with schemas from `@/lib/structured-data` (WebPage + Breadcrumb per page; Organization + LocalBusiness in the site layout). Metadata via the exported `metadata` object; canonical/OG URLs derive from `NEXT_PUBLIC_SITE_URL`.
- Business contact details come from `src/lib/site-config.ts` (static fallback) and the `site_settings` table (CMS-editable, read via `@/lib/public-site-settings`); prefer the settings-aware path for anything user-visible.
- Accessibility is a hard requirement: skip links, `aria-busy` on loading buttons, axe checks in Playwright QA (`tests/qa/accessibility.spec.ts`). Touch targets ≥ 44px (`min-w-[44px]` on icon buttons).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code — it is server-only (API routes and `scripts/`).
- When changing the DB schema, update **both** `SUPABASE_UNIVERSAL_SETUP.sql` and `src/types/tables.ts`, and keep query-layer fallbacks for older deployments.
