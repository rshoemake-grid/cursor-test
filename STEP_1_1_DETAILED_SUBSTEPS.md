# Step 1.1: Create Stateful Mock Helper Function - Detailed Substeps

**Parent Step:** Step 1.1 from MARKETPLACE_TEST_FIXES_PLAN.md  
**File:** `frontend/src/pages/MarketplacePage.test.tsx`  
**Estimated Time:** 15-20 minutes  
**Difficulty:** Medium

---

## Overview

This step creates a stateful mock helper function that tracks tab state changes, allowing tests to verify tab switching behavior. The mock will update its return value when `setActiveTab` or `setRepositorySubTab` are called.

---

## Pre-Step Verification

### Substep 0.1: Locate Mock Declaration Section

**Action:** Find where mocks are declared in the test file.

**Steps:**
1. [ ] Open `frontend/src/pages/MarketplacePage.test.tsx`
2. [ ] Find the `jest.mock('../hooks/marketplace', ...)` block
3. [ ] Locate the `useMarketplaceTabs` mock (around line 88-98)
4. [ ] Note the current static mock structure

**Verification:**
```bash
# Check current mock location
grep -n "useMarketplaceTabs:" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected Output:**
```
88:  useMarketplaceTabs: jest.fn(() => ({
89:    activeTab: 'agents',
90:    repositorySubTab: 'workflows',
...
```

**Current Code Structure:**
```typescript
jest.mock('../hooks/marketplace', () => ({
  // ... other mocks
  useMarketplaceTabs: jest.fn(() => ({
    activeTab: 'agents',  // Static value
    repositorySubTab: 'workflows',
    setActiveTab: jest.fn(),  // Does nothing
    setRepositorySubTab: jest.fn(),
    // ... computed properties
  })),
}))
```

---

## Implementation Substeps

### Substep 1.1.1: Add State Variables

**Location:** After imports, before `describe` block (around line 20-50)

**Action:** Declare variables to track mock state.

**Code to Add:**
```typescript
// Add after imports, before describe block
// State variables for tracking tab state in mocks
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'
```

**Step-by-step:**
1. [ ] Find the section after imports (around line 20)
2. [ ] Look for existing variable declarations or comments
3. [ ] Add comment: `// State variables for tracking tab state in mocks`
4. [ ] Add `mockActiveTab` variable with type annotation
5. [ ] Add `mockRepositorySubTab` variable with type annotation
6. [ ] Initialize both to default values ('agents' and 'workflows')

**Exact Location:**
- After: `const waitForWithTimeout = ...` (around line 16-18)
- Before: `// Mock dependencies` comment (around line 20)
- Or: Before `jest.mock(...)` declarations

**Code Placement:**
```typescript
// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {
  return waitFor(callback, { timeout })
}

// State variables for tracking tab state in mocks
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'

// Mock dependencies
jest.mock('../contexts/AuthContext', () => ({
  // ...
}))
```

**Verification:**
```bash
# Check variables are added
grep -n "mockActiveTab\|mockRepositorySubTab" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** Should show the two variable declarations.

**TypeScript Check:**
```bash
# Verify types are correct
npx tsc --noEmit src/pages/MarketplacePage.test.tsx 2>&1 | grep -i "mockActiveTab\|mockRepositorySubTab" || echo "No type errors"
```

**Common Issues:**
- **Issue:** Type errors if types don't match hook return types
- **Fix:** Ensure types match `TabType` and `RepositorySubTabType` from hook
- **Check:** Import types if needed: `import type { TabType, RepositorySubTabType } from '../hooks/marketplace/useMarketplaceTabs'`

---

### Substep 1.1.2: Create Helper Function Skeleton

**Location:** Right after state variables (around line 22-25)

**Action:** Create the function structure without implementation.

**Code to Add:**
```typescript
/**
 * Creates a stateful mock for useMarketplaceTabs
 * Tracks state changes when setActiveTab/setRepositorySubTab are called
 * This allows tests to verify tab switching behavior
 */
const createMockUseMarketplaceTabs = () => {
  // Implementation will be added in next substeps
}
```

**Step-by-step:**
1. [ ] Add JSDoc comment explaining the function purpose
2. [ ] Declare function: `const createMockUseMarketplaceTabs = () => {`
3. [ ] Add placeholder comment: `// Implementation will be added in next substeps`
4. [ ] Close function: `}`

**Code Placement:**
```typescript
// State variables for tracking tab state in mocks
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'

/**
 * Creates a stateful mock for useMarketplaceTabs
 * Tracks state changes when setActiveTab/setRepositorySubTab are called
 * This allows tests to verify tab switching behavior
 */
const createMockUseMarketplaceTabs = () => {
  // Implementation will be added in next substeps
}

// Mock dependencies
```

**Verification:**
```bash
# Check function exists
grep -n "createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** Should show function declaration.

---

### Substep 1.1.3: Add Return Object with Basic Properties

**Location:** Inside `createMockUseMarketplaceTabs` function

**Action:** Add return statement with activeTab and repositorySubTab.

**Code to Add:**
```typescript
const createMockUseMarketplaceTabs = () => {
  return {
    activeTab: mockActiveTab,
    repositorySubTab: mockRepositorySubTab,
    // More properties will be added in next substeps
  }
}
```

**Step-by-step:**
1. [ ] Add `return {` statement
2. [ ] Add `activeTab: mockActiveTab,` property
3. [ ] Add `repositorySubTab: mockRepositorySubTab,` property
4. [ ] Add comment: `// More properties will be added in next substeps`
5. [ ] Close object: `}`

**Code Structure:**
```typescript
const createMockUseMarketplaceTabs = () => {
  return {
    activeTab: mockActiveTab,
    repositorySubTab: mockRepositorySubTab,
    // More properties will be added in next substeps
  }
}
```

**Verification:**
```bash
# Check return object structure
grep -A 5 "createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx | head -10
```

**Expected:** Should show return object with activeTab and repositorySubTab.

---

### Substep 1.1.4: Implement setActiveTab Function

**Location:** Inside return object, after repositorySubTab

**Action:** Add setActiveTab that updates state and triggers re-render.

**Code to Add:**
```typescript
setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
  mockActiveTab = tab
  // Update mock return value to trigger re-render
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
}),
```

**Step-by-step:**
1. [ ] Add `setActiveTab:` property name
2. [ ] Create jest.fn() with parameter: `(tab: typeof mockActiveTab) => {`
3. [ ] Update state: `mockActiveTab = tab`
4. [ ] Add comment: `// Update mock return value to trigger re-render`
5. [ ] Update mock: `jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())`
6. [ ] Close function: `},`

**Important Notes:**
- Use `typeof mockActiveTab` for type inference
- The function updates the mock return value to trigger React re-render
- This mimics how the real hook works with useState

**Code Structure:**
```typescript
return {
  activeTab: mockActiveTab,
  repositorySubTab: mockRepositorySubTab,
  setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
    mockActiveTab = tab
    // Update mock return value to trigger re-render
    jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
  }),
  // More properties will be added
}
```

**Verification:**
```bash
# Check setActiveTab implementation
grep -A 6 "setActiveTab:" frontend/src/pages/MarketplacePage.test.tsx | head -10
```

**Expected:** Should show setActiveTab with state update logic.

**Potential Issues:**
- **Issue:** `jest.mocked()` might not be available
- **Fix:** Use `(useMarketplaceTabs as jest.Mock).mockReturnValue(...)`
- **Alternative:** Store reference to mock function and update it

**Alternative Implementation (if jest.mocked doesn't work):**
```typescript
// At top of file, after mock declaration
const mockUseMarketplaceTabsFn = jest.fn()

// In createMockUseMarketplaceTabs
setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
  mockActiveTab = tab
  mockUseMarketplaceTabsFn.mockReturnValue(createMockUseMarketplaceTabs())
}),
```

---

### Substep 1.1.5: Implement setRepositorySubTab Function

**Location:** Inside return object, after setActiveTab

**Action:** Add setRepositorySubTab that updates state.

**Code to Add:**
```typescript
setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
  mockRepositorySubTab = subTab
  // Update mock return value to trigger re-render
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
}),
```

**Step-by-step:**
1. [ ] Add `setRepositorySubTab:` property name
2. [ ] Create jest.fn() with parameter: `(subTab: typeof mockRepositorySubTab) => {`
3. [ ] Update state: `mockRepositorySubTab = subTab`
4. [ ] Add comment: `// Update mock return value to trigger re-render`
5. [ ] Update mock: `jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())`
6. [ ] Close function: `},`

**Code Structure:**
```typescript
setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
  mockActiveTab = tab
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
}),
setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
  mockRepositorySubTab = subTab
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
}),
```

**Verification:**
```bash
# Check setRepositorySubTab implementation
grep -A 6 "setRepositorySubTab:" frontend/src/pages/MarketplacePage.test.tsx | head -10
```

**Expected:** Should show setRepositorySubTab with state update logic.

---

### Substep 1.1.6: Add Computed Boolean Properties

**Location:** Inside return object, after setRepositorySubTab

**Action:** Add boolean properties that depend on state values.

**Code to Add:**
```typescript
isAgentsTab: mockActiveTab === 'agents',
isRepositoryTab: mockActiveTab === 'repository',
isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
```

**Step-by-step:**
1. [ ] Add `isAgentsTab: mockActiveTab === 'agents',`
2. [ ] Add `isRepositoryTab: mockActiveTab === 'repository',`
3. [ ] Add `isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',`
4. [ ] Add `isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',`
5. [ ] Add `isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',`

**Code Structure:**
```typescript
setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
  mockRepositorySubTab = subTab
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
}),
isAgentsTab: mockActiveTab === 'agents',
isRepositoryTab: mockActiveTab === 'repository',
isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
```

**Verification:**
```bash
# Check computed properties
grep -A 5 "isAgentsTab\|isRepositoryTab\|isWorkflowsOfWorkflowsTab" frontend/src/pages/MarketplacePage.test.tsx | head -10
```

**Expected:** Should show all boolean computed properties.

**Logic Verification:**
- `isAgentsTab`: true when activeTab is 'agents'
- `isRepositoryTab`: true when activeTab is 'repository'
- `isWorkflowsOfWorkflowsTab`: true when activeTab is 'workflows-of-workflows'
- `isRepositoryWorkflowsSubTab`: true when repository tab AND workflows sub-tab
- `isRepositoryAgentsSubTab`: true when repository tab AND agents sub-tab

---

### Substep 1.1.7: Verify Complete Function Structure

**Location:** Review entire `createMockUseMarketplaceTabs` function

**Action:** Ensure function is complete and matches hook interface.

**Complete Function Should Look Like:**
```typescript
/**
 * Creates a stateful mock for useMarketplaceTabs
 * Tracks state changes when setActiveTab/setRepositorySubTab are called
 * This allows tests to verify tab switching behavior
 */
const createMockUseMarketplaceTabs = () => {
  return {
    activeTab: mockActiveTab,
    repositorySubTab: mockRepositorySubTab,
    setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
      mockActiveTab = tab
      // Update mock return value to trigger re-render
      jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
    }),
    setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
      mockRepositorySubTab = subTab
      // Update mock return value to trigger re-render
      jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
    }),
    isAgentsTab: mockActiveTab === 'agents',
    isRepositoryTab: mockActiveTab === 'repository',
    isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
    isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
    isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
  }
}
```

**Checklist:**
- [ ] Function has JSDoc comment
- [ ] Function returns an object
- [ ] `activeTab` property uses `mockActiveTab`
- [ ] `repositorySubTab` property uses `mockRepositorySubTab`
- [ ] `setActiveTab` updates `mockActiveTab` and mock return value
- [ ] `setRepositorySubTab` updates `mockRepositorySubTab` and mock return value
- [ ] All 5 boolean computed properties are present
- [ ] Boolean logic matches hook implementation
- [ ] No syntax errors

**Verification Commands:**
```bash
# Check function structure
grep -A 25 "const createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx

# Check TypeScript compilation
npx tsc --noEmit src/pages/MarketplacePage.test.tsx 2>&1 | grep -i "createMockUseMarketplaceTabs\|mockActiveTab\|mockRepositorySubTab" || echo "No type errors"

# Count properties in return object
grep -A 25 "const createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx | grep -c ":" | head -1
```

**Expected:** Should show 9 properties (activeTab, repositorySubTab, setActiveTab, setRepositorySubTab, and 5 boolean properties).

---

### Substep 1.1.8: Compare with Real Hook Interface

**Location:** Check `frontend/src/hooks/marketplace/useMarketplaceTabs.ts`

**Action:** Verify mock matches real hook return type.

**Real Hook Interface:**
```typescript
export interface UseMarketplaceTabsReturn {
  activeTab: TabType
  repositorySubTab: RepositorySubTabType
  setActiveTab: (tab: TabType) => void
  setRepositorySubTab: (subTab: RepositorySubTabType) => void
  isAgentsTab: boolean
  isRepositoryTab: boolean
  isWorkflowsOfWorkflowsTab: boolean
  isRepositoryWorkflowsSubTab: boolean
  isRepositoryAgentsSubTab: boolean
}
```

**Verification Checklist:**
- [ ] All properties from interface are present in mock
- [ ] Property names match exactly
- [ ] Property types match (or are compatible)
- [ ] Function signatures match

**Command:**
```bash
# Compare mock with hook interface
diff <(grep -A 15 "export interface UseMarketplaceTabsReturn" frontend/src/hooks/marketplace/useMarketplaceTabs.ts | grep -E "^\s+\w+:" | sort) \
     <(grep -A 25 "const createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx | grep -E "^\s+\w+:" | sort)
```

**Expected:** Properties should match (allowing for implementation differences).

---

## Post-Implementation Verification

### Substep 1.1.9: Syntax Check

**Action:** Verify code compiles without errors.

**Commands:**
```bash
cd frontend

# TypeScript check
npx tsc --noEmit src/pages/MarketplacePage.test.tsx

# ESLint check (if configured)
npx eslint src/pages/MarketplacePage.test.tsx --fix
```

**Expected:** No compilation errors.

**If Errors Occur:**
- **Type errors:** Check type annotations match hook types
- **Syntax errors:** Verify all brackets/braces are closed
- **Import errors:** Ensure jest types are available

---

### Substep 1.1.10: Visual Code Review

**Action:** Review code for correctness and style.

**Checklist:**
- [ ] Code is properly formatted
- [ ] Comments are clear and helpful
- [ ] Variable names are descriptive
- [ ] Function structure is logical
- [ ] No duplicate code
- [ ] Follows existing test file style

**Code Review Points:**
1. **State Management:** Are state variables properly scoped?
2. **Function Logic:** Does setActiveTab correctly update state?
3. **Computed Properties:** Do boolean properties match hook logic?
4. **Type Safety:** Are types correctly specified?
5. **Maintainability:** Is code easy to understand and modify?

---

## Troubleshooting

### Issue: jest.mocked() is not available

**Symptoms:**
- TypeScript error: `Property 'mocked' does not exist on type 'typeof jest'`
- Runtime error when calling `jest.mocked()`

**Solutions:**

**Option 1: Use type assertion**
```typescript
setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
  mockActiveTab = tab
  (useMarketplaceTabs as jest.Mock).mockReturnValue(createMockUseMarketplaceTabs())
}),
```

**Option 2: Store mock reference**
```typescript
// At top of file, after mock declaration
let mockUseMarketplaceTabsRef: jest.Mock

// In createMockUseMarketplaceTabs
setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
  mockActiveTab = tab
  if (mockUseMarketplaceTabsRef) {
    mockUseMarketplaceTabsRef.mockReturnValue(createMockUseMarketplaceTabs())
  }
}),
```

**Option 3: Update in beforeEach**
```typescript
// Don't update in setActiveTab, update in beforeEach after state changes
// This requires different approach - see Step 1.3
```

---

### Issue: Circular Reference Warning

**Symptoms:**
- Warning about circular reference in mock
- `createMockUseMarketplaceTabs` calls itself

**Solutions:**

**Option 1: Use function reference**
```typescript
const createMockUseMarketplaceTabs = (): ReturnType<typeof createMockUseMarketplaceTabs> => {
  // ... implementation
}
```

**Option 2: Separate update logic**
```typescript
const updateMockTabs = () => {
  jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
}

const createMockUseMarketplaceTabs = () => {
  return {
    // ... properties
    setActiveTab: jest.fn((tab) => {
      mockActiveTab = tab
      updateMockTabs()
    }),
  }
}
```

---

### Issue: Type Mismatch Errors

**Symptoms:**
- TypeScript errors about incompatible types
- `mockActiveTab` type doesn't match `TabType`

**Solutions:**

**Option 1: Import types from hook**
```typescript
import type { TabType, RepositorySubTabType } from '../hooks/marketplace/useMarketplaceTabs'

let mockActiveTab: TabType = 'agents'
let mockRepositorySubTab: RepositorySubTabType = 'workflows'
```

**Option 2: Use const assertions**
```typescript
const TABS = {
  AGENTS: 'agents',
  REPOSITORY: 'repository',
  WORKFLOWS_OF_WORKFLOWS: 'workflows-of-workflows',
} as const

let mockActiveTab: typeof TABS[keyof typeof TABS] = TABS.AGENTS
```

---

## Success Criteria

✅ State variables declared with correct types  
✅ Helper function created with JSDoc comment  
✅ Return object includes all required properties  
✅ setActiveTab updates state and mock return value  
✅ setRepositorySubTab updates state and mock return value  
✅ All computed boolean properties implemented  
✅ Function matches real hook interface  
✅ Code compiles without errors  
✅ Code follows project style guidelines

---

## Next Steps

After completing Step 1.1:
1. Proceed to **Step 1.2:** Update mock declaration to use helper
2. Then **Step 1.3:** Add state reset in beforeEach
3. Continue with test fixes in Steps 1.4-1.5

---

## Reference

### Related Files:
- `frontend/src/pages/MarketplacePage.test.tsx` (file being modified)
- `frontend/src/hooks/marketplace/useMarketplaceTabs.ts` (real hook implementation)
- `MARKETPLACE_TEST_FIXES_PLAN.md` (parent plan)

### Related Steps:
- Step 1.2: Update Mock Declaration
- Step 1.3: Add State Reset in beforeEach
