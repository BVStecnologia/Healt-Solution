import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PatientDocument, DocumentType } from '../types/documents';
import { useAuth } from '../context/AuthContext';

interface UploadParams {
  file: File;
  title: string;
  type: DocumentType;
  category?: string;
}

export function usePatientDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('[Documents] Erro ao buscar documentos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .createSignedUrl(filePath, 60 * 60); // 1 hour

      if (error) throw error;
      return data.signedUrl;
    } catch (err: any) {
      console.error('[Documents] Erro ao gerar URL:', err);
      return null;
    }
  };

  const upload = async ({ file, title, type, category }: UploadParams): Promise<boolean> => {
    if (!user) return false;
    try {
      setError(null);

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: user.id,
          title,
          type,
          category: category || null,
          file_url: path,
          uploaded_by: user.id,
        });

      if (insertError) {
        await supabase.storage.from('patient-documents').remove([path]);
        throw insertError;
      }

      await fetchDocuments();
      return true;
    } catch (err: any) {
      console.error('[Documents] Erro no upload:', err);
      setError(err.message);
      return false;
    }
  };

  const signDocument = async (
    docId: string,
    signatureDataUrl: string,
    fullName: string
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      setError(null);

      // Convert base64 data URL to blob
      const res = await fetch(signatureDataUrl);
      const blob = await res.blob();

      // Upload signature PNG to storage
      const timestamp = Date.now();
      const sigPath = `${user.id}/signatures/${timestamp}_signature.png`;

      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(sigPath, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      // Update document record
      const { error: updateError } = await supabase
        .from('patient_documents')
        .update({
          signed_at: new Date().toISOString(),
          signature_url: sigPath,
          signed_by_name: fullName,
        })
        .eq('id', docId)
        .eq('patient_id', user.id);

      if (updateError) {
        await supabase.storage.from('patient-documents').remove([sigPath]);
        throw updateError;
      }

      await fetchDocuments();
      return true;
    } catch (err: any) {
      console.error('[Documents] Erro ao assinar:', err);
      setError(err.message);
      return false;
    }
  };

  return { documents, loading, error, refetch: fetchDocuments, getSignedUrl, upload, signDocument };
}
