# Launch checklist — owner actions

Everything in this file needs an account, a purchase, or a decision, so none of
it could be done from the codebase. The code is already written to consume all
of it; nothing here requires further development.

Work top to bottom — items 1 and 2 unblock the rest.

---

## 1. Run the two database migrations

In the Supabase SQL editor, run these **in order**:

1. `SUPABASE_ADD_SLUGS.sql` — adds and backfills `properties.slug` and
   `services.slug`, plus triggers so rows created from the Supabase dashboard
   get a slug automatically.
2. `SUPABASE_ADD_BUSINESS_PROFILE.sql` — adds structured address fields, geo
   coordinates and a Google Business Profile URL to `site_settings`, seeded from
   the values currently hardcoded in `src/lib/site-config.ts`.

Both are idempotent, re-runnable, and drop nothing.

> ⚠️ **Do not run `SUPABASE_UNIVERSAL_SETUP.sql` against the live database.**
> It contains `DROP TABLE public.services CASCADE`. That file is for fresh
> installs only.

**Verify:**
```sql
SELECT id, title, slug FROM public.properties LIMIT 5;
SELECT street_address, address_locality, latitude, longitude FROM public.site_settings;
```

Until this runs, slug URLs still work but fall back to a full-table scan per
lookup, and structured data uses the `site-config.ts` fallbacks.

---

## 2. Buy the domain and point it at Vercel

- **Registrar**: Cloudflare Registrar for `bathalaenterprises.com` — at-cost
  renewals, no markup, free WHOIS privacy.
- **`.in` as well?** Cloudflare does not sell `.in`. If you want
  `bathalaenterprises.in` (worth it for an India-local business — mild local
  relevance plus brand defence), buy it from Namecheap or BigRock and 301 it to
  the `.com`.
- **DNS**: host at Cloudflare but set the Vercel records to **DNS-only (grey
  cloud)**. Proxying Cloudflare in front of Vercel double-CDNs the site and
  interferes with ISR cache invalidation.
- **Canonical host**: use the apex (`https://bathalaenterprises.com`) and add
  `www` in Vercel as a redirect to it. Never let both resolve 200.

Then set in Vercel (**all three environments**):

```
NEXT_PUBLIC_SITE_URL=https://bathalaenterprises.com
```

Everything derives from this one value — canonicals, Open Graph URLs, the
sitemap, `robots.txt`, JSON-LD, `llms.txt` and the RSS feed.

---

## 3. Set the remaining environment variables in Vercel

| Variable | Why | Without it |
|---|---|---|
| `GOOGLE_SITE_VERIFICATION` | Search Console verification | Verification meta tag silently absent |
| `INDEXNOW_KEY` | Push new listings to Bing/Copilot in minutes | `/api/indexnow` is a no-op, `/indexnow-key.txt` 404s |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub Actions deploy | **Production deploy now fails loudly** (it used to skip silently) |

`INDEXNOW_KEY` can be any 8–128 character hex string you invent.

---

## 4. Create / claim the Google Business Profile

For a local real-estate business this outranks most on-page work. Once you have
the profile URL, paste it into **Admin → Settings** (or the `google_business_url`
column). It feeds `Organization.sameAs`, which is the strongest local-SEO
association signal available.

---

## 5. Check `site_settings` holds real values

Admin → Settings. Phone, email and address are now read from the database by the
footer, the contact page, the JSON-LD, `/llms.txt` and **the chatbot**.

> The chatbot previously told users a phone number, email and address that did
> not exist. It now reads from `site_settings`, falling back to
> `src/lib/site-config.ts`. Whatever is in there is what customers are told.

---

## 6. Fix the contradictory business claims

`src/app/layout.tsx` says **"15+ years of trusted experience with 500+
properties"** — that is the meta description Google prints in search results.
`/about` says **"10+ Years of Experience"** and **"50+ Properties Managed"**, and
the timeline says founded 2014 (12 years). The 2017 milestone says "100+
Properties" while the headline stat says 50+.

Tell me the correct numbers and I will make them consistent everywhere.

---

## 7. Review the FAQ copy

`src/lib/faq-content.ts` — six questions and answers I drafted from what the site
already states, deliberately free of numbers, prices and timelines.

**Everything in that file is published to Google as a factual claim about your
business**, and it also grounds the chatbot's answers and appears in
`/llms.txt`. Please read it and replace with your own wording.

---

## 8. Optional: a proper square logo

`Organization.logo` currently points at the existing
`public/android-chrome-512x512.png` favicon asset. A real 512×512 transparent
brand logo would be better. Drop it in as `public/logo.png` and tell me.

---

## After the domain is live

1. Verify in **Google Search Console** and **Bing Webmaster Tools**, submit
   `https://<domain>/sitemap.xml`.
2. Run the predeploy checks against the live domain:
   ```
   npm run check:predeploy
   npm run check:ssl
   npm run check:analytics
   ```
3. Spot-check these by hand — they need real data and a real domain, which is
   why they could not be verified locally:
   - A property detail page: the slug URL resolves, the old UUID URL 301s to it,
     and the Open Graph card shows the property photo with price and beds/sqft.
   - `https://<domain>/llms.txt` lists your real catalogue.
   - Paste a property URL into the
     [Rich Results Test](https://search.google.com/test/rich-results) — expect
     `RealEstateListing`, `BreadcrumbList` and `Offer` with no errors.
   - Admin CRUD end to end: create a property, confirm the slug generates and
     the public URL works.
   - The `/properties` "Related Properties" rail (new database-side query).
