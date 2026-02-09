import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SmartNavState {
  from?: string;
  scrollY?: number;
  restoreScrollY?: number;
}

/**
 * Hook de navegação inteligente com restauração de scroll.
 *
 * - navigateTo(path): salva rota atual + scrollY automaticamente
 * - goBack(fallback): volta para a rota de origem restaurando o scroll
 * - Auto-restaura scroll ao montar se veio de um goBack()
 */
export function useSmartNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navegar para outra página, salvando posição atual
  const navigateTo = useCallback((path: string) => {
    navigate(path, {
      state: {
        from: location.pathname,
        scrollY: window.scrollY,
      },
    });
  }, [navigate, location.pathname]);

  // Voltar para a página de origem, passando o scrollY salvo
  const goBack = useCallback((fallback: string) => {
    const state = location.state as SmartNavState | null;
    if (state?.from) {
      navigate(state.from, {
        state: { restoreScrollY: state.scrollY ?? 0 },
      });
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [navigate, location.state]);

  // Restaurar scroll ao montar se veio de goBack()
  // Tenta múltiplas vezes para cobrir carregamento assíncrono de dados
  useEffect(() => {
    const state = location.state as SmartNavState | null;
    if (state?.restoreScrollY != null && state.restoreScrollY > 0) {
      const y = state.restoreScrollY;
      const scroll = () => window.scrollTo(0, y);
      // Imediato (layout já pronto)
      requestAnimationFrame(scroll);
      // Após dados carregarem da API
      const t1 = setTimeout(scroll, 150);
      const t2 = setTimeout(scroll, 400);
      const t3 = setTimeout(scroll, 800);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [location.key]); // location.key muda a cada navegação

  return { navigateTo, goBack };
}
