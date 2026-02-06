-- =============================================
-- MÓDULO DE AGENDAMENTO - CLÍNICA
-- Estrutura de tabelas e funções RPC
-- =============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TIPOS ENUM
-- =============================================

CREATE TYPE user_role AS ENUM ('patient', 'provider', 'admin');
CREATE TYPE patient_type AS ENUM ('new', 'trt', 'hormone', 'general', 'vip');
CREATE TYPE appointment_type AS ENUM (
  'initial_consultation',
  'follow_up',
  'hormone_check',
  'lab_review',
  'nutrition',
  'health_coaching',
  'therapy',
  'personal_training'
);
CREATE TYPE appointment_status AS ENUM (
  'pending',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

-- =============================================
-- TABELA: profiles
-- Estende auth.users com dados adicionais
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'patient',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  patient_type patient_type DEFAULT 'new',
  last_visit_at TIMESTAMPTZ,
  labs_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Função auxiliar para verificar se o usuário é admin (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- =============================================
-- TABELA: providers
-- Médicos e profissionais de saúde
-- =============================================

CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TRIGGER providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS para providers
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active providers"
  ON providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage providers"
  ON providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TABELA: provider_schedules
-- Horários de trabalho dos providers
-- =============================================

CREATE TABLE provider_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INT NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, day_of_week),
  CHECK (end_time > start_time)
);

CREATE TRIGGER provider_schedules_updated_at
  BEFORE UPDATE ON provider_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedules"
  ON provider_schedules FOR SELECT
  USING (true);

CREATE POLICY "Providers can manage own schedules"
  ON provider_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- TABELA: appointments
-- Agendamentos
-- =============================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  type appointment_type NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INT NOT NULL DEFAULT 30,
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can create own appointments"
  ON appointments FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own appointments"
  ON appointments FOR UPDATE
  USING (patient_id = auth.uid());

CREATE POLICY "Providers can view their appointments"
  ON appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their appointments"
  ON appointments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM providers WHERE id = provider_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all appointments"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- FUNÇÃO RPC: get_patient_appointments
-- Retorna consultas do paciente
-- =============================================

CREATE OR REPLACE FUNCTION get_patient_appointments(p_patient_id UUID)
RETURNS SETOF appointments
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM appointments
  WHERE patient_id = p_patient_id
  ORDER BY scheduled_at DESC;
$$;

-- =============================================
-- FUNÇÃO RPC: get_available_slots
-- Retorna horários disponíveis
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
  v_duration INT := 30; -- Default
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date)::INT;

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

    -- Verificar se slot está disponível (não tem appointment)
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
      ) AS available;

    v_slot_start := v_slot_end;
  END LOOP;
END;
$$;

-- =============================================
-- FUNÇÃO RPC: check_patient_eligibility
-- Verifica elegibilidade para agendamento
-- =============================================

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
BEGIN
  -- Buscar perfil do paciente
  SELECT * INTO v_profile FROM profiles WHERE id = p_patient_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'eligible', false,
      'reasons', ARRAY['Paciente não encontrado'],
      'next_eligible_date', null,
      'requirements', json_build_object(
        'labs_required', false,
        'labs_completed', false,
        'visit_required', false,
        'last_visit_date', null
      )
    );
  END IF;

  -- Verificar labs (para TRT e hormone)
  v_labs_completed := v_profile.labs_completed_at IS NOT NULL
    AND v_profile.labs_completed_at > NOW() - INTERVAL '6 months';

  -- Regras baseadas no tipo de paciente e consulta
  IF v_profile.patient_type IN ('trt', 'hormone') THEN
    -- TRT/Hormônios requer labs e visita a cada 6 meses
    IF p_appointment_type IN ('follow_up', 'hormone_check') THEN
      -- Verificar labs
      IF NOT v_labs_completed THEN
        v_eligible := false;
        v_reasons := array_append(v_reasons, 'Exames laboratoriais pendentes ou expirados (validade: 6 meses)');
      END IF;

      -- Verificar última visita
      IF v_profile.last_visit_at IS NULL OR v_profile.last_visit_at < NOW() - INTERVAL '6 months' THEN
        v_visit_required := true;
        -- Não bloqueia, mas avisa
      END IF;
    END IF;
  END IF;

  -- Paciente novo só pode agendar consulta inicial
  IF v_profile.patient_type = 'new' THEN
    IF p_appointment_type != 'initial_consultation' THEN
      v_eligible := false;
      v_reasons := array_append(v_reasons, 'Pacientes novos devem agendar uma consulta inicial primeiro');
    END IF;
  END IF;

  -- Verificar se já tem consulta no mesmo dia (limite de 1/dia)
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE patient_id = p_patient_id
      AND DATE(scheduled_at) = CURRENT_DATE
      AND status NOT IN ('cancelled', 'no_show')
  ) THEN
    v_eligible := false;
    v_reasons := array_append(v_reasons, 'Já existe uma consulta agendada para hoje');
  END IF;

  -- Calcular próxima data elegível
  IF NOT v_eligible AND NOT v_labs_completed THEN
    v_next_eligible_date := CURRENT_DATE + INTERVAL '7 days'; -- Tempo estimado para fazer labs
  END IF;

  RETURN json_build_object(
    'eligible', v_eligible,
    'reasons', v_reasons,
    'next_eligible_date', v_next_eligible_date,
    'requirements', json_build_object(
      'labs_required', v_profile.patient_type IN ('trt', 'hormone'),
      'labs_completed', v_labs_completed,
      'visit_required', v_visit_required,
      'last_visit_date', v_profile.last_visit_at
    )
  );
END;
$$;

-- =============================================
-- FUNÇÃO RPC: create_appointment
-- Cria um agendamento com validações
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
AS $$
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

  -- Criar appointment
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

-- =============================================
-- TRIGGER: Atualizar last_visit_at
-- Quando consulta é marcada como completed
-- =============================================

CREATE OR REPLACE FUNCTION update_patient_last_visit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles
    SET last_visit_at = NEW.scheduled_at
    WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_completed_update_visit
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_patient_last_visit();

-- =============================================
-- DADOS INICIAIS (Seed)
-- =============================================

-- Inserir tipos de consulta padrão (para referência)
COMMENT ON TYPE appointment_type IS 'Tipos de consulta disponíveis:
- initial_consultation: Consulta Inicial (60 min)
- follow_up: Retorno (30 min)
- hormone_check: Avaliação Hormonal (45 min)
- lab_review: Revisão de Exames (20 min)
- nutrition: Nutrição (45 min)
- health_coaching: Health Coaching (30 min)
- therapy: Terapia (50 min)
- personal_training: Personal Training (60 min)';

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('001', 'scheduling_tables')
ON CONFLICT (version) DO NOTHING;
