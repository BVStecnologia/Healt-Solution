import { useState, useEffect, useCallback } from 'react';
import { callRPC } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { EligibilityResult, AppointmentType } from '../types/database';

interface UseEligibilityReturn {
  eligibility: EligibilityResult | null;
  loading: boolean;
  error: Error | null;
  checkEligibility: (type: AppointmentType) => Promise<EligibilityResult>;
  isEligibleFor: (type: AppointmentType) => boolean;
}

// Cache local para evitar chamadas repetidas
const eligibilityCache: Map<string, { data: EligibilityResult; timestamp: number }> = new Map();
const CACHE_TTL = 60000; // 1 minuto

export const useEligibility = (): UseEligibilityReturn => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkEligibility = useCallback(async (type: AppointmentType): Promise<EligibilityResult> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const cacheKey = `${user.id}-${type}`;

    // Verificar cache
    const cached = eligibilityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setEligibility(cached.data);
      return cached.data;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await callRPC<EligibilityResult>('check_patient_eligibility', {
        p_patient_id: user.id,
        p_appointment_type: type,
      });

      // Atualizar cache
      eligibilityCache.set(cacheKey, { data, timestamp: Date.now() });

      setEligibility(data);
      return data;
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isEligibleFor = useCallback((type: AppointmentType): boolean => {
    if (!user) return false;

    const cacheKey = `${user.id}-${type}`;
    const cached = eligibilityCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data.eligible;
    }

    return true; // Default: assume elegível se não tiver cache
  }, [user]);

  return {
    eligibility,
    loading,
    error,
    checkEligibility,
    isEligibleFor,
  };
};

export default useEligibility;
