-- =============================================
-- MIGRAÇÃO 008: Admin pode gerenciar provider_schedules
-- =============================================

-- Admin pode gerenciar todos os horários de providers
CREATE POLICY "Admins can manage all schedules"
  ON provider_schedules FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('008', 'admin_provider_schedules')
ON CONFLICT (version) DO NOTHING;
