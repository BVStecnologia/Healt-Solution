-- =============================================
-- CONTROLE DE MIGRAÇÕES
-- Sempre deve ser a primeira migração aplicada
-- =============================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  name TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registrar esta migração
INSERT INTO schema_migrations (version, name)
VALUES ('000', 'schema_migrations')
ON CONFLICT (version) DO NOTHING;
