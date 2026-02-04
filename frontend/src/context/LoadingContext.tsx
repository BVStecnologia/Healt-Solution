import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  forceHideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Contador de referências (padrão Liftlio)
  // Evita que múltiplas chamadas de hideLoading escondam prematuramente
  const loadingCountRef = useRef(0);

  const showLoading = useCallback((message = 'Carregando...') => {
    loadingCountRef.current += 1;
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);

    if (loadingCountRef.current === 0) {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const forceHideLoading = useCallback(() => {
    loadingCountRef.current = 0;
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const value: LoadingContextType = {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    forceHideLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;
