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

const { createMock, resetState } = createMultiStatefulMock({
  initialState: { tab: 'agents', subTab: 'workflows' },
  createMockFn: (currentState, updateState) => ({
    activeTab: currentState.tab,
    repositorySubTab: currentState.subTab,
    setActiveTab: jest.fn((tab) => updateState({ tab })),
    setRepositorySubTab: jest.fn((subTab) => updateState({ subTab })),
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
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

## Migration from Inline Implementation

If you have an inline stateful mock implementation, you can migrate it to use this utility:

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
