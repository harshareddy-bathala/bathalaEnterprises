# Deployment

How the app ships to Vercel today, what it needs, and how to stand up a new environment from zero.

## Current deployment model

Deployment is driven by **GitHub Actions using the Vercel CLI** (`.github/workflows/deploy.yml`), not by Vercel's Git integration:

- **PR → preview**: on pull requests to `main`, the workflow runs `vercel pull --environment=preview`, `vercel build`, `vercel deploy --prebuilt`, and comments the preview URL on the PR.
- **Push to `main` → production**: `vercel pull --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`.
- Both jobs are gated on the presence of `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` repo secrets and **silently skip** if any is missing — a missing secret looks like a green build with no deploy.
- Companion workflows: `ci.yml` (lint/typecheck/build), `lighthouse.yml` (Lighthouse CI, configs in `.lighthouserc.production.json` / `.lighthouserc.qa.json`).

Environment variables are managed in the **Vercel project dashboard** (pulled at build time via `vercel pull`); GitHub only holds the three Vercel credentials.

Production behavior toggles on `NODE_ENV=production`: security headers + redirects in `next.config.mjs`, CSP via `src/proxy.ts`, image optimization, `removeConsole` (keeps error/warn), package-import optimization.

## Required environment variables (set in Vercel)

Minimum for the site to function:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (canonical URL — drives metadata, sitemap, HTTPS redirect host, admin links in emails)

Contact form + email notifications:

- `SUPABASE_SERVICE_ROLE_KEY` (or alias `NEXT_SUPABASE_SERVICE_ROLE_KEY`) — fail-safe writer for `messages`; without it the form relies purely on the anon RLS insert policy
- `RESEND_API_KEY`, `CONTACT_EMAIL`, `SENDER_EMAIL`, `CONTACT_EMAIL_NOTIFICATIONS` (default `true`; Resend testing mode only delivers to the Resend account inbox until a domain is verified)

Chatbot: `GOOGLE_AI_API_KEY` (chat degrades gracefully without it), optional `CHAT_RATE_LIMIT_MAX` / `CHAT_RATE_LIMIT_WINDOW_MS`

Optional observability/SEO: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ENABLE_RUM`, `ERROR_TRACKING_WEBHOOK_URL`/`_TOKEN`, `LOG_INGEST_URL`/`_TOKEN`, `RUM_INGEST_URL`/`_TOKEN`, `GOOGLE_SITE_VERIFICATION`, `SSL_MIN_DAYS` (predeploy script threshold)

GitHub repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Deploying a new environment from scratch

1. **Supabase project**
   1. Create a project at supabase.com; note the project URL, anon key, and service-role key (Settings → API).
   2. Open the SQL Editor and run `SUPABASE_UNIVERSAL_SETUP.sql` **once**. It creates all tables, RLS policies, triggers, indexes, realtime publications, and the `property-images` / `testimonial-avatars` storage buckets. ⚠️ It `DROP`s and recreates `services` — never re-run against a database with live services data.
   3. Create the admin user: Dashboard → Authentication → Users → "Add user" (email + password, confirm email), then in SQL Editor:
      ```sql
      INSERT INTO public.admin_users (user_id, is_active)
      SELECT id, TRUE FROM auth.users WHERE email = 'ADMIN_EMAIL'
      ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, updated_at = NOW();
      ```
2. **Resend** (optional but expected in prod): create an API key; verify the sending domain and set `SENDER_EMAIL` to an address on it. Without a verified domain, use `onboarding@resend.dev` and set `CONTACT_EMAIL` to your Resend account inbox.
3. **Google AI** (optional): create an API key at aistudio.google.com/apikey for the chatbot.
4. **Vercel project**
   1. `vercel link` (or create the project in the dashboard) — framework preset Next.js, Node 20.
   2. Add all environment variables above for Production (and Preview as appropriate).
   3. Attach the custom domain and set `NEXT_PUBLIC_SITE_URL` to match (the prod redirect rules and email links derive the host from it).
5. **GitHub**: add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` as repo secrets. Pushing to `main` now deploys production; PRs get preview deploys.
6. **Verify** (predeploy scripts run locally against the target env, reading `.env.local` or exported vars):
   ```bash
   npm run check:env         # required env vars present
   npm run check:external    # Supabase / Resend / Google AI reachability
   npm run check:predeploy   # full checklist
   npm run check:contact-email  # end-to-end contact email delivery
   npm run check:ssl         # cert validity ≥ SSL_MIN_DAYS
   ```
   Then hit `https://<domain>/api/health` — expect `"status": "ok"` — and log in at `/admin/login`.
7. **Smoke test**: `npm run test:critical-flows` (Playwright) against the deployed URL; optionally `npm run lighthouse:production`.

See also `docs/deployment-monitoring.md` — the operational runbook with the release checklist, monitoring setup, and RLS remediation steps (`SUPABASE_FIX_MESSAGES_RLS.sql` if contact-form inserts hit RLS errors).

## Known gaps

<!-- To be filled in during the production readiness pass -->

-
