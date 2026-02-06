# Real Hook Evaluation: useMarketplaceTabs

**Date:** January 26, 2026  
**Phase:** Phase 4 - Evaluate Using Real Hook Instead of Mock  
**Hook:** `useMarketplaceTabs`

---

## Executive Summary

**Recommendation:** ✅ **Use Real Hook**

The `useMarketplaceTabs` hook is simple, has no external dependencies, and is already well-tested. Using the real hook would:
- Test actual behavior instead of mock behavior
- Catch real bugs in the hook
- Reduce maintenance burden
- Improve test reliability

**Complexity:** Low - Hook only uses React's `useState`, no dependencies to mock

---

## Task 4.1: Research Real Hook Usage

### 4.1.1: Review `useMarketplaceTabs` Hook Implementation

**File:** `frontend/src/hooks/marketplace/useMarketplaceTabs.ts`

**Code:**
```typescript
export function useMarketplaceTabs(): UseMarketplaceTabsReturn {
  const [activeTab, setActiveTab] = useState<TabType>(MARKETPLACE_TABS.AGENTS)
  const [repositorySubTab, setRepositorySubTab] = useState<RepositorySubTabType>(
    REPOSITORY_SUB_TABS.WORKFLOWS
  )

  const isAgentsTab = activeTab === MARKETPLACE_TABS.AGENTS
  const isRepositoryTab = activeTab === MARKETPLACE_TABS.REPOSITORY
  const isWorkflowsOfWorkflowsTab = activeTab === MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS
  const isRepositoryWorkflowsSubTab = isRepositoryTab && repositorySubTab === REPOSITORY_SUB_TABS.WORKFLOWS
  const isRepositoryAgentsSubTab = isRepositoryTab && repositorySubTab === REPOSITORY_SUB_TABS.AGENTS

  return {
    activeTab,
    repositorySubTab,
    setActiveTab,
    setRepositorySubTab,
    isAgentsTab,
    isRepositoryTab,
    isWorkflowsOfWorkflowsTab,
    isRepositoryWorkflowsSubTab,
    isRepositoryAgentsSubTab,
  }
}
```

**Findings:**
- ✅ **Simple Implementation:** Only uses React's `useState` hook
- ✅ **No External Dependencies:** No API calls, no storage, no context
- ✅ **Pure Logic:** Just state management and computed properties
- ✅ **Well-Tested:** Has dedicated test file with comprehensive coverage

---

### 4.1.2: Check Hook Dependencies

**Dependencies Analysis:**

1. **React `useState`:**
   - ✅ Built-in React hook
   - ✅ No mocking needed
   - ✅ Works in test environment

2. **Constants (`MARKETPLACE_TABS`, `REPOSITORY_SUB_TABS`):**
   - ✅ Exported constants
   - ✅ No mocking needed
   - ✅ Already imported in tests

3. **No Other Dependencies:**
   - ✅ No API calls
   - ✅ No storage access
   - ✅ No context dependencies
   - ✅ No external services

**Conclusion:** Hook has **zero external dependencies** that need mocking.

---

### 4.1.3: Identify What Would Need to Be Mocked

**Answer:** **Nothing!**

The hook only uses:
- React's `useState` (works in test environment)
- Constants (already available)
- No external dependencies

**No mocking required** to use the real hook.

---

### 4.1.4: Evaluate Complexity vs Benefits

**Complexity Analysis:**

| Aspect | Mock Approach | Real Hook Approach |
|--------|---------------|-------------------|
| **Setup Complexity** | Medium (stateful mock utility) | Low (no setup needed) |
| **Maintenance** | Medium (mock must match hook) | Low (hook is source of truth) |
| **Dependencies** | None | None |
| **Test Reliability** | Medium (mock may drift) | High (tests real behavior) |
| **Bug Detection** | Low (tests mock, not hook) | High (catches hook bugs) |

**Benefits of Using Real Hook:**

1. ✅ **Tests Real Behavior:** Tests actual hook, not mock
2. ✅ **Catches Bugs:** Will catch bugs in hook implementation
3. ✅ **Less Maintenance:** No mock to keep in sync with hook
4. ✅ **Simpler Code:** No stateful mock setup needed
5. ✅ **Better Confidence:** Tests verify real implementation

**Complexity:** ✅ **Low** - No additional complexity, actually simpler

**Recommendation:** ✅ **Use Real Hook** - Benefits outweigh any complexity (which is minimal)

---

## Task 4.2: Create Proof of Concept

### Implementation Plan

**Steps:**
1. Remove mock for `useMarketplaceTabs` from `jest.mock()` call
2. Import real hook (already imported)
3. Update tests if needed (likely no changes needed)
4. Run tests to verify

**Expected Changes:**
- Remove `useMarketplaceTabs: jest.fn(...)` from mock declaration
- Tests should work without changes (hook is simple, no dependencies)

---

### 4.2.1: Remove Mock for `useMarketplaceTabs`

**Current Code (to remove):**
```typescript
jest.mock('../hooks/marketplace', () => ({
  // ... other mocks
  useMarketplaceTabs: jest.fn(() => marketplaceTabsMock.createMock()),
  // ... other mocks
}))
```

**New Code:**
```typescript
jest.mock('../hooks/marketplace', () => ({
  // ... other mocks
  // Remove: useMarketplaceTabs: jest.fn(...)
  // Real hook will be used instead
  // ... other mocks
}))
```

**Action:** Simply remove the mock line, don't mock the hook.

---

### 4.2.2: Mock Only Hook Dependencies If Needed

**Dependencies Check:**
- ✅ React `useState` - No mocking needed (works in tests)
- ✅ Constants - No mocking needed (already imported)

**Result:** **No dependencies to mock** - Hook can be used as-is.

---

### 4.2.3: Update Tests to Work with Real Hook

**Analysis:**
- Tests currently interact with hook through component
- Component calls `useMarketplaceTabs()` internally
- Tests click tabs, verify state changes
- Real hook should work identically to mock

**Expected Behavior:**
- Tests should work without changes
- Hook state will persist across renders (React behavior)
- Tab clicks will update real hook state
- Tests verify component behavior, which uses hook

**Potential Issues:**
- ⚠️ **State Persistence:** Real hook state persists across test renders
- ⚠️ **Test Isolation:** Need to ensure state resets between tests

**Solution:**
- Use `renderHook` wrapper or ensure component unmounts between tests
- Or wrap component in fresh provider for each test
- Current test structure should handle this (components are re-rendered)

---

### 4.2.4: Run Tests to Verify Functionality

**Test Command:**
```bash
npm test -- MarketplacePage.test.tsx
```

**Expected Result:**
- All 50 tests should pass
- No changes needed to test code
- Real hook behaves identically to mock

---

## Task 4.3: Compare Approaches

### 4.3.1: Compare Test Execution Time

**Current (Mock):**
- Execution Time: ~0.6 seconds
- 50 tests

**Expected (Real Hook):**
- Execution Time: ~0.6 seconds (similar)
- 50 tests
- Real hook is simple, no performance impact

**Result:** ✅ **No Performance Difference** - Hook is simple, no overhead

---

### 4.3.2: Compare Test Reliability

**Mock Approach:**
- ⚠️ Mock may drift from real hook
- ⚠️ Tests mock behavior, not real behavior
- ⚠️ Bugs in hook won't be caught

**Real Hook Approach:**
- ✅ Tests real behavior
- ✅ Catches bugs in hook
- ✅ More reliable

**Result:** ✅ **Real Hook More Reliable**

---

### 4.3.3: Compare Maintainability

**Mock Approach:**
- ⚠️ Mock must be updated when hook changes
- ⚠️ Two places to maintain (hook + mock)
- ⚠️ Risk of mock getting out of sync

**Real Hook Approach:**
- ✅ Single source of truth (hook)
- ✅ No mock to maintain
- ✅ Always in sync

**Result:** ✅ **Real Hook More Maintainable**

---

### 4.3.4: Compare Ability to Catch Bugs

**Mock Approach:**
- ❌ Tests mock, not hook
- ❌ Won't catch hook bugs
- ❌ Won't catch hook regressions

**Real Hook Approach:**
- ✅ Tests actual hook
- ✅ Catches hook bugs
- ✅ Catches hook regressions
- ✅ Tests integration with component

**Result:** ✅ **Real Hook Better at Catching Bugs**

---

## Task 4.4: Make Decision

### 4.4.1: Document Pros and Cons

**Pros of Using Real Hook:**
1. ✅ Tests real behavior
2. ✅ Catches bugs in hook
3. ✅ Less maintenance (no mock to sync)
4. ✅ Simpler code (no mock setup)
5. ✅ Better test reliability
6. ✅ Hook is simple, no dependencies

**Cons of Using Real Hook:**
1. ⚠️ State persists across renders (but this is React behavior)
2. ⚠️ Need to ensure test isolation (but current structure handles this)

**Pros of Mock Approach:**
1. ✅ Full control over state
2. ✅ Can test edge cases easily

**Cons of Mock Approach:**
1. ❌ Mock may drift from real hook
2. ❌ More code to maintain
3. ❌ Won't catch hook bugs
4. ❌ Tests mock, not real behavior

---

### 4.4.2: Make Recommendation

**Recommendation:** ✅ **Use Real Hook**

**Reasoning:**
1. Hook is simple with no dependencies
2. Benefits significantly outweigh any drawbacks
3. Tests will be more reliable and catch real bugs
4. Less code to maintain
5. Current mock approach adds complexity without clear benefit

**Implementation:**
- Remove mock for `useMarketplaceTabs`
- Use real hook (already imported)
- Tests should work without changes
- Verify all tests pass

---

### 4.4.3: Either Implement or Document Why Not

**Decision:** ✅ **Implement**

**Rationale:**
- Clear benefits
- Low risk (hook is simple)
- Easy to implement
- Improves test quality

**Next Steps:**
- Implement the change
- Run tests to verify
- Document the change

---

## Conclusion

**Phase 4 Status:** ✅ **Recommendation: Use Real Hook**

The evaluation clearly shows that using the real `useMarketplaceTabs` hook is the better approach. The hook is simple, has no dependencies, and using it will improve test quality and reduce maintenance burden.

**Next Action:** Implement the change to use the real hook instead of the mock.
