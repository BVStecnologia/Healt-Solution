import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, callRPC } from '../lib/supabaseClient';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, preferredLanguage?: 'pt' | 'en') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Detectar idioma preferido do navegador
  const detectBrowserLanguage = (): 'pt' | 'en' => {
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('pt') ? 'pt' : 'en';
  };

  // Criar perfil para usuário que fez login via Google (primeira vez)
  const createProfileForOAuthUser = useCallback(async (user: User): Promise<Profile | null> => {
    try {
      const metadata = user.user_metadata || {};
      const email = user.email || '';

      // Extrair nome do Google ou usar email como fallback
      const fullName = metadata.full_name || metadata.name || email.split('@')[0];
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'Usuário';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Detectar idioma do navegador
      const preferredLanguage = detectBrowserLanguage();

      const newProfile = {
        id: user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'patient' as const,
        patient_type: 'new' as const,
        avatar_url: metadata.avatar_url || metadata.picture || null,
        preferred_language: preferredLanguage,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile for OAuth user:', error);
        return null;
      }

      console.log(`[Auth] Perfil criado para usuário Google com idioma: ${preferredLanguage}`);
      return data as Profile;
    } catch (error) {
      console.error('Error creating profile for OAuth user:', error);
      return null;
    }
  }, []);

  // Buscar perfil do usuário (ou criar se não existir para OAuth)
  const fetchProfile = useCallback(async (userId: string, user?: User): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Se não encontrou o perfil e temos dados do usuário (provavelmente OAuth)
        if (error.code === 'PGRST116' && user) {
          console.log('[Auth] Perfil não encontrado, criando para usuário OAuth...');
          const newProfile = await createProfileForOAuthUser(user);
          if (newProfile) {
            setProfile(newProfile);
            return true;
          }
        }
        console.error('Error fetching profile:', error);
        setProfile(null);
        return false;
      }

      // Atualizar avatar_url do Google OAuth se disponível e diferente
      if (user?.user_metadata?.avatar_url && data.avatar_url !== user.user_metadata.avatar_url) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: user.user_metadata.avatar_url })
          .eq('id', userId);

        if (!updateError) {
          data.avatar_url = user.user_metadata.avatar_url;
        }
      }

      setProfile(data);
      return true;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return false;
    }
  }, [createProfileForOAuthUser]);

  // Refresh do perfil
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  // Inicializar autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id, session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch profile mas não bloqueia o loading
          fetchProfile(session.user.id, session.user).finally(() => {
            setLoading(false);
          });
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign In with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign Up
  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    preferredLanguage: 'pt' | 'en' = 'pt'
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            preferred_language: preferredLanguage,
          },
        },
      });

      if (error) return { error };

      // Criar perfil após signup
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'patient',
            patient_type: 'new',
            preferred_language: preferredLanguage,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
