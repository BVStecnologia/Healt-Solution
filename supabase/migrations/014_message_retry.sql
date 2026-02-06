-- =============================================
-- MIGRAÇÃO 014: Sistema de retry para mensagens WhatsApp
-- =============================================
-- Adiciona retry_count e last_retry_at no message_logs
-- Permite rastrear tentativas de reenvio de mensagens falhas
-- =============================================

BEGIN;

-- 1. Adicionar colunas de retry
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ;

-- 2. Índice para buscar mensagens falhas pendentes de retry
CREATE INDEX IF NOT EXISTS idx_message_logs_failed_retry
  ON message_logs(status, retry_count)
  WHERE status = 'failed' AND retry_count < 3;

-- 3. Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('014', 'message_retry')
ON CONFLICT (version) DO NOTHING;

COMMIT;
