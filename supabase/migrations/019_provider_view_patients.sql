-- =============================================
-- Migration 019: Provider View Patient Profiles
-- =============================================
-- Permite que médicos vejam perfis de pacientes
-- que têm consultas agendadas com eles.
-- Fix: Dashboard do médico mostrava "N/A" nos nomes.
-- IMPORTANTE: Usa SECURITY DEFINER para evitar recursão RLS (42P17)

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('019', 'provider_view_patients')
ON CONFLICT (version) DO NOTHING;

-- Função SECURITY DEFINER para verificar se o provider atual
-- tem consultas com o paciente (bypassa RLS, evita recursão)
CREATE OR REPLACE FUNCTION is_provider_of_patient(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM appointments a
    JOIN providers p ON p.id = a.provider_id
    WHERE a.patient_id = p_patient_id
      AND p.user_id = auth.uid()
  );
$$;

-- Policy: Providers podem ver perfis de pacientes das suas consultas
DROP POLICY IF EXISTS "Providers can view patient profiles" ON profiles;
CREATE POLICY "Providers can view patient profiles"
  ON profiles FOR SELECT
  USING (is_provider_of_patient(id));
