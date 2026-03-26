import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { defaultAdapters } from '../types/adapters';
import { logger } from '../utils/logger';
import { API_CONFIG, STORAGE_KEYS } from '../config/constants';
import { extractApiErrorMessage } from '../hooks/utils/apiUtils';
const AuthContext = /*#__PURE__*/ createContext(undefined);
export const AuthProvider = ({ children, options })=>{
    // Memoize adapters to prevent recreation on every render
    // Use explicit null when passed (for testing "storage not available"), default when undefined
    const local = useMemo(()=>options?.localStorage !== undefined ? options.localStorage : defaultAdapters.createLocalStorageAdapter(), [
        options?.localStorage
    ]);
    const session = useMemo(()=>options?.sessionStorage !== undefined ? options.sessionStorage : defaultAdapters.createSessionStorageAdapter(), [
        options?.sessionStorage
    ]);
    const httpClient = useMemo(()=>options?.httpClient ?? defaultAdapters.createHttpClient(), [
        options?.httpClient
    ]);
    const apiBaseUrl = options?.apiBaseUrl ?? API_CONFIG.BASE_URL;
    const injectedLogger = useMemo(()=>options?.logger ?? logger, [
        options?.logger
    ]);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const hasLoadedFromStorage = useRef(false);
    // Store stable references in refs to avoid dependency issues
    const localRef = useRef(local);
    const sessionRef = useRef(session);
    const loggerRef = useRef(injectedLogger);
    // Update refs when values change
    localRef.current = local;
    sessionRef.current = session;
    loggerRef.current = injectedLogger;
    useEffect(()=>{
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
        const rememberMe = currentLocal.getItem(STORAGE_KEYS.AUTH_REMEMBER_ME) === 'true';
        const storage = rememberMe ? currentLocal : currentSession;
        const savedToken = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const savedUser = storage.getItem(STORAGE_KEYS.AUTH_USER);
        if (savedToken && savedUser) {
            // Use functional updates to avoid dependency on token/user state
            setToken(()=>savedToken);
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(()=>parsedUser);
            } catch (error) {
                // Handle invalid JSON gracefully - clear corrupted data
                currentLogger.warn('Failed to parse saved user data, clearing auth state:', error);
                storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                storage.removeItem(STORAGE_KEYS.AUTH_USER);
                setToken(()=>null);
                setUser(()=>null);
            }
        }
    // Empty dependency array - effect only runs once on mount, refs provide latest values
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount
    // Listen for unauthorized events from API interceptor
    useEffect(()=>{
        const handleUnauthorized = ()=>{
            // Clear auth state when 401 is received
            setToken(null);
            setUser(null);
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('auth:unauthorized', handleUnauthorized);
            return ()=>{
                window.removeEventListener('auth:unauthorized', handleUnauthorized);
            };
        }
    }, []);
    const login = useCallback(async (username, password, rememberMe = false)=>{
        if (!local || !session) {
            throw new Error('Storage adapters not available');
        }
        const response = await httpClient.post(`${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
            username,
            password,
            remember_me: rememberMe
        }, {
            'Content-Type': 'application/json'
        });
        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const error = await response.json();
                errorMessage = extractApiErrorMessage(error, errorMessage);
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
            local.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
            local.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
            local.setItem(STORAGE_KEYS.AUTH_REMEMBER_ME, 'true');
        } else {
            // Use sessionStorage for session-only storage
            session.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
            session.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
            // Clear localStorage if it exists
            local.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            local.removeItem(STORAGE_KEYS.AUTH_USER);
            local.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
        }
    }, [
        local,
        session,
        httpClient,
        apiBaseUrl,
        injectedLogger
    ]);
    const register = useCallback(async (username, email, password, fullName)=>{
        const response = await httpClient.post(`${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
            username,
            email,
            password,
            full_name: fullName
        }, {
            'Content-Type': 'application/json'
        });
        if (!response.ok) {
            let errorMessage = 'Registration failed';
            try {
                const error = await response.json();
                errorMessage = extractApiErrorMessage(error, errorMessage);
            } catch  {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        // Auto-login after registration
        await login(username, password);
    }, [
        httpClient,
        apiBaseUrl,
        login
    ]);
    const logout = useCallback(()=>{
        setToken(null);
        setUser(null);
        // Clear both localStorage and sessionStorage
        if (local) {
            local.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            local.removeItem(STORAGE_KEYS.AUTH_USER);
            local.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
        }
        if (session) {
            session.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            session.removeItem(STORAGE_KEYS.AUTH_USER);
        }
    }, [
        local,
        session
    ]);
    const value = useMemo(()=>({
            user,
            token,
            login,
            register,
            logout,
            isAuthenticated: !!token
        }), [
        user,
        token,
        login,
        register,
        logout
    ]);
    return /*#__PURE__*/ _jsx(AuthContext.Provider, {
        value: value,
        children: children
    });
};
export const useAuth = ()=>{
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
