-- =============================================
-- Migration 005: Suporte a Idioma Preferido
-- =============================================
-- Adiciona campo preferred_language em profiles
-- Altera constraint de message_templates para (name, language)
-- Adiciona templates de mensagem em inglês
-- =============================================

-- Verificar se migration já foi aplicada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '005') THEN
    RAISE NOTICE 'Migration 005 já aplicada, pulando...';
    RETURN;
  END IF;

  -- =============================================
  -- 1. ADICIONAR CAMPO preferred_language EM PROFILES
  -- =============================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'pt';

    -- Constraint para validar valores
    ALTER TABLE profiles ADD CONSTRAINT valid_preferred_language
      CHECK (preferred_language IN ('pt', 'en'));

    RAISE NOTICE 'Campo preferred_language adicionado em profiles';
  END IF;

  -- =============================================
  -- 2. ADICIONAR CAMPO language EM MESSAGE_LOGS
  -- =============================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'message_logs' AND column_name = 'language'
  ) THEN
    ALTER TABLE message_logs ADD COLUMN language TEXT DEFAULT 'pt';

    RAISE NOTICE 'Campo language adicionado em message_logs';
  END IF;

  -- =============================================
  -- 3. CRIAR ÍNDICE PARA PERFORMANCE
  -- =============================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_preferred_language'
  ) THEN
    CREATE INDEX idx_profiles_preferred_language ON profiles(preferred_language);
    RAISE NOTICE 'Índice idx_profiles_preferred_language criado';
  END IF;

  -- =============================================
  -- 4. ALTERAR CONSTRAINT DE MESSAGE_TEMPLATES
  -- De UNIQUE(name) para UNIQUE(name, language)
  -- =============================================

  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'message_templates' AND constraint_name = 'message_templates_name_key'
  ) THEN
    ALTER TABLE message_templates DROP CONSTRAINT message_templates_name_key;
    RAISE NOTICE 'Constraint message_templates_name_key removida';
  END IF;

  -- Criar nova constraint unique em (name, language)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'message_templates' AND constraint_name = 'message_templates_name_language_key'
  ) THEN
    ALTER TABLE message_templates ADD CONSTRAINT message_templates_name_language_key UNIQUE (name, language);
    RAISE NOTICE 'Constraint UNIQUE(name, language) criada';
  END IF;

  -- Criar índice para buscas por name + language
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_message_templates_name_language'
  ) THEN
    CREATE INDEX idx_message_templates_name_language ON message_templates(name, language);
    RAISE NOTICE 'Índice idx_message_templates_name_language criado';
  END IF;

  -- =============================================
  -- 5. INSERIR TEMPLATES EM INGLÊS
  -- =============================================

  -- Template: Confirmação de consulta (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_confirmed',
    'Appointment confirmation message for patient (English)',
    'en',
    E'✅ *Appointment Confirmed!*\n\nHello {nome}, your appointment has been confirmed:\n\n*Doctor:* {medico}\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}\n\nSee you soon! 👋',
    ARRAY['nome', 'medico', 'tipo', 'data', 'hora'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_confirmed (EN) inserido';

  -- Template: Rejeição de consulta (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_rejected',
    'Appointment rejection message for patient (English)',
    'en',
    E'❌ *Appointment Not Available*\n\nHello {nome}, unfortunately we could not confirm your appointment.\n\n*Reason:* {motivo}\n\nPlease schedule another time through our portal.\n\nWe apologize for any inconvenience.',
    ARRAY['nome', 'motivo'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_rejected (EN) inserido';

  -- Template: Cancelamento de consulta (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_cancelled',
    'Appointment cancellation message (English)',
    'en',
    E'⚠️ *Appointment Cancelled*\n\nHello {nome}, your appointment has been cancelled:\n\n*Doctor:* {medico}\n*Date:* {data}\n*Time:* {hora}\n\n*Reason:* {motivo}\n\nYou can schedule a new appointment through our portal.',
    ARRAY['nome', 'medico', 'data', 'hora', 'motivo'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_cancelled (EN) inserido';

  -- Template: Lembrete 24 horas (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'reminder_24h',
    '24-hour appointment reminder (English)',
    'en',
    E'⏰ *Appointment Reminder!*\n\nHello {nome}, your appointment is *tomorrow*:\n\n*Doctor:* {medico}\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}\n\nPlease confirm your attendance by replying *OK*.\n\nSee you there! 🏥',
    ARRAY['nome', 'medico', 'tipo', 'data', 'hora'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = NOW();

  RAISE NOTICE 'Template reminder_24h (EN) inserido';

  -- Template: Lembrete 1 hora (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'reminder_1h',
    '1-hour appointment reminder (English)',
    'en',
    E'🔔 *Your appointment is in 1 hour!*\n\n*Doctor:* {medico}\n*Time:* {hora}\n\nWe are waiting for you! 🏥',
    ARRAY['medico', 'hora'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = NOW();

  RAISE NOTICE 'Template reminder_1h (EN) inserido';

  -- Template: Nova consulta para clínica (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'new_appointment_clinic',
    'New appointment notification for clinic (English)',
    'en',
    E'📅 *New Appointment Request*\n\n*Patient:* {paciente}\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}\n*Doctor:* {medico}\n\nAccess the admin panel to confirm or reject.',
    ARRAY['paciente', 'tipo', 'data', 'hora', 'medico'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = NOW();

  RAISE NOTICE 'Template new_appointment_clinic (EN) inserido';

  -- =============================================
  -- 6. FUNÇÃO PARA OBTER IDIOMA PREFERIDO
  -- =============================================
  CREATE OR REPLACE FUNCTION get_patient_preferred_language(p_patient_id UUID)
  RETURNS TEXT
  LANGUAGE sql
  SECURITY DEFINER
  STABLE
  AS $func$
    SELECT COALESCE(preferred_language, 'pt')
    FROM profiles
    WHERE id = p_patient_id;
  $func$;

  RAISE NOTICE 'Função get_patient_preferred_language criada';

  -- =============================================
  -- 7. ATUALIZAR FUNÇÃO log_whatsapp_message PARA INCLUIR LANGUAGE
  -- =============================================
  CREATE OR REPLACE FUNCTION log_whatsapp_message(
    p_instance_id UUID,
    p_appointment_id UUID,
    p_patient_id UUID,
    p_template_name TEXT,
    p_phone_number TEXT,
    p_message TEXT,
    p_status message_status DEFAULT 'pending',
    p_evolution_message_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_language TEXT DEFAULT 'pt'
  )
  RETURNS UUID
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  DECLARE
    v_log_id UUID;
  BEGIN
    INSERT INTO message_logs (
      instance_id,
      appointment_id,
      patient_id,
      template_name,
      phone_number,
      message,
      status,
      evolution_message_id,
      sent_at,
      metadata,
      language
    )
    VALUES (
      p_instance_id,
      p_appointment_id,
      p_patient_id,
      p_template_name,
      p_phone_number,
      p_message,
      p_status,
      p_evolution_message_id,
      CASE WHEN p_status = 'sent' THEN NOW() ELSE NULL END,
      p_metadata,
      p_language
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
  END;
  $func$;

  RAISE NOTICE 'Função log_whatsapp_message atualizada com language';

  -- =============================================
  -- 8. REGISTRAR MIGRATION
  -- =============================================
  INSERT INTO schema_migrations (version, name, applied_at)
  VALUES ('005', 'add_preferred_language', NOW());

  RAISE NOTICE 'Migration 005 aplicada com sucesso!';

END $$;

-- =============================================
-- VERIFICAÇÃO FINAL
-- =============================================
SELECT
  'Templates por idioma:' as info,
  language,
  COUNT(*) as total
FROM message_templates
GROUP BY language
ORDER BY language;
