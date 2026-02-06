-- =============================================
-- Migration 016: Treatment Types Reference Table
-- + Fix duration bug in create_appointment
-- + Update eligibility rules for new patient types
-- =============================================

-- 1. Create treatment_types reference table
CREATE TABLE IF NOT EXISTS treatment_types (
  key TEXT PRIMARY KEY,
  label_pt TEXT NOT NULL,
  label_en TEXT NOT NULL,
  short_label_pt TEXT NOT NULL,
  short_label_en TEXT NOT NULL,
  description_pt TEXT,
  description_en TEXT,
  category TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Populate active treatment types (18)
INSERT INTO treatment_types (key, label_pt, label_en, short_label_pt, short_label_en, description_pt, description_en, category, duration_minutes, is_active, sort_order) VALUES
  -- General
  ('initial_consultation', 'Consulta Inicial', 'Initial Consultation', 'Inicial', 'Initial', 'Primeira consulta com o medico', 'First consultation with the doctor', 'general', 60, true, 1),
  ('follow_up', 'Retorno', 'Follow-up', 'Retorno', 'Follow-up', 'Acompanhamento de tratamento', 'Treatment follow-up', 'general', 30, true, 2),
  -- Well-being
  ('functional_medicine', 'Medicina Funcional', 'Functional Medicine', 'Funcional', 'Functional', 'Medicina funcional personalizada', 'Personalized functional medicine', 'wellbeing', 60, true, 10),
  ('bhrt', 'Terapia Hormonal Bioidentica', 'Bio-Identical Hormone Therapy', 'BHRT', 'BHRT', 'Reposicao hormonal bioidentica', 'Bio-identical hormone replacement therapy', 'wellbeing', 45, true, 11),
  ('male_hypertrophy', 'Hipertrofia Masculina', 'Male Hypertrophy Protocol', 'Hipert. Masc.', 'Male Hyper.', 'Protocolo de hipertrofia masculina', 'Male hypertrophy protocol', 'wellbeing', 45, true, 12),
  ('female_hypertrophy', 'Hipertrofia Feminina', 'Female Hypertrophy Protocol', 'Hipert. Fem.', 'Female Hyper.', 'Protocolo de hipertrofia feminina', 'Female hypertrophy protocol', 'wellbeing', 45, true, 13),
  -- Personalized Medicine
  ('insulin_resistance', 'Resistencia a Insulina', 'Insulin Resistance Management', 'Insulina', 'Insulin', 'Gerenciamento de resistencia a insulina', 'Insulin resistance management', 'personalized', 45, true, 20),
  ('chronic_inflammation', 'Inflamacao Cronica', 'Chronic Inflammation Management', 'Inflamacao', 'Inflammation', 'Gerenciamento de inflamacao cronica', 'Chronic inflammation management', 'personalized', 45, true, 21),
  ('thyroid_support', 'Suporte de Tireoide', 'Thyroid Support', 'Tireoide', 'Thyroid', 'Suporte e otimizacao tireoidiana', 'Thyroid support and optimization', 'personalized', 45, true, 22),
  -- Rejuvenation
  ('morpheus8', 'Morpheus8', 'Morpheus8', 'Morpheus8', 'Morpheus8', 'Estimulacao de colageno com Morpheus8', 'Collagen stimulation with Morpheus8', 'rejuvenation', 60, true, 30),
  ('botulinum_toxin', 'Toxina Botulinica', 'Botulinum Toxin', 'Botox', 'Botox', 'Aplicacao de toxina botulinica', 'Botulinum toxin application', 'rejuvenation', 30, true, 31),
  ('fillers', 'Preenchimento', 'Fillers', 'Preenchi.', 'Fillers', 'Preenchimento dermico com acido hialuronico', 'Dermal fillers with hyaluronic acid', 'rejuvenation', 45, true, 32),
  ('skin_boosters', 'Skin Boosters', 'Skin Boosters', 'Skin Boost', 'Skin Boost', 'Hidratacao profunda da pele', 'Deep skin hydration treatment', 'rejuvenation', 30, true, 33),
  -- IV Therapy
  ('iv_protocols', 'Protocolos IV', 'IV Protocols', 'IV Proto.', 'IV Proto.', 'Protocolos de infusao intravenosa', 'Intravenous infusion protocols', 'iv_therapy', 60, true, 40),
  ('customized_iv_nutrition', 'Nutricao IV Personalizada', 'Customized IV Nutrition', 'IV Nutri.', 'IV Nutri.', 'Nutricao intravenosa personalizada', 'Customized intravenous nutrition', 'iv_therapy', 60, true, 41),
  ('nutrient_testing', 'Teste de Nutrientes', 'Nutrient Testing', 'Nutrientes', 'Nutrients', 'Teste de micronutrientes', 'Micronutrient testing', 'iv_therapy', 30, true, 42),
  ('nad_therapy', 'Terapia NAD+', 'NAD+ Therapy', 'NAD+', 'NAD+', 'Infusao de NAD+ para energia celular', 'NAD+ infusion for cellular energy', 'iv_therapy', 90, true, 43),
  ('vitamin_injections', 'Injecoes de Vitaminas', 'Vitamin Injections', 'Vitaminas', 'Vitamins', 'Injecoes intramusculares de vitaminas', 'Intramuscular vitamin injections', 'iv_therapy', 20, true, 44)
ON CONFLICT (key) DO NOTHING;

-- 3. Populate legacy treatment types (inactive, for backward compat)
INSERT INTO treatment_types (key, label_pt, label_en, short_label_pt, short_label_en, description_pt, description_en, category, duration_minutes, is_active, sort_order) VALUES
  ('hormone_check', 'Avaliacao Hormonal', 'Hormone Check', 'Hormonal', 'Hormone', 'Verificacao de niveis hormonais', 'Hormone level check', 'general', 45, false, 90),
  ('lab_review', 'Revisao de Exames', 'Lab Review', 'Exames', 'Lab Review', 'Analise de resultados laboratoriais', 'Laboratory results analysis', 'general', 20, false, 91),
  ('nutrition', 'Nutricao', 'Nutrition', 'Nutricao', 'Nutrition', 'Consulta com nutricionista', 'Nutrition consultation', 'general', 45, false, 92),
  ('health_coaching', 'Health Coaching', 'Health Coaching', 'Coaching', 'Coaching', 'Sessao de coaching de saude', 'Health coaching session', 'general', 30, false, 93),
  ('therapy', 'Terapia', 'Therapy', 'Terapia', 'Therapy', 'Sessao de terapia', 'Therapy session', 'general', 50, false, 94),
  ('personal_training', 'Personal Training', 'Personal Training', 'Personal', 'Personal', 'Sessao de personal training', 'Personal training session', 'general', 60, false, 95)
ON CONFLICT (key) DO NOTHING;

-- 4. RLS for treatment_types
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view treatment types" ON treatment_types;
CREATE POLICY "Anyone can view treatment types"
  ON treatment_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage treatment types" ON treatment_types;
CREATE POLICY "Admins can manage treatment types"
  ON treatment_types FOR ALL USING (is_admin());

-- 5. Fix create_appointment RPC - use correct duration from treatment_types
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
BEGIN
  -- Look up duration from treatment_types (fixes hardcoded 30 bug)
  SELECT duration_minutes INTO v_duration
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

  -- Criar appointment com duracao correta
  INSERT INTO appointments (
    patient_id,
    provider_id,
    type,
    status,
    scheduled_at,
    duration,
    notes
  )
  VALUES (
    p_patient_id,
    p_provider_id,
    p_type,
    'pending',
    p_scheduled_at,
    v_duration,
    p_notes
  )
  RETURNING * INTO v_appointment;

  RETURN row_to_json(v_appointment);
END;
$$;

-- 6. Update check_patient_eligibility for new patient types
CREATE OR REPLACE FUNCTION check_patient_eligibility(
  p_patient_id UUID,
  p_appointment_type appointment_type
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_eligible BOOLEAN := true;
  v_reasons TEXT[] := '{}';
  v_next_eligible_date DATE;
  v_labs_completed BOOLEAN;
  v_visit_required BOOLEAN := false;
  v_type_text TEXT;
  v_patient_type_text TEXT;
BEGIN
  -- Cast enum to text for comparisons
  v_type_text := p_appointment_type::TEXT;

  -- Buscar perfil do paciente
  SELECT * INTO v_profile FROM profiles WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'eligible', false,
      'reasons', ARRAY['Paciente nao encontrado'],
      'next_eligible_date', null,
      'requirements', json_build_object(
        'labs_required', false,
        'labs_completed', false,
        'visit_required', false,
        'last_visit_date', null
      )
    );
  END IF;

  v_patient_type_text := v_profile.patient_type::TEXT;

  -- Verificar labs (para BHRT, TRT e hormone patients)
  v_labs_completed := v_profile.labs_completed_at IS NOT NULL
    AND v_profile.labs_completed_at > NOW() - INTERVAL '6 months';

  -- BHRT/TRT/Hormone patients: require labs for hormone-related treatments
  IF v_patient_type_text IN ('bhrt', 'trt', 'hormone') THEN
    IF v_type_text IN ('bhrt', 'male_hypertrophy', 'female_hypertrophy', 'follow_up', 'hormone_check') THEN
      IF NOT v_labs_completed THEN
        v_eligible := false;
        v_reasons := array_append(v_reasons, 'Exames laboratoriais pendentes ou expirados (validade: 6 meses)');
      END IF;

      IF v_profile.last_visit_at IS NULL OR v_profile.last_visit_at < NOW() - INTERVAL '6 months' THEN
        v_visit_required := true;
      END IF;
    END IF;
  END IF;

  -- Paciente novo so pode agendar consulta inicial ou medicina funcional
  IF v_patient_type_text = 'new' THEN
    IF v_type_text NOT IN ('initial_consultation', 'functional_medicine') THEN
      v_eligible := false;
      v_reasons := array_append(v_reasons, 'Pacientes novos devem agendar uma Consulta Inicial ou Medicina Funcional primeiro');
    END IF;
  END IF;

  -- Verificar se ja tem consulta no mesmo dia (limite de 1/dia)
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = p_patient_id
      AND DATE(scheduled_at) = CURRENT_DATE
      AND status NOT IN ('cancelled', 'no_show')
  ) THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Ja existe uma consulta agendada para hoje');
  END IF;

  -- Calcular proxima data elegivel
  IF NOT v_eligible AND NOT v_labs_completed THEN
    v_next_eligible_date := CURRENT_DATE + INTERVAL '7 days';
  END IF;

  RETURN json_build_object(
    'eligible', v_eligible,
    'reasons', v_reasons,
    'next_eligible_date', v_next_eligible_date,
    'requirements', json_build_object(
      'labs_required', v_patient_type_text IN ('bhrt', 'trt', 'hormone'),
      'labs_completed', v_labs_completed,
      'visit_required', v_visit_required,
      'last_visit_date', v_profile.last_visit_at
    )
  );
END;
$$;

-- 7. Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('016', '016_treatment_types')
ON CONFLICT (version) DO NOTHING;
