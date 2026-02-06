# MarketplacePage Test Fixes Implementation Plan

**Date:** January 26, 2026  
**Status:** Ready for Implementation  
**Estimated Time:** 1-1.5 hours  
**Priority:** Medium

---

## Overview

This plan provides step-by-step instructions to fix the 2 failing tests in `MarketplacePage.test.tsx`:
1. `should fetch workflows-of-workflows with workflow references`
2. `should display empty state for workflows`

**Root Cause:** Static mock for `useMarketplaceTabs` doesn't respond to `setActiveTab` calls.

**Solution:** Implement a stateful mock that tracks tab state changes.

---

## Pre-Implementation Verification

### Step 0.1: Verify Current Failures

**Action:** Confirm the exact test failures.

**Commands:**
```bash
cd frontend

# Run MarketplacePage tests
npm test -- MarketplacePage.test.tsx

# Run specific failing tests
npm test -- MarketplacePage.test.tsx -t "should fetch workflows-of-workflows"
npm test -- MarketplacePage.test.tsx -t "should display empty state for workflows"
```

**Expected Output:**
- 2 tests failing
- Error messages showing `activeTab: 'agents'` instead of expected values

**Document Findings:**
- [ ] Note exact error messages
- [ ] Verify mock implementation location
- [ ] Check current mock setup

---

## Implementation Steps

### Step 1.1: Create Stateful Mock Helper Function

**File:** `frontend/src/pages/MarketplacePage.test.tsx`

**Location:** After imports, before `describe` block (around line 20-50)

**Action:** Create a helper function that returns a stateful mock.

**Code to Add:**
```typescript
// Add after imports, before describe block
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'

/**
 * Creates a stateful mock for useMarketplaceTabs
 * Tracks state changes when setActiveTab/setRepositorySubTab are called
 */
const createMockUseMarketplaceTabs = () => ({
  activeTab: mockActiveTab,
  repositorySubTab: mockRepositorySubTab,
  setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
    mockActiveTab = tab
    // Trigger re-render by updating the mock return value
    jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
  }),
  setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
    mockRepositorySubTab = subTab
    jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
  }),
  isAgentsTab: mockActiveTab === 'agents',
  isRepositoryTab: mockActiveTab === 'repository',
  isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
  isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
  isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
})
```

**Verification:**
```bash
# Check syntax
cd frontend
npx tsc --noEmit src/pages/MarketplacePage.test.tsx
```

---

### Step 1.2: Update Mock Declaration

**File:** `frontend/src/pages/MarketplacePage.test.tsx`

**Location:** Around line 68-98 (mock declaration section)

**Action:** Replace static mock with stateful mock helper.

**Current Code (to replace):**
```typescript
useMarketplaceTabs: jest.fn(() => ({
  activeTab: 'agents',
  repositorySubTab: 'workflows',
  setActiveTab: jest.fn(),
  setRepositorySubTab: jest.fn(),
  isAgentsTab: true,
  isRepositoryTab: false,
  isWorkflowsOfWorkflowsTab: false,
  isRepositoryWorkflowsSubTab: false,
  isRepositoryAgentsSubTab: false,
})),
```

**New Code:**
```typescript
useMarketplaceTabs: jest.fn(() => createMockUseMarketplaceTabs()),
```

**Step-by-step:**
1. [ ] Find the `jest.mock('../hooks/marketplace', ...)` block
2. [ ] Locate `useMarketplaceTabs` mock (around line 88)
3. [ ] Replace entire object with: `jest.fn(() => createMockUseMarketplaceTabs())`
4. [ ] Ensure `createMockUseMarketplaceTabs` is defined before the mock

**Verification:**
```bash
# Check that mock is updated
grep -A 2 "useMarketplaceTabs:" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** Should show `jest.fn(() => createMockUseMarketplaceTabs())`

---

### Step 1.3: Add State Reset in beforeEach

**File:** `frontend/src/pages/MarketplacePage.test.tsx`

**Location:** Find existing `beforeEach` block or create one (around line 120-150)

**Action:** Reset mock state before each test.

**Code to Add/Update:**
```typescript
beforeEach(() => {
  // Reset mock state to defaults
  mockActiveTab = 'agents'
  mockRepositorySubTab = 'workflows'
  
  // Clear all mocks
  jest.clearAllMocks()
  
  // Reset the mock return value
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
})
```

**Step-by-step:**
1. [ ] Find or create `beforeEach` block
2. [ ] Add state reset: `mockActiveTab = 'agents'`
3. [ ] Add state reset: `mockRepositorySubTab = 'workflows'`
4. [ ] Add mock reset: `jest.mocked(useMarketplaceTabs).mockReturnValue(...)`
5. [ ] Ensure `jest.clearAllMocks()` is called

**Verification:**
```bash
# Check beforeEach exists
grep -A 5 "beforeEach" frontend/src/pages/MarketplacePage.test.tsx | head -10
```

---

### Step 1.4: Fix Test 1 - "should fetch workflows-of-workflows with workflow references"

**File:** `frontend/src/pages/MarketplacePage.test.tsx`

**Location:** Around line 446-486

**Action:** Update test to work with stateful mock and trigger re-render.

**Current Test Code:**
```typescript
it('should fetch workflows-of-workflows with workflow references', async () => {
  // ... setup code ...
  
  await waitForWithTimeout(() => {
    const workflowsOfWorkflowsTab = screen.getByText(/Workflows of Workflows/)
    fireEvent.click(workflowsOfWorkflowsTab)
  })

  // Verify the hook was called with workflows-of-workflows tab
  await waitForWithTimeout(() => {
    expect(mockUseMarketplaceData).toHaveBeenCalledWith(
      expect.objectContaining({ activeTab: 'workflows-of-workflows' })
    )
  })
})
```

**Updated Test Code:**
```typescript
it('should fetch workflows-of-workflows with workflow references', async () => {
  const mockWorkflowsOfWorkflows = [
    {
      id: 'wf1',
      name: 'Workflow 1',
      description: 'A workflow of workflows',
      tags: ['workflow-of-workflows'],
    },
  ]

  // Mock the hook to return workflows-of-workflows data
  mockUseMarketplaceData.mockReturnValueOnce({
    templates: [],
    workflowsOfWorkflows: mockWorkflowsOfWorkflows,
    agents: [],
    repositoryAgents: [],
    loading: false,
    setTemplates: jest.fn(),
    setWorkflowsOfWorkflows: jest.fn(),
    setAgents: jest.fn(),
    setRepositoryAgents: jest.fn(),
    fetchTemplates: jest.fn(),
    fetchWorkflowsOfWorkflows: jest.fn(),
    fetchAgents: jest.fn(),
    fetchRepositoryAgents: jest.fn(),
  })

  renderWithRouter(<MarketplacePage />)

  // Click the workflows-of-workflows tab
  await waitForWithTimeout(() => {
    const workflowsOfWorkflowsTab = screen.getByText(/Workflows of Workflows/)
    fireEvent.click(workflowsOfWorkflowsTab)
  })

  // Wait for component to re-render with updated tab state
  // The stateful mock should have updated mockActiveTab
  await waitForWithTimeout(() => {
    // Verify useMarketplaceData was called with workflows-of-workflows tab
    expect(mockUseMarketplaceData).toHaveBeenCalledWith(
      expect.objectContaining({ activeTab: 'workflows-of-workflows' })
    )
  }, 2000)
})
```

**Key Changes:**
1. [ ] Test clicks tab button (already done)
2. [ ] Stateful mock updates `mockActiveTab` automatically
3. [ ] Component re-renders with new tab state
4. [ ] `useMarketplaceData` receives updated `activeTab`

**Alternative Approach (if stateful mock doesn't trigger re-render):**
```typescript
it('should fetch workflows-of-workflows with workflow references', async () => {
  // ... setup code ...
  
  const { rerender } = renderWithRouter(<MarketplacePage />)

  await waitForWithTimeout(() => {
    const workflowsOfWorkflowsTab = screen.getByText(/Workflows of Workflows/)
    fireEvent.click(workflowsOfWorkflowsTab)
  })

  // Manually trigger re-render with updated tab state
  rerender(<MarketplacePage />)

  await waitForWithTimeout(() => {
    expect(mockUseMarketplaceData).toHaveBeenCalledWith(
      expect.objectContaining({ activeTab: 'workflows-of-workflows' })
    )
  })
})
```

**Verification:**
```bash
npm test -- MarketplacePage.test.tsx -t "should fetch workflows-of-workflows"
```

**Expected:** Test should pass ✅

---

### Step 1.5: Fix Test 2 - "should display empty state for workflows"

**File:** `frontend/src/pages/MarketplacePage.test.tsx`

**Location:** Around line 1001-1022

**Action:** Update test to switch to Repository tab and workflows sub-tab, then verify empty state.

**Current Test Code:**
```typescript
it('should display empty state for workflows', async () => {
  const mockHttpClient: HttpClient = {
    get: jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }

  renderWithRouter(<MarketplacePage httpClient={mockHttpClient} />)

  await waitForWithTimeout(() => {
    const repositoryTab = screen.getByText(/Repository/)
    fireEvent.click(repositoryTab)
  })

  await waitForWithTimeout(() => {
    expect(screen.getByText(/No workflows found/)).toBeInTheDocument()
  }, 3000)
})
```

**Updated Test Code:**
```typescript
it('should display empty state for workflows', async () => {
  const mockHttpClient: HttpClient = {
    get: jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }

  // Mock empty workflows data
  mockUseMarketplaceData.mockReturnValueOnce({
    templates: [],
    workflowsOfWorkflows: [],
    agents: [],
    repositoryAgents: [],
    loading: false,
    setTemplates: jest.fn(),
    setWorkflowsOfWorkflows: jest.fn(),
    setAgents: jest.fn(),
    setRepositoryAgents: jest.fn(),
    fetchTemplates: jest.fn(),
    fetchWorkflowsOfWorkflows: jest.fn(),
    fetchAgents: jest.fn(),
    fetchRepositoryAgents: jest.fn(),
  })

  const { rerender } = renderWithRouter(<MarketplacePage httpClient={mockHttpClient} />)

  // Click Repository tab
  await waitForWithTimeout(() => {
    const repositoryTab = screen.getByText(/Repository/)
    fireEvent.click(repositoryTab)
  })

  // Ensure we're on the workflows sub-tab (default is 'workflows')
  // If needed, click workflows sub-tab
  await waitForWithTimeout(() => {
    const workflowsSubTab = screen.queryByText(/Workflows/)
    if (workflowsSubTab && !mockRepositorySubTab) {
      fireEvent.click(workflowsSubTab)
    }
  })

  // Trigger re-render to apply tab state changes
  rerender(<MarketplacePage httpClient={mockHttpClient} />)

  // Wait for empty state to appear
  await waitForWithTimeout(() => {
    expect(screen.getByText(/No workflows found/)).toBeInTheDocument()
  }, 3000)
})
```

**Key Changes:**
1. [ ] Mock `useMarketplaceData` to return empty workflows
2. [ ] Click Repository tab (updates `mockActiveTab` to 'repository')
3. [ ] Ensure workflows sub-tab is active (default should be 'workflows')
4. [ ] Trigger re-render to apply state changes
5. [ ] Verify empty state text appears

**Alternative Approach (simpler):**
```typescript
it('should display empty state for workflows', async () => {
  // Set initial state to repository tab with workflows sub-tab
  mockActiveTab = 'repository'
  mockRepositorySubTab = 'workflows'
  
  const mockHttpClient: HttpClient = {
    get: jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }

  mockUseMarketplaceData.mockReturnValue({
    templates: [],
    workflowsOfWorkflows: [],
    agents: [],
    repositoryAgents: [],
    loading: false,
    // ... other properties
  })

  renderWithRouter(<MarketplacePage httpClient={mockHttpClient} />)

  // Empty state should be visible immediately
  await waitForWithTimeout(() => {
    expect(screen.getByText(/No workflows found/)).toBeInTheDocument()
  })
})
```

**Verification:**
```bash
npm test -- MarketplacePage.test.tsx -t "should display empty state for workflows"
```

**Expected:** Test should pass ✅

---

### Step 1.6: Verify Empty State Rendering Logic

**File:** `frontend/src/components/marketplace/MarketplaceTabContent.tsx`

**Action:** Check when empty state is rendered.

**Steps:**
1. [ ] Find `MarketplaceTabContent` component
2. [ ] Check conditions for showing "No workflows found"
3. [ ] Verify it checks `isRepositoryWorkflowsSubTab` and empty workflows
4. [ ] Ensure test data matches conditions

**If empty state logic is different:**
- [ ] Update test to match actual rendering conditions
- [ ] May need to check `templates` array instead of `workflowsOfWorkflows`
- [ ] May need different empty state text

**Verification:**
```bash
# Check empty state rendering
grep -n "No workflows found\|No.*found" frontend/src/components/marketplace/MarketplaceTabContent.tsx
```

---

### Step 1.7: Handle Component Re-rendering

**Issue:** React may not automatically re-render when mock state changes.

**Solution Options:**

**Option A: Use rerender from renderHook/render**
```typescript
const { rerender } = renderWithRouter(<MarketplacePage />)
// ... click tab ...
rerender(<MarketplacePage />)  // Force re-render
```

**Option B: Use act() wrapper**
```typescript
await act(async () => {
  fireEvent.click(tab)
  // Wait for state update
  await new Promise(resolve => setTimeout(resolve, 0))
})
```

**Option C: Update mock to trigger re-render**
```typescript
setActiveTab: jest.fn((tab) => {
  mockActiveTab = tab
  // Update mock return value
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
  // Component should re-render when hook returns new value
})
```

**Recommended:** Try Option C first (stateful mock with automatic update), fall back to Option A if needed.

---

## Verification Phase

### Step 2.1: Run Individual Tests

**Commands:**
```bash
cd frontend

# Run Test 1
npm test -- MarketplacePage.test.tsx -t "should fetch workflows-of-workflows"

# Run Test 2
npm test -- MarketplacePage.test.tsx -t "should display empty state"

# Run both failing tests
npm test -- MarketplacePage.test.tsx -t "should fetch workflows-of-workflows|should display empty state"
```

**Expected Result:** Both tests should pass ✅

**If tests still fail:**
- [ ] Check mock state is updating correctly
- [ ] Verify component is re-rendering
- [ ] Check empty state rendering conditions
- [ ] Review error messages for clues

---

### Step 2.2: Run Full MarketplacePage Test Suite

**Command:**
```bash
npm test -- MarketplacePage.test.tsx
```

**Expected Result:** All tests should pass ✅

**If other tests fail:**
- [ ] Check if state reset in `beforeEach` is working
- [ ] Verify no test isolation issues
- [ ] Ensure mock state doesn't leak between tests

---

### Step 2.3: Run Full Test Suite

**Command:**
```bash
npm test
```

**Expected Result:** 
- MarketplacePage tests: All passing ✅
- Overall: 2 fewer failures (from 2 to 0)

**If new failures appear:**
- [ ] Check if stateful mock affects other tests
- [ ] Verify mock isolation
- [ ] Review any new error messages

---

## Troubleshooting

### Issue: Mock state not updating

**Symptoms:**
- `mockActiveTab` stays as 'agents' after clicking tab
- `setActiveTab` is called but state doesn't change

**Solutions:**
1. Verify `setActiveTab` implementation updates `mockActiveTab`
2. Check that mock return value is updated
3. Ensure component re-renders after state change
4. Use `rerender()` if automatic re-render doesn't work

### Issue: Component not re-rendering

**Symptoms:**
- State updates but component doesn't reflect changes
- Tests timeout waiting for updated UI

**Solutions:**
1. Use `rerender()` after state changes
2. Wrap interactions in `act()`
3. Add small delay for state propagation
4. Check if React is detecting the change

### Issue: Empty state not appearing

**Symptoms:**
- Tab switches correctly but empty state doesn't show
- Test times out looking for "No workflows found"

**Solutions:**
1. Verify `isRepositoryWorkflowsSubTab` is true
2. Check that workflows array is empty
3. Verify `loading: false`
4. Check actual empty state text in component
5. May need to check `templates` instead of `workflowsOfWorkflows`

### Issue: Other tests failing after changes

**Symptoms:**
- Previously passing tests now fail
- Mock state leaking between tests

**Solutions:**
1. Ensure `beforeEach` resets state properly
2. Check `jest.clearAllMocks()` is called
3. Verify mock isolation
4. Reset state in `afterEach` if needed

---

## Alternative Implementation: Use Real Hook

If stateful mock proves too complex, consider using the real `useMarketplaceTabs` hook:

### Step A: Remove Mock for useMarketplaceTabs

**File:** `frontend/src/pages/MarketplacePage.test.tsx`

**Action:** Don't mock `useMarketplaceTabs`, use real implementation.

**Change:**
```typescript
jest.mock('../hooks/marketplace', () => ({
  useMarketplaceData: (...args: any[]) => mockUseMarketplaceData(...args),
  // ... other mocks
  // Remove: useMarketplaceTabs: jest.fn(...)
}))
```

**Pros:**
- Tests real behavior
- No mock maintenance
- Catches real bugs

**Cons:**
- May require additional setup
- Tests become more integration-like
- May need to mock dependencies of the hook

---

## Success Criteria

✅ Test 1 passes: "should fetch workflows-of-workflows with workflow references"  
✅ Test 2 passes: "should display empty state for workflows"  
✅ All other MarketplacePage tests still pass  
✅ No new test failures introduced  
✅ Mock state properly isolated between tests  
✅ Tests are maintainable and clear

---

## Implementation Checklist

### Setup
- [ ] Create `createMockUseMarketplaceTabs()` helper function
- [ ] Add state variables: `mockActiveTab`, `mockRepositorySubTab`
- [ ] Update mock declaration to use helper
- [ ] Add state reset in `beforeEach`

### Test Fixes
- [ ] Fix Test 1: "should fetch workflows-of-workflows"
- [ ] Fix Test 2: "should display empty state for workflows"
- [ ] Verify empty state rendering conditions
- [ ] Handle component re-rendering

### Verification
- [ ] Test 1 passes individually
- [ ] Test 2 passes individually
- [ ] All MarketplacePage tests pass
- [ ] Full test suite passes
- [ ] No regressions introduced

---

## Estimated Timeline

- **Step 1.1-1.3 (Setup):** 15-20 minutes
- **Step 1.4-1.5 (Fix Tests):** 20-30 minutes
- **Step 1.6-1.7 (Refinement):** 10-15 minutes
- **Step 2.1-2.3 (Verification):** 10-15 minutes
- **Total:** 55-80 minutes (1-1.5 hours)

**Buffer:** Add 30 minutes for troubleshooting and edge cases.

---

## Notes

- Start with stateful mock approach (Step 1.1-1.5)
- If stateful mock doesn't work, try using real hook (Alternative Implementation)
- Empty state test may need adjustment based on actual rendering logic
- Component re-rendering may require `rerender()` calls
- Test isolation is critical - ensure state resets properly

---

## Related Files

### Test Files:
- `frontend/src/pages/MarketplacePage.test.tsx` (file to modify)

### Implementation Files:
- `frontend/src/pages/MarketplacePage.tsx` (component)
- `frontend/src/hooks/marketplace/useMarketplaceTabs.ts` (hook)
- `frontend/src/components/marketplace/MarketplaceTabContent.tsx` (may need to check)

### Reference:
- `MARKETPLACE_TEST_FAILURES_ANALYSIS.md` (analysis document)
