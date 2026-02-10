-- =============================================
-- Migration 029: Conversation Logs
-- Log all WhatsApp chatbot interactions for debugging
-- =============================================

CREATE TABLE IF NOT EXISTS conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  message_text TEXT NOT NULL,
  handler TEXT,
  state_step TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_conversation_logs_user
  ON conversation_logs(user_id, created_at DESC);

-- Index for quick lookup by phone
CREATE INDEX IF NOT EXISTS idx_conversation_logs_phone
  ON conversation_logs(phone, created_at DESC);

-- Index for finding errors
CREATE INDEX IF NOT EXISTS idx_conversation_logs_errors
  ON conversation_logs((metadata->>'error'))
  WHERE metadata->>'error' IS NOT NULL;

-- RLS: only admins can read conversation logs
ALTER TABLE conversation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view conversation logs" ON conversation_logs;
CREATE POLICY "Admins can view conversation logs"
  ON conversation_logs FOR SELECT
  USING (is_admin());

-- Service role (webhook) can insert without RLS
DROP POLICY IF EXISTS "Service role can insert conversation logs" ON conversation_logs;
CREATE POLICY "Service role can insert conversation logs"
  ON conversation_logs FOR INSERT
  WITH CHECK (true);

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('029', '029_conversation_logs')
ON CONFLICT (version) DO NOTHING;
