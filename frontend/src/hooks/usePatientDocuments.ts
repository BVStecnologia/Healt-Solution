import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PatientDocument } from '../types/documents';
import { useAuth } from '../context/AuthContext';

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

  return { documents, loading, error, refetch: fetchDocuments, getSignedUrl };
}
