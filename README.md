# Bathala Enterprises

> Premium Real Estate Services in Bangalore - Building trust, one property at a time.

A modern, enterprise-grade real estate web application built with Next.js App Router, featuring property listings, service showcase, admin dashboard, and contact management.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)

## ✨ Features

- **🏠 Property Listings** - Showcase properties for rent, lease, and sale with filtering
- **📋 Services Display** - Present your real estate services with beautiful cards
- **📝 Contact Form** - Secure message capture in Supabase with optional email notifications
- **🔐 Admin Dashboard** - Full CRUD for properties and services
- **🤖 Chatbot Widget** - Context-aware FAQ assistant
- **🔍 SEO Optimized** - Sitemap, robots.txt, meta tags, Open Graph
- **📱 Fully Responsive** - Mobile-first design
- **⚡ Performance** - ISR, image optimization, security headers
- **🛡️ Security** - Input sanitization, XSS protection, CSP headers

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| UI Components | Custom shadcn-inspired primitives |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Forms | React Hook Form + Zod |
| Icons | Material Symbols |
| Fonts | Inter, Playfair Display |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bathala-enterprises.git
cd bathala-enterprises

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

Create `.env.local` with:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-only key (required for local admin scripts like seed:add testimonials)
# Use either name below. Never expose this value in client code.
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
# NEXT_SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional: Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Google Site Verification
GOOGLE_SITE_VERIFICATION=your-verification-code

# Optional: Contact message email notifications
RESEND_API_KEY=your-resend-api-key
CONTACT_EMAIL=ops@yourdomain.com
SENDER_EMAIL=notifications@yourdomain.com
CONTACT_EMAIL_NOTIFICATIONS=true
```

### Database Setup

1. Create a Supabase project
2. Run `SUPABASE_UNIVERSAL_SETUP.sql` in the SQL Editor
3. Create an admin user in Supabase Auth
4. Grant admin privileges by inserting the user into `public.admin_users`:

```sql
INSERT INTO public.admin_users (user_id, is_active)
SELECT id, TRUE
FROM auth.users
WHERE email = 'YOUR_ADMIN_EMAIL@example.com'
ON CONFLICT (user_id) DO UPDATE
SET is_active = EXCLUDED.is_active,
	updated_at = NOW();
```

5. Sign in at `/admin/login` and add properties/services via the admin console

**Note:** The database starts completely empty. All content must be added by admins through the admin dashboard.

**Admin auth model:** runtime admin checks use `public.is_admin_user()` backed by `public.admin_users`.

### Contact Form RLS Fix (If Needed)

If contact submissions fail with a row-level security policy error on `public.messages`:

1. Run `SUPABASE_FIX_MESSAGES_RLS.sql` in Supabase SQL Editor.
2. Ensure server runtime has `SUPABASE_SERVICE_ROLE_KEY` configured (recommended fail-safe).
3. Re-run `npm run check:contact-email`.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (site)/             # Public website routes
│   ├── admin/              # Admin dashboard routes
│   ├── api/                # API route handlers
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # Reusable UI primitives
│   └── admin/              # Admin-specific components
├── lib/                    # Utilities and helpers
│   ├── supabase-client.ts  # Supabase client
│   ├── supabase-queries.ts # Database queries
│   ├── security.ts         # Security utilities
│   └── utils.ts            # General utilities
└── types/                  # TypeScript types
```

## 📜 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript check
npm run lint:ci   # CI-safe lint command

# Predeploy checks
npm run check:predeploy     # Env + external APIs + SSL
npm run test:critical-flows # Playwright critical user flows
npm run lighthouse:production  # Full Lighthouse score-gated audit
npm run check:analytics     # Verify GA + RUM tracking path
npm run check:contact-email # Verify contact delivery path
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [SUPABASE_UNIVERSAL_SETUP.sql](./SUPABASE_UNIVERSAL_SETUP.sql) | Universal Supabase setup script for schema, RLS policies, and baseline application data |
| [docs/deployment-monitoring.md](./docs/deployment-monitoring.md) | Deployment verification runbook for Vercel release readiness |

## 🔒 Security Features

- ✅ Input sanitization on all forms
- ✅ Rate limiting on contact form
- ✅ XSS protection headers
- ✅ HTTPS enforcement (HSTS)
- ✅ Content Security Policy
- ✅ Row Level Security (Supabase)
- ✅ Admin authentication with Supabase Auth

## 🌐 Deployment

Use your preferred platform (for example Vercel) and run:

1. `npm run build`
2. `npm run start`

Set all required environment variables before deployment.

For complete release checks (predeploy scripts, critical-flow tests, and Lighthouse), follow [docs/deployment-monitoring.md](./docs/deployment-monitoring.md).

### CI/CD Automation

GitHub Actions workflows are included:

- [CI quality gate](./.github/workflows/ci.yml) for lint, typecheck, build, and critical-flow testing on PRs.
- [Lighthouse gate](./.github/workflows/lighthouse.yml) for score-based performance checks.
- [Deploy pipeline](./.github/workflows/deploy.yml) for preview deployments on PRs and automatic production deployment on `main`.

Required repository secrets for Vercel deployment:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for Bathala Enterprises.

## 📞 Support

- **Email:** tech@bathalaenterprises.com
- **Phone:** +91 98765 43210
- **Address:** Chikkapatre Main Road, Basapura, Bangalore 560100

---

Built with ❤️ for Bathala Enterprises