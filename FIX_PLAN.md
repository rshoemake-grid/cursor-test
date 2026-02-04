# Fix Plan: Test Isolation Issue in draftStorage.test.ts

## Problem Summary

The test `draftExists › should return true when draft exists` fails when run with other test files because the mock implementation is being cleared/reset between when it's set up and when `loadDraftsFromStorage()` calls it.

**Root Cause**: Mock implementation returns `{}` instead of `mockDrafts` when called from within the function chain, even though direct calls work correctly.

## Solution Approaches (Prioritized)

### Approach 1: Remove mockClear() from main beforeEach ⭐ RECOMMENDED

**Rationale**: `mockClear()` may be clearing implementations in addition to call history, or the subsequent `mockReturnValue({})` is overriding the test's mock setup.

**Implementation**:
1. Remove `mockClear()` calls from main `beforeEach`
2. Only clear call history if needed, without touching implementations
3. Let each test set up its own mock return values

**Pros**:
- Simple change
- Preserves mock implementations
- Each test has full control

**Cons**:
- May need to clear call history manually in tests if needed
- Could affect other tests if they rely on cleared state

**Code Changes**:
```typescript
// BEFORE (current)
beforeEach(() => {
  mockGetLocalStorageItem.mockClear()
  mockSetLocalStorageItem.mockClear()
  mockGetLocalStorageItem.mockReturnValue({})
  mockSetLocalStorageItem.mockReturnValue(undefined)
})

// AFTER (proposed)
beforeEach(() => {
  // Don't clear mocks - let each test set up its own state
  // Only clear call history if needed for specific tests
})
```

**Risk Level**: Low  
**Effort**: Low  
**Success Probability**: High (80%)

---

### Approach 2: Set Mock in Test-Specific beforeEach

**Rationale**: Ensure mock is set up after any global resets, right before tests run.

**Implementation**:
1. Add `beforeEach` hook in `draftExists` describe block
2. Set mock implementation there, ensuring it runs after main `beforeEach`
3. This ensures mock is set up immediately before test execution

**Pros**:
- Isolates mock setup for these specific tests
- Runs after main `beforeEach`, ensuring clean state
- Doesn't affect other tests

**Cons**:
- Still may be affected by `jest.clearAllMocks()` from other files
- Adds complexity

**Code Changes**:
```typescript
describe('draftExists', () => {
  beforeEach(() => {
    // Set up mock for draftExists tests - runs after main beforeEach
    mockGetLocalStorageItem.mockReset()
    mockGetLocalStorageItem.mockReturnValue(mockDrafts)
  })

  it('should return true when draft exists', () => {
    const result = draftExists('tab-1')
    expect(result).toBe(true)
  })
})
```

**Risk Level**: Medium  
**Effort**: Low  
**Success Probability**: Medium (60%)

---

### Approach 3: Use jest.spyOn() Instead of Module Mock

**Rationale**: Spies may have different lifecycle behavior and better isolation than module mocks.

**Implementation**:
1. Remove module mock: `jest.mock('../useLocalStorage', ...)`
2. Use `jest.spyOn()` to spy on the actual implementation
3. Set return value on the spy

**Pros**:
- Better isolation
- More explicit control
- May avoid module re-initialization issues

**Cons**:
- Requires importing actual implementation
- May need to adjust other tests
- More invasive change

**Code Changes**:
```typescript
// Remove module mock
// jest.mock('../useLocalStorage', ...)  // REMOVE

// In test file, import actual implementation
import * as useLocalStorage from '../useLocalStorage'

// In beforeEach or test
const getLocalStorageItemSpy = jest.spyOn(useLocalStorage, 'getLocalStorageItem')
getLocalStorageItemSpy.mockReturnValue(mockDrafts)
```

**Risk Level**: Medium-High  
**Effort**: Medium  
**Success Probability**: Medium (65%)

---

### Approach 4: Set Mock Immediately Before Function Call

**Rationale**: Minimize time between mock setup and use to reduce chance of interference.

**Implementation**:
1. Set mock implementation right before calling `draftExists()`
2. Don't set it earlier in the test
3. Use a helper function if needed

**Pros**:
- Minimizes window for interference
- Simple change

**Cons**:
- May still be affected by `jest.clearAllMocks()`
- Less clean test structure

**Code Changes**:
```typescript
it('should return true when draft exists', () => {
  // Set mock right before use
  mockGetLocalStorageItem.mockReset()
  mockGetLocalStorageItem.mockReturnValue(mockDrafts)
  
  // Call immediately
  const result = draftExists('tab-1')
  
  expect(result).toBe(true)
})
```

**Risk Level**: Low  
**Effort**: Low  
**Success Probability**: Low (40%) - Already tried this

---

### Approach 5: Use jest.isolateModules()

**Rationale**: Completely isolate the module to prevent cross-file interference.

**Implementation**:
1. Wrap test in `jest.isolateModules()`
2. Re-import modules inside isolation
3. Set up mocks within isolation

**Pros**:
- Complete isolation
- Prevents module re-initialization issues

**Cons**:
- Complex implementation
- May require significant refactoring
- May not work with current test structure

**Code Changes**:
```typescript
it('should return true when draft exists', () => {
  jest.isolateModules(() => {
    // Re-import and set up mocks here
    // Complex implementation required
  })
})
```

**Risk Level**: High  
**Effort**: High  
**Success Probability**: Medium (55%)

---

### Approach 6: Move Test to Separate File

**Rationale**: File-level isolation may prevent interference from other test files.

**Implementation**:
1. Create `draftStorage.draftExists.test.ts`
2. Move `draftExists` tests to new file
3. Run separately or ensure isolation

**Pros**:
- Complete file-level isolation
- Doesn't affect other tests
- Easy to implement

**Cons**:
- Doesn't solve root cause
- May still fail if run with other files
- File organization concern

**Risk Level**: Low  
**Effort**: Low  
**Success Probability**: Low (30%) - Doesn't address root cause

---

### Approach 7: Fix Other Test Files' beforeEach Hooks

**Rationale**: Prevent `jest.clearAllMocks()` from interfering with mocks.

**Implementation**:
1. Change `errorHandling.test.ts` and `ownership.test.ts` to use specific mock clearing
2. Use `mockClear()` on specific mocks instead of `jest.clearAllMocks()`
3. Or add logic to preserve certain mocks

**Pros**:
- Addresses root cause
- Prevents interference

**Cons**:
- Affects other test files
- May break other tests
- Not ideal to modify unrelated tests

**Risk Level**: Medium-High  
**Effort**: Medium  
**Success Probability**: High (75%) but risky

---

## Critical Observation

**Important Finding**: Other tests in the same file (e.g., `loadDraftsFromStorage`, `getDraftForTab`) use `mockReturnValue()` directly and work correctly, even when run with other test files. The failing test is the ONLY one using `mockReset()` + `mockImplementation()`.

**Implication**: The issue is likely:
1. `mockClear()` in `beforeEach` clearing implementations, OR
2. The combination of `mockReset()` + `mockImplementation()` not working correctly when tests run together

**Solution**: Match the pattern used by working tests - use simple `mockReturnValue()` without `mockReset()`.

## Recommended Implementation Plan

### Phase 1: Try Approach 1 (Remove mockClear) ⭐ START HERE

**Steps**:
1. Remove `mockClear()` calls from main `beforeEach`
2. Remove default `mockReturnValue({})` setup
3. Let each test set up its own mocks
4. Run tests to verify

**Expected Outcome**: 
- Test should pass because:
  1. `mockClear()` won't clear implementations
  2. Test will use simple `mockReturnValue()` like other working tests
  3. Pattern matches successful tests in the same file

**Success Indicators**:
- Test passes when run individually (already works)
- Test passes when run with other test files (currently fails)
- Other tests continue to pass (they already use this pattern)

**If This Fails**: Move to Phase 2

---

### Phase 2: Try Approach 2 (Test-Specific beforeEach)

**Steps**:
1. Add `beforeEach` in `draftExists` describe block
2. Set mock implementation there
3. Ensure it runs after main `beforeEach`
4. Run tests to verify

**Expected Outcome**: Mock is set up right before tests run, after any global resets

**If This Fails**: Move to Phase 3

---

### Phase 3: Try Approach 7 (Fix Other Test Files)

**Steps**:
1. Modify `errorHandling.test.ts` to use specific mock clearing
2. Modify `ownership.test.ts` to use specific mock clearing
3. Replace `jest.clearAllMocks()` with targeted `mockClear()` calls
4. Run tests to verify

**Expected Outcome**: Other test files won't interfere with mocks

**If This Fails**: Move to Phase 4

---

### Phase 4: Try Approach 3 (jest.spyOn)

**Steps**:
1. Refactor to use `jest.spyOn()` instead of module mock
2. Update all tests that use the mock
3. Run tests to verify

**Expected Outcome**: Better isolation with spies

**If This Fails**: Consider Approach 5 or document as known limitation

---

## Implementation Details

### Step-by-Step for Approach 1 (Recommended)

1. **Open** `frontend/src/hooks/utils/draftStorage.test.ts`

2. **Modify main beforeEach** (lines 59-67):
   ```typescript
   beforeEach(() => {
     // Remove mockClear() calls - they may be clearing implementations
     // Keep default mockReturnValue({}) for tests that don't override it
     // Tests can override with their own mockReturnValue() calls
     mockGetLocalStorageItem.mockReturnValue({})
     mockSetLocalStorageItem.mockReturnValue(undefined)
   })
   ```
   
   **Key Change**: Remove `mockClear()` calls, keep default return values

3. **Update failing test** (lines 254-271):
   ```typescript
   it('should return true when draft exists', () => {
     // Override default mock return value - this should work without mockReset()
     mockGetLocalStorageItem.mockReturnValue(mockDrafts)

     const result = draftExists('tab-1')

     expect(mockGetLocalStorageItem).toHaveBeenCalled()
     expect(mockGetLocalStorageItem).toHaveBeenCalledWith('workflowBuilderDrafts', {}, undefined)
     expect(result).toBe(true)
   })
   ```
   
   **Key Change**: Remove `mockReset()` and `mockImplementation()`, use simple `mockReturnValue()` like other tests

4. **Remove debug code**: Clean up the debugging assertions added earlier

5. **Check other tests**: They already use `mockReturnValue()` directly, so they should continue working

6. **Run tests**:
   ```bash
   npm test -- draftStorage.test.ts errorHandling.test.ts ownership.test.ts
   ```

7. **Verify**: All 70 tests should pass

### Rollback Plan

If Approach 1 causes issues:
1. Revert changes to `beforeEach`
2. Try Approach 2 instead
3. Document findings

---

## Testing Strategy

### Test Cases to Verify

1. **Individual Test**:
   ```bash
   npm test -- draftStorage.test.ts --testNamePattern="draftExists.*should return true"
   ```
   Should: ✅ Pass

2. **With Other Test Files**:
   ```bash
   npm test -- draftStorage.test.ts errorHandling.test.ts ownership.test.ts
   ```
   Should: ✅ Pass (currently fails)

3. **All draftStorage Tests**:
   ```bash
   npm test -- draftStorage.test.ts
   ```
   Should: ✅ All pass

4. **Full Test Suite** (if applicable):
   ```bash
   npm test
   ```
   Should: ✅ No regressions

---

## Success Criteria

✅ **Primary Goal**: Test passes when run with other test files  
✅ **Secondary Goal**: No other tests break  
✅ **Tertiary Goal**: Solution is maintainable and clear

---

## Risk Assessment

### Low Risk Approaches
- Approach 1: Remove mockClear()
- Approach 2: Test-specific beforeEach
- Approach 6: Separate file

### Medium Risk Approaches
- Approach 3: jest.spyOn()
- Approach 7: Fix other test files

### High Risk Approaches
- Approach 5: jest.isolateModules()

---

## Timeline Estimate

- **Approach 1**: 15-30 minutes
- **Approach 2**: 15-30 minutes
- **Approach 3**: 1-2 hours
- **Approach 7**: 30-60 minutes

**Total Estimated Time**: 1-3 hours (depending on which approach works)

---

## Documentation Updates Needed

After fixing:
1. Update test comments to explain mock setup pattern
2. Document why `mockClear()` is not used in `beforeEach`
3. Add note about test isolation if using specific patterns
4. Update `REMAINING_TASKS.md` to mark as resolved

---

## Alternative: Accept Limitation

If all approaches fail:
1. Document as known limitation
2. Run test in isolation when needed
3. Add comment in test file explaining the issue
4. Consider filing Jest issue if it's a framework bug

---

## Implementation Priority

### Immediate Action: Try Approach 1

**Why Start Here:**
- Other tests in the file already use `mockReturnValue()` directly and work fine
- The failing test is the only one using `mockReset()` + `mockImplementation()`
- Removing `mockClear()` from `beforeEach` should prevent implementation clearing
- Simplest change with highest success probability

**Expected Fix:**
1. Remove `mockClear()` from `beforeEach` (keeps implementations intact)
2. Change failing test to use `mockReturnValue()` like other tests
3. This should work because other tests already follow this pattern successfully

### If Approach 1 Fails

**Next**: Try Approach 2 (test-specific beforeEach)
- Add `beforeEach` in `draftExists` describe block
- Set mock there to ensure it runs after main `beforeEach`

### If Approach 2 Fails

**Next**: Try Approach 7 (fix other test files)
- Modify `errorHandling.test.ts` and `ownership.test.ts`
- Replace `jest.clearAllMocks()` with specific mock clearing
- This addresses the root cause but affects other files

## Next Steps

1. ✅ **Analysis Complete**: Root cause identified
2. ✅ **Plan Created**: Multiple approaches documented  
3. ✅ **Priority Set**: Approach 1 recommended as first attempt
4. ⏳ **Implementation**: Start with Approach 1 (remove mockClear, simplify test)
5. ⏳ **Testing**: Verify fix works with all test files
6. ⏳ **Documentation**: Update docs with solution
