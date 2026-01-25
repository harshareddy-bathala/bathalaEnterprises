-- =============================================
-- Bathala Enterprises - Supabase Database Setup
-- =============================================
-- Run this SQL file in your Supabase SQL Editor
-- to create all required tables and enable RLS.
-- 
-- IMPORTANT: This creates EMPTY tables with no sample data.
-- All properties and services must be added by admin through
-- the admin console after deployment.
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Clean existing data (if any)
-- =============================================
-- Uncomment these lines if you want to clean existing data:
-- DELETE FROM inquiries;
-- DELETE FROM properties;
-- DELETE FROM services;

-- =============================================
-- Properties Table
-- =============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  sqft INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Rent', 'Lease', 'Sale')),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Services Table
-- =============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price_range VARCHAR(100),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Inquiries Table
-- =============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  service_type VARCHAR(100),
  query_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Properties: Public read access
CREATE POLICY "Allow public read access on properties"
  ON properties FOR SELECT
  USING (true);

-- Properties: Authenticated admin write access
CREATE POLICY "Allow authenticated insert on properties"
  ON properties FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on properties"
  ON properties FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on properties"
  ON properties FOR DELETE
  USING (auth.role() = 'authenticated');

-- Services: Public read access
CREATE POLICY "Allow public read access on services"
  ON services FOR SELECT
  USING (true);

-- Services: Authenticated admin write access
CREATE POLICY "Allow authenticated insert on services"
  ON services FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on services"
  ON services FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on services"
  ON services FOR DELETE
  USING (auth.role() = 'authenticated');

-- Inquiries: Public can insert (submit contact form)
CREATE POLICY "Allow public insert on inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- Inquiries: Only authenticated can read
CREATE POLICY "Allow authenticated read on inquiries"
  ON inquiries FOR SELECT
  USING (auth.role() = 'authenticated');

-- Inquiries: Authenticated can update status
CREATE POLICY "Allow authenticated update on inquiries"
  ON inquiries FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);

-- =============================================
-- Updated At Trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Setup Complete!
-- =============================================
-- After running this script:
-- 1. Create an admin user in Authentication > Users
-- 2. Grant admin privileges by running:
--    UPDATE auth.users 
--    SET raw_user_meta_data = jsonb_set(
--      COALESCE(raw_user_meta_data, '{}'::jsonb),
--      '{is_admin}',
--      'true'
--    )
--    WHERE email = 'your-admin@email.com';
--
-- NOTE: Tables are created empty. Add properties and services
-- through the admin console at /admin/dashboard after deployment.
-- =============================================
