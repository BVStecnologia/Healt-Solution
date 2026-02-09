import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { supabase } from '../lib/supabaseClient';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language, syncToDatabase?: boolean) => void;
  syncFromDatabase: (userId: string) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'essence-language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: i18nT } = useTranslation();
  const manuallyChanged = useRef(false);

  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt' || stored === 'en') {
      return stored;
    }
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('pt') ? 'pt' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    // Sincronizar i18next com o idioma do context
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  const setLanguage = useCallback(async (lang: Language, syncToDatabase: boolean = false) => {
    setLanguageState(lang);
    manuallyChanged.current = true;
    i18n.changeLanguage(lang);

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
          }
        }
      } catch (error) {
        console.error('[Language] Erro ao sincronizar idioma:', error);
      }
    }
  }, []);

  const syncFromDatabase = useCallback(async (userId: string) => {
    if (manuallyChanged.current) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .single();

      if (error) {
        return;
      }

      if (data?.preferred_language && (data.preferred_language === 'pt' || data.preferred_language === 'en')) {
        setLanguageState(data.preferred_language);
        i18n.changeLanguage(data.preferred_language);
      }
    } catch (error) {
      console.error('[Language] Erro ao sincronizar do banco:', error);
    }
  }, []);

  // Delega para i18next — se a key não existir, i18next retorna a própria key
  const t = useCallback((key: string): string => {
    return i18nT(key);
  }, [i18nT]);

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
