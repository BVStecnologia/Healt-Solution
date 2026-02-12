-- Migration 030: Human Handoff System
-- Attendants, schedules, and handoff sessions for live human support

BEGIN;

-- ==================
-- ATTENDANTS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS attendants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notify_whatsapp BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================
-- ATTENDANT SCHEDULES TABLE
-- ==================
CREATE TABLE IF NOT EXISTS attendant_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendant_id UUID NOT NULL REFERENCES attendants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- ==================
-- HANDOFF SESSIONS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS handoff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone TEXT NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  patient_name TEXT,
  attendant_id UUID REFERENCES attendants(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'resolved')),
  instance_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup of active handoff sessions by phone
CREATE INDEX IF NOT EXISTS idx_handoff_sessions_active
  ON handoff_sessions (patient_phone)
  WHERE status IN ('waiting', 'active');

-- Index for stale session cleanup
CREATE INDEX IF NOT EXISTS idx_handoff_sessions_stale
  ON handoff_sessions (last_message_at)
  WHERE status IN ('waiting', 'active');

-- ==================
-- RLS POLICIES
-- ==================

ALTER TABLE attendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendant_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_sessions ENABLE ROW LEVEL SECURITY;

-- Attendants: admins can do everything
DROP POLICY IF EXISTS "Admins can manage attendants" ON attendants;
CREATE POLICY "Admins can manage attendants" ON attendants
  FOR ALL USING (is_admin());

-- Attendant schedules: admins can do everything
DROP POLICY IF EXISTS "Admins can manage attendant schedules" ON attendant_schedules;
CREATE POLICY "Admins can manage attendant schedules" ON attendant_schedules
  FOR ALL USING (is_admin());

-- Handoff sessions: admins can do everything
DROP POLICY IF EXISTS "Admins can manage handoff sessions" ON handoff_sessions;
CREATE POLICY "Admins can manage handoff sessions" ON handoff_sessions
  FOR ALL USING (is_admin());

-- ==================
-- MIGRATION RECORD
-- ==================
INSERT INTO schema_migrations (version, name)
VALUES ('030', 'handoff_system')
ON CONFLICT (version) DO NOTHING;

COMMIT;
