import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
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

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
