-- =============================================
-- MIGRATION 012: No-Show System + Template Updates
-- - Add no_show_count to profiles
-- - Add confirmed_by_patient_at to appointments
-- - Trigger to increment no_show_count
-- - Update cancellation templates with {link}
-- - New no-show notification templates (PT/EN)
-- =============================================

DO $$ BEGIN

-- =============================================
-- 1. ADD COLUMNS
-- =============================================

-- Counter for no-shows on patient profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;

-- Track when patient confirmed via WhatsApp
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_by_patient_at TIMESTAMPTZ;

RAISE NOTICE 'Columns added: no_show_count, confirmed_by_patient_at';

-- =============================================
-- 2. TRIGGER: Auto-increment no_show_count
-- =============================================

CREATE OR REPLACE FUNCTION update_no_show_count()
RETURNS TRIGGER AS $fn$
BEGIN
  -- When status changes TO no_show
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    UPDATE profiles
    SET no_show_count = COALESCE(no_show_count, 0) + 1,
        updated_at = NOW()
    WHERE id = NEW.patient_id;
  END IF;

  -- When status changes FROM no_show (undo)
  IF OLD.status = 'no_show' AND NEW.status != 'no_show' THEN
    UPDATE profiles
    SET no_show_count = GREATEST(COALESCE(no_show_count, 0) - 1, 0),
        updated_at = NOW()
    WHERE id = NEW.patient_id;
  END IF;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_no_show_count ON appointments;
CREATE TRIGGER trg_update_no_show_count
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_no_show_count();

RAISE NOTICE 'Trigger update_no_show_count created';

-- =============================================
-- 3. UPDATE CANCELLATION TEMPLATES WITH {link}
-- =============================================

-- PT template
UPDATE message_templates
SET content = E'*Consulta cancelada*\n\nOlá {nome}, infelizmente sua consulta precisou ser cancelada:\n\n*Médico:* {medico}\n*Data:* {data}\n*Horário:* {hora}\n*Motivo:* {motivo}\n\nAgende uma nova consulta: {link}',
    variables = ARRAY['nome', 'medico', 'data', 'hora', 'motivo', 'link']
WHERE name = 'appointment_cancelled_by_provider' AND language = 'pt';

-- EN template
UPDATE message_templates
SET content = E'*Appointment Cancelled*\n\nHello {nome}, unfortunately your appointment had to be cancelled:\n\n*Doctor:* {medico}\n*Date:* {data}\n*Time:* {hora}\n*Reason:* {motivo}\n\nBook a new appointment: {link}',
    variables = ARRAY['nome', 'medico', 'data', 'hora', 'motivo', 'link']
WHERE name = 'appointment_cancelled_by_provider' AND language = 'en';

RAISE NOTICE 'Cancellation templates updated with {link}';

-- =============================================
-- 4. NO-SHOW NOTIFICATION TEMPLATES
-- =============================================

-- No-show patient notification (PT)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'no_show_patient',
  'Notifica paciente que não compareceu à consulta',
  'pt',
  E'⚠️ *Falta registrada*\n\nOlá {nome}, verificamos que você não compareceu à consulta:\n\n*Médico:* Dr(a). {medico}\n*Data:* {data}\n*Horário:* {hora}\n\nSe houve algum imprevisto, entre em contato conosco.\nAgende uma nova consulta: {link}',
  ARRAY['nome', 'medico', 'data', 'hora', 'link'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active;

-- No-show patient notification (EN)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'no_show_patient',
  'Notifies patient about missed appointment',
  'en',
  E'⚠️ *No-Show Recorded*\n\nHello {nome}, we noticed you did not attend your appointment:\n\n*Doctor:* Dr. {medico}\n*Date:* {data}\n*Time:* {hora}\n\nIf something came up, please contact us.\nBook a new appointment: {link}',
  ARRAY['nome', 'medico', 'data', 'hora', 'link'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active;

-- No-show provider notification (PT)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'no_show_provider',
  'Notifica médico que paciente não compareceu',
  'pt',
  E'⚠️ *Paciente não compareceu*\n\nDr(a). {medico}, o paciente {paciente} não compareceu à consulta:\n\n*Tipo:* {tipo}\n*Data:* {data}\n*Horário:* {hora}\n\nA consulta foi marcada como falta.',
  ARRAY['medico', 'paciente', 'tipo', 'data', 'hora'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active;

-- No-show provider notification (EN)
INSERT INTO message_templates (name, description, language, content, variables, is_active)
VALUES (
  'no_show_provider',
  'Notifies doctor that patient did not show up',
  'en',
  E'⚠️ *Patient No-Show*\n\nDr. {medico}, patient {paciente} did not attend the appointment:\n\n*Type:* {tipo}\n*Date:* {data}\n*Time:* {hora}\n\nThe appointment has been marked as no-show.',
  ARRAY['medico', 'paciente', 'tipo', 'data', 'hora'],
  true
)
ON CONFLICT (name, language) DO UPDATE SET
  content = EXCLUDED.content,
  description = EXCLUDED.description,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active;

RAISE NOTICE 'No-show templates created';

-- =============================================
-- 5. REGISTER MIGRATION
-- =============================================

INSERT INTO schema_migrations (version, name, applied_at)
VALUES ('012', 'no_show_system', NOW());

RAISE NOTICE 'Migration 012 applied successfully!';

END $$;
