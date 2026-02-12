-- =============================================
-- Migration 031: Clinic Settings
-- Generic key-value settings table
-- Makes min_booking_hours configurable (was hardcoded 24h)
-- =============================================

-- 1. Create clinic_settings table
CREATE TABLE IF NOT EXISTS clinic_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default value
INSERT INTO clinic_settings (key, value, description)
VALUES ('min_booking_hours', '24', 'Minimum hours in advance required for booking appointments')
ON CONFLICT (key) DO NOTHING;

-- 3. RLS
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read clinic settings" ON clinic_settings;
CREATE POLICY "Anyone can read clinic settings" ON clinic_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update clinic settings" ON clinic_settings;
CREATE POLICY "Admins can update clinic settings" ON clinic_settings
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert clinic settings" ON clinic_settings;
CREATE POLICY "Admins can insert clinic settings" ON clinic_settings
  FOR INSERT WITH CHECK (is_admin());

-- 4. RPC: get_clinic_setting
CREATE OR REPLACE FUNCTION get_clinic_setting(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value FROM clinic_settings WHERE key = p_key;
  RETURN v_value;
END;
$$;

-- 5. RPC: update_clinic_setting
CREATE OR REPLACE FUNCTION update_clinic_setting(p_key TEXT, p_value TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE clinic_settings
  SET value = p_value, updated_at = NOW()
  WHERE key = p_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Setting not found: %', p_key;
  END IF;
END;
$$;

-- 6. Update create_appointment RPC to use dynamic min_booking_hours
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
  v_min_hours INT;
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

  -- Read configurable min booking hours (default 24)
  SELECT COALESCE(value, '24')::INT INTO v_min_hours
  FROM clinic_settings
  WHERE key = 'min_booking_hours';

  IF v_min_hours IS NULL THEN
    v_min_hours := 24;
  END IF;

  -- Verificar antecedencia minima (configurable)
  IF p_scheduled_at < NOW() + (v_min_hours || ' hours')::INTERVAL THEN
    RAISE EXCEPTION 'Agendamentos devem ser feitos com pelo menos % horas de antecedencia', v_min_hours;
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

-- 7. Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('031', '031_clinic_settings')
ON CONFLICT (version) DO NOTHING;
