# Production Deployment & Domain Setup Guide

## 🚀 Production Deployment Roadmap

This guide will walk you through deploying Bathala Enterprises to production, connecting a custom domain, and making it visible on Google Search.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Supabase Setup](#supabase-setup)
3. [Deploy to Vercel](#deploy-to-vercel)
4. [Connect Custom Domain](#connect-custom-domain)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Google Search Console Setup](#google-search-console-setup)
7. [Google Analytics Setup](#google-analytics-setup)
8. [Post-Deployment Tasks](#post-deployment-tasks)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] A Supabase account with database tables created
- [ ] A Vercel account (free tier works)
- [ ] A domain name (purchase from Namecheap, GoDaddy, Google Domains, etc.)
- [ ] Environment variables ready

### Required Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional: Google Verification
GOOGLE_SITE_VERIFICATION=your_verification_code
```

---

## Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### Step 2: Create Database Tables

Run the SQL from `SUPABASE_SETUP.sql` in your Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Paste the contents of `SUPABASE_SETUP.sql`
4. Click **Run**

### Step 3: Configure Row Level Security (RLS)

The SQL file already includes RLS policies. Verify they're active:

1. Go to **Table Editor**
2. Click on each table (properties, services, inquiries)
3. Check that RLS is enabled (green toggle)

### Step 4: Create Admin User

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter admin email and password
4. After user is created, go to **SQL Editor** and run:

```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'
)
WHERE email = 'your-admin@email.com';
```

---

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Production ready deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/bathala-enterprises.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your domain or Vercel URL initially)
5. Click **Deploy**

### Step 3: Verify Deployment

1. Visit your `.vercel.app` URL
2. Test all pages work correctly
3. Test the contact form
4. Test admin login at `/admin/login`

---

## Connect Custom Domain

### Step 1: Add Domain in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Enter your domain (e.g., `bathalaenterprises.com`)
4. Also add `www.bathalaenterprises.com`

### Step 2: Configure DNS Records

Add these DNS records at your domain registrar:

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | 76.76.21.21              |
| CNAME | www  | cname.vercel-dns.com     |

**Alternative (if CNAME not supported for root domain):**

| Type  | Name | Value                                |
|-------|------|--------------------------------------|
| CNAME | @    | cname.vercel-dns.com                 |

### Step 3: Verify Domain

1. Wait 24-48 hours for DNS propagation
2. Vercel will automatically verify and issue SSL
3. Check your domain shows "Valid Configuration" in Vercel

---

## SSL Certificate Setup

Vercel automatically provisions free SSL certificates via Let's Encrypt.

1. After domain is connected, SSL is auto-enabled
2. Verify HTTPS works by visiting `https://yourdomain.com`
3. All HTTP traffic is automatically redirected to HTTPS

---

## Google Search Console Setup

### Step 1: Add Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property**
3. Choose **Domain** and enter your domain
4. Verify ownership via DNS TXT record

### Step 2: Verify Ownership

Add this DNS record at your registrar:

| Type | Name | Value                                      |
|------|------|--------------------------------------------|
| TXT  | @    | google-site-verification=YOUR_CODE_HERE    |

### Step 3: Submit Sitemap

1. After verification, go to **Sitemaps**
2. Enter: `https://yourdomain.com/sitemap.xml`
3. Click **Submit**

### Step 4: Request Indexing

1. Go to **URL Inspection**
2. Enter your homepage URL
3. Click **Request Indexing**
4. Repeat for key pages (services, properties, contact)

---

## Google Analytics Setup

### Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new GA4 property
3. Get your Measurement ID (G-XXXXXXXXXX)

### Step 2: Add to Application

Create `src/app/google-analytics.tsx`:

```tsx
'use client';

import Script from 'next/script';

export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
```

### Step 3: Add to Layout

Update `src/app/layout.tsx`:

```tsx
import GoogleAnalytics from './google-analytics';

// In the body, add:
{process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
  <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
)}
```

### Step 4: Add Environment Variable

Add to Vercel:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX`

---

## Post-Deployment Tasks

### SEO Optimization

1. **Verify sitemap.xml works:** `https://yourdomain.com/sitemap.xml`
2. **Verify robots.txt works:** `https://yourdomain.com/robots.txt`
3. **Add Open Graph image:** Create `public/og-image.jpg` (1200x630px)
4. **Add favicon:** Ensure `public/favicon.ico` exists

### Performance Checklist

- [ ] Run Lighthouse audit (target 90+ scores)
- [ ] Test mobile responsiveness
- [ ] Verify images are optimized
- [ ] Check Core Web Vitals in Search Console

### Security Checklist

- [ ] Verify security headers (use securityheaders.com)
- [ ] Test admin authentication works
- [ ] Ensure RLS is enabled on all Supabase tables
- [ ] Review and rotate API keys regularly

### Monitoring

1. Set up Vercel Analytics (free tier available)
2. Configure error tracking (Sentry recommended)
3. Set up uptime monitoring (UptimeRobot, free tier)

---

## Troubleshooting

### Domain Not Working

1. Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
2. Clear browser cache and try incognito
3. Wait 24-48 hours for full propagation

### SSL Certificate Issues

1. Remove and re-add domain in Vercel
2. Ensure DNS records are correct
3. Contact Vercel support if issues persist

### Build Failures

1. Check Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Test locally with `npm run build`

---

## Support

For technical issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Google Search Console: [support.google.com/webmasters](https://support.google.com/webmasters)

---

**Your site is now production-ready! 🎉**

After following this guide, your website will be:
- ✅ Deployed on enterprise-grade infrastructure (Vercel)
- ✅ Connected to your custom domain with HTTPS
- ✅ Indexed by Google for search visibility
- ✅ Tracked with Google Analytics
- ✅ Secured with proper headers and authentication
