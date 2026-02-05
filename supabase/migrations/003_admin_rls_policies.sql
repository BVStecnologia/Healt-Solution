-- =============================================
-- Migration 003: Admin RLS Policies
-- =============================================
-- Adiciona políticas para admins acessarem todas as consultas

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('003', 'admin_rls_policies')
ON CONFLICT (version) DO NOTHING;

-- Policy para admins verem todas as consultas
CREATE POLICY IF NOT EXISTS "Admins can view all appointments" ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy para admins atualizarem qualquer consulta
CREATE POLICY IF NOT EXISTS "Admins can update all appointments" ON appointments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy para admins deletarem consultas
CREATE POLICY IF NOT EXISTS "Admins can delete appointments" ON appointments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy para admins inserirem consultas
CREATE POLICY IF NOT EXISTS "Admins can insert appointments" ON appointments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
