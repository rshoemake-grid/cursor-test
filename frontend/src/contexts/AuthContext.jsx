import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { defaultAdapters } from "../types/adapters";
import { logger } from "../utils/logger";
import { API_CONFIG, STORAGE_KEYS } from "../config/constants";
import { extractApiErrorMessage } from "../hooks/utils/apiUtils";
const AuthContext = createContext(void 0);
const AuthProvider = ({ children, options }) => {
  const local = useMemo(
    () =>
      options?.localStorage !== void 0
        ? options.localStorage
        : defaultAdapters.createLocalStorageAdapter(),
    [options?.localStorage],
  );
  const session = useMemo(
    () =>
      options?.sessionStorage !== void 0
        ? options.sessionStorage
        : defaultAdapters.createSessionStorageAdapter(),
    [options?.sessionStorage],
  );
  const httpClient = useMemo(
    () => options?.httpClient ?? defaultAdapters.createHttpClient(),
    [options?.httpClient],
  );
  const apiBaseUrl = options?.apiBaseUrl ?? API_CONFIG.BASE_URL;
  const injectedLogger = useMemo(
    () => options?.logger ?? logger,
    [options?.logger],
  );
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [authHydrated, setAuthHydrated] = useState(false);
  const hasLoadedFromStorage = useRef(false);
  const localRef = useRef(local);
  const sessionRef = useRef(session);
  const loggerRef = useRef(injectedLogger);
  localRef.current = local;
  sessionRef.current = session;
  loggerRef.current = injectedLogger;
  useEffect(() => {
    if (hasLoadedFromStorage.current) {
      setAuthHydrated(true);
      return;
    }
    const currentLocal = localRef.current;
    const currentSession = sessionRef.current;
    const currentLogger = loggerRef.current;
    if (!currentLocal || !currentSession) {
      hasLoadedFromStorage.current = true;
      setAuthHydrated(true);
      return;
    }
    hasLoadedFromStorage.current = true;
    const rememberMe =
      currentLocal.getItem(STORAGE_KEYS.AUTH_REMEMBER_ME) === "true";
    const storage = rememberMe ? currentLocal : currentSession;
    const savedToken = storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const savedUser = storage.getItem(STORAGE_KEYS.AUTH_USER);
    if (savedToken && savedUser) {
      setToken(() => savedToken);
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(() => parsedUser);
      } catch (error) {
        currentLogger.warn(
          "Failed to parse saved user data, clearing auth state:",
          error,
        );
        storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        storage.removeItem(STORAGE_KEYS.AUTH_USER);
        setToken(() => null);
        setUser(() => null);
      }
    }
    setAuthHydrated(true);
  }, []);
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("auth:unauthorized", handleUnauthorized);
      return () => {
        window.removeEventListener("auth:unauthorized", handleUnauthorized);
      };
    }
  }, []);
  const login = useCallback(
    async (username, password, rememberMe = false) => {
      if (!local || !session) {
        throw new Error("Storage adapters not available");
      }
      const response = await httpClient.post(
        `${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`,
        {
          username,
          password,
          remember_me: rememberMe,
        },
        {
          "Content-Type": "application/json",
        },
      );
      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const error = await response.json();
          errorMessage = extractApiErrorMessage(error, errorMessage);
          injectedLogger.error("Login error:", error);
        } catch (e) {
          injectedLogger.error("Failed to parse error response:", e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      if (rememberMe) {
        local.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
        local.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
        local.setItem(STORAGE_KEYS.AUTH_REMEMBER_ME, "true");
      } else {
        session.setItem(STORAGE_KEYS.AUTH_TOKEN, data.access_token);
        session.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
        local.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        local.removeItem(STORAGE_KEYS.AUTH_USER);
        local.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
      }
    },
    [local, session, httpClient, apiBaseUrl, injectedLogger],
  );
  const register = useCallback(
    async (username, email, password, fullName) => {
      const response = await httpClient.post(
        `${apiBaseUrl}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`,
        {
          username,
          email,
          password,
          full_name: fullName,
        },
        {
          "Content-Type": "application/json",
        },
      );
      if (!response.ok) {
        let errorMessage = "Registration failed";
        try {
          const error = await response.json();
          errorMessage = extractApiErrorMessage(error, errorMessage);
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      await login(username, password);
    },
    [httpClient, apiBaseUrl, login],
  );
  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:logged-out"));
    }
    setToken(null);
    setUser(null);
    if (local) {
      local.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      local.removeItem(STORAGE_KEYS.AUTH_USER);
      local.removeItem(STORAGE_KEYS.AUTH_REMEMBER_ME);
    }
    if (session) {
      session.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      session.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  }, [local, session]);
  const value = useMemo(
    () => ({
      user,
      token,
      login,
      register,
      logout,
      isAuthenticated: !!token,
      authHydrated,
    }),
    [user, token, login, register, logout, authHydrated],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export { AuthProvider, useAuth };
