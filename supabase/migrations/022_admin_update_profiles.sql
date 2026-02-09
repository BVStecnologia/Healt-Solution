-- Migration 022: Allow admins to update any profile
-- Fixes: admin edit patient profile silently fails (RLS blocks update on other users' profiles)

BEGIN;

-- Admin can update any profile
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin());

INSERT INTO schema_migrations (version, name)
VALUES ('022', 'admin_update_profiles')
ON CONFLICT (version) DO NOTHING;

COMMIT;
