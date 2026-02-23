import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { StorageAdapter, HttpClient } from '../types/adapters';
import { defaultAdapters } from '../types/adapters';
import { logger } from '../utils/logger';

interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  options?: {
    localStorage?: StorageAdapter | null;
    sessionStorage?: StorageAdapter | null;
    httpClient?: HttpClient;
    apiBaseUrl?: string;
    logger?: typeof logger;
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, options }) => {
  // Memoize adapters to prevent recreation on every render
  const local = useMemo(() => options?.localStorage ?? defaultAdapters.createLocalStorageAdapter(), [options?.localStorage]);
  const session = useMemo(() => options?.sessionStorage ?? defaultAdapters.createSessionStorageAdapter(), [options?.sessionStorage]);
  const httpClient = useMemo(() => options?.httpClient ?? defaultAdapters.createHttpClient(), [options?.httpClient]);
  const apiBaseUrl = options?.apiBaseUrl ?? 'http://localhost:8000/api';
  const injectedLogger = useMemo(() => options?.logger ?? logger, [options?.logger]);

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const hasLoadedFromStorage = useRef(false);
  
  // Store stable references in refs to avoid dependency issues
  const localRef = useRef(local);
  const sessionRef = useRef(session);
  const loggerRef = useRef(injectedLogger);
  
  // Update refs when values change
  localRef.current = local;
  sessionRef.current = session;
  loggerRef.current = injectedLogger;

  useEffect(() => {
    // Only load from storage once on mount - ref prevents re-execution
    if (hasLoadedFromStorage.current) {
      return;
    }

    const currentLocal = localRef.current;
    const currentSession = sessionRef.current;
    const currentLogger = loggerRef.current;

    if (!currentLocal || !currentSession) {
      return;
    }

    hasLoadedFromStorage.current = true;

    const rememberMe = currentLocal.getItem('auth_remember_me') === 'true';
    const storage = rememberMe ? currentLocal : currentSession;
    
    const savedToken = storage.getItem('auth_token');
    const savedUser = storage.getItem('auth_user');
    
    if (savedToken && savedUser) {
      // Use functional updates to avoid dependency on token/user state
      setToken(() => savedToken);
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(() => parsedUser);
      } catch (error) {
        // Handle invalid JSON gracefully - clear corrupted data
        currentLogger.warn('Failed to parse saved user data, clearing auth state:', error);
        storage.removeItem('auth_token');
        storage.removeItem('auth_user');
        setToken(() => null);
        setUser(() => null);
      }
    }
    // Empty dependency array - effect only runs once on mount, refs provide latest values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Listen for unauthorized events from API interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      // Clear auth state when 401 is received
      setToken(null);
      setUser(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorized);
      };
    }
  }, []);

  const login = useCallback(async (username: string, password: string, rememberMe: boolean = false) => {
    if (!local || !session) {
      throw new Error('Storage adapters not available');
    }

    const response = await httpClient.post(
      `${apiBaseUrl}/auth/login`,
      { username, password, remember_me: rememberMe },
      { 'Content-Type': 'application/json' }
    );

    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const error = await response.json();
        errorMessage = error.detail || error.message || errorMessage;
        injectedLogger.error('Login error:', error);
      } catch (e) {
        injectedLogger.error('Failed to parse error response:', e);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    setToken(data.access_token);
    setUser(data.user);
    
    // Store auth data
    if (rememberMe) {
      // Use localStorage for persistent sessions
      local.setItem('auth_token', data.access_token);
      local.setItem('auth_user', JSON.stringify(data.user));
      local.setItem('auth_remember_me', 'true');
    } else {
      // Use sessionStorage for session-only storage
      session.setItem('auth_token', data.access_token);
      session.setItem('auth_user', JSON.stringify(data.user));
      // Clear localStorage if it exists
      local.removeItem('auth_token');
      local.removeItem('auth_user');
      local.removeItem('auth_remember_me');
    }
  }, [local, session, httpClient, apiBaseUrl, injectedLogger]);

  const register = useCallback(async (username: string, email: string, password: string, fullName?: string) => {
    const response = await httpClient.post(
      `${apiBaseUrl}/auth/register`,
      { username, email, password, full_name: fullName },
      { 'Content-Type': 'application/json' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    // Auto-login after registration
    await login(username, password);
  }, [httpClient, apiBaseUrl, login]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    // Clear both localStorage and sessionStorage
    if (local) {
      local.removeItem('auth_token');
      local.removeItem('auth_user');
      local.removeItem('auth_remember_me');
    }
    if (session) {
      session.removeItem('auth_token');
      session.removeItem('auth_user');
    }
  }, [local, session]);

  const value = useMemo(() => ({
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token
  }), [user, token, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

