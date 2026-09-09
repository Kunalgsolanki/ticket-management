'use client';

import React, { createContext, startTransition, useCallback, useContext, useEffect, useState } from 'react';
import { User } from './types';

export type WorkspaceView = 'tickets' | 'users' | 'roles';
export type Theme = 'light' | 'dark';

interface AppContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  workspaceView: WorkspaceView;
  setWorkspaceView: (view: WorkspaceView) => void;
  currentUser: User | null;
  token: string | null;
  isHydrated: boolean;
  setSession: (user: User, token: string) => void;
  updateCurrentUser: (user: User) => void;
  clearSession: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('tickets');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const setSession = useCallback((user: User, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    window.localStorage.setItem('ticket_user', JSON.stringify(user));
    window.localStorage.setItem('ticket_token', userToken);
  }, []);

  const updateCurrentUser = useCallback((user: User) => {
    setCurrentUser(user);
    window.localStorage.setItem('ticket_user', JSON.stringify(user));
  }, []);

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    setToken(null);
    window.localStorage.removeItem('ticket_user');
    window.localStorage.removeItem('ticket_token');
  }, []);

  useEffect(() => {
    startTransition(() => {
      const storedTheme = window.localStorage.getItem('ticket_theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      }

      try {
        const savedUser = window.localStorage.getItem('ticket_user');
        const savedToken = window.localStorage.getItem('ticket_token');
        if (savedUser && savedToken) {
          setCurrentUser(JSON.parse(savedUser) as User);
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Failed to load user session', error);
        window.localStorage.removeItem('ticket_user');
        window.localStorage.removeItem('ticket_token');
      }

      setIsHydrated(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('ticket_theme', theme);
  }, [theme]);

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        workspaceView,
        setWorkspaceView,
        currentUser,
        token,
        isHydrated,
        setSession,
        updateCurrentUser,
        clearSession,
      }}
    >
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
