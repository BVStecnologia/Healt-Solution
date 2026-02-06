-- =============================================
-- MIGRAÇÃO 007: Provider Blocks (Bloqueios de Agenda)
-- Permite médicos bloquearem dias/horários via WhatsApp ou painel
-- =============================================

-- =============================================
-- TABELA: provider_blocks
-- Bloqueios de agenda dos médicos
-- =============================================

CREATE TABLE IF NOT EXISTS provider_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,      -- NULL = dia inteiro
  end_time TIME DEFAULT NULL,        -- NULL = dia inteiro
  reason TEXT DEFAULT NULL,
  created_via TEXT NOT NULL DEFAULT 'panel', -- 'panel' | 'whatsapp'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (
    (start_time IS NULL AND end_time IS NULL) OR
    (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  )
);

CREATE INDEX idx_provider_blocks_provider ON provider_blocks(provider_id);
CREATE INDEX idx_provider_blocks_date ON provider_blocks(block_date);
CREATE INDEX idx_provider_blocks_provider_date ON provider_blocks(provider_id, block_date);

CREATE TRIGGER provider_blocks_updated_at
  BEFORE UPDATE ON provider_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS para provider_blocks
-- =============================================

ALTER TABLE provider_blocks ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa autenticada pode ler bloqueios (necessário para agendamento)
CREATE POLICY "Anyone can view provider blocks"
  ON provider_blocks FOR SELECT
  USING (true);

-- Providers podem gerenciar seus próprios bloqueios
CREATE POLICY "Providers can manage own blocks"
  ON provider_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid()
    )
  );

-- Admins podem gerenciar todos os bloqueios
CREATE POLICY "Admins can manage all blocks"
  ON provider_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ATUALIZAR get_available_slots para verificar bloqueios
-- =============================================

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
    SELECT 1 FROM provider_blocks
    WHERE provider_id = p_provider_id
      AND block_date = p_date
      AND start_time IS NULL
      AND end_time IS NULL
  ) INTO v_full_day_blocked;

  IF v_full_day_blocked THEN
    RETURN; -- Sem slots se dia inteiro bloqueado
  END IF;

  -- Buscar schedule do provider para o dia
  SELECT * INTO v_schedule
  FROM provider_schedules
  WHERE provider_id = p_provider_id
    AND day_of_week = v_day_of_week
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_duration := v_schedule.slot_duration;
  v_slot_start := p_date + v_schedule.start_time;

  -- Gerar slots
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
END;
$$;

-- =============================================
-- RPC: create_provider_block
-- Cria um bloqueio e retorna consultas conflitantes
-- =============================================

CREATE OR REPLACE FUNCTION create_provider_block(
  p_provider_id UUID,
  p_block_date DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_created_via TEXT DEFAULT 'panel'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_block provider_blocks;
  v_conflicts JSON;
BEGIN
  -- Inserir bloqueio
  INSERT INTO provider_blocks (provider_id, block_date, start_time, end_time, reason, created_via)
  VALUES (p_provider_id, p_block_date, p_start_time, p_end_time, p_reason, p_created_via)
  RETURNING * INTO v_block;

  -- Buscar consultas conflitantes
  IF p_start_time IS NULL THEN
    -- Dia inteiro: todas as consultas do dia
    SELECT json_agg(json_build_object(
      'id', a.id,
      'scheduled_at', a.scheduled_at,
      'type', a.type,
      'status', a.status,
      'patient_name', p.first_name || ' ' || p.last_name
    ))
    INTO v_conflicts
    FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    WHERE a.provider_id = p_provider_id
      AND DATE(a.scheduled_at) = p_block_date
      AND a.status NOT IN ('cancelled', 'no_show');
  ELSE
    -- Período específico: consultas no intervalo
    SELECT json_agg(json_build_object(
      'id', a.id,
      'scheduled_at', a.scheduled_at,
      'type', a.type,
      'status', a.status,
      'patient_name', p.first_name || ' ' || p.last_name
    ))
    INTO v_conflicts
    FROM appointments a
    JOIN profiles p ON p.id = a.patient_id
    WHERE a.provider_id = p_provider_id
      AND DATE(a.scheduled_at) = p_block_date
      AND a.status NOT IN ('cancelled', 'no_show')
      AND a.scheduled_at::TIME < p_end_time
      AND (a.scheduled_at + (a.duration || ' minutes')::INTERVAL)::TIME > p_start_time;
  END IF;

  RETURN json_build_object(
    'block', row_to_json(v_block),
    'conflicts', COALESCE(v_conflicts, '[]'::json)
  );
END;
$$;

-- =============================================
-- RPC: delete_provider_block
-- Remove um bloqueio por ID
-- =============================================

CREATE OR REPLACE FUNCTION delete_provider_block(
  p_block_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM provider_blocks WHERE id = p_block_id;
  RETURN FOUND;
END;
$$;

-- =============================================
-- RPC: get_provider_blocks
-- Retorna bloqueios de um provider para um período
-- =============================================

CREATE OR REPLACE FUNCTION get_provider_blocks(
  p_provider_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS SETOF provider_blocks
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM provider_blocks
  WHERE provider_id = p_provider_id
    AND block_date >= p_start_date
    AND block_date <= p_end_date
  ORDER BY block_date, start_time;
$$;

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('007', 'provider_blocks')
ON CONFLICT (version) DO NOTHING;
