-- =============================================
-- Migration 028: Insurance fields on profiles
-- Primary + Secondary insurance (14 fields total)
-- =============================================

-- Primary Insurance (7 fields)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_member_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_group_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_copay DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_coinsurance DECIMAL(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_deductible DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_payer_id TEXT;

-- Secondary Insurance (7 fields)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sec_insurance_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sec_insurance_member_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sec_insurance_group_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sec_insurance_copay DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sec_insurance_coinsurance DECIMAL(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sec_insurance_deductible DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sec_insurance_payer_id TEXT;

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('028', '028_insurance_fields')
ON CONFLICT (version) DO NOTHING;
