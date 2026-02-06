# Migration Guide: Inline Stateful Mock to Shared Utility

**Date:** January 26, 2026  
**Purpose:** Step-by-step guide for migrating from inline stateful mock implementations to the shared `createMultiStatefulMock` utility.

---

## Overview

This guide walks through migrating an inline stateful mock implementation to use the shared `createMultiStatefulMock` utility, using the MarketplacePage test migration as a real-world example.

---

## Before: Inline Implementation

### Original Code Structure

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
  // ... rest of setup
})
```

### Issues with Inline Implementation

1. **Code Duplication:** Pattern repeated across multiple test files
2. **Maintenance Burden:** Changes require updates in multiple places
3. **Inconsistency:** Different implementations may behave slightly differently
4. **Testing:** Harder to test the mock pattern itself
5. **Type Safety:** Less type-safe without utility generics

---

## After: Shared Utility Implementation

### Migrated Code Structure

```typescript
// Import the utility
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
  // ... rest of setup
})
```

### Benefits of Shared Utility

1. **Reusability:** Pattern can be used across multiple test files
2. **Consistency:** Same behavior everywhere
3. **Maintainability:** Changes in one place affect all usages
4. **Type Safety:** Full TypeScript generics support
5. **Testability:** Utility itself is tested
6. **Documentation:** Centralized documentation

---

## Step-by-Step Migration Process

### Step 1: Import the Utility

```typescript
import { createMultiStatefulMock } from '../test/utils/createStatefulMock'
import type { UseMarketplaceTabsReturn } from '../hooks/marketplace/useMarketplaceTabs'
```

**Action:** Add imports at the top of your test file.

---

### Step 2: Define State Type

Identify your state structure:

```typescript
// Before: Separate variables
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'

// After: Single state object type
type StateType = {
  activeTab: 'agents' | 'repository' | 'workflows-of-workflows'
  repositorySubTab: 'workflows' | 'agents'
}
```

**Action:** Combine separate state variables into a single object type.

---

### Step 3: Create Mock Using Utility

Replace your inline function with the utility:

```typescript
const marketplaceTabsMock = createMultiStatefulMock<StateType, UseMarketplaceTabsReturn>({
  initialState: {
    activeTab: 'agents',
    repositorySubTab: 'workflows',
  },
  createMockFn: (currentState, updateState) => ({
    // Map state to mock return value
    activeTab: currentState.activeTab,
    repositorySubTab: currentState.repositorySubTab,
    
    // Update state in setters
    setActiveTab: jest.fn((tab) => {
      updateState({ activeTab: tab })
    }),
    setRepositorySubTab: jest.fn((subTab) => {
      updateState({ repositorySubTab: subTab })
    }),
    
    // Computed properties
    isAgentsTab: currentState.activeTab === 'agents',
    // ... etc
  }),
  getMockFn: () => jest.mocked(require('../hooks/marketplace').useMarketplaceTabs),
})
```

**Key Changes:**
- Use `currentState` instead of module-level variables
- Call `updateState()` instead of directly mutating variables
- Use `updateState({ key: value })` for partial updates

---

### Step 4: Update Mock Declaration

```typescript
// Before
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceTabs: jest.fn(() => createMockUseMarketplaceTabs()),
}))

// After
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceTabs: jest.fn(() => marketplaceTabsMock.createMock()),
}))
```

**Action:** Replace function call with `createMock()` method.

---

### Step 5: Update beforeEach

```typescript
// Before
beforeEach(() => {
  mockActiveTab = 'agents'
  mockRepositorySubTab = 'workflows'
  jest.clearAllMocks()
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
})

// After
beforeEach(() => {
  marketplaceTabsMock.resetState()
  jest.clearAllMocks()
  const { useMarketplaceTabs } = require('../hooks/marketplace')
  jest.mocked(useMarketplaceTabs).mockReturnValue(marketplaceTabsMock.createMock())
})
```

**Action:** Replace manual state reset with `resetState()` method.

---

### Step 6: Remove Old Code

Delete:
- Module-level state variables (`let mockActiveTab`, etc.)
- Inline `createMockUseMarketplaceTabs` function

**Action:** Clean up old implementation.

---

### Step 7: Verify Tests Pass

```bash
npm test -- YourTestFile.test.tsx
```

**Action:** Run tests to ensure everything still works.

---

## Common Pitfalls and Solutions

### Pitfall 1: Forgetting to Call `updateState()`

**Symptom:** State doesn't update when setters are called.

**Solution:** Always call `updateState()` in setter functions:

```typescript
// ❌ Wrong
setActiveTab: jest.fn((tab) => {
  // Missing updateState call
})

// ✅ Correct
setActiveTab: jest.fn((tab) => {
  updateState({ activeTab: tab })
})
```

---

### Pitfall 2: Not Resetting State in beforeEach

**Symptom:** Tests affect each other, state leaks between tests.

**Solution:** Always call `resetState()` in `beforeEach`:

```typescript
beforeEach(() => {
  marketplaceTabsMock.resetState() // ✅ Don't forget this!
  jest.clearAllMocks()
  // ... rest
})
```

---

### Pitfall 3: Wrong State Update Pattern

**Symptom:** Only one state property updates, others reset.

**Solution:** Use partial updates for multi-state mocks:

```typescript
// ❌ Wrong - replaces entire state
updateState({ activeTab: tab })

// ✅ Correct - partial update preserves other properties
updateState({ activeTab: tab })
```

**Note:** `createMultiStatefulMock` handles partial updates automatically.

---

### Pitfall 4: Type Errors

**Symptom:** TypeScript errors about type mismatches.

**Solution:** Provide explicit type parameters:

```typescript
// ✅ Explicit types
const mock = createMultiStatefulMock<
  { activeTab: TabType; repositorySubTab: SubTabType },
  UseMarketplaceTabsReturn
>({
  // ...
})
```

---

## Verification Checklist

After migration, verify:

- [ ] All imports are correct
- [ ] State type matches hook's state structure
- [ ] `createMockFn` return type matches hook return type
- [ ] All setters call `updateState()`
- [ ] `beforeEach` calls `resetState()`
- [ ] Mock declaration uses `createMock()`
- [ ] Old code is removed
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Test execution time hasn't increased significantly

---

## Real-World Example: MarketplacePage Migration

See `frontend/src/pages/MarketplacePage.test.tsx` for a complete, working example of the migrated code.

**Key Points:**
- Uses `createMultiStatefulMock` for multiple state values
- Properly typed with TypeScript generics
- All 50 tests passing
- Clean, maintainable code

---

## Next Steps

After migration:

1. **Run Tests:** Verify all tests pass
2. **Code Review:** Review for any improvements
3. **Documentation:** Update any related docs
4. **Share:** Let team know about the pattern

---

## Related Documentation

- `frontend/src/test/utils/README.md` - Utility documentation
- `frontend/src/test/utils/createStatefulMock.ts` - Implementation
- `frontend/src/pages/MarketplacePage.test.tsx` - Real-world example
