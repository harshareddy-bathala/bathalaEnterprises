# Deployment Guide: Deploy to Vercel and Supabase

This guide walks you through a single, simple deployment workflow for Bathala Enterprises. It includes steps to run the Supabase schema, create an admin user, set environment variables, and deploy the Next.js app to Vercel.

---

## Quick Overview

- Host frontend on Vercel (recommended)
- Host backend data on Supabase (Postgres)
- Set environment variables on Vercel for Supabase
- Enable Row Level Security and policies in Supabase

---

## 1) Create Supabase Project and Run Schema

1. Sign into Supabase (https://app.supabase.com) and create a new project (or use your existing project).
2. Get your **Project URL** and **anon public API key** from the Project Settings → API (Client keys section).
3. Go to **SQL Editor** and run `SUPABASE_SETUP.sql` (this file is in the repository root) to create `properties`, `services`, and `inquiries` tables and seed sample data.

Notes: If you see a message "Connect to your project", do the following:

- In the Supabase dashboard, click the project name in the top left and confirm you are inside the correct project. If you just created a project, you may need to finish provisioning and refresh the page.
- Open **SQL Editor** → Click **New Query** → Paste contents of `SUPABASE_SETUP.sql` and click **Run**. If the sidebar shows a different project, switch to the correct project using the project selector.

To find your Project URL and Anon Key: Project → Settings → API → Client Keys (copy the Project URL and the "anon" public key). Use those values in `.env.local` and Vercel environment variables.

---

## 2) Create Admin User in Supabase

1. In Supabase Dashboard → Authentication → Users → Add User → Create new user.
2. Fill in:
   - Email: admin@bathala.com (or your own admin email)
   - Password: your secure password
   - Toggle **Auto confirm user** ON
3. Click the created user → Edit User Metadata → Add this JSON:

```json
{
  "is_admin": true
}
```

This `is_admin` metadata is used by the app to restrict access to the admin dashboard.

---

## 3) Row Level Security (RLS) - Recommended for Production

In Supabase SQL Editor, add the following policies to restrict CRUD operations to admins:

```sql
-- Allow anyone to read properties
CREATE POLICY "Public read properties"
ON properties FOR SELECT
TO authenticated, anon
USING (true);

-- Admin management for properties
CREATE POLICY "Admins manage properties"
ON properties FOR ALL
TO authenticated
USING (auth.jwt() ->> 'user_metadata' ->> 'is_admin' = 'true')
WITH CHECK (auth.jwt() ->> 'user_metadata' ->> 'is_admin' = 'true');

-- Services: public read
CREATE POLICY "Public read services"
ON services FOR SELECT
TO authenticated, anon
USING (true);

-- Services: admins manage
CREATE POLICY "Admins manage services"
ON services FOR ALL
TO authenticated
USING (auth.jwt() ->> 'user_metadata' ->> 'is_admin' = 'true')
WITH CHECK (auth.jwt() ->> 'user_metadata' ->> 'is_admin' = 'true');

-- Inquiries: Anyone can submit an inquiry
CREATE POLICY "Insert inquiries"
ON inquiries FOR INSERT
TO anon
WITH CHECK (true);

-- Inquiries: Admins can read
CREATE POLICY "Admins read inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'user_metadata' ->> 'is_admin' = 'true');
```

Note: Edit policies as required for your security model.

---

## 4) Configure Environment Variables Locally

Create a `.env.local` file in the project root with these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

If you do not add these, the app will not be able to fetch data from Supabase and will display empty arrays.

---

## 5) Deploy to Vercel

1. Push your repository to GitHub (or your preferred Git provider).
2. Create a new Vercel project and import the repo.
3. In Vercel's project settings, add environment variables (Production and Preview):

- `NEXT_PUBLIC_SUPABASE_URL` = https://<your-project-id>.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = <your-anon-key>

4. Build command: `npm run build`
5. Install command: `npm install`
6. Output directory: (leave default for Next.js)
7. Click **Deploy**.

---

## 6) Final Checks

- Open the Vercel deployment and test:
  - `https://<your-deployment-url>/` - Homepage
  - `https://<your-deployment-url>/admin/login` - Admin login
- Login using the admin user created in Supabase (ensure `is_admin` metadata is true)
- Create a property or service via admin; verify the public site reflects updates

---

## Appendix: Troubleshooting

- If the site shows empty data: verify `SUPABASE_SETUP.sql` was executed successfully and `properties`/`services` tables contain rows.
- If authentication fails: confirm user exists in Supabase and `is_admin` metadata is set to true.
- If you get CORS/network issues: check Supabase Project settings for allowed origins.

---

If you want, I can also create a Vercel template and set up GitHub Actions (CI) for deployment automation.
