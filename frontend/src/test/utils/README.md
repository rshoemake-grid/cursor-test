# Test Utilities

Shared utilities for testing React components and hooks.

## Stateful Mock Utilities

### `createStatefulMock`

Creates a stateful mock for hooks that manage state, allowing tests to verify actual state changes when setters are called.

**Use Case:** Testing hooks with state management where you need to verify that state changes are reflected in subsequent renders.

**Example:**

```typescript
import { createStatefulMock } from '../test/utils/createStatefulMock'

type TabState = 'agents' | 'repository' | 'workflows-of-workflows'

const { createMock, resetState } = createStatefulMock<TabState, ReturnType<typeof useMarketplaceTabs>>({
  initialState: 'agents',
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState,
    setActiveTab: jest.fn((tab: TabState) => {
      updateState(tab)
    }),
    isAgentsTab: currentState === 'agents',
    isRepositoryTab: currentState === 'repository',
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})

// Use in jest.mock
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceTabs: jest.fn(() => createMock()),
}))

// Reset in beforeEach
beforeEach(() => {
  resetState()
  jest.clearAllMocks()
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMock())
})
```

### `createMultiStatefulMock`

Creates a stateful mock for hooks with multiple state values.

**Example:**

```typescript
import { createMultiStatefulMock } from '../test/utils/createStatefulMock'
import type { UseMarketplaceTabsReturn } from '../hooks/marketplace/useMarketplaceTabs'

const marketplaceTabsMock = createMultiStatefulMock<
  { activeTab: 'agents' | 'repository' | 'workflows-of-workflows'; repositorySubTab: 'workflows' | 'agents' },
  UseMarketplaceTabsReturn
>({
  initialState: {
    activeTab: 'agents',
    repositorySubTab: 'workflows',
  },
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState.activeTab,
    repositorySubTab: currentState.repositorySubTab,
    setActiveTab: jest.fn((tab: typeof currentState.activeTab) => {
      updateState({ activeTab: tab })
    }),
    setRepositorySubTab: jest.fn((subTab: typeof currentState.repositorySubTab) => {
      updateState({ repositorySubTab: subTab })
    }),
    isAgentsTab: currentState.activeTab === 'agents',
    isRepositoryTab: currentState.activeTab === 'repository',
    isWorkflowsOfWorkflowsTab: currentState.activeTab === 'workflows-of-workflows',
    isRepositoryWorkflowsSubTab: currentState.activeTab === 'repository' && currentState.repositorySubTab === 'workflows',
    isRepositoryAgentsSubTab: currentState.activeTab === 'repository' && currentState.repositorySubTab === 'agents',
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})

// Use in jest.mock
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceTabs: jest.fn(() => marketplaceTabsMock.createMock()),
  // ... other mocks
}))

// Reset in beforeEach
beforeEach(() => {
  marketplaceTabsMock.resetState()
  jest.clearAllMocks()
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(marketplaceTabsMock.createMock())
})
```

## When to Use

Use stateful mocks when:
- Testing hooks that manage state
- You need to verify state changes across multiple renders
- Static mocks don't reflect state changes
- Tests need to verify behavior based on state transitions

## Benefits

- **Reusable:** Pattern can be applied to any hook with state
- **Type-safe:** Full TypeScript support
- **Test Isolation:** Proper state reset between tests
- **Maintainable:** Clear pattern, easy to understand

## Real-World Example: MarketplacePage Tests

The `MarketplacePage.test.tsx` file demonstrates a complete implementation using `createMultiStatefulMock`:

```typescript
import { createMultiStatefulMock } from '../test/utils/createStatefulMock'
import type { UseMarketplaceTabsReturn } from '../hooks/marketplace/useMarketplaceTabs'

// Create stateful mock with multiple state values
const marketplaceTabsMock = createMultiStatefulMock<
  { activeTab: 'agents' | 'repository' | 'workflows-of-workflows'; repositorySubTab: 'workflows' | 'agents' },
  UseMarketplaceTabsReturn
>({
  initialState: {
    activeTab: 'agents',
    repositorySubTab: 'workflows',
  },
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState.activeTab,
    repositorySubTab: currentState.repositorySubTab,
    setActiveTab: jest.fn((tab) => updateState({ activeTab: tab })),
    setRepositorySubTab: jest.fn((subTab) => updateState({ repositorySubTab: subTab })),
    // Computed properties based on current state
    isAgentsTab: currentState.activeTab === 'agents',
    isRepositoryTab: currentState.activeTab === 'repository',
    isWorkflowsOfWorkflowsTab: currentState.activeTab === 'workflows-of-workflows',
    isRepositoryWorkflowsSubTab: currentState.activeTab === 'repository' && currentState.repositorySubTab === 'workflows',
    isRepositoryAgentsSubTab: currentState.activeTab === 'repository' && currentState.repositorySubTab === 'agents',
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})

// Use in jest.mock
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceTabs: jest.fn(() => marketplaceTabsMock.createMock()),
  // ... other mocks
}))

// Reset in beforeEach for test isolation
beforeEach(() => {
  marketplaceTabsMock.resetState()
  jest.clearAllMocks()
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(marketplaceTabsMock.createMock())
})
```

**Key Points:**
- Uses TypeScript generics for type safety
- State updates trigger mock return value updates automatically
- `resetState()` ensures test isolation
- Computed properties reflect current state

## Migration from Inline Implementation

If you have an inline stateful mock implementation, you can migrate it to use this utility:

### Single State Value

**Before:**
```typescript
let mockActiveTab = 'agents'
const createMockUseMarketplaceTabs = () => {
  const mockFn = jest.mocked(require('../hooks/marketplace').useMarketplaceTabs)
  return {
    activeTab: mockActiveTab,
    setActiveTab: jest.fn((tab) => {
      mockActiveTab = tab
      if (mockFn) {
        mockFn.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
  }
}
```

**After:**
```typescript
import { createStatefulMock } from '../test/utils/createStatefulMock'

const { createMock, resetState } = createStatefulMock({
  initialState: 'agents',
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState,
    setActiveTab: jest.fn((tab) => updateState(tab)),
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})
```

### Multiple State Values

**Before:**
```typescript
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'

const createMockUseMarketplaceTabs = () => {
  const mockFn = jest.mocked(require('../hooks/marketplace').useMarketplaceTabs)
  return {
    activeTab: mockActiveTab,
    repositorySubTab: mockRepositorySubTab,
    setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
      mockActiveTab = tab
      if (mockFn) {
        mockFn.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
    setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
      mockRepositorySubTab = subTab
      if (mockFn) {
        mockFn.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
    // ... computed properties
  }
}
```

**After:**
```typescript
import { createMultiStatefulMock } from '../test/utils/createStatefulMock'

const marketplaceTabsMock = createMultiStatefulMock({
  initialState: {
    activeTab: 'agents',
    repositorySubTab: 'workflows',
  },
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState.activeTab,
    repositorySubTab: currentState.repositorySubTab,
    setActiveTab: jest.fn((tab) => updateState({ activeTab: tab })),
    setRepositorySubTab: jest.fn((subTab) => updateState({ repositorySubTab: subTab })),
    // ... computed properties
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})
```

## Troubleshooting

### Issue: State not updating in tests

**Symptoms:** Tests fail because state doesn't change when setters are called.

**Solutions:**
1. Ensure `updateState()` is called in setter functions
2. Verify `getMockFn()` returns the correct mock function
3. Check that `beforeEach` calls `resetState()` and re-initializes mock
4. Use `rerender()` in tests after state changes if needed

### Issue: Test isolation problems

**Symptoms:** Tests affect each other, state leaks between tests.

**Solutions:**
1. Always call `resetState()` in `beforeEach`
2. Call `jest.clearAllMocks()` before resetting state
3. Re-initialize mock after clearing: `jest.mocked(hook).mockReturnValue(createMock())`
4. Ensure state reset happens BEFORE clearing mocks

### Issue: Type errors

**Symptoms:** TypeScript errors when using the utility.

**Solutions:**
1. Provide explicit type parameters: `createMultiStatefulMock<StateType, ReturnType>`
2. Import return type from hook: `import type { UseHookReturn } from '../hooks/myHook'`
3. Ensure state type matches hook's state structure
4. Check that `createMockFn` return type matches hook return type

## Best Practices

1. **Use TypeScript Generics:** Always provide type parameters for type safety
2. **Reset State Properly:** Always reset state in `beforeEach` for test isolation
3. **Update Mock After Reset:** Re-initialize mock return value after clearing mocks
4. **Use Computed Properties:** Derive boolean flags from state rather than storing them
5. **Document Complex Mocks:** Add comments explaining complex state logic
6. **Test State Transitions:** Verify state changes work correctly in tests
7. **Keep Mocks Simple:** Don't over-complicate mock logic

## Edge Cases

### Rapid State Changes

When state changes occur in quick succession (e.g., multiple clicks in rapid succession), the mock handles each update correctly:

```typescript
it('handles rapid state changes', () => {
  const { result } = renderHook(() => useMyHook())
  
  // Rapid state changes
  act(() => {
    result.current.setTab('tab1')
    result.current.setTab('tab2')
    result.current.setTab('tab3')
  })
  
  // Final state should be the last update
  expect(result.current.activeTab).toBe('tab3')
  
  // All state transitions are tracked
  expect(result.current.setTab).toHaveBeenCalledTimes(3)
})
```

**Key Points:**
- Each `updateState()` call immediately updates the internal state
- The mock return value reflects the most recent state
- Jest mock functions track all calls correctly
- Use `act()` wrapper when testing rapid state changes in React components

### Partial State Updates in Multi-State

When updating only part of a multi-state object, other properties are preserved:

```typescript
const multiStateMock = createMultiStatefulMock<
  { activeTab: TabType; repositorySubTab: SubTabType; filter: string },
  UseMarketplaceTabsReturn
>({
  initialState: {
    activeTab: 'agents',
    repositorySubTab: 'workflows',
    filter: '',
  },
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState.activeTab,
    repositorySubTab: currentState.repositorySubTab,
    filter: currentState.filter,
    setActiveTab: jest.fn((tab) => {
      // ✅ Partial update - preserves other properties
      updateState({ ...currentState, activeTab: tab })
    }),
    setRepositorySubTab: jest.fn((subTab) => {
      // ✅ Partial update - preserves other properties
      updateState({ ...currentState, repositorySubTab: subTab })
    }),
    setFilter: jest.fn((filter) => {
      // ✅ Partial update - preserves other properties
      updateState({ ...currentState, filter })
    }),
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})

it('preserves other state when updating one property', () => {
  // Set initial state
  multiStateMock.updateState({ activeTab: 'repository', repositorySubTab: 'workflows', filter: 'test' })
  
  // Update only activeTab
  const mock = multiStateMock.createMock()
  act(() => {
    mock.setActiveTab('agents')
  })
  
  // repositorySubTab and filter should be preserved
  expect(multiStateMock.state.repositorySubTab).toBe('workflows')
  expect(multiStateMock.state.filter).toBe('test')
  expect(multiStateMock.state.activeTab).toBe('agents')
})
```

**Key Points:**
- Always spread `currentState` when updating: `updateState({ ...currentState, property: value })`
- `createMultiStatefulMock` handles partial updates correctly
- Other state properties remain unchanged unless explicitly updated
- This pattern matches React's `useState` behavior with object updates

### State Reset Timing

Understanding when state resets occur and ensuring proper test isolation:

```typescript
describe('State Reset Timing', () => {
  beforeEach(() => {
    // ✅ Correct order: Reset state BEFORE clearing mocks
    multiStateMock.resetState()
    jest.clearAllMocks()
    
    // Then re-initialize mock with reset state
    jest.mocked(useMarketplaceTabs).mockReturnValue(multiStateMock.createMock())
  })
  
  it('resets state between tests', () => {
    // Modify state in first test
    const mock = multiStateMock.createMock()
    act(() => {
      mock.setActiveTab('repository')
    })
    
    expect(multiStateMock.state.activeTab).toBe('repository')
  })
  
  it('state is reset for this test', () => {
    // State should be back to initial value
    expect(multiStateMock.state.activeTab).toBe('agents') // ✅ Initial state
  })
})
```

**Common Pitfall:**
```typescript
// ❌ Wrong - clearing mocks before reset can cause issues
beforeEach(() => {
  jest.clearAllMocks() // Clears mock return values
  multiStateMock.resetState() // But mock still has old return value
  // Mock return value doesn't reflect reset state!
})
```

**Key Points:**
- Always call `resetState()` before `jest.clearAllMocks()`
- Re-initialize mock return value after reset: `mockReturnValue(createMock())`
- State reset happens synchronously, so it's safe to use immediately after
- Each test starts with clean state, ensuring test isolation

### Nested State Updates

When state updates trigger other state updates (e.g., changing tab resets sub-tab):

```typescript
const nestedStateMock = createMultiStatefulMock<
  { activeTab: TabType; repositorySubTab: SubTabType },
  UseMarketplaceTabsReturn
>({
  initialState: {
    activeTab: 'agents',
    repositorySubTab: 'workflows',
  },
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState.activeTab,
    repositorySubTab: currentState.repositorySubTab,
    setActiveTab: jest.fn((tab) => {
      // Nested update: changing tab resets sub-tab
      if (tab === 'repository') {
        // ✅ Update multiple properties in one call
        updateState({ activeTab: tab, repositorySubTab: 'workflows' })
      } else {
        // ✅ Single property update
        updateState({ activeTab: tab })
      }
    }),
    setRepositorySubTab: jest.fn((subTab) => {
      updateState({ repositorySubTab: subTab })
    }),
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})

it('handles nested state updates correctly', () => {
  // Set sub-tab to 'agents'
  const mock = nestedStateMock.createMock()
  act(() => {
    mock.setRepositorySubTab('agents')
  })
  expect(nestedStateMock.state.repositorySubTab).toBe('agents')
  
  // Switch to different tab - should reset sub-tab
  act(() => {
    mock.setActiveTab('workflows-of-workflows')
  })
  expect(nestedStateMock.state.activeTab).toBe('workflows-of-workflows')
  // Sub-tab unchanged (not repository tab)
  
  // Switch to repository tab - should reset sub-tab to default
  act(() => {
    mock.setActiveTab('repository')
  })
  expect(nestedStateMock.state.activeTab).toBe('repository')
  expect(nestedStateMock.state.repositorySubTab).toBe('workflows') // ✅ Reset
})
```

**Key Points:**
- Multiple properties can be updated in a single `updateState()` call
- Nested updates are handled synchronously - all changes apply immediately
- The mock return value reflects all updates after the call completes
- Use conditional logic in setters to implement dependent state updates
- This pattern is useful for cascading state changes (e.g., form validation, dependent dropdowns)

## Edge Cases

### Rapid State Changes

When multiple state updates happen in quick succession (e.g., rapid clicks or async operations), the mock handles them correctly:

```typescript
it('handles rapid state changes', () => {
  const { result } = renderHook(() => useMyHook())
  
  // Rapid state changes
  act(() => {
    result.current.setTab('tab1')
    result.current.setTab('tab2')
    result.current.setTab('tab3')
  })
  
  // Mock reflects the final state
  expect(result.current.activeTab).toBe('tab3')
  
  // Each setter was called
  expect(result.current.setTab).toHaveBeenCalledTimes(3)
})
```

**Key Points:**
- Each `updateState()` call immediately updates the mock return value
- The final state is always reflected correctly
- All setter calls are tracked by Jest mocks

### Partial State Updates in Multi-State

When updating only part of a multi-state object, other properties are preserved:

```typescript
const multiStateMock = createMultiStatefulMock<
  { activeTab: string; subTab: string; filter: string },
  UseMyHookReturn
>({
  initialState: {
    activeTab: 'tab1',
    subTab: 'sub1',
    filter: 'all',
  },
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState.activeTab,
    subTab: currentState.subTab,
    filter: currentState.filter,
    setActiveTab: jest.fn((tab) => {
      // ✅ Partial update - preserves subTab and filter
      updateState({ ...currentState, activeTab: tab })
    }),
    setSubTab: jest.fn((subTab) => {
      // ✅ Partial update - preserves activeTab and filter
      updateState({ ...currentState, subTab })
    }),
    setFilter: jest.fn((filter) => {
      // ✅ Partial update - preserves activeTab and subTab
      updateState({ ...currentState, filter })
    }),
  }),
  getMockFn: () => jest.mocked(require('../hooks/myHook').useMyHook),
})

it('preserves other state when updating one property', () => {
  const { result } = renderHook(() => useMyHook())
  
  // Initial state
  expect(result.current.activeTab).toBe('tab1')
  expect(result.current.subTab).toBe('sub1')
  expect(result.current.filter).toBe('all')
  
  // Update only activeTab
  act(() => {
    result.current.setActiveTab('tab2')
  })
  
  // ✅ Other properties preserved
  expect(result.current.activeTab).toBe('tab2')
  expect(result.current.subTab).toBe('sub1') // Still 'sub1'
  expect(result.current.filter).toBe('all')  // Still 'all'
})
```

**Key Points:**
- Always use spread operator: `updateState({ ...currentState, property: value })`
- `createMultiStatefulMock` handles partial updates correctly
- Each update preserves all other state properties

### State Reset Timing

State reset must happen at the right time in `beforeEach` to ensure test isolation:

```typescript
beforeEach(() => {
  // ✅ Correct order:
  // 1. Clear all mocks first
  jest.clearAllMocks()
  
  // 2. Reset state to initial values
  myMock.resetState()
  
  // 3. Re-initialize mock with reset state
  jest.mocked(useMyHook).mockReturnValue(myMock.createMock())
})

// ❌ Wrong order - state reset after mock initialization won't work
beforeEach(() => {
  jest.mocked(useMyHook).mockReturnValue(myMock.createMock()) // Uses old state
  jest.clearAllMocks()
  myMock.resetState() // Too late - mock already initialized
})
```

**Key Points:**
- Reset state AFTER clearing mocks but BEFORE re-initializing
- The order ensures each test starts with clean state
- Mock return value reflects the reset state

### Nested State Updates

When state updates trigger other state updates (e.g., cascading updates), handle them carefully:

```typescript
const cascadingMock = createMultiStatefulMock<
  { tab: string; subTab: string; mode: 'view' | 'edit' },
  UseMyHookReturn
>({
  initialState: {
    tab: 'tab1',
    subTab: 'sub1',
    mode: 'view',
  },
  createMockFn: (currentState, updateState) => ({
    tab: currentState.tab,
    subTab: currentState.subTab,
    mode: currentState.mode,
    setTab: jest.fn((tab) => {
      // Update tab
      updateState({ ...currentState, tab })
      
      // ✅ Nested update: Reset subTab when tab changes
      // Note: This creates a second updateState call
      updateState({ ...currentState, tab, subTab: 'default' })
    }),
    setSubTab: jest.fn((subTab) => {
      updateState({ ...currentState, subTab })
    }),
    setMode: jest.fn((mode) => {
      updateState({ ...currentState, mode })
    }),
  }),
  getMockFn: () => jest.mocked(require('../hooks/myHook').useMyHook),
})

it('handles nested state updates', () => {
  const { result } = renderHook(() => useMyHook())
  
  // Set initial subTab
  act(() => {
    result.current.setSubTab('custom')
  })
  expect(result.current.subTab).toBe('custom')
  
  // Changing tab triggers nested update to reset subTab
  act(() => {
    result.current.setTab('tab2')
  })
  
  // ✅ Both updates applied
  expect(result.current.tab).toBe('tab2')
  expect(result.current.subTab).toBe('default') // Reset by nested update
})
```

**Alternative Approach (Better):**

For cleaner code, handle cascading logic in a single update:

```typescript
setTab: jest.fn((tab) => {
  // ✅ Single update with all changes
  updateState({
    ...currentState,
    tab,
    subTab: 'default', // Reset as part of same update
  })
}),
```

**Key Points:**
- Multiple `updateState()` calls work but can be harder to reason about
- Prefer single `updateState()` with all changes when possible
- Each `updateState()` immediately updates the mock return value
- Test that nested updates work as expected
