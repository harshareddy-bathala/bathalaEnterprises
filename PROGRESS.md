# PROGRESS.md — Production Release Checklist

> Session tracker for the prototype → production pass. Update as items complete.
> Legend: `[ ]` pending · `[x]` done · `[~]` in progress · `[!]` needs owner input (see LAUNCH_CHECKLIST.md)

## 0. Setup
- [x] Create PROGRESS.md
- [x] CLAUDE.md — already exists and documents stack/folders/schema/auth (verified, no rewrite needed)

## 1. Security & Secrets
- [x] Audit `/api/contact` — zod-validated, sanitized, rate-limited 5/min/IP; anon INSERT is constrained by RLS to `status='new'`, `is_read=false`, valid `query_type`
- [x] Audit `/api/chat` — rate-limited (40/min default), zod-validated, no secrets in responses; contact details now sourced from `site_settings` instead of hardcoded placeholders
- [x] Audit `/api/health` — returns only ok/degraded/down per dependency, no versions, hostnames or error bodies
- [x] Audit `/api/rum` — rate-limited 60/min/IP, zod-validated, returns 202
- [x] Search working tree for hardcoded API keys / service role keys — none
- [x] Search full git history for committed secrets / .env files — every blob across all commits scanned for JWT-, API-key- and private-key-shaped strings: **zero matches**, and no `.env` file has ever been committed
- [x] Confirm `.env*` gitignored — `.gitignore` has `.env`, `.env.*`, `!.env.example`
- [x] Review RLS policies for every table — all 7 have RLS enabled; admin paths gate on `is_admin_user()`, which is `SECURITY DEFINER` **with `SET search_path = public`**, revoked from PUBLIC and granted only to `authenticated`. anon can SELECT active properties / all services / testimonials / site_settings, and INSERT only constrained messages
- [x] Review storage bucket policies — `property-images` and `testimonial-avatars` are public-read, admin-only insert/delete via `is_admin_user()`
- [x] Assess admin route protection — no longer client-side only: `src/proxy.ts` verifies the Supabase session server-side with `auth.getUser()` and requires `is_admin_user()` on every `/admin/*` request except the login page. Admin pages also carry `robots: noindex`
- [x] Section 1 summary written — see below

**Section 1 summary.** No secrets have ever been committed. The authorization
model is sound: RLS is enabled everywhere, the admin predicate is a hardened
`SECURITY DEFINER` function, and there is now a server-side guard in front of the
admin UI in addition to RLS at the data layer. Two residual items, both
documented in `docs/ARCHITECTURE.md` → Known gaps: `script-src 'unsafe-inline'`
in the CSP (nonces would disable static rendering sitewide), and the anon
`messages` INSERT having no database-level rate limit — mitigated by
application-level rate limiting in `/api/contact`. One clarity fix applied:
the `site_settings` FOR ALL policy now states `WITH CHECK` explicitly rather
than relying on Postgres defaulting it to the `USING` expression.

## 2. Database Integrity
- [ ] Required fields / NOT NULL checks on all tables
- [ ] Unique constraints where needed
- [ ] FK cascade behavior (admin_users → auth.users, etc.)
- [ ] Data types (price, sqft, rating bounds)
- [ ] Indexes on filtered/sorted columns (properties: type, status, price, location; messages: status, is_read; services: display_order)
- [ ] Testimonials `featured` cap enforced in DB (currently client-side only)
- [ ] Schema drift: `Property.amenities`, `Property.related_property_ids`, `Service.is_active` in types but not SQL — reconcile
- [ ] Flag leftover test/seed/dummy data
- [ ] Section 2 summary written

## 3. UI Pass (375px / 768px / 1024px+ each; refactor rough code as found)

### Public (site)
- [ ] `/` — home
- [ ] `/properties` — property grid + filter bar (high risk on mobile)
- [ ] `/properties/[slug]` — detail page (verify legacy UUID URLs 301 to the slug)
- [ ] `/properties/[id]` — property detail
- [ ] `/services`
- [ ] `/services/[slug]`
- [ ] `/services` — legacy (redirects; verify)
- [ ] `/services/[id]` — legacy (redirects; verify)
- [ ] `/about`
- [ ] `/contact` — form
- [ ] `/privacy`
- [ ] `/terms`
- [ ] `/offline` — PWA fallback
- [ ] `/maintenance`
- [ ] `not-found` (site + root)
- [ ] Shared: Navbar (mobile menu, touch targets)
- [ ] Shared: Footer
- [ ] Shared: Chatbot widget

### Admin
- [ ] `/admin/login`
- [ ] `/admin/dashboard`
- [ ] `/admin/properties` — table + forms (high risk on mobile)
- [ ] `/admin/services`
- [ ] `/admin/testimonials`
- [ ] `/admin/messages`
- [ ] `/admin/settings`
- [ ] Shared: AdminLayout sidebar (mobile behavior)
- [ ] Section 3 summary written

### Refactors performed (log what + why)
- (none yet)

## 4. Error Handling & States
- [ ] Loading/empty/error/success states audit per page (site + admin)
- [ ] Global error boundary (`global-error.tsx` exists — verify quality)
- [ ] Missing `error.tsx` / `loading.tsx` for routes that need them
- [ ] Remove console.log / debug artifacts from production paths
- [ ] Contact form: frontend + backend validation confirmed
- [ ] Contact form: double-submit protection
- [ ] Admin forms: validation + double-submit protection
- [ ] Section 4 summary written

## 5. Performance & Images
- [ ] Determine: real Supabase Storage images vs placeholder/Unsplash — REPORT TO OWNER
- [ ] next/image everywhere: width/height, sizes, lazy below fold, priority hero only
- [ ] Unnecessary re-renders (memoization where warranted)
- [ ] Duplicate Supabase queries per page
- [ ] Pagination on property list (if list can grow past ~20)
- [ ] Section 5 summary written

## 6. SEO & AI-Search Visibility
- [ ] robots.ts correct
- [ ] sitemap.ts correct (includes dynamic property/service URLs?)
- [ ] Unique dynamic title/description per property detail page
- [ ] Unique dynamic title/description per service detail page
- [ ] schema.org RealEstateListing/Product on property pages
- [ ] schema.org Organization/LocalBusiness site-wide
- [ ] Content server-rendered/crawlable (ISR pages OK; verify nothing critical is client-only)
- [ ] Section 6 summary written

## 7. Final Pass
- [ ] All PROGRESS.md items checked or marked `[!]`
- [x] LAUNCH_CHECKLIST.md created with owner action items
