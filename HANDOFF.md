# Handoff — production hardening pass

**Branch:** `feat/seo-production-hardening` (9 commits, not yet merged or pushed)
**Date:** 1 August 2026
**State:** all automated gates green; nothing merged to `main`; no domain purchased yet.

This document is the one thing you need to read. It covers what changed, what
you have to do, and how to check my work.

---

## Part 1 — Verification status

Everything below was run from a clean `.next` on the final commit.

| Gate | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | **pass** — 0 errors |
| Lint | `npm run lint:ci` | **pass** — 0 errors, 19 warnings (see §5) |
| Build | `npm run build` | **pass** — 30 routes |
| Critical flows | `npm run test:critical-flows` | **8/8 pass** |
| Accessibility (axe) | `npm run test:a11y` | **5/5 pass** |

Also verified by hand against a production build on `localhost:3111`:

- All 10 public routes and all 7 machine routes return 200
  (`/indexnow-key.txt` correctly 404s until `INDEXNOW_KEY` is set).
- All 4 legacy redirects resolve to the right target with 308.
- Every page has a **unique** `<title>`, a correct self-referencing
  `<link rel="canonical">`, and an `og:image` — and no title has the duplicated
  `| Bathala Enterprises | Bathala Enterprises` suffix.
- `/admin/login`, `/maintenance` and `/offline` all emit
  `<meta name="robots" content="noindex, nofollow">`.
- JSON-LD per page confirmed: `Organization` + `RealEstateAgent` sitewide,
  `ItemList` on both listing pages, `FAQPage` on `/about` and `/contact`. Every
  block parses as valid JSON.
- Security headers present (HSTS, nosniff, X-Frame-Options, Referrer-Policy,
  Permissions-Policy). CSP no longer references Google Fonts hosts.
- `Cache-Control`: `/api/health` cacheable, `/api/contact` `no-store`.
- All 152 rendered icon glyphs resolve across 8 routes × 2 viewports.

### What could NOT be verified, and why

There is no `.env.local` on this machine, so **nothing that needs a live
database was exercised end to end.** Specifically:

- Slug resolution and the UUID → slug 301 on real rows
- Per-property Open Graph cards (photo, price, beds/sqft)
- The new database-side "Related Properties" query
- Admin CRUD, Realtime subscriptions, image upload
- `AggregateRating` (needs testimonials), `Organization.sameAs` (needs
  `site_settings` social URLs)
- `/llms.txt` and `/feed.xml` with real listings

All of it typechecks and has fallback paths, but **§4 below is the list of
things you must click through before launch.**

---

## Part 2 — What changed, in one page

Nine commits, six phases. Read `git log` on the branch for full reasoning.

**Phase 1 — critical SEO defects.** Every Open Graph image on the site was a
404 (`/og-image.jpg` and `/logo.png` never existed). No page overrode
`openGraph`/`twitter`, so every URL shared the homepage's social card. Four
titles rendered a doubled brand suffix. The sitemap stamped `new Date()` on
every URL including the privacy policy, and advertised a URL that 301s.

Two things found that weren't in the plan: **ISR was disabled sitewide**
(`unstable_noStore()` in a helper the Footer calls from the shared layout, so
`revalidate = 60` did nothing), and **the chatbot was giving customers a phone
number, email and address that do not exist.**

**Phase 2 — URL structure.** Listings lived at `/all-properties` while details
lived at `/properties/[uuid]`, so detail pages had no crawlable parent and the
URLs carried zero keywords. Now `/properties` + `/properties/<slug>` and
`/services` + `/services/<slug>`, with 301s from every old path and
`generateStaticParams` pre-rendering the catalogue.

**Phase 3 — structured data and AI discoverability.** Business identity now
comes from `site_settings` instead of drifting constants. Added `ItemList`
(lets an agent enumerate the whole catalogue from one fetch), `FAQPage`,
`AggregateRating`, `/llms.txt`, `/feed.xml`, `security.txt`, explicit AI-crawler
rules in `robots.txt`, and IndexNow.

**Phase 4 — visual and UX.** The LCP element sat at `opacity: 0` behind a 310ms
animation delay. The icon font was **3.2 MB** — the full unsubsetted Material
Symbols, preloaded, for ~100 glyphs; it is now a self-hosted 11.6 KB subset
(**99.6% smaller**). Fixed a critical axe violation, added a focus trap to the
mobile nav, hid 139 icon ligatures from screen readers, fixed focus-ring
contrast, and converted the spacing/type scales to rem. Deleted ~1,000 lines of
dead components and CSS.

**Phase 5 — data layer.** Detail pages hit the database 2–3× for the same row.
"Related properties" fetched the entire table to pick three rows. The sitemap
pulled every column to build URLs.

**Phase 6 — infrastructure.** Production could deploy from a red build (CI and
deploy were separate workflows with no dependency). A missing Vercel secret
produced a green check with nothing deployed. `Cache-Control: public` was
applied to every API route including POSTs. Completed the security audit that
`PROGRESS.md` had at 0/11.

---

## Part 3 — Your steps, in order

### Step 0 — Look at it (5 min, do this first)

```bash
cd C:\Users\harsh\Desktop\bathalaenterprises
git checkout feat/seo-production-hardening
npm run dev
```

Open http://localhost:3000. Without `.env.local` the data sections will be
empty — that is expected. You are checking the **shell**: header, footer,
typography, spacing, the mobile menu at 375px.

If you want live data locally, create `.env.local` from `.env.example` with your
Supabase URL and anon key.

### Step 1 — Run the two database migrations

Supabase dashboard → SQL Editor. Run **in this order**:

1. `SUPABASE_ADD_SLUGS.sql`
2. `SUPABASE_ADD_BUSINESS_PROFILE.sql`

Both are idempotent, re-runnable, and drop nothing.

> ⚠️ **Never run `SUPABASE_UNIVERSAL_SETUP.sql` against your live database.**
> It contains `DROP TABLE public.services CASCADE` — it will delete every
> service. That file is for fresh installs only.

Verify:
```sql
SELECT id, title, slug FROM public.properties LIMIT 5;
SELECT street_address, address_locality, latitude, longitude FROM public.site_settings;
```
You should see populated slugs like `3-bhk-villa-electronic-city-3f9a1c`.

**Until this runs**, slug URLs still work but fall back to a full-table scan per
lookup, and structured data uses the `site-config.ts` fallbacks. Nothing breaks.

### Step 2 — Merge and push

The branch is 9 commits ahead of `main` and has never been pushed.

```bash
npm run typecheck && npm run lint:ci && npm run build
git push -u origin feat/seo-production-hardening
```

Then open a PR into `main`. **Do not merge yet** if your Vercel secrets aren't
set — see the warning in Step 3.

> ⚠️ **Branch protection**: `deploy.yml` no longer exists. If a required status
> check references the "Deploy" workflow, GitHub will block the merge forever
> waiting for a check that will never run. Repoint it at **"Quality and build"**.

### Step 3 — Set the GitHub and Vercel secrets

**GitHub → Settings → Secrets and variables → Actions:**

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel project → Settings → General |
| `VERCEL_PROJECT_ID` | same page |

> ⚠️ **Behaviour change**: production deploy now **fails loudly** when these are
> missing. It used to skip silently and report a green check with nothing
> deployed. If you merge to `main` before setting them, the run goes red. That is
> intentional — but set them first to avoid the noise.

**Vercel → Project → Settings → Environment Variables** (all three environments):

| Variable | Value | Without it |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | your domain (Step 4) | Everything falls back to `bathalaenterprises.com` |
| `GOOGLE_SITE_VERIFICATION` | from Search Console | Verification tag silently absent |
| `INDEXNOW_KEY` | any 8–128 char hex string you invent | IndexNow is a no-op |

Your existing Supabase/Resend/Google AI variables stay as they are.

### Step 4 — Buy the domain

- **Registrar:** Cloudflare Registrar for `bathalaenterprises.com` — at-cost
  renewals, no markup, free WHOIS privacy.
- **Also want `.in`?** Cloudflare doesn't sell `.in`. Buy `bathalaenterprises.in`
  from Namecheap or BigRock and 301 it to the `.com`. Worth it for an
  India-local business — mild local relevance plus brand defence.
- **DNS:** host at Cloudflare, but set the Vercel records to **DNS-only (grey
  cloud)**. Proxying Cloudflare in front of Vercel double-CDNs the site and
  interferes with ISR cache invalidation.
- **Canonical host:** use the apex `https://bathalaenterprises.com`; add `www`
  in Vercel as a redirect to it. Never let both resolve 200.

Then set `NEXT_PUBLIC_SITE_URL` in Vercel and redeploy. **Everything derives
from that one value** — canonicals, OG URLs, sitemap, robots, JSON-LD,
`llms.txt`, RSS.

### Step 5 — Fill in the business data

**Admin → Settings.** Phone, email and address are now read from the database by
the footer, the contact page, all the JSON-LD, `/llms.txt` **and the chatbot**.

> The chatbot previously told customers a phone number, email and address that
> did not exist. Whatever is in `site_settings` is now what customers are told.

Also add the **Google Business Profile URL** (create/claim it first at
business.google.com if you haven't). For a local real-estate business this
outranks most on-page work, and the URL feeds `Organization.sameAs` — the
strongest local-SEO association signal available.

### Step 6 — Two content decisions only you can make

**6a. Contradictory claims.** `src/app/layout.tsx` says *"15+ years of trusted
experience with 500+ properties"* — that is the text Google prints in search
results. `/about` says *"10+ Years of Experience"* and *"50+ Properties
Managed"*, the timeline says founded 2014 (12 years), and the 2017 milestone
says "100+ Properties" while the headline stat says 50+.

Give me the correct figures and I'll make them consistent everywhere.

**6b. FAQ copy.** `src/lib/faq-content.ts` — six Q&As I drafted from what the
site already states, deliberately free of numbers, prices and timelines.
**Everything in that file is published to Google as a factual claim about your
business**, grounds the chatbot's answers, and appears in `/llms.txt`. Please
read it and replace with your own wording.

### Step 7 — Register with search engines

Once the domain is live:

1. **Google Search Console** → add property → verify (the
   `GOOGLE_SITE_VERIFICATION` tag) → submit `https://<domain>/sitemap.xml`
2. **Bing Webmaster Tools** → same, and it picks up IndexNow automatically

### Step 8 — Run the predeploy checks against the live domain

```bash
npm run check:predeploy    # env + external services + SSL
npm run check:ssl          # certificate expiry
npm run check:analytics    # GA tag present
```

---

## Part 4 — What to test manually (needs real data)

This is the list I could not verify. Do it on a Vercel preview before going live.

**Properties**
- [ ] `/properties` lists your real listings; type filters work
- [ ] A property card links to `/properties/<slug>` — a **readable slug**, not a UUID
- [ ] Visiting the **old** `/properties/<uuid>` URL 301s to the slug URL
- [ ] The "Related Properties" rail shows up to 3 sensible listings *(new DB query — most likely place for a bug)*
- [ ] Paste a property URL into Slack/WhatsApp — the card shows the **property photo**, its price and beds/sqft, not a generic image

**Services** — same three checks for `/services/<slug>`

**Admin** (`/admin/login`)
- [ ] Log in; a non-admin account is rejected
- [ ] Create a property → slug generates → public URL works
- [ ] Edit its title → slug updates → **old slug still resolves and redirects**
- [ ] Upload a gallery image
- [ ] Reorder services *(timeout behaviour changed here)*
- [ ] Feature a 4th testimonial → should be refused with a clear message
- [ ] Settings → save → footer and chatbot reflect the change

**Machine-readable**
- [ ] `/llms.txt` lists your real catalogue with prices
- [ ] `/feed.xml` is valid RSS
- [ ] `/robots.txt` names the AI crawlers
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) on a
      property URL → `RealEstateListing`, `BreadcrumbList`, `Offer`, no errors

**Chatbot**
- [ ] Ask "what's your phone number?" → **the real one**
- [ ] Ask about a listing → only real listings, no invented ones

**Performance** — run Lighthouse on the live domain. Expect a large LCP
improvement (icon font 3.2 MB → 11.6 KB, LCP element no longer starts invisible).

---

## Part 5 — Known gaps (deliberate, documented)

Full reasoning in `docs/ARCHITECTURE.md` → Known gaps. The four worth knowing:

1. **Soft 404s.** An unknown slug renders the not-found page with HTTP **200**,
   not 404. This is Next's streaming behaviour — once the shell flushes the
   status is locked. I verified it is *not* caused by `loading.tsx`,
   `generateStaticParams`, or the root Suspense boundaries. Mitigated: those
   responses carry `noindex, nofollow`, so the URLs never get indexed. Residual
   cost is a "soft 404" line in Search Console.

2. **`script-src 'unsafe-inline'` stays in the CSP.** You approved fixing this
   with nonces. I did not, deliberately: Next requires a fresh nonce per
   request, which forces dynamic rendering and would **disable static
   generation and ISR sitewide** — undoing the single biggest performance win of
   this whole pass. I removed the dead nonce code (it implied protection that
   did not exist) and tightened every other directive instead. Say the word if
   you want nonces anyway; it is a real trade, not an oversight.

3. **19 lint warnings**, almost all `set-state-in-effect` in admin CRUD. These
   rules were switched *off* before; they are now `warn`. Fixing them changes
   when effects re-run, so each needs exercising against a live database rather
   than a blind sweep.

4. **`/properties` paginates in the browser**, sending the whole active
   catalogue to the client. Correct at ~50 listings and better UX than
   round-tripping per page. Revisit past a few hundred.

---

## Part 6 — If something breaks

**Styling looks broken locally** — almost always a stale build. This bit me
several times:
```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Remove-Item -Recurse -Force .next
npm run dev
```

**An icon renders as the literal word** (e.g. "menu") — it's missing from the
font subset:
```bash
npm run icons:subset   # then commit the regenerated .woff2
```

**Admin save fails after a schema change** — the query layer tolerates missing
columns, but check the browser console for the exact PostgREST error.

**Rollback** — nothing is merged. `git checkout main` returns you to exactly the
current production state.

---

## Reference

| Document | What it covers |
|---|---|
| `LAUNCH_CHECKLIST.md` | The same owner actions, as a tick-list |
| `CLAUDE.md` | Stack, folders, schema, conventions |
| `docs/ARCHITECTURE.md` | Data flow, rendering per route, machine surface, known gaps |
| `docs/DEPLOYMENT.md` | Vercel/CI setup, env vars, known gaps |
| `docs/deployment-monitoring.md` | Operational runbook |
| `PROGRESS.md` | Release checklist; §1 security audit now complete |
| `.claude/skills/bathala-conventions/SKILL.md` | Conventions for future code changes |
