import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Provider } from '../types/database';

interface UseProvidersReturn {
  providers: Provider[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getProviderById: (id: string) => Provider | undefined;
}

export const useProviders = (): UseProvidersReturn => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('providers')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setProviders(data || []);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const getProviderById = useCallback((id: string): Provider | undefined => {
    return providers.find(p => p.id === id);
  }, [providers]);

  return {
    providers,
    loading,
    error,
    refetch: fetchProviders,
    getProviderById,
  };
};

export default useProviders;
