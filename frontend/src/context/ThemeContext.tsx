import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode, syncToDatabase?: boolean) => void;
  syncFromDatabase: (userId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'essence-theme';

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const manuallyChanged = useRef(false);

  // Forçar tema claro (dark mode desabilitado temporariamente)
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
    applyTheme(themeMode);
  }, [themeMode]);

  const setThemeMode = useCallback(async (mode: ThemeMode, syncToDatabase: boolean = false) => {
    setThemeModeState(mode);
    manuallyChanged.current = true;

    if (syncToDatabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ preferred_theme: mode })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('[Theme] Erro ao salvar tema no banco:', error);
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode, true);
  }, [themeMode, setThemeMode]);

  const syncFromDatabase = useCallback(async (userId: string) => {
    if (manuallyChanged.current) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_theme')
        .eq('id', userId)
        .single();

      if (error) return;

      if (data?.preferred_theme && (data.preferred_theme === 'light' || data.preferred_theme === 'dark')) {
        setThemeModeState(data.preferred_theme);
      }
    } catch (error) {
      console.error('[Theme] Erro ao sincronizar do banco:', error);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, setThemeMode, syncFromDatabase }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
