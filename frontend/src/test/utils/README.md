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
