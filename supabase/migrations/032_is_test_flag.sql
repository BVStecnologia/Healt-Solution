-- ================================================
-- Migration 032: is_test flag for test data marking
-- ================================================
-- Adds is_test column to profiles table.
-- All related data (appointments, message_logs, conversation_logs, etc.)
-- can be filtered via FK JOINs back to profiles.is_test.
-- ================================================

-- Add is_test column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_test ON profiles (is_test) WHERE is_test = true;

-- Record migration
INSERT INTO schema_migrations (version, name) VALUES ('032', 'is_test_flag');
