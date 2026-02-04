-- =============================================
-- MÓDULO DE NOTIFICAÇÕES WHATSAPP
-- Tabelas para gerenciar instâncias, templates e logs
-- =============================================

-- =============================================
-- TIPO ENUM: message_status
-- =============================================

CREATE TYPE message_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'read',
  'failed'
);

-- =============================================
-- TABELA: whatsapp_instances
-- Instâncias do Evolution API
-- =============================================

CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                       -- "Principal", "Recepção"
  instance_name TEXT NOT NULL UNIQUE,       -- nome na Evolution API
  phone_number TEXT,                        -- número conectado
  status TEXT DEFAULT 'disconnected',       -- connected, disconnected, qr_code
  qr_code TEXT,                             -- base64 do QR (se pendente)
  is_default BOOLEAN DEFAULT false,         -- instância padrão para envios
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp instances"
  ON whatsapp_instances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TABELA: message_templates
-- Templates de mensagens WhatsApp
-- =============================================

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,                -- "appointment_confirmed", "reminder_24h"
  description TEXT,                         -- descrição do template
  language TEXT DEFAULT 'pt',
  content TEXT NOT NULL,                    -- mensagem com {placeholders}
  variables TEXT[],                         -- ["nome", "medico", "data", "hora"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
  ON message_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TABELA: message_logs
-- Histórico de mensagens enviadas
-- =============================================

CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID REFERENCES whatsapp_instances(id),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES profiles(id),
  template_name TEXT,                       -- nome do template usado
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,                    -- mensagem final enviada
  status message_status DEFAULT 'pending',
  evolution_message_id TEXT,                -- ID da mensagem na Evolution API
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB,                           -- dados extras (response da API, etc)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_logs_appointment ON message_logs(appointment_id);
CREATE INDEX idx_message_logs_patient ON message_logs(patient_id);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_created ON message_logs(created_at);

-- RLS
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own messages"
  ON message_logs FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Admins can manage message logs"
  ON message_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- ALTERAÇÃO: appointments
-- Campos adicionais para confirmação
-- =============================================

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- =============================================
-- DADOS INICIAIS: Templates de mensagem
-- =============================================

INSERT INTO message_templates (name, description, content, variables) VALUES

-- Notificação para clínica (nova consulta)
('new_appointment_clinic', 'Notifica clínica sobre nova consulta',
'📋 *Nova consulta solicitada!*

*Paciente:* {nome}
*Médico:* {medico}
*Tipo:* {tipo}
*Data:* {data}
*Hora:* {hora}

Acesse o painel para confirmar.',
ARRAY['nome', 'medico', 'tipo', 'data', 'hora']),

-- Confirmação para paciente
('appointment_confirmed', 'Confirma consulta para o paciente',
'✅ *Consulta confirmada!*

Olá {nome}, sua consulta foi confirmada:

*Médico:* {medico}
*Tipo:* {tipo}
*Data:* {data}
*Hora:* {hora}

Até lá! 👋',
ARRAY['nome', 'medico', 'tipo', 'data', 'hora']),

-- Rejeição para paciente
('appointment_rejected', 'Informa paciente sobre rejeição',
'❌ *Consulta não disponível*

Olá {nome}, infelizmente não foi possível confirmar sua consulta.

*Motivo:* {motivo}

Por favor, agende outro horário pelo portal.',
ARRAY['nome', 'motivo']),

-- Lembrete 24h
('reminder_24h', 'Lembrete 24 horas antes',
'⏰ *Lembrete de consulta!*

Olá {nome}, sua consulta é *amanhã*:

*Médico:* {medico}
*Tipo:* {tipo}
*Data:* {data}
*Hora:* {hora}

Confirme sua presença respondendo *OK*.',
ARRAY['nome', 'medico', 'tipo', 'data', 'hora']),

-- Lembrete 1h
('reminder_1h', 'Lembrete 1 hora antes',
'🔔 *Sua consulta é em 1 hora!*

*Médico:* {medico}
*Hora:* {hora}

Estamos te esperando! 🏥',
ARRAY['medico', 'hora']),

-- Cancelamento
('appointment_cancelled', 'Notifica cancelamento',
'⚠️ *Consulta cancelada*

Olá {nome}, sua consulta foi cancelada:

*Médico:* {medico}
*Data:* {data}
*Hora:* {hora}

*Motivo:* {motivo}

Você pode agendar uma nova consulta pelo portal.',
ARRAY['nome', 'medico', 'data', 'hora', 'motivo']);

-- =============================================
-- FUNÇÃO RPC: log_whatsapp_message
-- Registra mensagem no log (chamada pelo frontend)
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
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    metadata
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
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =============================================
-- FUNÇÃO RPC: get_default_whatsapp_instance
-- Retorna instância padrão conectada
-- =============================================

CREATE OR REPLACE FUNCTION get_default_whatsapp_instance()
RETURNS TABLE (
  id UUID,
  instance_name TEXT,
  phone_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, instance_name, phone_number
  FROM whatsapp_instances
  WHERE status = 'connected'
    AND (is_default = true OR true)  -- Pega default ou primeira conectada
  ORDER BY is_default DESC, created_at ASC
  LIMIT 1;
$$;

-- Registrar migração
INSERT INTO schema_migrations (version, name)
VALUES ('002', 'whatsapp_notifications')
ON CONFLICT (version) DO NOTHING;
