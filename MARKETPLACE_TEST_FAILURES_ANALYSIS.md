# MarketplacePage Test Failures Analysis

**Date:** January 26, 2026  
**Status:** 2 test failures identified  
**File:** `frontend/src/pages/MarketplacePage.test.tsx`  
**Priority:** Medium (not part of original 8 failures)

---

## Summary

Two tests are failing in `MarketplacePage.test.tsx`:
1. `should fetch workflows-of-workflows with workflow references` - Tab switching mock issue
2. `should display empty state for workflows` - Tab switching and empty state rendering issue

**Root Cause:** The mock for `useMarketplaceTabs` is static and doesn't respond to `setActiveTab` calls, causing tab switching to not work in tests.

---

## Failure 1: "should fetch workflows-of-workflows with workflow references"

### Test Location
**File:** `frontend/src/pages/MarketplacePage.test.tsx`  
**Line:** ~446-486

### Error Message
```
expect(jest.fn()).toHaveBeenCalledWith(...expected)

Expected: ObjectContaining {"activeTab": "workflows-of-workflows"}
Received: {"activeTab": "agents", ...}
```

### Test Flow
1. Test renders `MarketplacePage` component
2. Test clicks "Workflows of Workflows" tab button
3. Test expects `useMarketplaceData` to be called with `activeTab: 'workflows-of-workflows'`
4. **Failure:** Hook is called with `activeTab: 'agents'` instead

### Root Cause Analysis

**Problem:**
The mock for `useMarketplaceTabs` (lines 88-98) always returns a static object:
```typescript
useMarketplaceTabs: jest.fn(() => ({
  activeTab: 'agents',  // Always returns 'agents'
  repositorySubTab: 'workflows',
  setActiveTab: jest.fn(),  // Mock function that does nothing
  setRepositorySubTab: jest.fn(),
  // ... other properties
}))
```

**What Happens:**
1. Component calls `useMarketplaceTabs()` → gets mock with `activeTab: 'agents'`
2. User clicks "Workflows of Workflows" tab → calls `setActiveTab('workflows-of-workflows')`
3. Mock's `setActiveTab` is a jest.fn() that does nothing (doesn't update state)
4. Component re-renders → `useMarketplaceTabs()` called again → still returns `activeTab: 'agents'`
5. `useMarketplaceData` is called with `activeTab: 'agents'` → test fails

**Code Flow:**
```typescript
// Component (MarketplacePage.tsx:248-260)
<MarketplaceTabButton
  label="Workflows of Workflows"
  onClick={() => setActiveTab(MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS)}
/>

// Hook usage (MarketplacePage.tsx:41-52)
const tabs = useMarketplaceTabs();  // Returns mock with activeTab: 'agents'
const { activeTab, setActiveTab } = tabs;

// Data hook (MarketplacePage.tsx:70-85)
const marketplaceData = useMarketplaceData({
  activeTab,  // Always 'agents' because mock doesn't update
  // ... other props
});
```

### Impact
- **Severity:** Medium - Test failure, but functionality works in application
- **User Impact:** None - Tab switching works correctly in real application
- **Test Coverage:** Gap in test coverage for tab switching behavior

---

## Failure 2: "should display empty state for workflows"

### Test Location
**File:** `frontend/src/pages/MarketplacePage.test.tsx`  
**Line:** ~1001-1022

### Error Message
```
Unable to find an element with the text: /No workflows found/
```

### Test Flow
1. Test renders `MarketplacePage` with empty workflows data
2. Test clicks "Repository" tab
3. Test expects to find "No workflows found" text
4. **Failure:** Text not found (timeout after 3000ms)

### Root Cause Analysis

**Problem:**
Same issue as Failure 1 - the mock for `useMarketplaceTabs` doesn't update when tabs are clicked.

**What Happens:**
1. Component renders with `activeTab: 'agents'` (from mock)
2. User clicks "Repository" tab → calls `setActiveTab('repository')`
3. Mock's `setActiveTab` does nothing
4. Component still thinks `activeTab: 'agents'`
5. Repository tab content (including empty state) never renders
6. Test times out looking for "No workflows found" text

**Additional Issue:**
The test clicks "Repository" tab, but the empty state for workflows might be shown in a different context:
- Repository tab has sub-tabs: "Workflows" and "Agents"
- Empty state might only show when `repositorySubTab === 'workflows'`
- Test might need to also switch to the workflows sub-tab

**Code Flow:**
```typescript
// Component renders based on activeTab
{isRepositoryTab && isRepositoryWorkflowsSubTab && (
  // Empty state would render here
  <div>No workflows found</div>
)}

// But isRepositoryTab is false because activeTab is still 'agents'
```

### Impact
- **Severity:** Medium - Test failure, but functionality works in application
- **User Impact:** None - Empty states work correctly in real application
- **Test Coverage:** Gap in test coverage for empty state rendering

---

## Technical Details

### Mock Implementation Issue

**Current Mock (lines 88-98):**
```typescript
useMarketplaceTabs: jest.fn(() => ({
  activeTab: 'agents',  // Static value
  setActiveTab: jest.fn(),  // No-op function
  // ...
}))
```

**What's Missing:**
- State tracking - mock doesn't remember when `setActiveTab` is called
- Reactive updates - mock doesn't return different values on subsequent calls
- Integration with component re-renders

### How Real Hook Works

**Real Implementation (`useMarketplaceTabs.ts`):**
```typescript
export function useMarketplaceTabs(): UseMarketplaceTabsReturn {
  const [activeTab, setActiveTab] = useState<TabType>(MARKETPLACE_TABS.AGENTS)
  // ... state management
  
  return {
    activeTab,  // Returns current state
    setActiveTab,  // Updates state, triggers re-render
    // ...
  }
}
```

**Key Difference:**
- Real hook: Uses `useState` to track and update `activeTab`
- Mock hook: Returns static value, `setActiveTab` does nothing

---

## Solutions

### Solution 1: Create Stateful Mock (Recommended)

**Approach:** Create a mock that tracks state changes.

**Implementation:**
```typescript
// In test file, create a stateful mock
let mockActiveTab = 'agents'
let mockRepositorySubTab = 'workflows'

const mockUseMarketplaceTabs = jest.fn(() => ({
  activeTab: mockActiveTab,
  repositorySubTab: mockRepositorySubTab,
  setActiveTab: jest.fn((tab) => {
    mockActiveTab = tab
  }),
  setRepositorySubTab: jest.fn((subTab) => {
    mockRepositorySubTab = subTab
  }),
  isAgentsTab: mockActiveTab === 'agents',
  isRepositoryTab: mockActiveTab === 'repository',
  isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
  isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
  isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
}))

jest.mock('../hooks/marketplace', () => ({
  // ... other mocks
  useMarketplaceTabs: () => mockUseMarketplaceTabs(),
}))
```

**Pros:**
- Tests actual tab switching behavior
- More realistic test scenario
- Catches integration issues

**Cons:**
- More complex mock setup
- Need to reset state between tests

---

### Solution 2: Use Real Hook Implementation

**Approach:** Don't mock `useMarketplaceTabs`, use the real implementation.

**Implementation:**
```typescript
// Remove useMarketplaceTabs from the mock
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceData: (...args: any[]) => mockUseMarketplaceData(...args),
  // ... other mocks
  // Don't mock useMarketplaceTabs - use real implementation
}))
```

**Pros:**
- Tests real behavior
- No mock maintenance
- Catches real bugs

**Cons:**
- May require additional setup
- Tests become more integration-like

---

### Solution 3: Update Mock Per Test

**Approach:** Update the mock return value for specific tests.

**Implementation:**
```typescript
it('should fetch workflows-of-workflows with workflow references', async () => {
  // Override mock for this test
  const mockSetActiveTab = jest.fn()
  jest.mocked(useMarketplaceTabs).mockReturnValueOnce({
    activeTab: 'workflows-of-workflows',  // Set expected value
    repositorySubTab: 'workflows',
    setActiveTab: mockSetActiveTab,
    // ... other properties
  })
  
  renderWithRouter(<MarketplacePage />)
  
  // Test continues...
})
```

**Pros:**
- Simple per-test customization
- Clear test intent

**Cons:**
- Doesn't test actual tab switching
- Mock doesn't reflect user interaction

---

### Solution 4: Test Tab Button Click Directly

**Approach:** Verify that `setActiveTab` is called, not that the hook returns updated value.

**Implementation:**
```typescript
it('should fetch workflows-of-workflows with workflow references', async () => {
  const mockSetActiveTab = jest.fn()
  jest.mocked(useMarketplaceTabs).mockReturnValue({
    activeTab: 'agents',
    setActiveTab: mockSetActiveTab,
    // ...
  })
  
  renderWithRouter(<MarketplacePage />)
  
  const workflowsTab = screen.getByText(/Workflows of Workflows/)
  fireEvent.click(workflowsTab)
  
  // Verify setActiveTab was called with correct value
  expect(mockSetActiveTab).toHaveBeenCalledWith('workflows-of-workflows')
  
  // Then manually trigger re-render with updated tab
  jest.mocked(useMarketplaceTabs).mockReturnValue({
    activeTab: 'workflows-of-workflows',
    setActiveTab: mockSetActiveTab,
    // ...
  })
  
  // Re-render or verify hook was called with updated tab
})
```

**Pros:**
- Verifies button click behavior
- Can test hook integration separately

**Cons:**
- More complex test setup
- Doesn't test full integration

---

## Recommended Approach

**Use Solution 1 (Stateful Mock)** for the following reasons:

1. **Tests Real Behavior:** Verifies that clicking tabs actually changes the active tab
2. **Integration Testing:** Tests the interaction between component and hook
3. **Maintainable:** Clear mock implementation that's easy to understand
4. **Comprehensive:** Catches issues with tab state management

---

## Implementation Steps

### Step 1: Create Stateful Mock Helper

```typescript
// At top of test file
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'

const createMockUseMarketplaceTabs = () => ({
  activeTab: mockActiveTab,
  repositorySubTab: mockRepositorySubTab,
  setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
    mockActiveTab = tab
  }),
  setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
    mockRepositorySubTab = subTab
  }),
  isAgentsTab: mockActiveTab === 'agents',
  isRepositoryTab: mockActiveTab === 'repository',
  isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
  isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
  isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
})
```

### Step 2: Update Mock Declaration

```typescript
jest.mock('../hooks/marketplace', () => ({
  // ... other mocks
  useMarketplaceTabs: jest.fn(() => createMockUseMarketplaceTabs()),
}))
```

### Step 3: Reset State in beforeEach

```typescript
beforeEach(() => {
  mockActiveTab = 'agents'
  mockRepositorySubTab = 'workflows'
  jest.clearAllMocks()
})
```

### Step 4: Update Tests to Trigger Re-renders

```typescript
it('should fetch workflows-of-workflows with workflow references', async () => {
  renderWithRouter(<MarketplacePage />)
  
  const workflowsTab = screen.getByText(/Workflows of Workflows/)
  fireEvent.click(workflowsTab)
  
  // Force re-render by updating mock return value
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
  
  await waitForWithTimeout(() => {
    expect(mockUseMarketplaceData).toHaveBeenCalledWith(
      expect.objectContaining({ activeTab: 'workflows-of-workflows' })
    )
  })
})
```

---

## Additional Considerations

### Test 2: Empty State Issue

For the "should display empty state for workflows" test:

1. **Check if Repository sub-tab needs to be set:**
   - Repository tab has sub-tabs: "Workflows" and "Agents"
   - Empty state might only show for workflows sub-tab
   - Test might need: `setActiveTab('repository')` AND `setRepositorySubTab('workflows')`

2. **Verify empty state rendering logic:**
   - Check `MarketplaceTabContent` component
   - Verify when empty state is shown
   - Ensure test data matches conditions

3. **Check loading states:**
   - Empty state might only show when `loading: false`
   - Verify mock returns `loading: false`

---

## Related Files

### Test Files:
- `frontend/src/pages/MarketplacePage.test.tsx` (failing tests)

### Implementation Files:
- `frontend/src/pages/MarketplacePage.tsx` (component)
- `frontend/src/hooks/marketplace/useMarketplaceTabs.ts` (hook)
- `frontend/src/components/marketplace/MarketplaceTabButton.tsx` (tab button)
- `frontend/src/components/marketplace/MarketplaceTabContent.tsx` (tab content)

---

## Impact Assessment

### Current Status:
- **Test Failures:** 2
- **Functionality:** Working correctly in application
- **User Impact:** None

### Priority:
- **Medium** - Tests need fixing for CI/CD reliability
- **Not Critical** - Functionality works, only test issues

### Risk:
- **Low** - Fixing tests won't affect application behavior
- **Isolation** - These failures are separate from original 8 failures

---

## Next Steps

1. **Implement stateful mock** for `useMarketplaceTabs`
2. **Update failing tests** to work with stateful mock
3. **Verify empty state rendering** logic for Test 2
4. **Run full test suite** to ensure no regressions
5. **Document mock pattern** for future reference

---

## Notes

- These failures are **not related** to the original 8 failures documented in `TEST_FAILURES_ANALYSIS.md`
- The original 8 failures have been resolved (InputConfiguration ✅, useWebSocket mostly ✅)
- These are separate test infrastructure issues with mocking
- Fixing these will improve test reliability and coverage
