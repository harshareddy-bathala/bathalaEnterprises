-- =============================================
-- Data Cleanup Script
-- =============================================
-- Run this if you have existing sample/mock data in your
-- Supabase database and want to start with empty tables.
-- 
-- WARNING: This will DELETE ALL DATA from properties, 
-- services, and inquiries tables. Use with caution!
-- =============================================

-- Delete all inquiries
DELETE FROM inquiries;

-- Delete all properties  
DELETE FROM properties;

-- Delete all services
DELETE FROM services;

-- Verify tables are empty
SELECT 'properties' as table_name, COUNT(*) as row_count FROM properties
UNION ALL
SELECT 'services' as table_name, COUNT(*) as row_count FROM services  
UNION ALL
SELECT 'inquiries' as table_name, COUNT(*) as row_count FROM inquiries;

-- =============================================
-- All data has been removed!
-- =============================================
-- You can now add fresh content through the 
-- admin console at /admin/dashboard
-- =============================================