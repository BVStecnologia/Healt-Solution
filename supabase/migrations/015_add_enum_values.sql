-- =============================================
-- Migration 015: Add new ENUM values
-- Separated because new enum values are only
-- visible after transaction COMMIT in PostgreSQL
-- =============================================

-- New appointment_type values (16 new treatments from essencemedicalclinic.com)
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'functional_medicine';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'bhrt';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'male_hypertrophy';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'female_hypertrophy';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'insulin_resistance';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'chronic_inflammation';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'thyroid_support';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'morpheus8';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'botulinum_toxin';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'fillers';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'skin_boosters';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'iv_protocols';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'customized_iv_nutrition';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'nutrient_testing';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'nad_therapy';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'vitamin_injections';

-- New patient_type values (4 new patient categories)
ALTER TYPE patient_type ADD VALUE IF NOT EXISTS 'wellness';
ALTER TYPE patient_type ADD VALUE IF NOT EXISTS 'bhrt';
ALTER TYPE patient_type ADD VALUE IF NOT EXISTS 'rejuvenation';
ALTER TYPE patient_type ADD VALUE IF NOT EXISTS 'iv_therapy';

-- Note: schema_migrations INSERT is in 016 (both 015 and 016 recorded there)
INSERT INTO schema_migrations (version, name)
VALUES ('015', '015_add_enum_values')
ON CONFLICT (version) DO NOTHING;
