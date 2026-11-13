import React, { createContext, useContext, useState, useCallback } from 'react';

const UiActionsContext = createContext(null);

/**
 * Contexto ligero para que el Dock (montado una sola vez en App)
 * pueda disparar acciones que vive dentro de cada página
 * (abrir configuración, rutina, etc.) sin duplicar lógica.
 */
export const UiActionsProvider = ({ children }) => {
  const [handlers, setHandlers] = useState({
    openSettings: null,
    openRoutine: null,
    voiceAutoPlay: null,
    toggleVoice: null,
  });

  const register = useCallback((partial) => {
    setHandlers(prev => ({ ...prev, ...partial }));
  }, []);

  const clear = useCallback((keys) => {
    setHandlers(prev => {
      const next = { ...prev };
      keys.forEach(k => { next[k] = null; });
      return next;
    });
  }, []);

  const value = {
    ...handlers,
    register,
    clear,
    openSettings: handlers.openSettings,
  };

  return <UiActionsContext.Provider value={value}>{children}</UiActionsContext.Provider>;
};

export const useUiActions = () => {
  const ctx = useContext(UiActionsContext);
  if (!ctx) throw new Error('useUiActions debe usarse dentro de UiActionsProvider');
  return ctx;
};
