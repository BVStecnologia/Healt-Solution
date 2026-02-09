import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
 * Se role=admin na rota /doctor, também busca (admin que é médico).
 * Se role=admin em outras rotas, retorna null.
 */
export function useCurrentProvider(): UseCurrentProviderReturn {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const isProvider = profile?.role === 'provider';
  const isAdmin = profile?.role === 'admin';
  const isDoctorRoute = location.pathname.startsWith('/doctor');

  useEffect(() => {
    if (!user || !profile) {
      setProvider(null);
      setLoading(false);
      return;
    }

    // Buscar provider se: é provider OU é admin na visão médico
    if (profile.role !== 'provider' && !isDoctorRoute) {
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
  }, [user, profile, isDoctorRoute]);

  return {
    provider,
    providerId: provider?.id || null,
    loading,
    isProvider: isProvider || (isAdmin && isDoctorRoute && !!provider),
    isAdmin,
  };
}

export default useCurrentProvider;
