# Bathala Enterprises

> Premium Real Estate Services in Bangalore - Building trust, one property at a time.

A modern, enterprise-grade real estate web application built with Next.js 14, featuring property listings, service showcase, admin dashboard, and contact management.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)

## ✨ Features

- **🏠 Property Listings** - Showcase properties for rent, lease, and sale with filtering
- **📋 Services Display** - Present your real estate services with beautiful cards
- **📝 Contact Form** - Secure inquiry system with rate limiting and validation
- **🔐 Admin Dashboard** - Full CRUD for properties and services
- **🤖 Chatbot Widget** - Context-aware FAQ assistant
- **🔍 SEO Optimized** - Sitemap, robots.txt, meta tags, Open Graph
- **📱 Fully Responsive** - Mobile-first design
- **⚡ Performance** - ISR, image optimization, security headers
- **🛡️ Security** - Input sanitization, XSS protection, CSP headers

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| UI Components | Custom shadcn-inspired primitives |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Fonts | Inter, Patua One, Great Vibes |

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

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Optional: Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Google Site Verification
GOOGLE_SITE_VERIFICATION=your-verification-code
```

### Database Setup

1. Create a Supabase project
2. Run `SUPABASE_SETUP.sql` in the SQL Editor
3. Enable Row Level Security (RLS)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard pages
│   ├── all-properties/     # Properties listing page
│   ├── contact/            # Contact page
│   ├── privacy/            # Privacy policy
│   ├── properties/[id]/    # Property detail pages
│   ├── services/           # Services page
│   └── terms/              # Terms of service
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
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) | Complete deployment guide with Vercel, domain, and SEO setup |
| [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | Admin setup and content management guide |
| [SUPABASE_SETUP.sql](./SUPABASE_SETUP.sql) | Database schema and sample data |

## 🔒 Security Features

- ✅ Input sanitization on all forms
- ✅ Rate limiting on contact form
- ✅ XSS protection headers
- ✅ HTTPS enforcement (HSTS)
- ✅ Content Security Policy
- ✅ Row Level Security (Supabase)
- ✅ Admin authentication with Supabase Auth

## 🌐 Deployment

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for complete instructions on:

1. Deploying to Vercel
2. Connecting a custom domain
3. Setting up SSL
4. Google Search Console
5. Google Analytics

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