# Bathala Enterprises - Development Guidelines

## Project Overview

This is a Next.js real estate web application for Bathala Enterprises, featuring:

- Property listings with filtering (Rent/Lease/Sale)
- Service showcase
- Contact form with inquiry management
- Admin dashboard for content management
- Chatbot widget

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 3.4
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Forms:** React Hook Form + Zod

## Key Conventions

### File Structure
- Pages go in `src/app/`
- Components in `src/components/`
- Utilities in `src/lib/`
- Types in `src/types/`

### Styling
- Use Tailwind CSS classes
- Custom colors: `royal`, `purple`, `amberGlow`, `slateInk`
- Glass panel effect: `glass-panel` class
- Container: `container-wide` class

### Data Types
- Property types: `"Rent" | "Lease" | "Sale"` (capitalized)
- Always import types from `@/lib/supabase-queries` or `@/types/tables`

### Security
- Sanitize all user inputs using `@/lib/security`
- Use rate limiting for forms
- Validate with Zod schemas

### SEO
- Add metadata to all pages
- Use semantic HTML
- Include proper alt text for images

## Development Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # Lint check
npm run typecheck # Type check
```

## Documentation

- [README.md](../README.md) - Project overview
- [SUPABASE_UNIVERSAL_SETUP.sql](../SUPABASE_UNIVERSAL_SETUP.sql) - Unified production schema, policies, and baseline setup
