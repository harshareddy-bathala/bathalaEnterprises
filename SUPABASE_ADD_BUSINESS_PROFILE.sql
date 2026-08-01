-- =============================================================================
-- BATHALA ENTERPRISES — STRUCTURED BUSINESS PROFILE FIELDS ON site_settings
-- =============================================================================
--
-- schema.org PostalAddress wants the address broken into parts, and
-- LocalBusiness/RealEstateAgent wants geo coordinates. `site_settings.address`
-- is a single free-text string, so those values were previously hardcoded in
-- src/lib/site-config.ts and could drift from what the admin CMS shows.
--
-- Adds the structured fields plus a Google Business Profile URL, which feeds
-- Organization.sameAs — the strongest local-SEO association signal available.
--
-- Run ONCE against an existing database (Supabase SQL editor).
-- Idempotent and re-runnable; drops nothing.
--
-- ⚠️  Do NOT run SUPABASE_UNIVERSAL_SETUP.sql on a live database to get these
--     columns — it does `DROP TABLE public.services CASCADE`.
-- =============================================================================

BEGIN;

ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS street_address    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS address_locality  TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS address_region    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS postal_code       TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS address_country   TEXT DEFAULT 'IN';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS latitude          NUMERIC(10, 7);
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS longitude         NUMERIC(10, 7);
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS google_business_url TEXT;

-- Seed from the values that were hardcoded in src/lib/site-config.ts, so the
-- structured data keeps emitting the same address until an admin edits it.
UPDATE public.site_settings
   SET street_address   = COALESCE(street_address,   'VJ2X+PV3, Green House Layout'),
       address_locality = COALESCE(address_locality, 'Bengaluru'),
       address_region   = COALESCE(address_region,   'Karnataka'),
       postal_code      = COALESCE(postal_code,      '560100'),
       address_country  = COALESCE(address_country,  'IN'),
       latitude         = COALESCE(latitude,         12.8518078),
       longitude        = COALESCE(longitude,        77.6471197);

COMMIT;

-- -----------------------------------------------------------------------------
-- Verify
-- -----------------------------------------------------------------------------
-- SELECT site_title, street_address, address_locality, address_region,
--        postal_code, address_country, latitude, longitude, google_business_url
--   FROM public.site_settings;
