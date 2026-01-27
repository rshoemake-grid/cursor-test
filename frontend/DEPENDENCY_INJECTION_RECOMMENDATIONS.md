# Frontend Dependency Injection & Testability Analysis

**Date:** January 26, 2026  
**Coverage Goal:** 80% statement coverage  
**Current Coverage:** 62.58%

## Executive Summary

The frontend codebase has **partial dependency injection** implementation. Some core utilities (`useLocalStorage`, `useWebSocket`, `api/client`, `AuthContext`) already use DI patterns, but many components still directly access browser APIs (`localStorage`, `fetch`, `window`, `document`), making them harder to test and reducing test coverage potential.

## Current State

### ✅ **Good DI Patterns Already Implemented**

1. **`types/adapters.ts`** - Comprehensive adapter interfaces:
   - `StorageAdapter` - localStorage/sessionStorage abstraction
   - `HttpClient` - fetch/axios abstraction
   - `DocumentAdapter` - DOM manipulation abstraction
   - `TimerAdapter` - setTimeout/setInterval abstraction
   - `WebSocketFactory` - WebSocket creation abstraction
   - `WindowLocation` - window.location abstraction
   - `ConsoleAdapter` - console logging abstraction
   - `EnvironmentAdapter` - environment variable abstraction

2. **`hooks/useLocalStorage.ts`** - ✅ Uses `StorageAdapter` injection
3. **`hooks/useWebSocket.ts`** - ✅ Uses `WebSocketFactory` and `WindowLocation` injection
4. **`api/client.ts`** - ✅ Has `createApiClient()` with `StorageAdapter` injection
5. **`contexts/AuthContext.tsx`** - ✅ Uses `StorageAdapter` and `HttpClient` injection

### ❌ **Areas Needing Improvement**

## Priority 1: High Impact (Direct Browser API Access)

### 1. `components/WorkflowChat.tsx`

**Current Issues:**
- ❌ Direct `localStorage.getItem()` and `localStorage.setItem()` (lines 22, 53)
- ❌ Direct `fetch()` call with hardcoded URL (line 87)
- ❌ Direct `logger` import (should be injected)

**Impact:**
- Cannot test storage errors
- Cannot test network failures
- Hardcoded API URL
- Tests must mock global `localStorage` and `fetch`

**Recommendation:**
```typescript
interface WorkflowChatProps {
  workflowId: string | null
  onWorkflowUpdate?: (changes: any) => void
  // NEW: Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
  logger?: typeof logger
}

export default function WorkflowChat({
  workflowId,
  onWorkflowUpdate,
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = 'http://localhost:8000/api',
  logger: injectedLogger = logger
}: WorkflowChatProps) {
  const loadConversationHistory = (workflowId: string | null): ChatMessage[] => {
    if (!storage) return defaultMessages
    
    const storageKey = workflowId ? `chat_history_${workflowId}` : 'chat_history_new_workflow'
    const saved = storage.getItem(storageKey)
    // ... rest of logic
  }

  const handleSend = async () => {
    // ... existing code ...
    
    const response = await httpClient.post(
      `${apiBaseUrl}/workflow-chat/chat`,
      {
        workflow_id: workflowId,
        message: userMessage.content,
        conversation_history: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      },
      headers
    )
    // ... rest of logic
  }
}
```

**Benefits:**
- ✅ Can inject mock storage and HTTP client in tests
- ✅ Configurable API base URL
- ✅ Better test isolation
- ✅ Can test conversation persistence easily
- ✅ Can test network errors

---

### 2. `components/NodePanel.tsx`

**Current Issues:**
- ❌ Direct `localStorage.getItem()` (lines 37, 67)
- ❌ Direct `window.addEventListener()` and `window.removeEventListener()` (lines 62, 79, 82, 83)
- ❌ Direct `logger` import (should be injected)

**Impact:**
- Cannot test storage errors
- Cannot test event listener cleanup
- Tests must mock global `window` and `localStorage`

**Recommendation:**
```typescript
interface NodePanelProps {
  // NEW: Dependency injection
  storage?: StorageAdapter | null
  logger?: typeof logger
}

export default function NodePanel({
  storage = defaultAdapters.createLocalStorageAdapter(),
  logger: injectedLogger = logger
}: NodePanelProps) {
  useEffect(() => {
    // Load custom agent nodes from storage
    try {
      if (!storage) return
      
      const savedAgentNodes = storage.getItem('customAgentNodes')
      if (savedAgentNodes) {
        const parsed = JSON.parse(savedAgentNodes)
        if (Array.isArray(parsed)) {
          setCustomAgentNodes(parsed)
        }
      }
    } catch (error) {
      injectedLogger.error('Failed to load custom agent nodes:', error)
    }

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      // ... existing logic ...
    }

    // Use storage adapter's event listener if available
    if (storage && 'addEventListener' in storage) {
      storage.addEventListener('storage', handleStorageChange)
    } else if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
    }
    
    // ... rest of logic ...

    return () => {
      if (storage && 'removeEventListener' in storage) {
        storage.removeEventListener('storage', handleStorageChange)
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange)
      }
      // ... cleanup ...
    }
  }, [storage, injectedLogger])
}
```

**Benefits:**
- ✅ Can inject mock storage in tests
- ✅ Can test event listener cleanup
- ✅ Better test isolation
- ✅ Can test storage errors

---

### 3. `pages/SettingsPage.tsx`

**Current Issues:**
- ❌ Direct `localStorage.getItem()` and `localStorage.setItem()` (lines 123, 168)
- ❌ Direct `fetch()` calls (lines 155, 197, 283)
- ❌ Direct `console.error()` and `console.log()` (lines 138, 177)

**Impact:**
- Cannot test storage errors
- Cannot test network failures
- Hardcoded API URLs
- Tests must mock global `localStorage`, `fetch`, and `console`

**Recommendation:**
```typescript
interface SettingsPageProps {
  // NEW: Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
  logger?: typeof logger
  consoleAdapter?: ConsoleAdapter
}

export default function SettingsPage({
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = '/api',
  logger: injectedLogger = logger,
  consoleAdapter = defaultAdapters.createConsoleAdapter()
}: SettingsPageProps) {
  useEffect(() => {
    const loadProviders = async () => {
      const fallbackToLocal = () => {
        if (!storage) {
          setSettingsLoaded(true)
          return
        }
        
        const saved = storage.getItem('llm_settings')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            // ... rest of logic ...
          } catch (e) {
            consoleAdapter.error('Failed to load providers:', e)
          }
        } else {
          setSettingsLoaded(true)
        }
      }

      if (!isAuthenticated) {
        fallbackToLocal()
        return
      }

      try {
        const response = await httpClient.get(`${apiBaseUrl}/settings/llm`, headers)
        // ... rest of logic ...
      } catch (e) {
        consoleAdapter.log('Could not load from backend, trying localStorage')
      }

      fallbackToLocal()
    }
    
    loadProviders()
  }, [isAuthenticated, storage, httpClient, apiBaseUrl, consoleAdapter])
}
```

**Benefits:**
- ✅ Can inject mock storage and HTTP client in tests
- ✅ Configurable API base URL
- ✅ Better test isolation
- ✅ Can test storage and network errors
- ✅ Can test console logging

---

### 4. `hooks/useWorkflowAPI.ts`

**Current Issues:**
- ❌ Direct `api` import (line 2)
- ❌ Direct `logger` import (should be injected)

**Impact:**
- Cannot inject mock API client in tests
- Tests must mock the entire `api` module
- Harder to test error scenarios

**Recommendation:**
```typescript
interface WorkflowAPIClient {
  getWorkflows(): Promise<WorkflowDefinition[]>
  getWorkflow(id: string): Promise<WorkflowDefinition>
  createWorkflow(workflow: WorkflowDefinition): Promise<WorkflowDefinition>
  updateWorkflow(id: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition>
  deleteWorkflow(id: string): Promise<void>
  executeWorkflow(workflowId: string, inputs?: Record<string, any>): Promise<ExecutionState>
  getExecution(executionId: string): Promise<ExecutionState>
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
  
  // ... rest of methods using apiClient and injectedLogger ...
}
```

**Benefits:**
- ✅ Can inject mock API client in tests
- ✅ Better test isolation
- ✅ Actually follows Dependency Inversion Principle
- ✅ Can test error scenarios easily

---

## Priority 2: Medium Impact (Components with Direct Browser API Access)

### 5. `components/MarketplaceDialog.tsx`

**Current Issues:**
- ❌ Direct `localStorage.getItem()` and `localStorage.setItem()` (multiple locations)
- ❌ Direct `fetch()` calls

**Recommendation:** Same pattern as `WorkflowChat.tsx` - inject `StorageAdapter` and `HttpClient`.

---

### 6. `components/WorkflowBuilder.tsx`

**Current Issues:**
- ❌ Direct `localStorage.getItem()` and `localStorage.setItem()` (multiple locations)
- ❌ Direct `fetch()` calls

**Recommendation:** Inject `StorageAdapter` and `HttpClient`.

---

### 7. `components/WorkflowTabs.tsx`

**Current Issues:**
- ❌ Direct `localStorage.getItem()` and `localStorage.setItem()` (multiple locations)

**Recommendation:** Inject `StorageAdapter`.

---

### 8. `components/PropertyPanel.tsx`

**Current Issues:**
- ❌ Direct `localStorage.getItem()` and `localStorage.setItem()` (multiple locations)

**Recommendation:** Inject `StorageAdapter`.

---

### 9. `pages/MarketplacePage.tsx`

**Current Issues:**
- ❌ Direct `fetch()` calls

**Recommendation:** Inject `HttpClient`.

---

### 10. `pages/ForgotPasswordPage.tsx` and `pages/ResetPasswordPage.tsx`

**Current Issues:**
- ❌ Direct `fetch()` calls

**Recommendation:** Inject `HttpClient`.

---

## Priority 3: Low Impact (Utilities)

### 11. `utils/confirm.tsx`

**Current Issues:**
- ❌ Direct `document.createElement()` and `document.body.appendChild()`
- ❌ Direct `setTimeout()` and `clearTimeout()`

**Recommendation:**
```typescript
interface ConfirmOptions {
  // ... existing options ...
  documentAdapter?: DocumentAdapter | null
  timerAdapter?: TimerAdapter
}

export async function showConfirm(
  message: string,
  options: ConfirmOptions = {}
): Promise<boolean> {
  const {
    documentAdapter = defaultAdapters.createDocumentAdapter(),
    timerAdapter = defaultAdapters.createTimerAdapter(),
    // ... other options ...
  } = options

  if (!documentAdapter) {
    return Promise.resolve(false)
  }

  const overlay = documentAdapter.createElement('div')
  // ... rest of logic using documentAdapter and timerAdapter ...
}
```

**Benefits:**
- ✅ Can inject mock document and timer adapters in tests
- ✅ Better test isolation
- ✅ Can test DOM manipulation errors

---

## Implementation Strategy

### Phase 1: High Priority Components (Week 1)
1. ✅ `WorkflowChat.tsx` - Add `StorageAdapter` and `HttpClient` injection
2. ✅ `NodePanel.tsx` - Add `StorageAdapter` injection
3. ✅ `SettingsPage.tsx` - Add `StorageAdapter`, `HttpClient`, and `ConsoleAdapter` injection
4. ✅ `useWorkflowAPI.ts` - Add `WorkflowAPIClient` injection

### Phase 2: Medium Priority Components (Week 2)
5. `MarketplaceDialog.tsx`
6. `WorkflowBuilder.tsx`
7. `WorkflowTabs.tsx`
8. `PropertyPanel.tsx`
9. `MarketplacePage.tsx`
10. `ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx`

### Phase 3: Low Priority Utilities (Week 3)
11. `utils/confirm.tsx`

---

## Testing Benefits

### Before DI:
```typescript
// Hard to test - must mock global APIs
beforeEach(() => {
  global.localStorage = { getItem: jest.fn(), setItem: jest.fn() }
  global.fetch = jest.fn()
})

test('handles storage error', () => {
  // Cannot easily simulate storage quota error
  // Must mock global localStorage
})
```

### After DI:
```typescript
// Easy to test - inject mocks
test('handles storage error', () => {
  const mockStorage = {
    getItem: jest.fn().mockImplementation(() => {
      throw new Error('QuotaExceededError')
    }),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }

  render(<WorkflowChat workflowId="123" storage={mockStorage} />)
  
  // Test error handling easily
})
```

---

## Coverage Impact

Implementing these recommendations will:
- ✅ **Increase test coverage** by making edge cases testable (storage errors, network failures)
- ✅ **Reduce NoCoverage mutants** by eliminating `typeof window === 'undefined'` checks
- ✅ **Improve test reliability** by eliminating global state dependencies
- ✅ **Enable better integration tests** by allowing controlled dependency injection

**Estimated Coverage Increase:** +5-10% (from 62.58% to 67-72%)

---

## Migration Notes

### Backward Compatibility
All changes maintain backward compatibility by providing default implementations:
```typescript
storage = defaultAdapters.createLocalStorageAdapter()
```

### Testing Strategy
1. Update component props to accept optional dependencies
2. Provide default implementations using `defaultAdapters`
3. Update tests to inject mocks
4. Verify existing functionality still works

### Breaking Changes
None - all changes are additive and backward compatible.

---

## Summary

| Category | Files | Priority | Estimated Impact |
|----------|-------|----------|------------------|
| High Priority | 4 | Critical | +3-5% coverage |
| Medium Priority | 6 | Important | +2-3% coverage |
| Low Priority | 1 | Nice to have | +1% coverage |
| **Total** | **11** | - | **+6-9% coverage** |

**Recommendation:** Implement Priority 1 items first, as they have the highest impact on testability and coverage potential.
