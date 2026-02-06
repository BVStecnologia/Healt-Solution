-- Migration 010: Add preferred_theme to profiles
-- Allows patients (and other users) to persist their dark/light theme preference

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_theme TEXT DEFAULT 'light'
  CHECK (preferred_theme IN ('light', 'dark'));

INSERT INTO schema_migrations (version, name) VALUES ('010', 'patient_theme');
