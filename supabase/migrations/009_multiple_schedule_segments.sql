-- =============================================
-- MIGRAÇÃO 009: Suporte a múltiplos turnos por dia
-- get_available_slots agora itera sobre TODOS os registros
-- de provider_schedules para o dia, não apenas o primeiro.
-- Permite: Segunda 08:00-12:00 + 13:00-17:00
-- =============================================

-- Remover constraint UNIQUE (provider_id, day_of_week)
-- para permitir múltiplos turnos por dia
ALTER TABLE provider_schedules
  DROP CONSTRAINT IF EXISTS provider_schedules_provider_id_day_of_week_key;

CREATE OR REPLACE FUNCTION get_available_slots(
  p_provider_id UUID,
  p_date DATE,
  p_appointment_type appointment_type
)
RETURNS TABLE (
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week INT;
  v_schedule RECORD;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
  v_duration INT := 30;
  v_full_day_blocked BOOLEAN;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INT;

  -- Verificar se o dia inteiro está bloqueado
  SELECT EXISTS (
    SELECT 1 FROM provider_blocks pb
    WHERE pb.provider_id = p_provider_id
      AND pb.block_date = p_date
      AND pb.start_time IS NULL
      AND pb.end_time IS NULL
  ) INTO v_full_day_blocked;

  IF v_full_day_blocked THEN
    RETURN; -- Sem slots se dia inteiro bloqueado
  END IF;

  -- Iterar sobre TODOS os segmentos de horário do dia
  FOR v_schedule IN
    SELECT * FROM provider_schedules ps
    WHERE ps.provider_id = p_provider_id
      AND ps.day_of_week = v_day_of_week
      AND ps.is_active = true
    ORDER BY ps.start_time
  LOOP
    v_duration := v_schedule.slot_duration;
    v_slot_start := p_date + v_schedule.start_time;

    -- Gerar slots para este segmento
    WHILE v_slot_start + (v_duration || ' minutes')::INTERVAL <= p_date + v_schedule.end_time LOOP
      v_slot_end := v_slot_start + (v_duration || ' minutes')::INTERVAL;

      -- Verificar se slot está disponível (não tem appointment E não está bloqueado)
      RETURN QUERY
      SELECT
        v_slot_start,
        v_slot_end,
        NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.provider_id = p_provider_id
            AND a.status NOT IN ('cancelled', 'no_show')
            AND a.scheduled_at < v_slot_end
            AND a.scheduled_at + (a.duration || ' minutes')::INTERVAL > v_slot_start
        )
        AND NOT EXISTS (
          SELECT 1 FROM provider_blocks pb
          WHERE pb.provider_id = p_provider_id
            AND pb.block_date = p_date
            AND pb.start_time IS NOT NULL
            AND pb.end_time IS NOT NULL
            AND (p_date + pb.start_time) < v_slot_end
            AND (p_date + pb.end_time) > v_slot_start
        ) AS available;

      v_slot_start := v_slot_end;
    END LOOP;
  END LOOP;
END;
$$;

-- =============================================
-- RPC: update_provider_schedules
-- Delete + Insert em transação atômica (sem race condition)
-- =============================================

DROP FUNCTION IF EXISTS update_provider_schedules(UUID, JSONB);

CREATE OR REPLACE FUNCTION update_provider_schedules(
  p_provider_id UUID,
  p_schedules JSON  -- [{ day_of_week, start_time, end_time, slot_duration }]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all existing schedules
  DELETE FROM provider_schedules WHERE provider_id = p_provider_id;

  -- Insert new schedules from JSON array
  INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, slot_duration, is_active)
  SELECT
    p_provider_id,
    (item->>'day_of_week')::INTEGER,
    (item->>'start_time')::TIME,
    (item->>'end_time')::TIME,
    COALESCE((item->>'slot_duration')::INTEGER, 30),
    true
  FROM json_array_elements(p_schedules) AS item;

  RETURN true;
END;
$$;

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('009', 'multiple_schedule_segments')
ON CONFLICT (version) DO NOTHING;
