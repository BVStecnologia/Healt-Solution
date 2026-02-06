-- Migration 011: Notification Rules (configurable reminder system)
-- Creates notification_rules table for configurable reminders
-- Adds provider-specific reminder templates (2h and 15min)

BEGIN;

-- ============================================================
-- 1. notification_rules table
-- ============================================================

CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_role TEXT NOT NULL CHECK (target_role IN ('patient', 'provider')),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,  -- NULL = global rule
  minutes_before INTEGER NOT NULL CHECK (minutes_before > 0),
  template_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(target_role, provider_id, minutes_before)
);

-- Index for scheduler queries
CREATE INDEX idx_notification_rules_active ON notification_rules (is_active, target_role);

-- RLS
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

-- Admins: full CRUD
CREATE POLICY notification_rules_admin_all ON notification_rules
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Providers: read all rules + manage their own overrides
CREATE POLICY notification_rules_provider_select ON notification_rules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.user_id = auth.uid() AND p.is_active = true
    )
  );

CREATE POLICY notification_rules_provider_manage ON notification_rules
  FOR ALL TO authenticated
  USING (
    provider_id IN (
      SELECT p.id FROM providers p WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT p.id FROM providers p WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. Default notification rules (global)
-- ============================================================

INSERT INTO notification_rules (target_role, provider_id, minutes_before, template_name) VALUES
  ('patient', NULL, 1440, 'reminder_24h'),           -- 24h before
  ('patient', NULL, 60,   'reminder_1h'),             -- 1h before
  ('provider', NULL, 120,  'provider_reminder_2h'),   -- 2h before
  ('provider', NULL, 15,   'provider_reminder_15min'); -- 15min before

-- ============================================================
-- 3. New provider reminder templates
-- ============================================================

-- Provider reminder 2h (Portuguese)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'provider_reminder_2h',
  'Lembrete individual 2 horas antes para o medico',
  'pt',
  E'\U0001F514 *Lembrete: Consulta em 2 horas*\n\nDr(a). {medico}, voce tem uma consulta:\n\n*Paciente:* {paciente}\n*Tipo:* {tipo}\n*Data:* {data}\n*Horario:* {hora}',
  ARRAY['medico', 'paciente', 'tipo', 'data', 'hora'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- Provider reminder 2h (English)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'provider_reminder_2h',
  'Individual reminder 2 hours before for doctor',
  'en',
  E'\U0001F514 *Reminder: Appointment in 2 hours*\n\nDr. {medico}, you have an appointment:\n\n*Patient:* {paciente}\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}',
  ARRAY['medico', 'paciente', 'tipo', 'data', 'hora'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- Provider reminder 15min (Portuguese)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'provider_reminder_15min',
  'Lembrete individual 15 minutos antes para o medico',
  'pt',
  E'\u23F0 *Consulta em 15 minutos!*\n\nDr(a). {medico}\n*Paciente:* {paciente}\n*Tipo:* {tipo}',
  ARRAY['medico', 'paciente', 'tipo'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- Provider reminder 15min (English)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'provider_reminder_15min',
  'Individual reminder 15 minutes before for doctor',
  'en',
  E'\u23F0 *Appointment in 15 minutes!*\n\nDr. {medico}\n*Patient:* {paciente}\n*Type:* {tipo}',
  ARRAY['medico', 'paciente', 'tipo'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  variables = EXCLUDED.variables,
  description = EXCLUDED.description,
  updated_at = now();

-- ============================================================
-- 4. Migration record
-- ============================================================

INSERT INTO schema_migrations (version, name)
VALUES ('011', 'notification_rules')
ON CONFLICT (version) DO NOTHING;

COMMIT;
