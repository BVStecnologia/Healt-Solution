import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language, syncToDatabase?: boolean) => void;
  syncFromDatabase: (userId: string) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traduções
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Login
    'login.welcome': 'Bem-vindo ao Portal do Paciente',
    'login.subtitle': 'Gerencie suas consultas, acompanhe seu tratamento e tenha acesso a todas as informações de saúde em um único lugar.',
    'login.email': 'Seu email',
    'login.password': 'Sua senha',
    'login.forgot': 'Esqueceu a senha?',
    'login.submit': 'Entrar',
    'login.or': 'ou continue com',
    'login.noAccount': 'Não tem uma conta?',
    'login.register': 'Cadastre-se',
    'login.error': 'Email ou senha incorretos',
    'login.errorGoogle': 'Erro ao fazer login com Google',

    // Register
    'register.title': 'Crie sua conta',
    'register.subtitle': 'Preencha seus dados para começar a usar o portal do paciente.',
    'register.firstName': 'Nome',
    'register.lastName': 'Sobrenome',
    'register.email': 'Email',
    'register.password': 'Senha',
    'register.confirmPassword': 'Confirmar senha',
    'register.submit': 'Criar conta',
    'register.hasAccount': 'Já tem uma conta?',
    'register.login': 'Entrar',
    'register.error': 'Erro ao criar conta. Tente novamente.',
    'register.passwordMismatch': 'As senhas não coincidem',
    'register.passwordTooShort': 'A senha deve ter pelo menos 6 caracteres',
    'register.success': 'Conta criada! Verifique seu email para confirmar.',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Bem-vindo',

    // Appointments
    'appointments.title': 'Agendamentos',
    'appointments.new': 'Novo Agendamento',
    'appointments.scheduled': 'Agendado',
    'appointments.confirmed': 'Confirmado',
    'appointments.cancelled': 'Cancelado',
    'appointments.completed': 'Concluído',

    // Common
    'common.loading': 'Carregando...',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',

    // Language
    'language.pt': 'Português',
    'language.en': 'English',
    'language.preference': 'Idioma preferido',
  },
  en: {
    // Login
    'login.welcome': 'Welcome to the Patient Portal',
    'login.subtitle': 'Manage your appointments, track your treatment, and access all your health information in one place.',
    'login.email': 'Your email',
    'login.password': 'Your password',
    'login.forgot': 'Forgot password?',
    'login.submit': 'Sign In',
    'login.or': 'or continue with',
    'login.noAccount': "Don't have an account?",
    'login.register': 'Sign Up',
    'login.error': 'Invalid email or password',
    'login.errorGoogle': 'Error signing in with Google',

    // Register
    'register.title': 'Create your account',
    'register.subtitle': 'Fill in your details to start using the patient portal.',
    'register.firstName': 'First name',
    'register.lastName': 'Last name',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm password',
    'register.submit': 'Create account',
    'register.hasAccount': 'Already have an account?',
    'register.login': 'Sign In',
    'register.error': 'Error creating account. Please try again.',
    'register.passwordMismatch': 'Passwords do not match',
    'register.passwordTooShort': 'Password must be at least 6 characters',
    'register.success': 'Account created! Check your email to confirm.',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',

    // Appointments
    'appointments.title': 'Appointments',
    'appointments.new': 'New Appointment',
    'appointments.scheduled': 'Scheduled',
    'appointments.confirmed': 'Confirmed',
    'appointments.cancelled': 'Cancelled',
    'appointments.completed': 'Completed',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',

    // Language
    'language.pt': 'Português',
    'language.en': 'English',
    'language.preference': 'Preferred language',
  },
};

const STORAGE_KEY = 'essence-language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt' || stored === 'en') {
      return stored;
    }
    // Detectar idioma do navegador
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('pt') ? 'pt' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Define o idioma da interface
   * @param lang - Idioma ('pt' ou 'en')
   * @param syncToDatabase - Se true, salva no banco de dados (default: false)
   */
  const setLanguage = useCallback(async (lang: Language, syncToDatabase: boolean = false) => {
    setLanguageState(lang);

    // Sincronizar com banco de dados se solicitado
    if (syncToDatabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ preferred_language: lang })
            .eq('id', user.id);

          if (error) {
            console.error('[Language] Erro ao salvar idioma no banco:', error);
          } else {
            console.log(`[Language] Idioma ${lang} salvo no banco`);
          }
        }
      } catch (error) {
        console.error('[Language] Erro ao sincronizar idioma:', error);
      }
    }
  }, []);

  /**
   * Sincroniza o idioma da interface com o banco de dados
   * Chamado após o login para aplicar a preferência do usuário
   */
  const syncFromDatabase = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('[Language] Perfil não encontrado, mantendo idioma atual');
        return;
      }

      if (data?.preferred_language && (data.preferred_language === 'pt' || data.preferred_language === 'en')) {
        console.log(`[Language] Sincronizando idioma do banco: ${data.preferred_language}`);
        setLanguageState(data.preferred_language);
      }
    } catch (error) {
      console.error('[Language] Erro ao sincronizar do banco:', error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, syncFromDatabase, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
