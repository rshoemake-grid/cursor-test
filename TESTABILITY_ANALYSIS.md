# Testability Analysis: useWebSocket, useLocalStorage, InputNodeEditor

## Executive Summary

**Current State**: The three files use **direct dependencies** (no dependency injection), making them harder to test and creating mutation testing challenges. Tests rely on global mocks which are fragile and don't provide good isolation.

**Recommendation**: Implement dependency injection for external dependencies to improve testability, reduce NoCoverage mutants, and make tests more maintainable.

---

## 1. useWebSocket.ts Analysis

### Current Testability Issues

#### ❌ **Direct WebSocket Instantiation**
```typescript
// Line 79: Hard-coded WebSocket constructor
const ws = new WebSocket(wsUrl)
```
**Problem**: Cannot inject a mock WebSocket for testing. Tests must replace `global.WebSocket`, which is fragile.

**Impact**: 
- Mutation testing struggles with WebSocket-related code paths
- Tests can't easily verify WebSocket creation with different parameters
- Hard to test error scenarios during WebSocket construction

#### ❌ **Direct window.location Access**
```typescript
// Lines 72-73: Direct window access
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const host = window.location.host
```
**Problem**: Cannot mock `window.location` in jsdom environment. Tests can't verify protocol/host logic.

**Impact**:
- NoCoverage mutants for protocol/host logic
- Cannot test HTTPS vs HTTP scenarios
- Hard to test different host configurations

#### ⚠️ **Logger Import (Partially Addressed)**
```typescript
// Line 2: Direct import
import { logger } from '../utils/logger'
```
**Status**: Already mocked in tests, but not injected. Works but violates Dependency Inversion Principle.

**Impact**: Low - tests work, but not ideal architecture.

### Recommended Improvements

#### ✅ **Inject WebSocket Factory**
```typescript
interface WebSocketFactory {
  create(url: string): WebSocket
}

interface UseWebSocketOptions {
  executionId: string | null
  executionStatus?: 'running' | 'completed' | 'failed' | 'pending' | 'paused'
  onLog?: (log: WebSocketMessage['log']) => void
  onStatus?: (status: string) => void
  onNodeUpdate?: (nodeId: string, nodeState: any) => void
  onCompletion?: (result: any) => void
  onError?: (error: string) => void
  // NEW: Dependency injection
  webSocketFactory?: WebSocketFactory
  windowLocation?: { protocol: string; host: string }
  logger?: typeof logger
}

export function useWebSocket({
  executionId,
  executionStatus,
  onLog,
  onStatus,
  onNodeUpdate,
  onCompletion,
  onError,
  webSocketFactory = { create: (url: string) => new WebSocket(url) }, // Default implementation
  windowLocation = window.location, // Default implementation
  logger: injectedLogger = logger // Default implementation
}: UseWebSocketOptions) {
  // Use injected dependencies
  const protocol = windowLocation.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = windowLocation.host
  const wsUrl = `${protocol}//${host}/ws/executions/${executionId}`
  
  const ws = webSocketFactory.create(wsUrl)
  // ...
}
```

**Benefits**:
- ✅ Can inject mock WebSocket factory in tests
- ✅ Can test protocol/host logic without mocking window.location
- ✅ Better isolation - each test controls its dependencies
- ✅ Reduces NoCoverage mutants

---

## 2. useLocalStorage.ts Analysis

### Current Testability Issues

#### ❌ **Direct window.localStorage Access**
```typescript
// Multiple locations: Lines 19, 43, 57, 80, 97, 145, 162
const item = window.localStorage.getItem(key)
window.localStorage.setItem(key, valueToStoreString)
window.localStorage.removeItem(key)
```
**Problem**: Tests use real localStorage, which can leak between tests. No way to inject a mock storage.

**Impact**:
- Tests must manually clear localStorage between tests
- Cannot easily test storage quota errors
- Cannot test storage unavailable scenarios
- Hard to verify exact storage operations

#### ❌ **Direct window.addEventListener**
```typescript
// Lines 80-81: Direct window access
window.addEventListener('storage', handleStorageChange)
window.removeEventListener('storage', handleStorageChange)
```
**Problem**: Cannot mock event system for testing.

**Impact**:
- Hard to test storage event handling
- Cannot test event listener cleanup

#### ❌ **typeof window === 'undefined' Checks**
```typescript
// Lines 14, 39, 66, 92, 137, 157
if (typeof window === 'undefined') {
  return initialValue
}
```
**Problem**: Creates **NoCoverage mutants** - cannot test in browser environment.

**Impact**: 
- 7 NoCoverage mutants in useLocalStorage.ts
- Cannot verify SSR behavior
- Mutation score artificially lowered

### Recommended Improvements

#### ✅ **Inject Storage Interface**
```typescript
interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

interface UseLocalStorageOptions {
  key: string
  initialValue: T
  storage?: StorageAdapter // NEW: Dependency injection
  logger?: typeof logger
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: { storage?: StorageAdapter; logger?: typeof logger }
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const storage = options?.storage ?? getDefaultStorage()
  const injectedLogger = options?.logger ?? logger
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      injectedLogger.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })
  
  // Use storage adapter throughout
  // ...
}

// Helper to get default storage (handles SSR)
function getDefaultStorage(): StorageAdapter | null {
  if (typeof window === 'undefined') {
    return null // Return null adapter for SSR
  }
  return {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
    removeItem: (key: string) => window.localStorage.removeItem(key),
    addEventListener: (type: string, listener: EventListener) => 
      window.addEventListener(type, listener),
    removeEventListener: (type: string, listener: EventListener) => 
      window.removeEventListener(type, listener)
  }
}
```

**Benefits**:
- ✅ Can inject mock storage in tests
- ✅ Can test SSR scenarios (inject null storage)
- ✅ Eliminates NoCoverage mutants
- ✅ Better isolation - no shared state between tests
- ✅ Can test storage errors easily

---

## 3. InputNodeEditor.tsx Analysis

### Current Testability Issues

#### ❌ **Direct document.activeElement Access**
```typescript
// Lines 57-94: Multiple document.activeElement checks
if (document.activeElement !== bucketNameRef.current) {
  setBucketNameValue(inputConfig.bucket_name || '')
}
```
**Problem**: Cannot mock `document.activeElement` for testing. Tests must manipulate real DOM focus state.

**Impact**:
- Hard to test focus state logic
- Tests must render components and manipulate focus
- Cannot easily test all focus scenarios

#### ⚠️ **Hardcoded useState Defaults**
```typescript
// Lines 40-53: Hardcoded default values
const [regionValue, setRegionValue] = useState('us-east-1')
const [modeValue, setModeValue] = useState('read')
const [overwriteValue, setOverwriteValue] = useState(true)
```
**Status**: These are reasonable defaults, but create StringLiteral/BooleanLiteral mutants.

**Impact**: Medium - mutation testing flags these, but they're acceptable defaults.

### Recommended Improvements

#### ✅ **Inject Document Adapter**
```typescript
interface DocumentAdapter {
  getActiveElement(): Element | null
}

interface InputNodeEditorProps {
  node: NodeWithData & { type: 'gcp_bucket' | 'aws_s3' | ... }
  onConfigUpdate: (configField: string, field: string, value: unknown) => void
  documentAdapter?: DocumentAdapter // NEW: Dependency injection
}

export default function InputNodeEditor({
  node,
  onConfigUpdate,
  documentAdapter = { getActiveElement: () => document.activeElement } // Default
}: InputNodeEditorProps) {
  useEffect(() => {
    if (documentAdapter.getActiveElement() !== bucketNameRef.current) {
      setBucketNameValue(inputConfig.bucket_name || '')
    }
    // ...
  }, [inputConfig, documentAdapter])
}
```

**Benefits**:
- ✅ Can inject mock document adapter in tests
- ✅ Can test focus state logic without real DOM manipulation
- ✅ Better test isolation

---

## 4. Comparison: Current vs. Recommended Approach

### Current Approach (Global Mocks)
```typescript
// useWebSocket.test.ts
global.WebSocket = class extends MockWebSocket { ... }

// useLocalStorage.test.ts
localStorage.clear() // Manual cleanup
```

**Problems**:
- ❌ Global state pollution
- ❌ Tests can interfere with each other
- ❌ Hard to test multiple scenarios in same test
- ❌ NoCoverage mutants for untestable code paths
- ❌ Fragile - depends on test execution order

### Recommended Approach (Dependency Injection)
```typescript
// useWebSocket.test.ts
const mockWebSocketFactory = {
  create: jest.fn(() => mockWebSocket)
}
renderHook(() => useWebSocket({
  executionId: 'test-123',
  webSocketFactory: mockWebSocketFactory
}))

// useLocalStorage.test.ts
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}
renderHook(() => useLocalStorage('key', 'value', { storage: mockStorage }))
```

**Benefits**:
- ✅ No global state pollution
- ✅ Tests are isolated
- ✅ Can test multiple scenarios easily
- ✅ Eliminates NoCoverage mutants
- ✅ More maintainable and predictable

---

## 5. Implementation Priority

### High Priority (Biggest Impact)

1. **useLocalStorage.ts - Storage Adapter**
   - **Impact**: Eliminates 7 NoCoverage mutants
   - **Effort**: Medium
   - **Benefit**: High - improves mutation score significantly

2. **useWebSocket.ts - WebSocket Factory**
   - **Impact**: Makes WebSocket testing more reliable
   - **Effort**: Medium
   - **Benefit**: High - improves test reliability

### Medium Priority

3. **useWebSocket.ts - window.location Injection**
   - **Impact**: Eliminates NoCoverage mutants for protocol/host logic
   - **Effort**: Low (part of #2)
   - **Benefit**: Medium

4. **InputNodeEditor.tsx - Document Adapter**
   - **Impact**: Improves focus state testing
   - **Effort**: Low
   - **Benefit**: Medium

### Low Priority

5. **Logger Injection** (all files)
   - **Impact**: Better architecture, but tests already work
   - **Effort**: Low
   - **Benefit**: Low (nice to have)

---

## 6. Migration Strategy

### Phase 1: Add Optional DI (Backward Compatible)
- Add optional dependency parameters with defaults
- Keep existing behavior when not provided
- **No breaking changes**

### Phase 2: Update Tests
- Migrate tests to use injected dependencies
- Remove global mocks
- Verify all tests still pass

### Phase 3: Refactor (Optional)
- Consider making dependencies required (breaking change)
- Or keep optional for convenience

---

## 7. Example: Refactored useLocalStorage.ts

```typescript
// Storage adapter interface
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

// Default storage adapter (handles SSR)
function createDefaultStorage(): StorageAdapter | null {
  if (typeof window === 'undefined') {
    return null
  }
  return {
    getItem: (key: string) => window.localStorage.getItem(key),
    setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
    removeItem: (key: string) => window.localStorage.removeItem(key),
    addEventListener: (type: string, listener: EventListener) => 
      window.addEventListener(type, listener),
    removeEventListener: (type: string, listener: EventListener) => 
      window.removeEventListener(type, listener)
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    storage?: StorageAdapter | null
    logger?: typeof logger
  }
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  const storage = options?.storage ?? createDefaultStorage()
  const injectedLogger = options?.logger ?? logger
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!storage) {
      return initialValue
    }
    
    try {
      const item = storage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      injectedLogger.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        
        if (storage) {
          const valueToStoreString = valueToStore === undefined 
            ? JSON.stringify(null) 
            : JSON.stringify(valueToStore)
          storage.setItem(key, valueToStoreString)
        }
      } catch (error) {
        injectedLogger.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue, storage, injectedLogger]
  )

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (storage) {
        storage.removeItem(key)
      }
    } catch (error) {
      injectedLogger.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue, storage, injectedLogger])

  useEffect(() => {
    if (!storage) {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          injectedLogger.error(`Error parsing storage event for key "${key}":`, error)
        }
      }
    }

    storage.addEventListener('storage', handleStorageChange)
    return () => storage.removeEventListener('storage', handleStorageChange)
  }, [key, storage, injectedLogger])

  return [storedValue, setValue, removeValue]
}
```

**Test Example**:
```typescript
it('should handle SSR (no storage)', () => {
  const mockStorage = null // SSR scenario
  const { result } = renderHook(() => 
    useLocalStorage('test-key', 'initial', { storage: mockStorage })
  )
  expect(result.current[0]).toBe('initial')
})

it('should use injected storage', () => {
  const mockStorage = {
    getItem: jest.fn(() => JSON.stringify('stored')),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
  const { result } = renderHook(() => 
    useLocalStorage('test-key', 'initial', { storage: mockStorage })
  )
  expect(result.current[0]).toBe('stored')
  expect(mockStorage.getItem).toHaveBeenCalledWith('test-key')
})
```

---

## 8. Expected Improvements

### Mutation Score Impact

| File | Current Score | Expected Score | Improvement |
|------|--------------|----------------|-------------|
| useLocalStorage.ts | 69.75% | ~85%+ | +15pp (eliminates 7 NoCoverage) |
| useWebSocket.ts | 58.40% | ~70%+ | +12pp (better test coverage) |
| InputNodeEditor.tsx | 86.64% | ~90%+ | +4pp (better focus testing) |

### Test Quality Impact

- ✅ **Better Isolation**: No shared global state
- ✅ **Easier Testing**: Inject mocks directly
- ✅ **More Reliable**: Tests don't depend on execution order
- ✅ **Better Coverage**: Can test previously untestable scenarios

---

## 9. Conclusion

**Current State**: Files use direct dependencies, making them harder to test and creating mutation testing challenges.

**Recommendation**: Implement dependency injection for external dependencies (WebSocket, localStorage, document) to:
1. Improve testability
2. Eliminate NoCoverage mutants
3. Increase mutation scores
4. Make tests more maintainable

**Next Steps**:
1. Start with `useLocalStorage.ts` (biggest impact - eliminates 7 NoCoverage mutants)
2. Then `useWebSocket.ts` (improves test reliability)
3. Finally `InputNodeEditor.tsx` (nice to have improvement)

All changes should be **backward compatible** (optional parameters with defaults) to avoid breaking existing code.

---

## 10. Additional Frontend Files Analysis

### 10.1 api/client.ts

#### Current Testability Issues

##### ❌ **Direct localStorage/sessionStorage Access**
```typescript
// Lines 15-17: Direct storage access in interceptor
const rememberMe = localStorage.getItem('auth_remember_me') === 'true'
const storage = rememberMe ? localStorage : sessionStorage
const token = storage.getItem('auth_token')
```
**Problem**: Cannot inject storage for testing. Tests must mock global `localStorage`/`sessionStorage`.

**Impact**:
- Hard to test different storage scenarios (rememberMe vs session-only)
- Cannot test storage errors
- Tests must manually mock global storage

##### ❌ **Module-Level Axios Instance**
```typescript
// Lines 7-9: Created at module level
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})
```
**Problem**: Cannot inject axios instance for testing. All tests share the same instance.

**Impact**:
- Hard to test different axios configurations
- Cannot easily mock axios for different scenarios
- Interceptors are global, affecting all tests

##### ⚠️ **Hardcoded API Base URL**
```typescript
// Line 4: Hardcoded base URL
const API_BASE_URL = '/api'
```
**Status**: Reasonable default, but not configurable.

**Impact**: Low - but prevents testing different API endpoints.

##### ⚠️ **Direct console.log Usage**
```typescript
// Lines 98, 105-121: Direct console usage
console.log('[API Client] executeWorkflow called with:', { workflowId, inputs })
console.error('[API Client] executeWorkflow error:', error)
```
**Problem**: Should use logger utility for consistency.

**Impact**: Medium - inconsistent logging, harder to test/mock.

#### Recommended Improvements

##### ✅ **Inject Storage and Axios Instance**
```typescript
interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface ApiClientConfig {
  baseURL?: string
  axiosInstance?: AxiosInstance
  localStorage?: StorageAdapter
  sessionStorage?: StorageAdapter
  logger?: typeof logger
}

function createApiClient(config: ApiClientConfig = {}) {
  const {
    baseURL = '/api',
    axiosInstance: providedInstance,
    localStorage: local = typeof window !== 'undefined' ? window.localStorage : null,
    sessionStorage: session = typeof window !== 'undefined' ? window.sessionStorage : null,
    logger: injectedLogger = logger
  } = config

  const instance = providedInstance ?? axios.create({ baseURL })

  // Add request interceptor with injected storage
  instance.interceptors.request.use(
    (config) => {
      if (!local || !session) return config
      
      const rememberMe = local.getItem('auth_remember_me') === 'true'
      const storage = rememberMe ? local : session
      const token = storage.getItem('auth_token')
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      return config
    },
    (error) => Promise.reject(error)
  )

  return {
    getWorkflows: () => instance.get('/workflows').then(r => r.data),
    // ... other methods
  }
}

// Default export for backward compatibility
export const api = createApiClient()
```

**Benefits**:
- ✅ Can inject mock storage in tests
- ✅ Can inject mock axios instance
- ✅ Better test isolation
- ✅ Can test different storage scenarios easily

---

### 10.2 contexts/AuthContext.tsx

#### Current Testability Issues

##### ❌ **Direct localStorage/sessionStorage Access**
```typescript
// Lines 29-33, 68-78, 102-106: Multiple direct storage accesses
const rememberMe = localStorage.getItem('auth_remember_me') === 'true'
const storage = rememberMe ? localStorage : sessionStorage
localStorage.setItem('auth_token', data.access_token)
sessionStorage.removeItem('auth_token')
```
**Problem**: Same as api/client.ts - cannot inject storage.

**Impact**:
- Hard to test authentication flow
- Cannot test storage errors
- Tests must mock global storage

##### ❌ **Direct fetch() Usage**
```typescript
// Lines 42, 83: Hardcoded fetch calls
const response = await fetch('http://localhost:8000/api/auth/login', { ... })
const response = await fetch('http://localhost:8000/api/auth/register', { ... })
```
**Problem**: Cannot inject HTTP client for testing. Hardcoded URLs.

**Impact**:
- Cannot test different API endpoints
- Hard to mock network requests
- Hardcoded localhost URL (won't work in different environments)

##### ⚠️ **Direct console.error Usage**
```typescript
// Lines 53, 55: Direct console usage
console.error('Login error:', error)
console.error('Failed to parse error response:', e)
```
**Problem**: Should use logger utility.

**Impact**: Low - but inconsistent with rest of codebase.

#### Recommended Improvements

##### ✅ **Inject Storage and HTTP Client**
```typescript
interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface HttpClient {
  post(url: string, body: any, headers?: HeadersInit): Promise<Response>
}

interface AuthContextOptions {
  localStorage?: StorageAdapter
  sessionStorage?: StorageAdapter
  httpClient?: HttpClient
  apiBaseUrl?: string
  logger?: typeof logger
}

export const AuthProvider: React.FC<{
  children: React.ReactNode
  options?: AuthContextOptions
}> = ({ children, options = {} }) => {
  const {
    localStorage: local = typeof window !== 'undefined' ? window.localStorage : null,
    sessionStorage: session = typeof window !== 'undefined' ? window.sessionStorage : null,
    httpClient = { post: (url, body, headers) => fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }) },
    apiBaseUrl = 'http://localhost:8000/api',
    logger: injectedLogger = logger
  } = options

  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    const response = await httpClient.post(
      `${apiBaseUrl}/auth/login`,
      { username, password, remember_me: rememberMe },
      { 'Content-Type': 'application/json' }
    )
    // ... rest of logic using injected storage
  }
  // ...
}
```

**Benefits**:
- ✅ Can inject mock storage and HTTP client
- ✅ Configurable API base URL
- ✅ Better test isolation
- ✅ Can test authentication scenarios easily

---

### 10.3 utils/confirm.tsx

#### Current Testability Issues

##### ❌ **Direct document Manipulation**
```typescript
// Lines 23, 39, 52, 71, 174: Multiple document operations
const overlay = document.createElement('div')
document.head.appendChild(style)
document.body.appendChild(overlay)
```
**Problem**: Cannot inject document for testing. Tests must use real DOM.

**Impact**:
- Hard to test dialog creation/cleanup
- Cannot test without full DOM setup
- Hard to verify DOM operations

##### ❌ **Direct setTimeout Usage**
```typescript
// No explicit setTimeout, but animations use it internally
```
**Problem**: Animations rely on browser timing, hard to test.

**Impact**: Low - animations are visual, but timing-dependent tests are flaky.

#### Recommended Improvements

##### ✅ **Inject Document and Timer**
```typescript
interface DocumentAdapter {
  createElement(tag: string): HTMLElement
  getElementById(id: string): HTMLElement | null
  head: HTMLElement
  body: HTMLElement
}

interface TimerAdapter {
  setTimeout(callback: () => void, delay: number): number
  clearTimeout(id: number): void
}

export function showConfirm(
  message: string,
  options: {
    title?: string
    confirmText?: string
    cancelText?: string
    type?: 'warning' | 'danger' | 'info'
    documentAdapter?: DocumentAdapter
    timerAdapter?: TimerAdapter
  } = {}
): Promise<boolean> {
  const {
    documentAdapter = typeof document !== 'undefined' ? {
      createElement: (tag: string) => document.createElement(tag),
      getElementById: (id: string) => document.getElementById(id),
      head: document.head,
      body: document.body
    } : null,
    timerAdapter = {
      setTimeout: (cb, delay) => setTimeout(cb, delay),
      clearTimeout: (id) => clearTimeout(id)
    },
    // ... other options
  } = options

  if (!documentAdapter) {
    return Promise.resolve(false) // SSR fallback
  }

  const overlay = documentAdapter.createElement('div')
  // ... rest of logic
}
```

**Benefits**:
- ✅ Can inject mock document in tests
- ✅ Can inject mock timer for testing animations
- ✅ Better test isolation
- ✅ Can test SSR scenarios

---

### 10.4 utils/notifications.ts

#### Current Testability Issues

##### ❌ **Direct document Manipulation**
```typescript
// Lines 23, 41, 60: Multiple document operations
const notification = document.createElement('div')
document.head.appendChild(style)
document.body.appendChild(notification)
```
**Problem**: Same as confirm.tsx - cannot inject document.

**Impact**:
- Hard to test notification creation/cleanup
- Cannot test without full DOM setup
- Hard to verify DOM operations

##### ❌ **Direct setTimeout Usage**
```typescript
// Lines 63-67: setTimeout for auto-removal
setTimeout(() => {
  notification.style.transition = 'opacity 0.3s, transform 0.3s'
  // ...
}, duration)
```
**Problem**: Hard to test timing-dependent behavior.

**Impact**: Medium - tests must wait for real timeouts or use fake timers globally.

#### Recommended Improvements

##### ✅ **Inject Document and Timer**
```typescript
interface DocumentAdapter {
  createElement(tag: string): HTMLElement
  getElementById(id: string): HTMLElement | null
  head: HTMLElement
  body: HTMLElement
}

interface TimerAdapter {
  setTimeout(callback: () => void, delay: number): number
  clearTimeout(id: number): void
}

export function showNotification(
  message: string,
  options: NotificationOptions & {
    documentAdapter?: DocumentAdapter
    timerAdapter?: TimerAdapter
  } = {}
) {
  const {
    documentAdapter = typeof document !== 'undefined' ? {
      createElement: (tag: string) => document.createElement(tag),
      getElementById: (id: string) => document.getElementById(id),
      head: document.head,
      body: document.body
    } : null,
    timerAdapter = {
      setTimeout: (cb, delay) => setTimeout(cb, delay),
      clearTimeout: (id) => clearTimeout(id)
    },
    // ... other options
  } = options

  if (!documentAdapter) {
    return null // SSR fallback
  }

  const notification = documentAdapter.createElement('div')
  // ... rest of logic using injected adapters
}
```

**Benefits**:
- ✅ Can inject mock document and timer in tests
- ✅ Better test isolation
- ✅ Can test SSR scenarios
- ✅ Can test timing without real delays

---

### 10.5 utils/logger.ts

#### Current Testability Issues

##### ⚠️ **Direct console Usage**
```typescript
// Lines 8, 14, 19, 23, 28: Direct console methods
console.log('[DEBUG]', ...args)
console.info('[INFO]', ...args)
console.warn('[WARN]', ...args)
console.error('[ERROR]', ...args)
```
**Problem**: Cannot inject console for testing. Tests must mock global `console`.

**Impact**:
- Low - logger is already mocked in tests
- But violates Dependency Inversion Principle

##### ⚠️ **Direct process.env Access**
```typescript
// Line 3: Direct process.env access
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'
```
**Problem**: Hard to test different environment scenarios.

**Impact**: Low - but prevents testing dev vs production behavior.

#### Recommended Improvements

##### ✅ **Inject Console and Environment**
```typescript
interface ConsoleAdapter {
  log(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
}

interface EnvironmentAdapter {
  isDevelopment(): boolean
}

function createLogger(options?: {
  console?: ConsoleAdapter
  environment?: EnvironmentAdapter
}) {
  const {
    console: consoleAdapter = typeof console !== 'undefined' ? console : {
      log: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    },
    environment = {
      isDevelopment: () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production'
    }
  } = options ?? {}

  return {
    debug: (...args: any[]) => {
      if (environment.isDevelopment()) {
        consoleAdapter.log('[DEBUG]', ...args)
      }
    },
    // ... other methods
  }
}

// Default export for backward compatibility
export const logger = createLogger()
```

**Benefits**:
- ✅ Can inject mock console in tests
- ✅ Can test different environment scenarios
- ✅ Better test isolation
- ✅ Follows Dependency Inversion Principle

---

### 10.6 hooks/useWorkflowAPI.ts

#### Current Testability Issues

##### ⚠️ **Direct api Import**
```typescript
// Line 2: Direct import
import { api } from '../api/client'
```
**Problem**: Cannot inject API client for testing. Tests must mock the module.

**Impact**:
- Medium - tests can mock the module, but not ideal
- Comment claims "Dependency Inversion Principle" but doesn't use DI

##### ⚠️ **Direct logger Import**
```typescript
// Line 4: Direct import
import { logger } from '../utils/logger'
```
**Problem**: Same as other files - should be injected.

**Impact**: Low - already mocked in tests.

#### Recommended Improvements

##### ✅ **Inject API Client and Logger**
```typescript
interface WorkflowAPIClient {
  getWorkflows(): Promise<WorkflowDefinition[]>
  getWorkflow(id: string): Promise<WorkflowDefinition>
  createWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>
  // ... other methods
}

export function useWorkflowAPI(options?: {
  apiClient?: WorkflowAPIClient
  logger?: typeof logger
}) {
  const {
    apiClient = api, // Default to exported api
    logger: injectedLogger = logger
  } = options ?? {}

  const getWorkflows = useCallback(async (): Promise<WorkflowDefinition[]> => {
    try {
      return await apiClient.getWorkflows()
    } catch (error) {
      injectedLogger.error('Failed to fetch workflows:', error)
      throw error
    }
  }, [apiClient, injectedLogger])
  // ... rest of methods
}
```

**Benefits**:
- ✅ Can inject mock API client in tests
- ✅ Better test isolation
- ✅ Actually follows Dependency Inversion Principle
- ✅ Can test error scenarios easily

---

### 10.7 components/WorkflowChat.tsx

#### Current Testability Issues

##### ❌ **Direct localStorage Access**
```typescript
// Lines 22, 53: Direct localStorage access
const saved = localStorage.getItem(storageKey)
localStorage.setItem(storageKey, JSON.stringify(messages))
```
**Problem**: Same as other files - cannot inject storage.

**Impact**:
- Hard to test conversation history persistence
- Cannot test storage errors
- Tests must mock global localStorage

##### ❌ **Direct fetch() Usage**
```typescript
// Line 87: Hardcoded fetch call
const response = await fetch('http://localhost:8000/api/workflow-chat/chat', { ... })
```
**Problem**: Cannot inject HTTP client. Hardcoded URL.

**Impact**:
- Cannot test different API endpoints
- Hard to mock network requests
- Hardcoded localhost URL

##### ⚠️ **Direct logger Import**
```typescript
// Line 5: Direct import
import { logger } from '../utils/logger'
```
**Problem**: Should be injected.

**Impact**: Low - already mocked.

#### Recommended Improvements

##### ✅ **Inject Storage, HTTP Client, and Logger**
```typescript
interface WorkflowChatProps {
  workflowId: string | null
  onWorkflowUpdate?: (changes: any) => void
  // NEW: Dependency injection
  storage?: StorageAdapter
  httpClient?: HttpClient
  apiBaseUrl?: string
  logger?: typeof logger
}

export default function WorkflowChat({
  workflowId,
  onWorkflowUpdate,
  storage = typeof window !== 'undefined' ? window.localStorage : null,
  httpClient = { post: (url, body, headers) => fetch(url, { method: 'POST', headers, body: JSON.stringify(body) }) },
  apiBaseUrl = 'http://localhost:8000/api',
  logger: injectedLogger = logger
}: WorkflowChatProps) {
  const loadConversationHistory = (workflowId: string | null): ChatMessage[] => {
    if (!storage) return defaultMessages
    
    const storageKey = workflowId ? `chat_history_${workflowId}` : 'chat_history_new_workflow'
    const saved = storage.getItem(storageKey)
    // ... rest of logic
  }
  // ... rest of component
}
```

**Benefits**:
- ✅ Can inject mock storage and HTTP client
- ✅ Configurable API base URL
- ✅ Better test isolation
- ✅ Can test conversation persistence easily

---

### 10.8 store/workflowStore.ts

#### Current Testability Issues

##### ✅ **No Direct Dependencies**
**Status**: This file uses Zustand and has no direct browser API dependencies.

**Impact**: None - this file is already well-structured and testable.

**Recommendation**: No changes needed.

---

## 11. Summary of All Files

### Files Requiring Dependency Injection

| File | Dependencies to Inject | Priority | Impact |
|------|----------------------|----------|--------|
| **useLocalStorage.ts** | StorageAdapter | High | Eliminates 7 NoCoverage mutants |
| **useWebSocket.ts** | WebSocketFactory, windowLocation | High | Improves test reliability |
| **api/client.ts** | StorageAdapter, AxiosInstance | High | Improves API testing |
| **contexts/AuthContext.tsx** | StorageAdapter, HttpClient | High | Improves auth testing |
| **utils/confirm.tsx** | DocumentAdapter, TimerAdapter | Medium | Improves dialog testing |
| **utils/notifications.ts** | DocumentAdapter, TimerAdapter | Medium | Improves notification testing |
| **hooks/useWorkflowAPI.ts** | WorkflowAPIClient, Logger | Medium | Better API testing |
| **components/WorkflowChat.tsx** | StorageAdapter, HttpClient | Medium | Better chat testing |
| **components/InputNodeEditor.tsx** | DocumentAdapter | Low | Better focus testing |
| **utils/logger.ts** | ConsoleAdapter, EnvironmentAdapter | Low | Better logging testing |

### Common Patterns

1. **Storage Access**: `localStorage`/`sessionStorage` used in 5+ files
   - **Solution**: Create shared `StorageAdapter` interface
   - **Impact**: High - eliminates many NoCoverage mutants

2. **HTTP Requests**: `fetch()` used in 2+ files
   - **Solution**: Create shared `HttpClient` interface
   - **Impact**: Medium - improves network testing

3. **Document Manipulation**: `document` used in 2+ files
   - **Solution**: Create shared `DocumentAdapter` interface
   - **Impact**: Medium - improves DOM testing

4. **Logger**: Direct import in 5+ files
   - **Solution**: Inject logger (low priority, but improves architecture)
   - **Impact**: Low - tests already work

---

## 12. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)
1. Create shared adapter interfaces:
   - `StorageAdapter`
   - `HttpClient`
   - `DocumentAdapter`
   - `TimerAdapter`
   - `WebSocketFactory`
2. Refactor `useLocalStorage.ts` (highest impact)
3. Refactor `useWebSocket.ts`

### Phase 2: API Layer (Week 2)
4. Refactor `api/client.ts`
5. Refactor `contexts/AuthContext.tsx`
6. Refactor `hooks/useWorkflowAPI.ts`

### Phase 3: UI Utilities (Week 3)
7. Refactor `utils/confirm.tsx`
8. Refactor `utils/notifications.ts`
9. Refactor `components/InputNodeEditor.tsx`
10. Refactor `components/WorkflowChat.tsx`

### Phase 4: Polish (Week 4)
11. Refactor `utils/logger.ts` (optional)
12. Update all tests to use injected dependencies
13. Remove global mocks
14. Verify mutation scores improved

---

## 13. Expected Overall Impact

### Mutation Score Improvements

| Category | Current | Expected | Improvement |
|----------|---------|----------|-------------|
| **NoCoverage Mutants** | 34 | ~10 | -24 (70% reduction) |
| **Overall Mutation Score** | 79.25% | ~85%+ | +6pp |
| **Test Reliability** | Medium | High | Significant improvement |
| **Test Maintainability** | Low | High | Significant improvement |

### Code Quality Improvements

- ✅ **Better Architecture**: Follows Dependency Inversion Principle
- ✅ **Better Testability**: All external dependencies injectable
- ✅ **Better Isolation**: Tests don't interfere with each other
- ✅ **Better Maintainability**: Easier to modify and extend
- ✅ **Better SSR Support**: Can handle server-side rendering scenarios

---

## 14. Conclusion

**Current State**: Most frontend files use direct dependencies (localStorage, fetch, document, console), making them harder to test and creating mutation testing challenges.

**Recommendation**: Implement dependency injection across all frontend files to:
1. Improve testability (eliminate global mocks)
2. Eliminate NoCoverage mutants (reduce from 34 to ~10)
3. Increase mutation scores (from 79.25% to ~85%+)
4. Make tests more maintainable and reliable
5. Follow SOLID principles (especially Dependency Inversion)

**Priority Order**:
1. **High**: useLocalStorage.ts, useWebSocket.ts, api/client.ts, contexts/AuthContext.tsx
2. **Medium**: utils/confirm.tsx, utils/notifications.ts, hooks/useWorkflowAPI.ts, components/WorkflowChat.tsx
3. **Low**: components/InputNodeEditor.tsx, utils/logger.ts

All changes should be **backward compatible** (optional parameters with defaults) to avoid breaking existing code.

