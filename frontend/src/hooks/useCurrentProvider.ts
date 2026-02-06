import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface ProviderRecord {
  id: string;
  user_id: string;
  specialty: string;
  is_active: boolean;
}

interface UseCurrentProviderReturn {
  provider: ProviderRecord | null;
  providerId: string | null;
  loading: boolean;
  isProvider: boolean;
  isAdmin: boolean;
}

/**
 * Hook que retorna o provider record do usuário logado.
 * Se role=provider, busca na tabela providers pelo user_id.
 * Se role=admin, retorna null (admin não é provider).
 */
export function useCurrentProvider(): UseCurrentProviderReturn {
  const { user, profile } = useAuth();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const isProvider = profile?.role === 'provider';
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!user || !profile) {
      setProvider(null);
      setLoading(false);
      return;
    }

    if (profile.role !== 'provider') {
      setProvider(null);
      setLoading(false);
      return;
    }

    const fetchProvider = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('providers')
          .select('id, user_id, specialty, is_active')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('[useCurrentProvider] Erro ao buscar provider:', error);
          setProvider(null);
        } else {
          setProvider(data);
        }
      } catch (err) {
        console.error('[useCurrentProvider] Erro:', err);
        setProvider(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [user, profile]);

  return {
    provider,
    providerId: provider?.id || null,
    loading,
    isProvider,
    isAdmin,
  };
}

export default useCurrentProvider;
