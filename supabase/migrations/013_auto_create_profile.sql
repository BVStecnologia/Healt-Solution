-- =============================================
-- MIGRAÇÃO 013: Auto-criar profile para novos usuários
-- =============================================
-- Trigger que cria automaticamente um registro em profiles
-- quando um novo usuário é criado (email/senha ou Google OAuth)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Tentar extrair nome do metadata (Google OAuth)
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  v_avatar_url := NEW.raw_user_meta_data->>'avatar_url';

  -- Separar primeiro e último nome
  IF v_full_name != '' THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    v_last_name := CASE
      WHEN position(' ' in v_full_name) > 0
      THEN substring(v_full_name from position(' ' in v_full_name) + 1)
      ELSE ''
    END;
  ELSE
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Novo');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Usuário');
  END IF;

  INSERT INTO public.profiles (id, email, role, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    'patient',  -- Padrão: paciente (admin promove manualmente)
    v_first_name,
    v_last_name,
    v_avatar_url
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Criar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('013', 'auto_create_profile')
ON CONFLICT (version) DO NOTHING;
