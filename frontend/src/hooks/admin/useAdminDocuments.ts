import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { PatientDocument, DocumentType } from '../../types/documents';

interface UploadParams {
  file: File;
  title: string;
  type: DocumentType;
  category?: string;
}

export function useAdminDocuments(patientId: string) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('[AdminDocuments] Erro ao buscar documentos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const upload = async ({ file, title, type, category }: UploadParams): Promise<boolean> => {
    try {
      setError(null);

      // Get current user for uploaded_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload file to storage
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${patientId}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(path, file);

      if (uploadError) throw uploadError;

      // Get signed URL (7 days)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('patient-documents')
        .createSignedUrl(path, 60 * 60 * 24 * 7);

      if (urlError) throw urlError;

      // Insert record in table
      const { error: insertError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          title,
          type,
          category: category || null,
          file_url: path, // Store the path, not signed URL (we'll generate signed URLs on demand)
          uploaded_by: user.id,
        });

      if (insertError) {
        // Rollback: delete uploaded file
        await supabase.storage.from('patient-documents').remove([path]);
        throw insertError;
      }

      await fetchDocuments();
      return true;
    } catch (err: any) {
      console.error('[AdminDocuments] Erro no upload:', err);
      setError(err.message);
      return false;
    }
  };

  const remove = async (documentId: string): Promise<boolean> => {
    try {
      setError(null);

      // Find document to get file path
      const doc = documents.find(d => d.id === documentId);
      if (!doc) throw new Error('Documento não encontrado');

      // Delete from storage
      const filePath = doc.file_url;
      await supabase.storage.from('patient-documents').remove([filePath]);

      // Delete from table
      const { error: deleteError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      await fetchDocuments();
      return true;
    } catch (err: any) {
      console.error('[AdminDocuments] Erro ao deletar:', err);
      setError(err.message);
      return false;
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour

      if (error) throw error;
      return data.signedUrl;
    } catch (err: any) {
      console.error('[AdminDocuments] Erro ao gerar URL:', err);
      return null;
    }
  };

  return { documents, loading, error, upload, remove, refetch: fetchDocuments, getSignedUrl };
}
