-- Migration 033: Support Tickets (internal bug reporting)
-- Staff (admin/provider) can report bugs, suggestions, questions

BEGIN;

-- Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'bug',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  screenshot_url TEXT,
  page_url TEXT,
  browser_info TEXT,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for listing
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created
  ON support_tickets (status, created_at DESC);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Admin: full access
DROP POLICY IF EXISTS "Admins full access support_tickets" ON support_tickets;
CREATE POLICY "Admins full access support_tickets"
  ON support_tickets FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Provider: see own tickets
DROP POLICY IF EXISTS "Providers view own support_tickets" ON support_tickets;
CREATE POLICY "Providers view own support_tickets"
  ON support_tickets FOR SELECT
  USING (created_by = auth.uid());

-- Provider: create tickets
DROP POLICY IF EXISTS "Providers create support_tickets" ON support_tickets;
CREATE POLICY "Providers create support_tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Provider: update own tickets (only while open)
DROP POLICY IF EXISTS "Providers update own support_tickets" ON support_tickets;
CREATE POLICY "Providers update own support_tickets"
  ON support_tickets FOR UPDATE
  USING (created_by = auth.uid() AND status = 'open')
  WITH CHECK (created_by = auth.uid());

-- Record migration
INSERT INTO schema_migrations (version, name, applied_at)
VALUES ('033', 'support_tickets', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;
