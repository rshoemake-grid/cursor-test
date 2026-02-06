# Migration Guide: Inline Stateful Mock to Shared Utility

**Date:** January 26, 2026  
**Purpose:** Step-by-step guide for migrating inline stateful mock implementations to use the shared utility

---

## Overview

This guide walks through migrating from an inline stateful mock implementation to using the `createMultiStatefulMock` utility. This migration improves code maintainability, reusability, and consistency across test files.

---

## Before Migration

### Inline Implementation Pattern

```typescript
// Module-level state variables
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'

/**
 * Creates a stateful mock for useMarketplaceTabs
 * Tracks state changes when setActiveTab/setRepositorySubTab are called
 */
const createMockUseMarketplaceTabs = () => {
  // Get reference to the mocked function
  const mockFn = jest.mocked(require('../hooks/marketplace').useMarketplaceTabs)
  
  return {
    activeTab: mockActiveTab,
    repositorySubTab: mockRepositorySubTab,
    setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
      mockActiveTab = tab
      // Update mock return value for next render
      if (mockFn) {
        mockFn.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
    setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
      mockRepositorySubTab = subTab
      // Update mock return value for next render
      if (mockFn) {
        mockFn.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
    isAgentsTab: mockActiveTab === 'agents',
    isRepositoryTab: mockActiveTab === 'repository',
    isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
    isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
    isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
  }
}

// In jest.mock
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceTabs: jest.fn(() => createMockUseMarketplaceTabs()),
  // ... other mocks
}))

// In beforeEach
beforeEach(() => {
  // Reset mock state to defaults FIRST
  mockActiveTab = 'agents'
  mockRepositorySubTab = 'workflows'
  
  jest.clearAllMocks()
  
  // Reset useMarketplaceTabs mock to use fresh state AFTER clearing mocks
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
  // ... other setup
})
```

### Issues with Inline Implementation

1. **Code Duplication:** Each test file needs its own implementation
2. **Maintenance Burden:** Changes need to be replicated across files
3. **Inconsistency:** Different implementations may behave slightly differently
4. **No Type Safety:** Easy to make mistakes with state types
5. **Harder to Test:** Inline mocks are harder to unit test

---

## After Migration

### Using Shared Utility

```typescript
// Import the utility and types
import { createMultiStatefulMock } from '../test/utils/createStatefulMock'
import type { UseMarketplaceTabsReturn } from '../hooks/marketplace/useMarketplaceTabs'

/**
 * Stateful mock for useMarketplaceTabs hook
 * Uses shared utility for cleaner, maintainable code
 */
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

// In jest.mock
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceTabs: jest.fn(() => marketplaceTabsMock.createMock()),
  // ... other mocks
}))

// In beforeEach
beforeEach(() => {
  // Reset mock state to defaults FIRST
  marketplaceTabsMock.resetState()
  
  jest.clearAllMocks()
  
  // Reset useMarketplaceTabs mock to use fresh state AFTER clearing mocks
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(marketplaceTabsMock.createMock())
  // ... other setup
})
```

### Benefits of Migration

1. **Reusability:** Same utility used across all test files
2. **Maintainability:** Changes in one place benefit all tests
3. **Consistency:** All tests use the same pattern
4. **Type Safety:** TypeScript generics ensure type correctness
5. **Testability:** Utility itself is tested

---

## Step-by-Step Migration Process

### Step 1: Identify State Structure

**Action:** Map your current state variables to a state object.

**Before:**
```typescript
let mockActiveTab = 'agents'
let mockRepositorySubTab = 'workflows'
```

**After:**
```typescript
{
  activeTab: 'agents',
  repositorySubTab: 'workflows',
}
```

**Checklist:**
- [ ] List all module-level state variables
- [ ] Group related state into an object
- [ ] Define TypeScript type for state object
- [ ] Note initial values

---

### Step 2: Import Required Dependencies

**Action:** Add imports for the utility and types.

```typescript
import { createMultiStatefulMock } from '../test/utils/createStatefulMock'
import type { UseMarketplaceTabsReturn } from '../hooks/marketplace/useMarketplaceTabs'
```

**Checklist:**
- [ ] Import `createMultiStatefulMock` (or `createStatefulMock` for single state)
- [ ] Import hook return type for type safety
- [ ] Verify import paths are correct

---

### Step 3: Create Stateful Mock Instance

**Action:** Replace inline function with utility call.

**Key Points:**
- Use TypeScript generics: `createMultiStatefulMock<StateType, ReturnType>`
- Define `initialState` matching your state structure
- Implement `createMockFn` that returns mock object
- Call `updateState()` in setter functions
- Provide `getMockFn` that returns the Jest mock

**Checklist:**
- [ ] Define state type
- [ ] Set initial state values
- [ ] Map state to mock return properties
- [ ] Implement setters that call `updateState()`
- [ ] Add computed properties based on state
- [ ] Provide `getMockFn` implementation

---

### Step 4: Update Mock Declaration

**Action:** Update `jest.mock()` to use `createMock()`.

**Before:**
```typescript
useMarketplaceTabs: jest.fn(() => createMockUseMarketplaceTabs()),
```

**After:**
```typescript
useMarketplaceTabs: jest.fn(() => marketplaceTabsMock.createMock()),
```

**Checklist:**
- [ ] Replace inline function call with `mockInstance.createMock()`
- [ ] Verify mock name matches your instance name
- [ ] Ensure other mocks are unchanged

---

### Step 5: Update beforeEach Hook

**Action:** Replace manual state reset with `resetState()`.

**Before:**
```typescript
beforeEach(() => {
  mockActiveTab = 'agents'
  mockRepositorySubTab = 'workflows'
  jest.clearAllMocks()
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
})
```

**After:**
```typescript
beforeEach(() => {
  marketplaceTabsMock.resetState()
  jest.clearAllMocks()
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(marketplaceTabsMock.createMock())
})
```

**Checklist:**
- [ ] Replace manual state variable assignments with `resetState()`
- [ ] Keep `jest.clearAllMocks()` call
- [ ] Update mock return value initialization
- [ ] Maintain order: reset state → clear mocks → re-initialize mock

---

### Step 6: Remove Old Implementation

**Action:** Delete inline implementation code.

**Checklist:**
- [ ] Remove module-level state variables
- [ ] Remove inline `createMock` function
- [ ] Remove any helper functions no longer needed
- [ ] Clean up unused imports if any

---

### Step 7: Verify Migration

**Action:** Run tests to ensure everything works.

**Checklist:**
- [ ] Run test file individually
- [ ] Verify all tests pass
- [ ] Check for any console warnings
- [ ] Verify test execution time hasn't increased significantly
- [ ] Run full test suite to check for regressions

---

## Common Pitfalls and Solutions

### Pitfall 1: Forgetting to Call `updateState()`

**Symptom:** State doesn't update when setters are called.

**Solution:** Always call `updateState()` in setter functions:

```typescript
setActiveTab: jest.fn((tab) => {
  updateState({ activeTab: tab }) // ✅ Don't forget this!
}),
```

---

### Pitfall 2: Wrong State Update Pattern

**Symptom:** State updates but other properties are lost.

**Solution:** For `createMultiStatefulMock`, use partial updates:

```typescript
// ✅ Correct - preserves other properties
updateState({ activeTab: tab })

// ❌ Wrong - would replace entire state
updateState({ activeTab: tab, repositorySubTab: undefined })
```

---

### Pitfall 3: Not Resetting State in beforeEach

**Symptom:** Tests affect each other, state leaks between tests.

**Solution:** Always call `resetState()` in `beforeEach`:

```typescript
beforeEach(() => {
  marketplaceTabsMock.resetState() // ✅ Don't forget this!
  jest.clearAllMocks()
  // ... rest of setup
})
```

---

### Pitfall 4: Type Errors

**Symptom:** TypeScript errors about type mismatches.

**Solution:** Provide explicit type parameters:

```typescript
// ✅ Correct - explicit types
const mock = createMultiStatefulMock<StateType, ReturnType>({...})

// ❌ Wrong - TypeScript can't infer types
const mock = createMultiStatefulMock({...})
```

---

### Pitfall 5: Wrong Mock Function Reference

**Symptom:** Mock return value doesn't update.

**Solution:** Ensure `getMockFn()` returns the correct mock:

```typescript
getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
```

---

## Migration Checklist Summary

**Pre-Migration:**
- [ ] Understand current inline implementation
- [ ] Identify all state variables
- [ ] Map state to object structure
- [ ] Review shared utility documentation

**Migration:**
- [ ] Import utility and types
- [ ] Create stateful mock instance
- [ ] Update mock declaration
- [ ] Update beforeEach hook
- [ ] Remove old implementation

**Post-Migration:**
- [ ] Run tests individually
- [ ] Verify all tests pass
- [ ] Check for regressions
- [ ] Update documentation if needed

---

## Real-World Example

See `frontend/src/pages/MarketplacePage.test.tsx` for a complete, working example of the migrated implementation.

---

## Additional Resources

- `frontend/src/test/utils/README.md` - Complete utility documentation
- `frontend/src/test/utils/createStatefulMock.ts` - Utility implementation
- `frontend/src/test/utils/createStatefulMock.test.ts` - Utility tests

---

## Need Help?

If you encounter issues during migration:

1. Check the troubleshooting section in `frontend/src/test/utils/README.md`
2. Review the real-world example in `MarketplacePage.test.tsx`
3. Check utility tests for usage patterns
4. Verify your state structure matches the utility's expectations
