-- =============================================================================
-- Bathala Enterprises - Contact Form RLS Remediation
-- =============================================================================
-- Use this script when contact form inserts fail with:
-- "new row violates row-level security policy for table \"messages\""
--
-- Run in Supabase SQL Editor (project database).

DO $$
BEGIN
  IF to_regclass('public.messages') IS NULL THEN
    RAISE EXCEPTION 'public.messages table does not exist. Run SUPABASE_UNIVERSAL_SETUP.sql first.';
  END IF;
END $$;

BEGIN;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON TABLE public.messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.messages TO authenticated;

DROP POLICY IF EXISTS "public_can_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "admin_can_select_messages" ON public.messages;
DROP POLICY IF EXISTS "admin_can_update_messages" ON public.messages;
DROP POLICY IF EXISTS "admin_can_delete_messages" ON public.messages;

CREATE POLICY "public_can_insert_messages"
ON public.messages FOR INSERT TO anon, authenticated
WITH CHECK (
  query_type IN ('properties', 'services')
  AND status = 'new'
  AND is_read = FALSE
);

CREATE POLICY "admin_can_select_messages"
ON public.messages FOR SELECT TO authenticated
USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false));

CREATE POLICY "admin_can_update_messages"
ON public.messages FOR UPDATE TO authenticated
USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false))
WITH CHECK (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false));

CREATE POLICY "admin_can_delete_messages"
ON public.messages FOR DELETE TO authenticated
USING (COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false));

COMMIT;
