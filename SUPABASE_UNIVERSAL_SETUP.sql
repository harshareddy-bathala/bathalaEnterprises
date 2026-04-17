-- =============================================================================
-- BATHALA ENTERPRISES - UNIVERSAL DATABASE SETUP
-- =============================================================================
-- Run this ENTIRE script in Supabase SQL Editor (one time only)
-- This creates all tables, policies, triggers, and indexes for the application
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. HELPER FUNCTIONS
-- =============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 1A. ADMIN AUTH OBJECTS
-- =============================================================================

-- Canonical admin registry table used by app-side admin checks.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_active
ON public.admin_users(is_active)
WHERE is_active = TRUE;

DROP TRIGGER IF EXISTS admin_users_set_updated_at ON public.admin_users;
CREATE TRIGGER admin_users_set_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
      AND is_active = TRUE
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_can_select_admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "admins_can_manage_admin_users" ON public.admin_users;

CREATE POLICY "admins_can_select_admin_users"
ON public.admin_users FOR SELECT TO authenticated
USING (public.is_admin_user() OR auth.uid() = user_id);

CREATE POLICY "admins_can_manage_admin_users"
ON public.admin_users FOR ALL TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- =============================================================================
-- 2. PROPERTIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  location VARCHAR(200) NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Rent', 'Lease', 'Sale')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  image_url VARCHAR(2000),
  thumbnail_url VARCHAR(2000),
  gallery_images JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  map_location VARCHAR(500),
  bedrooms INT NOT NULL DEFAULT 0,
  sqft INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_status_created_at ON public.properties(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_type_status ON public.properties(type, status);

-- Properties RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "public_can_select_properties" ON public.properties;
DROP POLICY IF EXISTS "admin_can_select_all_properties" ON public.properties;
DROP POLICY IF EXISTS "admin_can_insert_properties" ON public.properties;
DROP POLICY IF EXISTS "admin_can_update_properties" ON public.properties;
DROP POLICY IF EXISTS "admin_can_delete_properties" ON public.properties;

-- Public can view active properties
CREATE POLICY "public_can_select_properties"
ON public.properties FOR SELECT TO anon, authenticated
USING (status = 'active');

-- Admin can view ALL properties (including inactive)
CREATE POLICY "admin_can_select_all_properties"
ON public.properties FOR SELECT TO authenticated
USING (public.is_admin_user());

-- Admin CRUD policies
CREATE POLICY "admin_can_insert_properties"
ON public.properties FOR INSERT TO authenticated
WITH CHECK (public.is_admin_user());

CREATE POLICY "admin_can_update_properties"
ON public.properties FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "admin_can_delete_properties"
ON public.properties FOR DELETE TO authenticated
USING (public.is_admin_user());

-- Properties trigger
DROP TRIGGER IF EXISTS properties_set_updated_at ON public.properties;
CREATE TRIGGER properties_set_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- =============================================================================
-- 3. SERVICES TABLE (Enhanced Schema)
-- =============================================================================

-- Drop old services table if exists to recreate with new schema
DROP TABLE IF EXISTS public.services CASCADE;

CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  card_description VARCHAR(150),
  detailed_description TEXT,
  icon_name VARCHAR(50) DEFAULT 'home_repair_service',
  price_range VARCHAR(100),
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_display_order ON public.services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(is_featured) WHERE is_featured = TRUE;

-- Services RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_can_select_services" ON public.services;
DROP POLICY IF EXISTS "admin_can_insert_services" ON public.services;
DROP POLICY IF EXISTS "admin_can_update_services" ON public.services;
DROP POLICY IF EXISTS "admin_can_delete_services" ON public.services;

-- Public can read all services
CREATE POLICY "public_can_select_services"
ON public.services FOR SELECT TO anon, authenticated
USING (true);

-- Admin CRUD policies
CREATE POLICY "admin_can_insert_services"
ON public.services FOR INSERT TO authenticated
WITH CHECK (public.is_admin_user());

CREATE POLICY "admin_can_update_services"
ON public.services FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "admin_can_delete_services"
ON public.services FOR DELETE TO authenticated
USING (public.is_admin_user());

-- Services trigger
DROP TRIGGER IF EXISTS services_set_updated_at ON public.services;
CREATE TRIGGER services_set_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- =============================================================================
-- 4. TESTIMONIALS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  content TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  avatar_url VARCHAR(2000),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Testimonials indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_featured_created_at ON public.testimonials(featured DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating_created_at ON public.testimonials(rating DESC, created_at DESC);

-- Testimonials RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "public_can_select_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "admin_can_insert_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "admin_can_update_testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "admin_can_delete_testimonials" ON public.testimonials;

-- Public can read all testimonials
CREATE POLICY "public_can_select_testimonials"
ON public.testimonials FOR SELECT TO anon, authenticated
USING (true);

-- Admin CRUD policies
CREATE POLICY "admin_can_insert_testimonials"
ON public.testimonials FOR INSERT TO authenticated
WITH CHECK (public.is_admin_user());

CREATE POLICY "admin_can_update_testimonials"
ON public.testimonials FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

CREATE POLICY "admin_can_delete_testimonials"
ON public.testimonials FOR DELETE TO authenticated
USING (public.is_admin_user());

-- Testimonials trigger
DROP TRIGGER IF EXISTS testimonials_set_updated_at ON public.testimonials;
CREATE TRIGGER testimonials_set_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- =============================================================================
-- 5. MESSAGES TABLE (Contact Form Submissions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(20),
  query_type VARCHAR(50) NOT NULL CHECK (query_type IN ('properties', 'services')),
  service_type VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_status_created_at ON public.messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_query_type_created_at ON public.messages(query_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read_created_at ON public.messages(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_email_lower ON public.messages(LOWER(email));

-- Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "public_can_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "admin_can_select_messages" ON public.messages;
DROP POLICY IF EXISTS "admin_can_update_messages" ON public.messages;
DROP POLICY IF EXISTS "admin_can_delete_messages" ON public.messages;

-- Public can submit messages
CREATE POLICY "public_can_insert_messages"
ON public.messages FOR INSERT TO anon, authenticated
WITH CHECK (
  query_type IN ('properties', 'services')
  AND status = 'new'
  AND is_read = FALSE
);

-- Admin can read all messages
CREATE POLICY "admin_can_select_messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_admin_user());

-- Admin can update messages
CREATE POLICY "admin_can_update_messages"
ON public.messages FOR UPDATE TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- Admin can delete messages
CREATE POLICY "admin_can_delete_messages"
ON public.messages FOR DELETE TO authenticated
USING (public.is_admin_user());

-- Messages trigger
DROP TRIGGER IF EXISTS messages_set_updated_at ON public.messages;
CREATE TRIGGER messages_set_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- =============================================================================
-- 6. SITE SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_title VARCHAR(200) DEFAULT 'Bathala Enterprises',
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  facebook_url VARCHAR(255),
  twitter_url VARCHAR(255),
  instagram_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  business_hours JSONB DEFAULT '{
    "monday": "9:00 AM - 6:00 PM",
    "tuesday": "9:00 AM - 6:00 PM",
    "wednesday": "9:00 AM - 6:00 PM",
    "thursday": "9:00 AM - 6:00 PM",
    "friday": "9:00 AM - 6:00 PM",
    "saturday": "10:00 AM - 4:00 PM",
    "sunday": "Closed"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site Settings RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "public_can_read_site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "admin_can_modify_site_settings" ON public.site_settings;

-- Public can read site settings
CREATE POLICY "public_can_read_site_settings"
ON public.site_settings FOR SELECT TO anon, authenticated
USING (true);

-- Admin can modify site settings
CREATE POLICY "admin_can_modify_site_settings"
ON public.site_settings FOR ALL TO authenticated
USING (public.is_admin_user());

-- Site Settings trigger
DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_set_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Insert default site settings if not exists
INSERT INTO public.site_settings (site_title, phone, email, address)
SELECT 'Bathala Enterprises', '+91 98765 43210', 'contact@bathalaenterprises.com', 'Bangalore, Karnataka, India'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings LIMIT 1);

-- =============================================================================
-- 7. ADMIN NOTIFICATION SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  new_message_alerts BOOLEAN DEFAULT TRUE,
  daily_summary BOOLEAN DEFAULT FALSE,
  weekly_summary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Admin Notification Settings RLS
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_can_view_own_notification_settings" ON public.admin_notification_settings;
DROP POLICY IF EXISTS "users_can_update_own_notification_settings" ON public.admin_notification_settings;
DROP POLICY IF EXISTS "users_can_insert_own_notification_settings" ON public.admin_notification_settings;

-- Users can view their own settings
CREATE POLICY "users_can_view_own_notification_settings"
ON public.admin_notification_settings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "users_can_update_own_notification_settings"
ON public.admin_notification_settings FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "users_can_insert_own_notification_settings"
ON public.admin_notification_settings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin Notification Settings trigger
DROP TRIGGER IF EXISTS admin_notification_settings_set_updated_at ON public.admin_notification_settings;
CREATE TRIGGER admin_notification_settings_set_updated_at
BEFORE UPDATE ON public.admin_notification_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- =============================================================================
-- 8. REALTIME SUBSCRIPTIONS
-- =============================================================================

-- Add tables to realtime publication (safe - ignores if already added)
DO $$
BEGIN
  -- Properties
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'properties'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
  END IF;

  -- Services
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'services'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
  END IF;

  -- Testimonials
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'testimonials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.testimonials;
  END IF;

  -- Messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  -- Site Settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'site_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
  END IF;

  -- Admin Notification Settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'admin_notification_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notification_settings;
  END IF;
END $$;

-- =============================================================================
-- 9. STORAGE BUCKETS (For Image Uploads)
-- =============================================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonial-avatars', 'testimonial-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property-images bucket
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete property images" ON storage.objects;

CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'property-images');

CREATE POLICY "Admin can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND public.is_admin_user()
);

CREATE POLICY "Admin can delete property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images'
  AND public.is_admin_user()
);

-- Storage policies for testimonial-avatars bucket
DROP POLICY IF EXISTS "Public can view testimonial avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload testimonial avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete testimonial avatars" ON storage.objects;

CREATE POLICY "Public can view testimonial avatars"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'testimonial-avatars');

CREATE POLICY "Admin can upload testimonial avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'testimonial-avatars'
  AND public.is_admin_user()
);

CREATE POLICY "Admin can delete testimonial avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'testimonial-avatars'
  AND public.is_admin_user()
);

-- =============================================================================
-- 10. VERIFICATION QUERIES (Check if setup was successful)
-- =============================================================================

-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'properties', 'services', 'testimonials', 'messages', 'site_settings', 'admin_notification_settings')
ORDER BY table_name;

-- Check services table has correct columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'services'
ORDER BY ordinal_position;

-- =============================================================================
-- SETUP COMPLETE!
-- =============================================================================
-- After running this script, you need to:
-- 1. Create an admin user in Supabase Auth (Dashboard > Authentication > Users)
-- 2. Run the following SQL to grant admin access (replace EMAIL):
--
-- INSERT INTO public.admin_users (user_id, is_active)
-- SELECT id, TRUE
-- FROM auth.users
-- WHERE email = 'YOUR_ADMIN_EMAIL@example.com'
-- ON CONFLICT (user_id) DO UPDATE
-- SET is_active = EXCLUDED.is_active,
--     updated_at = NOW();
--
-- =============================================================================

