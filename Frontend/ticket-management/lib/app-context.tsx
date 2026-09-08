'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type WorkspaceView = 'tickets' | 'users' | 'roles';
export type Theme = 'light' | 'dark';

interface AppContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('tickets');

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('ticket_theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('ticket_theme', theme);
  }, [theme]);

  return (
    <AppContext.Provider value={{ theme, setTheme, workspaceView, setWorkspaceView }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return context;
}
