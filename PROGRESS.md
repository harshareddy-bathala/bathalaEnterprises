# PROGRESS.md — Production Release Checklist

> Session tracker for the prototype → production pass. Update as items complete.
> Legend: `[ ]` pending · `[x]` done · `[~]` in progress · `[!]` needs owner input (see MANUAL_SETUP.md)

## 0. Setup
- [x] Create PROGRESS.md
- [x] CLAUDE.md — already exists and documents stack/folders/schema/auth (verified, no rewrite needed)

## 1. Security & Secrets
- [ ] Audit `/api/contact` for auth/authorization correctness
- [ ] Audit `/api/chat` for auth/authorization correctness
- [ ] Audit `/api/health` for information disclosure
- [ ] Audit `/api/rum` for abuse potential
- [ ] Search working tree for hardcoded API keys / service role keys
- [ ] Search full git history for committed secrets / .env files
- [ ] Confirm `.env*` gitignored
- [ ] Review RLS policies for every table (admin_users, properties, services, testimonials, messages, site_settings, admin_notification_settings)
- [ ] Review storage bucket policies (property-images, testimonial-avatars)
- [ ] Assess admin route protection (client-side only today; RLS is enforcement boundary — evaluate & harden)
- [ ] Section 1 summary written

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
- [ ] MANUAL_SETUP.md created with owner action items
