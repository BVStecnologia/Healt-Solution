-- =====================================================
-- Migração 004: Adicionar avatar_url ao profiles
-- =====================================================
-- Este campo armazena a URL da foto de perfil do usuário
-- Útil especialmente para login via Google OAuth

-- Adicionar coluna avatar_url
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentário explicativo
COMMENT ON COLUMN profiles.avatar_url IS 'URL da foto de perfil do usuário (ex: Google OAuth)';

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('004', 'avatar_url')
ON CONFLICT (version) DO NOTHING;
