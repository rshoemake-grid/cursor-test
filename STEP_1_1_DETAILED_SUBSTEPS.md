# Step 1.1: Create Stateful Mock Helper Function - Detailed Substeps

**Parent Step:** Step 1.1 from MARKETPLACE_TEST_FIXES_PLAN.md  
**File:** `frontend/src/pages/MarketplacePage.test.tsx`  
**Location:** After imports, before `describe` block (around line 20-50)  
**Estimated Time:** 10-15 minutes

---

## Overview

Create a helper function that returns a stateful mock for `useMarketplaceTabs`. This mock will track state changes when `setActiveTab` and `setRepositorySubTab` are called, allowing tests to verify actual tab switching behavior.

---

## Pre-Step Verification

### Substep 0.1: Locate Insertion Point

**Action:** Find where to add the helper function.

**Steps:**
1. [ ] Open `frontend/src/pages/MarketplacePage.test.tsx`
2. [ ] Find the imports section (lines 1-20)
3. [ ] Find the first `describe` block (around line 120+)
4. [ ] Identify the space between imports and describe block

**Verification:**
```bash
# Check file structure
head -30 frontend/src/pages/MarketplacePage.test.tsx | tail -10
```

**Expected:** Should see imports ending, then space before describe block.

---

### Substep 0.2: Check Current Mock Implementation

**Action:** Review existing mock to understand what needs to be replaced.

**Steps:**
1. [ ] Find `jest.mock('../hooks/marketplace', ...)` block (around line 69)
2. [ ] Locate `useMarketplaceTabs` mock (around line 88-98)
3. [ ] Note the current structure and properties
4. [ ] Understand what properties the mock returns

**Current Mock Structure:**
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
}))
```

**Verification:**
```bash
# Find current mock
grep -A 10 "useMarketplaceTabs:" frontend/src/pages/MarketplacePage.test.tsx
```

---

### Substep 0.3: Review Real Hook Interface

**Action:** Understand what the real hook returns to ensure mock matches.

**File:** `frontend/src/hooks/marketplace/useMarketplaceTabs.ts`

**Steps:**
1. [ ] Read `UseMarketplaceTabsReturn` interface
2. [ ] Note all required properties
3. [ ] Understand computed properties (isAgentsTab, etc.)
4. [ ] Check default values

**Key Properties:**
- `activeTab: TabType` - Current active tab
- `repositorySubTab: RepositorySubTabType` - Current repository sub-tab
- `setActiveTab: (tab: TabType) => void` - Function to change active tab
- `setRepositorySubTab: (subTab: RepositorySubTabType) => void` - Function to change sub-tab
- `isAgentsTab: boolean` - Computed: `activeTab === 'agents'`
- `isRepositoryTab: boolean` - Computed: `activeTab === 'repository'`
- `isWorkflowsOfWorkflowsTab: boolean` - Computed: `activeTab === 'workflows-of-workflows'`
- `isRepositoryWorkflowsSubTab: boolean` - Computed: `activeTab === 'repository' && repositorySubTab === 'workflows'`
- `isRepositoryAgentsSubTab: boolean` - Computed: `activeTab === 'repository' && repositorySubTab === 'agents'`

**Verification:**
```bash
# Check hook interface
grep -A 15 "UseMarketplaceTabsReturn\|export function useMarketplaceTabs" frontend/src/hooks/marketplace/useMarketplaceTabs.ts
```

---

## Implementation Substeps

### Substep 1.1.1: Declare State Variables

**Location:** After imports, before any describe blocks (around line 20-25)

**Action:** Create module-level variables to track mock state.

**Code to Add:**
```typescript
// State variables for stateful mock
let mockActiveTab: 'agents' | 'repository' | 'workflows-of-workflows' = 'agents'
let mockRepositorySubTab: 'workflows' | 'agents' = 'workflows'
```

**Step-by-step:**
1. [ ] Find insertion point (after imports, before describe)
2. [ ] Add comment: `// State variables for stateful mock`
3. [ ] Declare `mockActiveTab` with type union
4. [ ] Initialize `mockActiveTab` to `'agents'` (default)
5. [ ] Declare `mockRepositorySubTab` with type union
6. [ ] Initialize `mockRepositorySubTab` to `'workflows'` (default)

**Type Safety Notes:**
- Use exact type unions to match `TabType` and `RepositorySubTabType`
- TypeScript will catch if wrong values are assigned
- Matches real hook types exactly

**Verification:**
```bash
# Check syntax
cd frontend
npx tsc --noEmit src/pages/MarketplacePage.test.tsx 2>&1 | grep -i "mockActiveTab\|mockRepositorySubTab" | head -5
```

**Expected:** No type errors related to these variables.

---

### Substep 1.1.2: Create Helper Function Skeleton

**Location:** Right after state variables (around line 25-30)

**Action:** Create the function structure.

**Code to Add:**
```typescript
/**
 * Creates a stateful mock for useMarketplaceTabs
 * Tracks state changes when setActiveTab/setRepositorySubTab are called
 * 
 * This allows tests to verify actual tab switching behavior by:
 * - Updating mockActiveTab when setActiveTab is called
 * - Updating mockRepositorySubTab when setRepositorySubTab is called
 * - Returning computed properties based on current state
 */
const createMockUseMarketplaceTabs = () => {
  // Function body will be added in next substeps
}
```

**Step-by-step:**
1. [ ] Add JSDoc comment explaining purpose
2. [ ] Declare function: `const createMockUseMarketplaceTabs = () => {`
3. [ ] Add opening brace
4. [ ] Add placeholder comment: `// Function body will be added in next substeps`
5. [ ] Add closing brace

**Verification:**
```bash
# Check function exists
grep -A 3 "createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** Function declaration visible.

---

### Substep 1.1.3: Add Basic Properties (activeTab, repositorySubTab)

**Location:** Inside `createMockUseMarketplaceTabs` function body

**Action:** Add the basic state properties.

**Code to Add:**
```typescript
const createMockUseMarketplaceTabs = () => ({
  activeTab: mockActiveTab,
  repositorySubTab: mockRepositorySubTab,
  // More properties will be added in next substeps
})
```

**Step-by-step:**
1. [ ] Change function body to return object: `() => ({`
2. [ ] Add `activeTab: mockActiveTab,`
3. [ ] Add `repositorySubTab: mockRepositorySubTab,`
4. [ ] Add comment: `// More properties will be added in next substeps`
5. [ ] Close object: `})`

**Key Points:**
- Use object shorthand: `activeTab: mockActiveTab` (could be `activeTab` if variable name matches)
- These reference the module-level state variables
- Values will change as state updates

**Verification:**
```bash
# Check basic structure
grep -A 5 "createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** Function returns object with `activeTab` and `repositorySubTab`.

---

### Substep 1.1.4: Add setActiveTab Function

**Location:** Inside returned object, after `repositorySubTab`

**Action:** Create stateful `setActiveTab` function.

**Code to Add:**
```typescript
setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
  mockActiveTab = tab
  // Update mock return value to trigger re-render
  // Note: This may not automatically trigger React re-render
  // Tests may need to use rerender() or act() for full integration
}),
```

**Step-by-step:**
1. [ ] Add `setActiveTab: jest.fn((tab: typeof mockActiveTab) => {`
2. [ ] Add state update: `mockActiveTab = tab`
3. [ ] Add comment about re-rendering
4. [ ] Close function: `}),`

**Key Points:**
- `jest.fn()` creates a mock function that can be spied on
- `typeof mockActiveTab` ensures type safety
- State update happens synchronously
- Component re-render may need explicit handling

**Advanced Version (with automatic mock update):**
```typescript
setActiveTab: jest.fn((tab: typeof mockActiveTab) => {
  mockActiveTab = tab
  // Update the mock return value so next call returns new state
  // This helps with re-rendering in some cases
  if (jest.isMockFunction(useMarketplaceTabs)) {
    jest.mocked(useMarketplaceTabs).mockReturnValue(createMockUseMarketplaceTabs())
  }
}),
```

**Note:** The advanced version may cause issues if `useMarketplaceTabs` isn't imported yet. Start with simple version, add advanced if needed.

**Verification:**
```bash
# Check function exists
grep -A 8 "setActiveTab:" frontend/src/pages/MarketplacePage.test.tsx | head -10
```

**Expected:** `setActiveTab` function visible with state update.

---

### Substep 1.1.5: Add setRepositorySubTab Function

**Location:** Inside returned object, after `setActiveTab`

**Action:** Create stateful `setRepositorySubTab` function.

**Code to Add:**
```typescript
setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {
  mockRepositorySubTab = subTab
  // Update mock return value to trigger re-render if needed
}),
```

**Step-by-step:**
1. [ ] Add `setRepositorySubTab: jest.fn((subTab: typeof mockRepositorySubTab) => {`
2. [ ] Add state update: `mockRepositorySubTab = subTab`
3. [ ] Add comment about re-rendering
4. [ ] Close function: `}),`

**Key Points:**
- Same pattern as `setActiveTab`
- Updates `mockRepositorySubTab` state variable
- Type-safe with `typeof mockRepositorySubTab`

**Verification:**
```bash
# Check function exists
grep -A 5 "setRepositorySubTab:" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** `setRepositorySubTab` function visible.

---

### Substep 1.1.6: Add Computed Properties - isAgentsTab

**Location:** Inside returned object, after `setRepositorySubTab`

**Action:** Add computed boolean property.

**Code to Add:**
```typescript
isAgentsTab: mockActiveTab === 'agents',
```

**Step-by-step:**
1. [ ] Add `isAgentsTab: mockActiveTab === 'agents',`
2. [ ] Ensure it's computed from current state (not hardcoded)

**Key Points:**
- Computed property - value changes as `mockActiveTab` changes
- Matches real hook behavior: `isAgentsTab = activeTab === MARKETPLACE_TABS.AGENTS`
- Boolean value for conditional rendering

**Verification:**
```bash
# Check computed property
grep "isAgentsTab:" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** `isAgentsTab: mockActiveTab === 'agents'`

---

### Substep 1.1.7: Add Computed Properties - isRepositoryTab

**Location:** After `isAgentsTab`

**Action:** Add computed boolean property.

**Code to Add:**
```typescript
isRepositoryTab: mockActiveTab === 'repository',
```

**Step-by-step:**
1. [ ] Add `isRepositoryTab: mockActiveTab === 'repository',`
2. [ ] Ensure it's computed from current state

**Verification:**
```bash
# Check computed property
grep "isRepositoryTab:" frontend/src/pages/MarketplacePage.test.tsx
```

---

### Substep 1.1.8: Add Computed Properties - isWorkflowsOfWorkflowsTab

**Location:** After `isRepositoryTab`

**Action:** Add computed boolean property.

**Code to Add:**
```typescript
isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',
```

**Step-by-step:**
1. [ ] Add `isWorkflowsOfWorkflowsTab: mockActiveTab === 'workflows-of-workflows',`
2. [ ] Ensure it's computed from current state

**Verification:**
```bash
# Check computed property
grep "isWorkflowsOfWorkflowsTab:" frontend/src/pages/MarketplacePage.test.tsx
```

---

### Substep 1.1.9: Add Computed Properties - isRepositoryWorkflowsSubTab

**Location:** After `isWorkflowsOfWorkflowsTab`

**Action:** Add computed boolean property with two conditions.

**Code to Add:**
```typescript
isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',
```

**Step-by-step:**
1. [ ] Add `isRepositoryWorkflowsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'workflows',`
2. [ ] Ensure both conditions are checked
3. [ ] Matches real hook: `isRepositoryTab && repositorySubTab === REPOSITORY_SUB_TABS.WORKFLOWS`

**Key Points:**
- Requires both `activeTab === 'repository'` AND `repositorySubTab === 'workflows'`
- Used for conditional rendering of workflows sub-tab content

**Verification:**
```bash
# Check computed property
grep "isRepositoryWorkflowsSubTab:" frontend/src/pages/MarketplacePage.test.tsx
```

**Expected:** Both conditions present with `&&` operator.

---

### Substep 1.1.10: Add Computed Properties - isRepositoryAgentsSubTab

**Location:** After `isRepositoryWorkflowsSubTab` (last property)

**Action:** Add final computed boolean property.

**Code to Add:**
```typescript
isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',
```

**Step-by-step:**
1. [ ] Add `isRepositoryAgentsSubTab: mockActiveTab === 'repository' && mockRepositorySubTab === 'agents',`
2. [ ] Ensure both conditions are checked
3. [ ] This is the last property in the object

**Verification:**
```bash
# Check computed property
grep "isRepositoryAgentsSubTab:" frontend/src/pages/MarketplacePage.test.tsx
```

---

### Substep 1.1.11: Verify Complete Function

**Action:** Review the complete function to ensure it's correct.

**Complete Function Should Look Like:**
```typescript
/**
 * Creates a stateful mock for useMarketplaceTabs
 * Tracks state changes when setActiveTab/setRepositorySubTab are called
 */
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

**Checklist:**
- [ ] All 9 properties present
- [ ] State variables referenced correctly
- [ ] Computed properties use correct logic
- [ ] Type annotations correct
- [ ] Function returns object (arrow function with parentheses)
- [ ] No syntax errors

**Verification Commands:**
```bash
cd frontend

# Check TypeScript compilation
npx tsc --noEmit src/pages/MarketplacePage.test.tsx 2>&1 | grep -i "createMockUseMarketplaceTabs\|mockActiveTab\|mockRepositorySubTab" | head -10

# Check function structure
grep -A 15 "const createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx

# Count properties (should be 9)
grep -A 15 "const createMockUseMarketplaceTabs" frontend/src/pages/MarketplacePage.test.tsx | grep -c ":"
```

**Expected:** 
- No TypeScript errors
- Function visible with all properties
- 9 properties total (2 state, 2 functions, 5 computed)

---

## Post-Implementation Verification

### Substep 1.1.12: Test Function Manually

**Action:** Create a simple test to verify the function works.

**Temporary Test Code (add temporarily, remove after verification):**
```typescript
// Temporary test - remove after verification
describe('createMockUseMarketplaceTabs verification', () => {
  it('should update state when setActiveTab is called', () => {
    mockActiveTab = 'agents'  // Reset state
    
    const mock = createMockUseMarketplaceTabs()
    expect(mock.activeTab).toBe('agents')
    expect(mock.isAgentsTab).toBe(true)
    
    mock.setActiveTab('workflows-of-workflows')
    expect(mockActiveTab).toBe('workflows-of-workflows')
    
    // Create new mock instance to see updated state
    const updatedMock = createMockUseMarketplaceTabs()
    expect(updatedMock.activeTab).toBe('workflows-of-workflows')
    expect(updatedMock.isWorkflowsOfWorkflowsTab).toBe(true)
  })
})
```

**Steps:**
1. [ ] Add temporary test
2. [ ] Run test: `npm test -- MarketplacePage.test.tsx -t "createMockUseMarketplaceTabs verification"`
3. [ ] Verify test passes
4. [ ] Remove temporary test

**Expected:** Test passes, confirming state updates work.

---

### Substep 1.1.13: Verify No Breaking Changes

**Action:** Ensure existing tests still work.

**Command:**
```bash
cd frontend
npm test -- MarketplacePage.test.tsx 2>&1 | tail -30
```

**Expected:** 
- No new errors introduced
- Existing tests still run (may fail, but shouldn't error)
- Function is defined and accessible

**If errors occur:**
- [ ] Check function is defined before use
- [ ] Verify no circular dependencies
- [ ] Check TypeScript types are correct

---

## Common Issues and Solutions

### Issue: TypeScript Type Errors

**Symptoms:**
- `Type 'string' is not assignable to type 'agents' | 'repository' | 'workflows-of-workflows'`
- Type mismatch errors

**Solution:**
- Ensure type annotations match exactly: `'agents' | 'repository' | 'workflows-of-workflows'`
- Use `typeof mockActiveTab` for function parameters
- Check that string literals match hook constants

### Issue: Function Not Found

**Symptoms:**
- `createMockUseMarketplaceTabs is not defined`
- Reference errors

**Solution:**
- Ensure function is defined before `jest.mock()` call
- Check function is in module scope (not inside describe block)
- Verify no typos in function name

### Issue: State Not Updating

**Symptoms:**
- `mockActiveTab` doesn't change when `setActiveTab` is called
- Tests still see old values

**Solution:**
- Verify `mockActiveTab = tab` assignment is present
- Check function is actually being called
- Ensure state variable is module-level (not function-scoped)

---

## Success Criteria

✅ Function `createMockUseMarketplaceTabs` is defined  
✅ Function returns object with all 9 required properties  
✅ State variables `mockActiveTab` and `mockRepositorySubTab` are declared  
✅ `setActiveTab` updates `mockActiveTab` when called  
✅ `setRepositorySubTab` updates `mockRepositorySubTab` when called  
✅ Computed properties correctly reflect current state  
✅ TypeScript compilation passes without errors  
✅ No breaking changes to existing tests  
✅ Function is ready to be used in mock declaration (next step)

---

## Next Steps

After completing Step 1.1:
- **Step 1.2:** Update mock declaration to use `createMockUseMarketplaceTabs()`
- **Step 1.3:** Add state reset in `beforeEach`

---

## Reference

**Related Files:**
- `frontend/src/pages/MarketplacePage.test.tsx` (file being modified)
- `frontend/src/hooks/marketplace/useMarketplaceTabs.ts` (real hook reference)

**Related Documents:**
- `MARKETPLACE_TEST_FIXES_PLAN.md` (parent plan)
- `MARKETPLACE_TEST_FAILURES_ANALYSIS.md` (analysis)

---

## Notes

- Function must be defined before `jest.mock()` calls
- State variables are module-level to persist across test runs
- Computed properties must match real hook logic exactly
- Type safety is important - use exact type unions
- Function will be used in Step 1.2 to replace static mock
