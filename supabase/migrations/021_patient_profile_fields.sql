-- Migration 021: Patient Profile Fields
-- Adiciona campos demográficos, endereço, contato de emergência e referências ao perfil do paciente

BEGIN;

-- Dados Pessoais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex_at_birth TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender_identity TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pronoun TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS race TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT;

-- Endereço
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Contatos Adicionais
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alternative_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;

-- Referências e Notas
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_care_physician TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS patient_notes TEXT;

-- Registro da migração
INSERT INTO schema_migrations (version, name) VALUES ('021', 'patient_profile_fields')
ON CONFLICT (version) DO NOTHING;

COMMIT;
