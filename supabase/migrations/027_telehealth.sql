-- =============================================
-- Migration 027: Telehealth support
-- Adds modality + video_link to appointments
-- Updates create_appointment RPC
-- =============================================

-- 1. Add columns
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS modality TEXT NOT NULL DEFAULT 'in_office';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS video_link TEXT;

-- 2. Update create_appointment RPC to accept modality + video_link
CREATE OR REPLACE FUNCTION create_appointment(
  p_patient_id UUID,
  p_provider_id UUID,
  p_type appointment_type,
  p_scheduled_at TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL,
  p_modality TEXT DEFAULT 'in_office',
  p_video_link TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_eligibility JSON;
  v_appointment appointments;
  v_duration INT;
  v_price DECIMAL(10,2);
BEGIN
  -- Look up duration and price from treatment_types
  SELECT duration_minutes, price_usd INTO v_duration, v_price
  FROM treatment_types
  WHERE key = p_type::TEXT;

  -- Fallback to 30 if not found
  IF v_duration IS NULL THEN
    v_duration := 30;
  END IF;

  -- Verificar elegibilidade
  v_eligibility := check_patient_eligibility(p_patient_id, p_type);

  IF NOT (v_eligibility->>'eligible')::BOOLEAN THEN
    RAISE EXCEPTION 'Paciente nao elegivel: %', v_eligibility->>'reasons';
  END IF;

  -- Verificar se horario esta disponivel (using correct duration)
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE provider_id = p_provider_id
      AND status NOT IN ('cancelled', 'no_show')
      AND scheduled_at < p_scheduled_at + (v_duration || ' minutes')::INTERVAL
      AND scheduled_at + (duration || ' minutes')::INTERVAL > p_scheduled_at
  ) THEN
    RAISE EXCEPTION 'Horario nao disponivel';
  END IF;

  -- Verificar antecedencia minima (24h)
  IF p_scheduled_at < NOW() + INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'Agendamentos devem ser feitos com pelo menos 24 horas de antecedencia';
  END IF;

  -- Criar appointment com duracao, preco e modalidade corretos
  INSERT INTO appointments (
    patient_id,
    provider_id,
    type,
    status,
    scheduled_at,
    duration,
    notes,
    price_at_booking,
    modality,
    video_link
  )
  VALUES (
    p_patient_id,
    p_provider_id,
    p_type,
    'pending',
    p_scheduled_at,
    v_duration,
    p_notes,
    v_price,
    COALESCE(p_modality, 'in_office'),
    p_video_link
  )
  RETURNING * INTO v_appointment;

  RETURN row_to_json(v_appointment);
END;
$$;

-- 3. Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('027', '027_telehealth')
ON CONFLICT (version) DO NOTHING;
