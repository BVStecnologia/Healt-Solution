-- =============================================
-- Migration 023: Treatment Prices
-- Adds price_usd/cost_usd to treatment_types
-- Adds price_at_booking to appointments
-- Updates create_appointment RPC to snapshot price
-- =============================================

-- 1. Add price columns to treatment_types
ALTER TABLE treatment_types ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2);
ALTER TABLE treatment_types ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(10,2);

-- 2. Add price_at_booking to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price_at_booking DECIMAL(10,2);

-- 3. Seed prices from OptiMantra mapping
UPDATE treatment_types SET price_usd = 100.00 WHERE key = 'initial_consultation';
UPDATE treatment_types SET price_usd = 125.00 WHERE key = 'follow_up';
UPDATE treatment_types SET price_usd = 300.00 WHERE key = 'functional_medicine';
UPDATE treatment_types SET price_usd = 200.00 WHERE key = 'bhrt';
UPDATE treatment_types SET price_usd = 200.00 WHERE key = 'male_hypertrophy';
UPDATE treatment_types SET price_usd = 200.00 WHERE key = 'female_hypertrophy';
UPDATE treatment_types SET price_usd = 200.00 WHERE key = 'insulin_resistance';
UPDATE treatment_types SET price_usd = 200.00 WHERE key = 'chronic_inflammation';
UPDATE treatment_types SET price_usd = 200.00 WHERE key = 'thyroid_support';
UPDATE treatment_types SET price_usd = 200.00 WHERE key = 'high_cortisol';
UPDATE treatment_types SET price_usd = 1000.00, cost_usd = 145.00 WHERE key = 'morpheus8';
UPDATE treatment_types SET price_usd = 600.00, cost_usd = 100.00 WHERE key = 'botulinum_toxin';
-- fillers = NULL (variable price)
UPDATE treatment_types SET price_usd = 150.00 WHERE key = 'skin_boosters';
UPDATE treatment_types SET price_usd = 250.00 WHERE key = 'iv_protocols';
UPDATE treatment_types SET price_usd = 180.00 WHERE key = 'customized_iv_nutrition';
UPDATE treatment_types SET price_usd = 70.00, cost_usd = 20.00 WHERE key = 'nutrient_testing';
UPDATE treatment_types SET price_usd = 350.00 WHERE key = 'nad_therapy';
UPDATE treatment_types SET price_usd = 30.00, cost_usd = 5.00 WHERE key = 'vitamin_injections';
UPDATE treatment_types SET price_usd = 180.00 WHERE key = 'iron_infusions';
UPDATE treatment_types SET price_usd = 300.00 WHERE key = 'chelation_therapy';
-- peptides = NULL (variable price)

-- 4. Update create_appointment RPC to snapshot price_at_booking
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

  -- Criar appointment com duracao e preco corretos
  INSERT INTO appointments (
    patient_id,
    provider_id,
    type,
    status,
    scheduled_at,
    duration,
    notes,
    price_at_booking
  )
  VALUES (
    p_patient_id,
    p_provider_id,
    p_type,
    'pending',
    p_scheduled_at,
    v_duration,
    p_notes,
    v_price
  )
  RETURNING * INTO v_appointment;

  RETURN row_to_json(v_appointment);
END;
$$;

-- 5. Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('023', '023_treatment_prices')
ON CONFLICT (version) DO NOTHING;
