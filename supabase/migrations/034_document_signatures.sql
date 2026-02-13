-- Migration 034: Document Signatures + Patient Upload
-- Adiciona campos de assinatura digital e permite pacientes fazer upload

BEGIN;

-- Campos de assinatura na patient_documents
ALTER TABLE patient_documents
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signature_url TEXT,
  ADD COLUMN IF NOT EXISTS signed_by_name TEXT;

-- RLS: Paciente pode inserir docs próprios (upload)
DROP POLICY IF EXISTS "Patients can upload their own documents" ON patient_documents;
CREATE POLICY "Patients can upload their own documents"
  ON patient_documents FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- RLS: Paciente pode atualizar docs próprios (assinar)
DROP POLICY IF EXISTS "Patients can update their own documents" ON patient_documents;
CREATE POLICY "Patients can update their own documents"
  ON patient_documents FOR UPDATE
  USING (auth.uid() = patient_id);

-- Storage: Paciente pode fazer upload na pasta própria
DROP POLICY IF EXISTS "Patients can upload their own document files" ON storage.objects;
CREATE POLICY "Patients can upload their own document files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage: Paciente pode atualizar arquivos próprios (para assinatura)
DROP POLICY IF EXISTS "Patients can update their own document files" ON storage.objects;
CREATE POLICY "Patients can update their own document files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'patient-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Registro da migração
INSERT INTO schema_migrations (version, name)
VALUES ('034', 'document_signatures')
ON CONFLICT (version) DO NOTHING;

COMMIT;
