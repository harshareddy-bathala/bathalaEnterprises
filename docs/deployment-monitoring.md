# Deployment And Monitoring Runbook

This runbook is the release checklist for production deployments (for example, Vercel).

## 1. Required Environment Configuration

Verify all required environment variables are present in the deployment target:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

If email notifications are enabled:

- `RESEND_API_KEY`
- `CONTACT_EMAIL`
- `SENDER_EMAIL`
- `CONTACT_EMAIL_NOTIFICATIONS`

For Vercel GitHub Actions deployment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 2. Database Admin Access Prerequisite

`SUPABASE_UNIVERSAL_SETUP.sql` creates the admin auth objects used by runtime checks:

- `public.admin_users`
- `public.is_admin_user()`

Grant admin access to each admin user:

```sql
INSERT INTO public.admin_users (user_id, is_active)
SELECT id, TRUE
FROM auth.users
WHERE email = 'YOUR_ADMIN_EMAIL@example.com'
ON CONFLICT (user_id) DO UPDATE
SET is_active = EXCLUDED.is_active,
    updated_at = NOW();
```

## 3. Static Quality Gates

Run in repository root:

```bash
npm run lint:ci
npm run typecheck
```

## 4. Production Build Validation

Preferred command:

```bash
npm run build
```

If PowerShell policy blocks `next` directly, use:

```bash
node ./node_modules/next/dist/bin/next build
```

## 5. Predeploy Script Checks

```bash
npm run check:predeploy
npm run check:env
npm run check:analytics
npm run check:contact-email
```

## 6. QA And Performance Checks

```bash
npm run test:critical-flows
npm run lighthouse:production
```

## 7. Manual Smoke Checklist

Validate these paths in a production-like deployment:

- Services flows: `/services`, `/services/[slug]`, quick preview modal behavior.
- Admin flows: `/admin/login`, dashboard access for an active `public.admin_users` account.
- Contact flow: `/contact` form submission and success response behavior.

## 8. Release Hygiene

Before tagging or final deployment:

- Ensure generated artifacts are not committed.
- Confirm SQL setup files remain tracked at repo root:
  - `SUPABASE_UNIVERSAL_SETUP.sql`
  - `SUPABASE_FIX_MESSAGES_RLS.sql`
- Confirm CI warnings about missing deployment secrets are resolved in repository settings.
