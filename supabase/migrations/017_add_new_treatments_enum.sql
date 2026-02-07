-- =============================================
-- Migration 017: Add new appointment_type ENUM values
-- 11 new treatments: High Cortisol, Iron Infusions,
-- Chelation Therapy, and 8 Peptide Therapy types
-- Separated because new enum values need COMMIT
-- =============================================

-- Personalized Medicine
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'high_cortisol';

-- IV Therapy
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'iron_infusions';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'chelation_therapy';

-- Peptide Therapy (new category, 8 peptides)
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'bpc_157';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'thymosin_alpha_1';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'cjc_1295_ipamorelin';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'pt_141';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'selank';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'kpv';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'dihexa';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'mots_c';

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('017', '017_add_new_treatments_enum')
ON CONFLICT (version) DO NOTHING;
