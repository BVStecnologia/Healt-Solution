-- =============================================
-- Migration 025: Add 17 new appointment_type ENUM values
-- Services from OptiMantra gap analysis
-- Separated because ALTER TYPE needs COMMIT before use
-- =============================================

-- General
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'inbody';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'calorimetry';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'nutritionist_consult';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'mid_level_consultation';

-- Well-being
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'weight_loss_injection';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'testosterone_injection';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'nandrolone_injection';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'tirzepatide_2_5mg';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'tirzepatide_5mg';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'tirzepatide_7_5mg';

-- Personalized Medicine
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'male_pellet';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'female_pellet';

-- IV Therapy
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'high_dose_vitamin_c';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'inflammation_iv';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'metabolic_iv';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'homocysteine_iv';
ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS 'insulin_resistance_iv';

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('025', '025_add_services_enum')
ON CONFLICT (version) DO NOTHING;
