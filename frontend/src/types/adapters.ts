/**
 * Adapter interfaces for dependency injection
 * These interfaces abstract browser APIs and external dependencies to improve testability
 */

/**
 * Storage adapter for localStorage/sessionStorage abstraction
 */
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

/**
 * HTTP client adapter for fetch/axios abstraction
 */
export interface HttpClient {
  get(url: string, headers?: HeadersInit): Promise<Response>
  post(url: string, body: any, headers?: HeadersInit): Promise<Response>
  put(url: string, body: any, headers?: HeadersInit): Promise<Response>
  delete(url: string, headers?: HeadersInit): Promise<Response>
}

/**
 * Document adapter for DOM manipulation abstraction
 */
export interface DocumentAdapter {
  createElement(tag: string): HTMLElement
  getElementById(id: string): HTMLElement | null
  getActiveElement(): Element | null
  head: HTMLElement
  body: HTMLElement
}

/**
 * Timer adapter for setTimeout/setInterval abstraction
 */
export interface TimerAdapter {
  setTimeout(callback: () => void, delay: number): number
  clearTimeout(id: number): void
  setInterval(callback: () => void, delay: number): number
  clearInterval(id: number): void
}

/**
 * WebSocket factory for WebSocket creation abstraction
 */
export interface WebSocketFactory {
  create(url: string): WebSocket
}

/**
 * Window location adapter
 */
export interface WindowLocation {
  protocol: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
}

/**
 * Console adapter for logging abstraction
 */
export interface ConsoleAdapter {
  log(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  debug?(...args: any[]): void
}

/**
 * Environment adapter for environment variable abstraction
 */
export interface EnvironmentAdapter {
  isDevelopment(): boolean
  isProduction(): boolean
  get(key: string): string | undefined
}

/**
 * Default implementations that use browser APIs
 */
export const defaultAdapters = {
  /**
   * Create default storage adapter (handles SSR)
   */
  createStorageAdapter(storage: Storage | null): StorageAdapter | null {
    if (!storage) {
      return null
    }
    return {
      getItem: (key: string) => storage.getItem(key),
      setItem: (key: string, value: string) => storage.setItem(key, value),
      removeItem: (key: string) => storage.removeItem(key),
      addEventListener: (type: string, listener: EventListener) =>
        window.addEventListener(type, listener),
      removeEventListener: (type: string, listener: EventListener) =>
        window.removeEventListener(type, listener),
    }
  },

  /**
   * Create default localStorage adapter
   */
  createLocalStorageAdapter(): StorageAdapter | null {
    if (typeof window === 'undefined') {
      return null
    }
    return this.createStorageAdapter(window.localStorage)
  },

  /**
   * Create default sessionStorage adapter
   */
  createSessionStorageAdapter(): StorageAdapter | null {
    if (typeof window === 'undefined') {
      return null
    }
    return this.createStorageAdapter(window.sessionStorage)
  },

  /**
   * Create default HTTP client using fetch
   * Made mutation-resistant: always returns a valid client even if fetch is mutated
   */
  createHttpClient(): HttpClient {
    // Use a try-catch to ensure we always return a valid client
    // This prevents crashes when mutations affect fetch or other dependencies
    try {
      const fetchFn = typeof fetch !== 'undefined' ? fetch : global.fetch || (() => Promise.resolve(new Response()))
      
      return {
        get: (url: string, headers?: HeadersInit) => {
          try {
            return fetchFn(url, { method: 'GET', headers })
          } catch (error) {
            // Return a rejected promise instead of throwing synchronously
            return Promise.reject(error)
          }
        },
        post: (url: string, body: any, headers?: HeadersInit) => {
          try {
            return fetchFn(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...headers },
              body: JSON.stringify(body),
            })
          } catch (error) {
            return Promise.reject(error)
          }
        },
        put: (url: string, body: any, headers?: HeadersInit) => {
          try {
            return fetchFn(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...headers },
              body: JSON.stringify(body),
            })
          } catch (error) {
            return Promise.reject(error)
          }
        },
        delete: (url: string, headers?: HeadersInit) => {
          try {
            return fetchFn(url, { method: 'DELETE', headers })
          } catch (error) {
            return Promise.reject(error)
          }
        },
      }
    } catch (error) {
      // Fallback: return a mock client that always rejects
      // This prevents crashes but allows tests to handle errors
      const mockReject = () => Promise.reject(new Error('HTTP client initialization failed'))
      return {
        get: mockReject,
        post: mockReject,
        put: mockReject,
        delete: mockReject,
      }
    }
  },

  /**
   * Create default document adapter
   */
  createDocumentAdapter(): DocumentAdapter | null {
    if (typeof document === 'undefined') {
      return null
    }
    return {
      createElement: (tag: string) => document.createElement(tag),
      getElementById: (id: string) => document.getElementById(id),
      getActiveElement: () => document.activeElement,
      head: document.head,
      body: document.body,
    }
  },

  /**
   * Create default timer adapter
   */
  createTimerAdapter(): TimerAdapter {
    return {
      setTimeout: ((callback: () => void, delay: number) => {
        return setTimeout(callback, delay) as unknown as number
      }) as TimerAdapter['setTimeout'],
      clearTimeout: (id: number) => clearTimeout(id),
      setInterval: ((callback: () => void, delay: number) => {
        return setInterval(callback, delay) as unknown as number
      }) as TimerAdapter['setInterval'],
      clearInterval: (id: number) => clearInterval(id),
    }
  },

  /**
   * Create default WebSocket factory
   */
  createWebSocketFactory(): WebSocketFactory {
    return {
      create: (url: string) => new WebSocket(url),
    }
  },

  /**
   * Create default window location adapter
   */
  createWindowLocation(): WindowLocation | null {
    if (typeof window === 'undefined') {
      return null
    }
    // Handle test environments where location might not be fully available
    try {
      return {
        protocol: window.location?.protocol || 'http:',
        host: window.location?.host || 'localhost:8000',
        hostname: window.location?.hostname || 'localhost',
        port: window.location?.port || '8000',
        pathname: window.location?.pathname || '/',
        search: window.location?.search || '',
        hash: window.location?.hash || '',
      }
    } catch {
      // Fallback for test environments
      return {
        protocol: 'http:',
        host: 'localhost:8000',
        hostname: 'localhost',
        port: '8000',
        pathname: '/',
        search: '',
        hash: '',
      }
    }
  },

  /**
   * Create default console adapter
   */
  createConsoleAdapter(): ConsoleAdapter {
    if (typeof console === 'undefined') {
      return {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      }
    }
    return {
      log: (...args: any[]) => console.log(...args),
      info: (...args: any[]) => console.info(...args),
      warn: (...args: any[]) => console.warn(...args),
      error: (...args: any[]) => console.error(...args),
      debug: (...args: any[]) => {
        if (console.debug) {
          console.debug(...args)
        } else {
          console.log(...args)
        }
      },
    }
  },

  /**
   * Create default environment adapter
   */
  createEnvironmentAdapter(): EnvironmentAdapter {
    return {
      isDevelopment: () =>
        process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV !== 'production',
      isProduction: () => process.env.NODE_ENV === 'production',
      get: (key: string) => process.env[key],
    }
  },
}

