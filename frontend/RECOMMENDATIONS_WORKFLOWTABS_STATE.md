# Recommendations for Fixing WorkflowTabs Module-Level State Management

## Problem Analysis

The `WorkflowTabs` component uses module-level `globalTabs` variable to persist tabs across component remounts. This causes:

1. **Test Isolation Issues**: Module-level state persists across tests, making it impossible to reliably test different scenarios
2. **Initialization Timing**: `globalTabs` is initialized at module load time, before test mocks are set up
3. **Race Condition Handling**: The code uses `globalTabs` as a fallback when React state seems "stale" (line 223), which is an anti-pattern

## Recommended Solutions (in order of preference)

### Option 1: Use Context API (Recommended) ⭐

**Best for**: Production code that needs state persistence across remounts while maintaining testability

Create a `WorkflowTabsContext` that manages tabs state:

```typescript
// contexts/WorkflowTabsContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getLocalStorageItem, setLocalStorageItem } from '../hooks/useLocalStorage'
import type { StorageAdapter } from '../types/adapters'

interface WorkflowTabData {
  id: string
  name: string
  workflowId: string | null
  isUnsaved: boolean
  executions: Execution[]
  activeExecutionId: string | null
}

interface WorkflowTabsContextValue {
  tabs: WorkflowTabData[]
  setTabs: (tabs: WorkflowTabData[]) => void
  activeTabId: string
  setActiveTabId: (id: string) => void
}

const WorkflowTabsContext = createContext<WorkflowTabsContextValue | null>(null)

export function WorkflowTabsProvider({ 
  children, 
  storage 
}: { 
  children: ReactNode
  storage?: StorageAdapter | null 
}) {
  const [tabs, setTabs] = useState<WorkflowTabData[]>(() => {
    const stored = getLocalStorageItem<WorkflowTabData[]>('workflowTabs', [])
    return Array.isArray(stored) && stored.length > 0 ? stored : [emptyTabState]
  })
  
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const saved = getLocalStorageItem<string | null>('activeWorkflowTabId', null)
    return saved && tabs.some(t => t.id === saved) ? saved : tabs[0]?.id || 'workflow-1'
  })

  // Persist to storage whenever tabs change
  useEffect(() => {
    if (storage) {
      try {
        storage.setItem('workflowTabs', JSON.stringify(tabs))
      } catch {
        // ignore quota errors
      }
    }
  }, [tabs, storage])

  return (
    <WorkflowTabsContext.Provider value={{ tabs, setTabs, activeTabId, setActiveTabId }}>
      {children}
    </WorkflowTabsContext.Provider>
  )
}

export function useWorkflowTabs() {
  const context = useContext(WorkflowTabsContext)
  if (!context) {
    throw new Error('useWorkflowTabs must be used within WorkflowTabsProvider')
  }
  return context
}
```

**Benefits**:
- ✅ State persists across remounts (via Context)
- ✅ Easy to test (can provide mock context)
- ✅ Follows React patterns
- ✅ No module-level state

**Migration**: Wrap `WorkflowTabs` usage in `WorkflowTabsProvider` at the App level

---

### Option 2: Dependency Injection for State Manager

**Best for**: Maintaining current architecture while improving testability

Create a state manager that can be injected:

```typescript
// utils/workflowTabsStateManager.ts
export interface WorkflowTabsStateManager {
  getTabs(): WorkflowTabData[]
  setTabs(tabs: WorkflowTabData[]): void
  getActiveTabId(): string | null
  setActiveTabId(id: string | null): void
  reset(): void // For testing
}

class DefaultWorkflowTabsStateManager implements WorkflowTabsStateManager {
  private tabs: WorkflowTabData[] = []
  private activeTabId: string | null = null
  private storage?: StorageAdapter | null

  constructor(storage?: StorageAdapter | null) {
    this.storage = storage
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const stored = getLocalStorageItem<WorkflowTabData[]>('workflowTabs', [])
    this.tabs = Array.isArray(stored) && stored.length > 0 ? stored : [emptyTabState]
    const saved = getLocalStorageItem<string | null>('activeWorkflowTabId', null)
    this.activeTabId = saved && this.tabs.some(t => t.id === saved) ? saved : this.tabs[0]?.id || null
  }

  getTabs() { return [...this.tabs] }
  setTabs(tabs: WorkflowTabData[]) { 
    this.tabs = [...tabs]
    this.saveToStorage()
  }
  getActiveTabId() { return this.activeTabId }
  setActiveTabId(id: string | null) { 
    this.activeTabId = id
    this.saveToStorage()
  }
  reset() {
    this.tabs = [emptyTabState]
    this.activeTabId = 'workflow-1'
  }

  private saveToStorage() {
    if (this.storage) {
      try {
        this.storage.setItem('workflowTabs', JSON.stringify(this.tabs))
        if (this.activeTabId) {
          this.storage.setItem('activeWorkflowTabId', this.activeTabId)
        }
      } catch {
        // ignore quota errors
      }
    }
  }
}

// Export singleton for production, but allow injection for testing
let defaultManager: WorkflowTabsStateManager | null = null

export function getDefaultStateManager(storage?: StorageAdapter | null): WorkflowTabsStateManager {
  if (!defaultManager) {
    defaultManager = new DefaultWorkflowTabsStateManager(storage)
  }
  return defaultManager
}
```

Then in `WorkflowTabs`:

```typescript
export default function WorkflowTabs({ 
  storage = defaultAdapters.createLocalStorageAdapter(),
  stateManager = getDefaultStateManager(storage),
  // ... other props
}: WorkflowTabsProps & { stateManager?: WorkflowTabsStateManager }) {
  const [tabs, setTabs] = useState<WorkflowTabData[]>(() => stateManager.getTabs())
  const [activeTabId, setActiveTabId] = useState<string>(() => stateManager.getActiveTabId() || 'workflow-1')
  
  // Sync with state manager
  useEffect(() => {
    stateManager.setTabs(tabs)
  }, [tabs, stateManager])
  
  useEffect(() => {
    stateManager.setActiveTabId(activeTabId)
  }, [activeTabId, stateManager])
  
  // ... rest of component
}
```

**Benefits**:
- ✅ Maintains current architecture
- ✅ Easy to test (inject mock state manager)
- ✅ Can reset state manager between tests
- ⚠️ Still uses singleton pattern (but can be overridden)

---

### Option 3: Remove Module-Level State, Use Storage Directly

**Best for**: Simplest solution if persistence across remounts isn't critical

Remove `globalTabs` entirely and always read from storage:

```typescript
export default function WorkflowTabs({ 
  storage = defaultAdapters.createLocalStorageAdapter(),
  // ... other props
}: WorkflowTabsProps) {
  // Always initialize from storage (not module-level state)
  const [tabs, setTabs] = useState<WorkflowTabData[]>(() => {
    if (storage) {
      try {
        const stored = storage.getItem('workflowTabs')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      } catch {
        // ignore errors
      }
    }
    return [emptyTabState]
  })
  
  // ... rest of component
}
```

**Benefits**:
- ✅ Simplest solution
- ✅ No module-level state
- ✅ Easy to test
- ⚠️ May cause brief flash of default state on remount (storage read is async)
- ⚠️ Loses the "stale state" fallback (but that's probably fine)

---

### Option 4: Test Helper to Reset Module State

**Best for**: Quick fix without changing production code

Create a test utility that resets the module state:

```typescript
// __tests__/utils/resetWorkflowTabsState.ts
let originalGlobalTabs: any

export function resetWorkflowTabsState() {
  // Access the module's internal state (requires exporting it or using a reset function)
  const WorkflowTabsModule = require('../components/WorkflowTabs')
  if (WorkflowTabsModule.__resetGlobalTabs) {
    WorkflowTabsModule.__resetGlobalTabs()
  }
}

// In WorkflowTabs.tsx, add:
export function __resetGlobalTabs() {
  globalTabs = [emptyTabState]
}
```

Then in tests:

```typescript
beforeEach(() => {
  resetWorkflowTabsState()
  // ... other setup
})
```

**Benefits**:
- ✅ Minimal changes to production code
- ✅ Quick to implement
- ⚠️ Requires exposing internal state (not ideal)
- ⚠️ Doesn't solve the root architectural issue

---

## Recommended Approach

**I recommend Option 1 (Context API)** because:

1. **Follows React Best Practices**: Context is the standard way to share state across components
2. **Maintains Persistence**: State persists across remounts via Context provider
3. **Excellent Testability**: Can easily provide mock context in tests
4. **No Module-Level State**: Eliminates the root cause of test isolation issues
5. **Future-Proof**: Easy to extend (e.g., add undo/redo, tab synchronization)

### Migration Steps

1. Create `WorkflowTabsContext.tsx` with provider
2. Wrap `WorkflowTabs` usage in `WorkflowTabsProvider` at App level
3. Update `WorkflowTabs` to use `useWorkflowTabs()` hook instead of module-level state
4. Update tests to wrap components in `WorkflowTabsProvider` with test data
5. Remove module-level `globalTabs` variable

### Testing Example with Context

```typescript
it('should handle publish workflow', async () => {
  const mockTabs = [
    { id: 'tab-1', name: 'Test', workflowId: 'workflow-1', isUnsaved: false, executions: [], activeExecutionId: null }
  ]
  
  render(
    <WorkflowTabsProvider storage={mockStorage} initialTabs={mockTabs}>
      <WorkflowTabs httpClient={mockHttpClient} />
    </WorkflowTabsProvider>
  )
  
  // Test continues...
})
```

---

## Additional Considerations

### Race Condition Handling

The current code uses `globalTabs` as a fallback when React state seems "stale" (line 223). This is an anti-pattern. Better approaches:

1. **Use functional updates**: `setTabs(prev => [...prev, newTab])` ensures you always work with latest state
2. **Use refs for latest values**: `const tabsRef = useRef(tabs); useEffect(() => { tabsRef.current = tabs }, [tabs])`
3. **Remove the fallback**: If state is truly stale, there's a deeper architectural issue

### Performance

If you're concerned about Context re-renders:
- Use `useMemo` to memoize context value
- Split contexts (one for tabs, one for activeTabId) if needed
- Use `React.memo` on child components

---

## Summary

The module-level state pattern is causing test isolation issues. The best solution is to migrate to React Context API, which provides the same persistence benefits while being fully testable. This is a common pattern in React applications and aligns with the framework's design principles.
