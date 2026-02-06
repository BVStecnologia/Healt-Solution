-- =============================================
-- Migration 003: Admin RLS Policies
-- =============================================
-- Adiciona políticas para admins acessarem todas as consultas

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('003', 'admin_rls_policies')
ON CONFLICT (version) DO NOTHING;

-- Policy para admins verem todas as consultas
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT
  USING (is_admin());

-- Policy para admins atualizarem qualquer consulta
DROP POLICY IF EXISTS "Admins can update all appointments" ON appointments;
CREATE POLICY "Admins can update all appointments" ON appointments
  FOR UPDATE
  USING (is_admin());

-- Policy para admins deletarem consultas
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;
CREATE POLICY "Admins can delete appointments" ON appointments
  FOR DELETE
  USING (is_admin());

-- Policy para admins inserirem consultas
DROP POLICY IF EXISTS "Admins can insert appointments" ON appointments;
CREATE POLICY "Admins can insert appointments" ON appointments
  FOR INSERT
  WITH CHECK (is_admin());
