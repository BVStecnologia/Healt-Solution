-- =============================================
-- Migration 006: Notificações para Médicos + Confirmação Automática
-- =============================================
-- 1. Altera create_appointment para status 'confirmed' (auto-confirmação)
-- 2. Adiciona templates WhatsApp para notificar médicos (PT + EN)
-- 3. Adiciona confirmed_at automático na criação
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = '006') THEN
    RAISE NOTICE 'Migration 006 já aplicada, pulando...';
    RETURN;
  END IF;

  -- =============================================
  -- 1. ALTERAR create_appointment: pending → confirmed
  -- =============================================

  CREATE OR REPLACE FUNCTION create_appointment(
    p_patient_id UUID,
    p_provider_id UUID,
    p_type appointment_type,
    p_scheduled_at TIMESTAMPTZ,
    p_notes TEXT DEFAULT NULL
  )
  RETURNS JSON
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  DECLARE
    v_eligibility JSON;
    v_appointment appointments;
    v_duration INT := 30;
  BEGIN
    -- Verificar elegibilidade
    v_eligibility := check_patient_eligibility(p_patient_id, p_type);

    IF NOT (v_eligibility->>'eligible')::BOOLEAN THEN
      RAISE EXCEPTION 'Paciente não elegível: %', v_eligibility->>'reasons';
    END IF;

    -- Definir duração baseada no tipo
    CASE p_type
      WHEN 'initial_consultation' THEN v_duration := 60;
      WHEN 'follow_up' THEN v_duration := 30;
      WHEN 'hormone_check' THEN v_duration := 45;
      WHEN 'lab_review' THEN v_duration := 20;
      WHEN 'nutrition' THEN v_duration := 45;
      WHEN 'health_coaching' THEN v_duration := 30;
      WHEN 'therapy' THEN v_duration := 50;
      WHEN 'personal_training' THEN v_duration := 60;
      ELSE v_duration := 30;
    END CASE;

    -- Verificar se horário está disponível
    IF EXISTS (
      SELECT 1 FROM appointments
      WHERE provider_id = p_provider_id
        AND status NOT IN ('cancelled', 'no_show')
        AND scheduled_at < p_scheduled_at + (v_duration || ' minutes')::INTERVAL
        AND scheduled_at + (duration || ' minutes')::INTERVAL > p_scheduled_at
    ) THEN
      RAISE EXCEPTION 'Horário não disponível';
    END IF;

    -- Verificar antecedência mínima (24h)
    IF p_scheduled_at < NOW() + INTERVAL '24 hours' THEN
      RAISE EXCEPTION 'Agendamentos devem ser feitos com pelo menos 24 horas de antecedência';
    END IF;

    -- Criar appointment com status 'confirmed' (auto-confirmação)
    INSERT INTO appointments (
      patient_id,
      provider_id,
      type,
      status,
      scheduled_at,
      duration,
      notes,
      confirmed_at
    )
    VALUES (
      p_patient_id,
      p_provider_id,
      p_type,
      'confirmed',
      p_scheduled_at,
      v_duration,
      p_notes,
      NOW()
    )
    RETURNING * INTO v_appointment;

    RETURN row_to_json(v_appointment);
  END;
  $func$;

  RAISE NOTICE 'Função create_appointment atualizada: status confirmed + confirmed_at automático';

  -- =============================================
  -- 2. TEMPLATES PARA MÉDICOS - PORTUGUÊS
  -- =============================================

  -- Nova consulta agendada (notifica médico)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'new_appointment_provider',
    'Notifica médico sobre nova consulta agendada',
    'pt',
    E'*Nova consulta agendada*\n\nDr(a). {medico}, uma nova consulta foi agendada:\n\n*Paciente:* {paciente}\n*Tipo:* {tipo}\n*Data:* {data}\n*Horário:* {hora}\n\nAcesse o painel para mais detalhes.',
    ARRAY['medico', 'paciente', 'tipo', 'data', 'hora'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template new_appointment_provider (PT) inserido';

  -- Consulta cancelada pelo paciente (notifica médico)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_cancelled_provider',
    'Notifica médico quando paciente cancela consulta',
    'pt',
    E'*Consulta cancelada*\n\nDr(a). {medico}, a seguinte consulta foi cancelada:\n\n*Paciente:* {paciente}\n*Tipo:* {tipo}\n*Data:* {data}\n*Horário:* {hora}\n*Motivo:* {motivo}\n\nO horário foi liberado na sua agenda.',
    ARRAY['medico', 'paciente', 'tipo', 'data', 'hora', 'motivo'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_cancelled_provider (PT) inserido';

  -- Lembrete diário para médico (resumo da agenda)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'reminder_daily_provider',
    'Resumo diário da agenda do médico',
    'pt',
    E'*Agenda de amanhã*\n\nDr(a). {medico}, você tem {total} consulta(s) amanhã:\n\n{agenda}\n\nBom trabalho!',
    ARRAY['medico', 'total', 'agenda'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template reminder_daily_provider (PT) inserido';

  -- Confirmação automática para paciente (novo template simplificado)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_auto_confirmed',
    'Confirmação automática de consulta para paciente',
    'pt',
    E'*Consulta confirmada*\n\nOlá {nome}, sua consulta foi confirmada:\n\n*Médico:* {medico}\n*Tipo:* {tipo}\n*Data:* {data}\n*Horário:* {hora}\n\nCaso precise cancelar ou reagendar, acesse o portal do paciente.\n\nAté lá!',
    ARRAY['nome', 'medico', 'tipo', 'data', 'hora'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_auto_confirmed (PT) inserido';

  -- Cancelamento pelo médico/admin (notifica paciente com sugestão de reagendamento)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_cancelled_by_provider',
    'Notifica paciente quando médico/admin cancela consulta',
    'pt',
    E'*Consulta cancelada*\n\nOlá {nome}, infelizmente sua consulta precisou ser cancelada:\n\n*Médico:* {medico}\n*Data:* {data}\n*Horário:* {hora}\n*Motivo:* {motivo}\n\nPedimos desculpas pelo inconveniente. Acesse o portal para agendar um novo horário.',
    ARRAY['nome', 'medico', 'data', 'hora', 'motivo'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_cancelled_by_provider (PT) inserido';

  -- =============================================
  -- 3. TEMPLATES PARA MÉDICOS - INGLÊS
  -- =============================================

  -- Nova consulta agendada (notifica médico - EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'new_appointment_provider',
    'Notifies doctor about new scheduled appointment',
    'en',
    E'*New Appointment Scheduled*\n\nDr. {medico}, a new appointment has been scheduled:\n\n*Patient:* {paciente}\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}\n\nAccess the panel for more details.',
    ARRAY['medico', 'paciente', 'tipo', 'data', 'hora'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template new_appointment_provider (EN) inserido';

  -- Consulta cancelada pelo paciente (notifica médico - EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_cancelled_provider',
    'Notifies doctor when patient cancels appointment',
    'en',
    E'*Appointment Cancelled*\n\nDr. {medico}, the following appointment has been cancelled:\n\n*Patient:* {paciente}\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}\n*Reason:* {motivo}\n\nThe time slot has been freed in your schedule.',
    ARRAY['medico', 'paciente', 'tipo', 'data', 'hora', 'motivo'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_cancelled_provider (EN) inserido';

  -- Lembrete diário para médico (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'reminder_daily_provider',
    'Daily schedule summary for doctor',
    'en',
    E'*Tomorrow''s Schedule*\n\nDr. {medico}, you have {total} appointment(s) tomorrow:\n\n{agenda}\n\nHave a great day!',
    ARRAY['medico', 'total', 'agenda'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template reminder_daily_provider (EN) inserido';

  -- Confirmação automática para paciente (EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_auto_confirmed',
    'Automatic appointment confirmation for patient',
    'en',
    E'*Appointment Confirmed*\n\nHello {nome}, your appointment has been confirmed:\n\n*Doctor:* {medico}\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}\n\nIf you need to cancel or reschedule, please access the patient portal.\n\nSee you soon!',
    ARRAY['nome', 'medico', 'tipo', 'data', 'hora'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_auto_confirmed (EN) inserido';

  -- Cancelamento pelo médico/admin (notifica paciente - EN)
  INSERT INTO message_templates (name, description, language, content, variables, is_active)
  VALUES (
    'appointment_cancelled_by_provider',
    'Notifies patient when doctor/admin cancels appointment',
    'en',
    E'*Appointment Cancelled*\n\nHello {nome}, unfortunately your appointment had to be cancelled:\n\n*Doctor:* {medico}\n*Date:* {data}\n*Time:* {hora}\n*Reason:* {motivo}\n\nWe apologize for the inconvenience. Please access the portal to schedule a new appointment.',
    ARRAY['nome', 'medico', 'data', 'hora', 'motivo'],
    true
  )
  ON CONFLICT (name, language) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    variables = EXCLUDED.variables,
    updated_at = NOW();

  RAISE NOTICE 'Template appointment_cancelled_by_provider (EN) inserido';

  -- =============================================
  -- 4. REGISTRAR MIGRATION
  -- =============================================
  INSERT INTO schema_migrations (version, name, applied_at)
  VALUES ('006', 'provider_notifications', NOW());

  RAISE NOTICE 'Migration 006 aplicada com sucesso!';

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
