-- Migration 035: WhatsApp Consent Fields
-- Adds consent tracking for TCPA compliance
-- Existing patients are grandfathered (implicit consent from existing relationship)

BEGIN;

-- Add consent columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_consent_source TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_opted_out BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opted_out_at TIMESTAMPTZ;

-- Grandfather existing patients (they already have a WhatsApp relationship with the clinic)
UPDATE profiles
SET whatsapp_consent = true,
    whatsapp_consent_at = NOW(),
    whatsapp_consent_source = 'grandfathered'
WHERE role = 'patient'
  AND whatsapp_consent = false;

-- Add check constraint for consent_source values
ALTER TABLE profiles
  ADD CONSTRAINT chk_whatsapp_consent_source
  CHECK (whatsapp_consent_source IS NULL OR whatsapp_consent_source IN ('portal', 'admin', 'whatsapp_bot', 'intake_form', 'grandfathered'));

-- Record migration
INSERT INTO schema_migrations (version, name, applied_at)
VALUES ('035', 'whatsapp_consent', NOW());

COMMIT;
