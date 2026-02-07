-- Migration 017: Patient Documents
-- Tabela para documentos do paciente (exames, receitas, planos, etc.)

BEGIN;

-- Tipo de documento
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'prescription', 'lab_result', 'treatment_plan',
    'invoice', 'consent_form', 'intake_form', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tabela principal
CREATE TABLE IF NOT EXISTS patient_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type document_type NOT NULL,
  category TEXT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por paciente
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_patient_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_patient_documents_updated_at ON patient_documents;
CREATE TRIGGER trg_patient_documents_updated_at
  BEFORE UPDATE ON patient_documents
  FOR EACH ROW EXECUTE FUNCTION update_patient_documents_updated_at();

-- RLS
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can view their own documents" ON patient_documents;
CREATE POLICY "Patients can view their own documents"
  ON patient_documents FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Admins can view all documents" ON patient_documents;
CREATE POLICY "Admins can view all documents"
  ON patient_documents FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert documents" ON patient_documents;
CREATE POLICY "Admins can insert documents"
  ON patient_documents FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update documents" ON patient_documents;
CREATE POLICY "Admins can update documents"
  ON patient_documents FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete documents" ON patient_documents;
CREATE POLICY "Admins can delete documents"
  ON patient_documents FOR DELETE
  USING (is_admin());

-- Storage bucket para arquivos
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (usando path com patient_id como prefixo)
DROP POLICY IF EXISTS "Patients can view their own document files" ON storage.objects;
CREATE POLICY "Patients can view their own document files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admin: policies separadas (FOR ALL com USING não gera WITH CHECK para INSERT)
DROP POLICY IF EXISTS "Admins can manage all document files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view document files" ON storage.objects;
CREATE POLICY "Admins can view document files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-documents' AND is_admin());

DROP POLICY IF EXISTS "Admins can upload document files" ON storage.objects;
CREATE POLICY "Admins can upload document files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-documents' AND is_admin());

DROP POLICY IF EXISTS "Admins can update document files" ON storage.objects;
CREATE POLICY "Admins can update document files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'patient-documents' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete document files" ON storage.objects;
CREATE POLICY "Admins can delete document files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-documents' AND is_admin());

-- Registro da migração
INSERT INTO schema_migrations (version, name)
VALUES ('017', 'patient_documents')
ON CONFLICT (version) DO NOTHING;

COMMIT;
