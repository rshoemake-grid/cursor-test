# Step 1.1 Status: Already Implemented - Refinement Guide

**Date:** January 26, 2026  
**Status:** ✅ Implemented (with potential improvements)  
**File:** `frontend/src/pages/MarketplacePage.test.tsx`

---

## Current Implementation Status

### ✅ Already Complete

Step 1.1 has **already been implemented** in the test file. The following exists:

1. **State Variables** (lines 21-22):
   ```typescript
   let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
   let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'
   ```

2. **Helper Function** (lines 24-55):
   ```typescript
   const createMockUseMarketplaceTabs = () => {
     const mockFn = jest.mocked(require('../hooks/marketplace').useMarketplaceTabs)
     return {
       activeTab: mockActiveTab,
       repositorySubTab: mockRepositorySubTab,
       setActiveTab: jest.fn((tab) => { /* updates state */ }),
       setRepositorySubTab: jest.fn((subTab) => { /* updates state */ }),
       // ... computed properties
     }
   }
   ```

3. **Mock Declaration** (line 125):
   ```typescript
   useMarketplaceTabs: jest.fn(() => createMockUseMarketplaceTabs()),
   ```

4. **State Reset** (lines 192-193):
   ```typescript
   beforeEach(() => {
     mockActiveTab = 'agents'
     mockRepositorySubTab = 'workflows'
     // ...
   })
   ```

---

## Potential Refinements

### Issue 1: Using `require()` in Mock Function

**Current Code (line 30):**
```typescript
const mockFn = jest.mocked(require('../hooks/marketplace').useMarketplaceTabs)
```

**Potential Problems:**
- `require()` may not work correctly in Jest module system
- May cause circular dependency issues
- Type safety may be compromised

**Recommended Refinement:**

**Option A: Import and use jest.mocked()**
```typescript
import { useMarketplaceTabs } from '../hooks/marketplace'

const createMockUseMarketplaceTabs = () => {
  return {
    activeTab: mockActiveTab,
    repositorySubTab: mockRepositorySubTab,
    setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
      mockActiveTab = tab
      // Update mock return value
      jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
    }),
    // ... rest of implementation
  }
}
```

**Option B: Store mock reference**
```typescript
// At top of file, after mock declaration
let mockUseMarketplaceTabsRef: jest.Mock

// In createMockUseMarketplaceTabs
const createMockUseMarketplaceTabs = () => {
  return {
    // ... properties
    setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
      mockActiveTab = tab
      if (mockUseMarketplaceTabsRef) {
        mockUseMarketplaceTabsRef.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
  }
}

// In jest.mock block
jest.mock('../hooks/marketplace', () => ({
  // ...
  useMarketplaceTabs: (mockUseMarketplaceTabsRef = jest.fn(() => createMockUseMarketplaceTabs())),
}))
```

**Option C: Use closure pattern**
```typescript
// Create factory that captures mock reference
const createMockFactory = () => {
  let mockRef: jest.Mock | null = null
  
  const createMock = () => ({
    // ... properties
    setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
      mockActiveTab = tab
      if (mockRef) {
        mockRef.mockReturnValue(createMock())
      }
    }),
  })
  
  return { createMock, setMockRef: (ref: jest.Mock) => { mockRef = ref } }
}

const { createMock, setMockRef } = createMockFactory()
const createMockUseMarketplaceTabs = createMock

// In jest.mock, after creating mock
jest.mock('../hooks/marketplace', () => {
  const mockFn = jest.fn(() => createMockUseMarketplaceTabs())
  setMockRef(mockFn)
  return {
    // ...
    useMarketplaceTabs: mockFn,
  }
})
```

---

### Issue 2: Component Re-rendering

**Current Implementation:**
The mock updates its return value, but React may not automatically re-render the component.

**Current Test Approach (line 514):**
```typescript
const { rerender } = renderWithRouter(<MarketplacePage />)
// ... click tab ...
rerender(<MarketplacePage />)  // Manual re-render
```

**Analysis:**
- Tests are using `rerender()` which is good
- However, this may not be necessary if mock updates trigger re-renders
- Need to verify if automatic re-rendering works

**Refinement Options:**

**Option A: Keep manual rerender** (Current - works)
- Explicit and clear
- Guarantees re-render happens
- No changes needed

**Option B: Use act() wrapper**
```typescript
await act(async () => {
  fireEvent.click(tab)
  // Wait for state propagation
  await new Promise(resolve => setTimeout(resolve, 0))
})
```

**Option C: Verify automatic re-render works**
- Remove `rerender()` calls
- Test if component re-renders automatically
- If not, keep manual rerender

---

### Issue 3: Mock Reference Access

**Current Approach:**
Using `require()` to get mock reference inside the function.

**Potential Issues:**
- `require()` may not work in Jest ESM mode
- May cause timing issues
- Type safety concerns

**Recommended Refinement:**

**Better Pattern:**
```typescript
// Store mock reference at module level
let mockUseMarketplaceTabsFn: jest.Mock

// Create helper
const createMockUseMarketplaceTabs = () => {
  return {
    activeTab: mockActiveTab,
    repositorySubTab: mockRepositorySubTab,
    setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
      mockActiveTab = tab
      // Use stored reference
      if (mockUseMarketplaceTabsFn) {
        mockUseMarketplaceTabsFn.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
    setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
      mockRepositorySubTab = subTab
      if (mockUseMarketplaceTabsFn) {
        mockUseMarketplaceTabsFn.mockReturnValue(createMockUseMarketplaceTabs())
      }
    }),
    // ... computed properties
  }
}

// In jest.mock
jest.mock('../hooks/marketplace', () => {
  const mockFn = jest.fn(() => createMockUseMarketplaceTabs())
  mockUseMarketplaceTabsFn = mockFn  // Store reference
  return {
    // ...
    useMarketplaceTabs: mockFn,
  }
})
```

---

## Verification of Current Implementation

### Check 1: Does Mock Update Work?

**Test:**
```typescript
it('should update mockActiveTab when setActiveTab is called', () => {
  const mock = createMockUseMarketplaceTabs()
  expect(mock.activeTab).toBe('agents')
  
  mock.setActiveTab('workflows-of-workflows')
  expect(mockActiveTab).toBe('workflows-of-workflows')
  
  const updatedMock = createMockUseMarketplaceTabs()
  expect(updatedMock.activeTab).toBe('workflows-of-workflows')
})
```

**Expected:** State should update correctly.

---

### Check 2: Does Mock Return Value Update?

**Test:**
```typescript
it('should update mock return value', () => {
  const initialMock = jest.mocked(useMarketplaceTabs).mock.results[0].value
  expect(initialMock.activeTab).toBe('agents')
  
  initialMock.setActiveTab('repository')
  
  const updatedMock = jest.mocked(useMarketplaceTabs).mock.results[0].value
  expect(updatedMock.activeTab).toBe('repository')
})
```

**Expected:** Mock return value should update.

---

### Check 3: Do Tests Pass?

**Command:**
```bash
npm test -- MarketplacePage.test.tsx -t "should fetch workflows-of-workflows|should display empty state"
```

**If tests still fail:**
- Mock implementation may need refinement
- Component re-rendering may need adjustment
- Test logic may need updates

---

## Recommended Action Plan

### If Tests Are Still Failing:

1. **Refine Mock Reference Access** (Priority: High)
   - Replace `require()` with module-level variable
   - Use pattern from "Issue 3" refinement

2. **Verify Re-rendering** (Priority: Medium)
   - Test if automatic re-render works
   - Keep `rerender()` if needed
   - Consider `act()` wrapper

3. **Test Mock Behavior** (Priority: Medium)
   - Add unit tests for mock helper
   - Verify state updates work
   - Check mock return value updates

### If Tests Are Passing:

1. **Code Review** (Priority: Low)
   - Review `require()` usage
   - Consider cleaner patterns
   - Document current approach

2. **Documentation** (Priority: Low)
   - Document why `require()` is used
   - Explain re-rendering approach
   - Note any limitations

---

## Current Implementation Analysis

### Strengths:
✅ State variables properly scoped  
✅ Helper function is clear and well-documented  
✅ Computed properties match hook logic  
✅ State reset in beforeEach  
✅ Mock uses helper function  

### Areas for Improvement:
⚠️ `require()` usage may be fragile  
⚠️ Mock reference access could be cleaner  
⚠️ Re-rendering approach could be more automatic  

---

## Next Steps

1. **Verify if tests pass** with current implementation
2. **If failing:** Apply refinements from this document
3. **If passing:** Consider optional improvements
4. **Proceed to Step 1.2** (Update Mock Declaration) - may already be done
5. **Proceed to Step 1.3** (State Reset) - already implemented
6. **Continue to Step 1.4-1.5** (Fix failing tests)

---

## Reference

### Current Implementation Location:
- **State Variables:** Lines 21-22
- **Helper Function:** Lines 24-55
- **Mock Declaration:** Line 125
- **State Reset:** Lines 192-193

### Related Documents:
- `STEP_1_1_DETAILED_SUBSTEPS.md` (detailed substeps guide)
- `MARKETPLACE_TEST_FIXES_PLAN.md` (overall plan)
- `MARKETPLACE_TEST_FAILURES_ANALYSIS.md` (analysis)
