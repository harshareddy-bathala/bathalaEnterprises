-- =============================================================================
-- BATHALA ENTERPRISES — ADD URL SLUGS TO PROPERTIES AND SERVICES
-- =============================================================================
--
-- Public detail URLs moved from raw UUIDs to keyword slugs:
--   /properties/<uuid>  ->  /properties/3-bhk-villa-electronic-city-3f9a1c
--
-- Run this ONCE against an existing database (Supabase SQL editor).
-- It is idempotent and re-runnable, and it does NOT drop or recreate anything.
--
-- ⚠️  Do NOT run SUPABASE_UNIVERSAL_SETUP.sql on a live database to get these
--     columns — that script does `DROP TABLE public.services CASCADE`. Use this
--     script instead. The universal setup already carries the same definitions
--     for fresh installs.
--
-- The slug format is `<slugified title>-<first 6 hex chars of id>`, matching
-- `toSlug()` in src/lib/slug.ts. The id suffix guarantees uniqueness without a
-- retry loop and keeps slug -> row resolution deterministic.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Slug builder
-- -----------------------------------------------------------------------------
-- Mirrors src/lib/slug.ts. One intentional difference: the TypeScript version
-- NFKD-folds accents (é -> e) whereas this collapses them to a hyphen. Only the
-- one-time backfill below is affected, and the resulting slug is still valid and
-- unique; the application rewrites the slug on the next save.
CREATE OR REPLACE FUNCTION public.bathala_build_slug(p_title TEXT, p_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN parts.base = '' THEN parts.suffix
              ELSE parts.base || '-' || parts.suffix
         END
  FROM (
    SELECT
      rtrim(
        left(
          trim(BOTH '-' FROM regexp_replace(lower(COALESCE(p_title, '')), '[^a-z0-9]+', '-', 'g')),
          60
        ),
        '-'
      ) AS base,
      left(replace(p_id::text, '-', ''), 6) AS suffix
  ) AS parts;
$$;

-- -----------------------------------------------------------------------------
-- 2. Columns
-- -----------------------------------------------------------------------------
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.services   ADD COLUMN IF NOT EXISTS slug TEXT;

-- -----------------------------------------------------------------------------
-- 3. Backfill existing rows
-- -----------------------------------------------------------------------------
UPDATE public.properties
   SET slug = public.bathala_build_slug(title, id)
 WHERE slug IS NULL OR slug = '';

UPDATE public.services
   SET slug = public.bathala_build_slug(title, id)
 WHERE slug IS NULL OR slug = '';

-- -----------------------------------------------------------------------------
-- 4. Uniqueness (NULLs are permitted and do not collide in Postgres)
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_services_slug   ON public.services(slug);

-- -----------------------------------------------------------------------------
-- 5. Keep slugs populated for rows created outside the app
-- -----------------------------------------------------------------------------
-- The app sets the slug on create/update, but rows added straight from the
-- Supabase dashboard would otherwise have none and be unreachable by URL.
CREATE OR REPLACE FUNCTION public.bathala_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.bathala_build_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_properties_slug ON public.properties;
CREATE TRIGGER set_properties_slug
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.bathala_set_slug();

DROP TRIGGER IF EXISTS set_services_slug ON public.services;
CREATE TRIGGER set_services_slug
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.bathala_set_slug();

COMMIT;

-- -----------------------------------------------------------------------------
-- Verify
-- -----------------------------------------------------------------------------
-- SELECT id, title, slug FROM public.properties ORDER BY created_at DESC LIMIT 10;
-- SELECT id, title, slug FROM public.services   ORDER BY display_order LIMIT 10;
