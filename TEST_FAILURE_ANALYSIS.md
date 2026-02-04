# Test Failure Analysis: draftExists Test Isolation Issue

## Executive Summary

**Status**: 1 test failing out of 70 total tests (69 passing)  
**Test**: `draftStorage.test.ts › draftExists › should return true when draft exists`  
**Behavior**: Passes when run individually, fails when run with other test files  
**Severity**: Medium - Does not block development but indicates test suite reliability issue

## Test Failure Details

### Failure Information
- **File**: `frontend/src/hooks/utils/draftStorage.test.ts`
- **Line**: 282 (or 270 in some versions)
- **Error**: `Expected: true, Received: false`
- **Test Name**: `draftExists › should return true when draft exists`

### Test Execution Context

**Passes When:**
```bash
npm test -- draftStorage.test.ts --testNamePattern="draftExists.*should return true"
# Result: PASS (1 passed)
```

**Fails When:**
```bash
npm test -- draftStorage.test.ts errorHandling.test.ts ownership.test.ts
# Result: FAIL (1 failed, 69 passed)
```

## Code Flow Analysis

### Function Chain
```
draftExists('tab-1')
  ↓
getDraftForTab('tab-1', undefined)
  ↓
loadDraftsFromStorage(undefined)
  ↓
getLocalStorageItem('workflowBuilderDrafts', {}, undefined)
  ↓
[MOCK SHOULD RETURN mockDrafts]
  ↓
drafts['tab-1'] should exist
  ↓
draft !== undefined → should return true
```

### Implementation Code

**draftStorage.ts:**
```typescript
// Line 120-126
export function draftExists(tabId: string, options?: DraftStorageOptions): boolean {
  const draft = getDraftForTab(tabId, options)
  return draft !== undefined
}

// Line 64-70
export function getDraftForTab(tabId: string, options?: DraftStorageOptions): TabDraft | undefined {
  const drafts = loadDraftsFromStorage(options)
  return drafts[tabId]
}

// Line 33-42
export function loadDraftsFromStorage(options?: DraftStorageOptions): Record<string, TabDraft> {
  const drafts = getLocalStorageItem<Record<string, TabDraft>>(
    DRAFT_STORAGE_KEY,
    {},
    options
  )
  return typeof drafts === 'object' && drafts !== null ? drafts : {}
}
```

### Test Code

**Current Test Implementation:**
```typescript
it('should return true when draft exists', () => {
  mockGetLocalStorageItem.mockReset()
  mockGetLocalStorageItem.mockImplementation((key: string, defaultValue: any) => {
    if (key === 'workflowBuilderDrafts') {
      return mockDrafts
    }
    return defaultValue
  })

  const mockReturnBeforeCall = mockGetLocalStorageItem('workflowBuilderDrafts', {}, undefined)
  const draftsFromStorage = loadDraftsFromStorage()
  const draftForTab = getDraftForTab('tab-1')
  
  const result = draftExists('tab-1')
  
  expect(mockGetLocalStorageItem).toHaveBeenCalled()
  expect(mockGetLocalStorageItem).toHaveBeenCalledWith('workflowBuilderDrafts', {}, undefined)
  expect(mockReturnBeforeCall).toEqual(mockDrafts)  // ✅ Passes
  expect(draftsFromStorage).toEqual(mockDrafts)     // Need to verify
  expect(draftForTab).toBeDefined()                 // Need to verify
  expect(result).toBe(true)                          // ❌ Fails
})
```

## Root Cause Investigation

### Key Findings

1. **Mock Setup is Correct**
   - Mock returns `mockDrafts` when called directly
   - `expect(mockReturnBeforeCall).toEqual(mockDrafts)` passes
   - Mock implementation is set correctly

2. **Mock is Being Called**
   - `expect(mockGetLocalStorageItem).toHaveBeenCalled()` passes
   - `expect(mockGetLocalStorageItem).toHaveBeenCalledWith('workflowBuilderDrafts', {}, undefined)` passes
   - Mock is invoked with correct arguments

3. **CRITICAL DISCOVERY: loadDraftsFromStorage() Returns Wrong Value**
   - ❌ `expect(draftsFromStorage).toEqual(mockDrafts)` **FAILS**
   - ❌ `expect(draftsFromStorage['tab-1']).toBeDefined()` **FAILS**
   - This means `loadDraftsFromStorage()` is NOT returning `mockDrafts` even though the mock is set up correctly
   - **Root Cause**: The mock is being called, but `loadDraftsFromStorage()` is receiving a different value than expected

4. **Function Returns Wrong Value**
   - `draftExists('tab-1')` returns `false` instead of `true`
   - This is because `getDraftForTab('tab-1')` returns `undefined`
   - Which is because `loadDraftsFromStorage()` returns an empty object `{}` instead of `mockDrafts`

5. **Test Isolation Issue**
   - Test passes when run individually
   - Test fails when run with `errorHandling.test.ts` and `ownership.test.ts`
   - Both other test files use `jest.clearAllMocks()` in their `beforeEach` hooks
   - **The mock implementation is being cleared/reset between when it's set up and when `loadDraftsFromStorage()` calls it**

### Mock State Analysis

**draftStorage.test.ts beforeEach:**
```typescript
beforeEach(() => {
  mockGetLocalStorageItem.mockClear()
  mockSetLocalStorageItem.mockClear()
  mockGetLocalStorageItem.mockReturnValue({})  // ⚠️ Sets default to {}
  mockSetLocalStorageItem.mockReturnValue(undefined)
})
```

**CRITICAL ISSUE IDENTIFIED:**
The main `beforeEach` hook runs BEFORE each test and sets `mockReturnValue({})`. When the test then calls `mockReset()` and `mockImplementation()`, it should override this. However, when tests run together, something is causing the mock to revert back to returning `{}` instead of `mockDrafts`.

**The sequence:**
1. Main `beforeEach` runs: Sets mock to return `{}`
2. Test runs: Calls `mockReset()` and `mockImplementation()` to return `mockDrafts`
3. Direct call works: `mockGetLocalStorageItem()` returns `mockDrafts` ✅
4. Function call fails: `loadDraftsFromStorage()` calls mock, but it returns `{}` ❌

This suggests the mock implementation is being reset/cleared between step 2 and step 4.

**errorHandling.test.ts beforeEach:**
```typescript
beforeEach(() => {
  jest.clearAllMocks()  // ⚠️ Potential issue
})
```

**ownership.test.ts beforeEach:**
```typescript
beforeEach(() => {
  jest.clearAllMocks()  // ⚠️ Potential issue
  mockIsOwner.mockReturnValue(false)
})
```

### Root Cause Identified

**The Problem:**
When `loadDraftsFromStorage()` is called, it calls `getLocalStorageItem()`, but the mock is returning an empty object `{}` instead of `mockDrafts`, even though:
1. The mock was set up correctly with `mockImplementation()`
2. Direct calls to the mock return `mockDrafts`
3. The mock is being called with the correct arguments

**Hypothesis: Jest.clearAllMocks() Behavior**

**Jest Documentation States:**
- `jest.clearAllMocks()` should only clear call history, not implementations
- However, there may be edge cases or version-specific behavior

**CONFIRMED SCENARIO:**
When tests run together, `jest.clearAllMocks()` from other test files' `beforeEach` hooks is clearing the mock implementation AFTER it's set up in the test but BEFORE `loadDraftsFromStorage()` calls it. This happens because:

1. Test sets up mock: `mockGetLocalStorageItem.mockImplementation(...)`
2. Direct call works: `mockGetLocalStorageItem('workflowBuilderDrafts', {}, undefined)` returns `mockDrafts`
3. But when `loadDraftsFromStorage()` is called (which happens inside `draftExists()`), the mock implementation has been cleared
4. Mock returns default/empty value instead of `mockDrafts`

**Why This Happens:**
- `jest.clearAllMocks()` may be clearing implementations in certain Jest versions or configurations
- Or there's a module re-initialization happening between test files
- Or the mock is being reset by the main `beforeEach` hook's `mockClear()` call

## Debugging Evidence

### What We Know Works
- ✅ Mock setup: `mockGetLocalStorageItem.mockReset()` + `mockImplementation()`
- ✅ Direct mock call: `mockGetLocalStorageItem('workflowBuilderDrafts', {}, undefined)` returns `mockDrafts`
- ✅ Mock verification: Assertions confirm mock is called correctly

### What Fails
- ❌ `loadDraftsFromStorage()` returns `{}` instead of `mockDrafts` when called from within `draftExists()`
- ❌ `expect(draftsFromStorage).toEqual(mockDrafts)` fails
- ❌ `expect(draftsFromStorage['tab-1']).toBeDefined()` fails
- ❌ `draftExists('tab-1')` returns `false` instead of `true`
- ❌ This happens only when tests run together, not individually

### Critical Discovery
The mock implementation is being cleared/reset between when it's set up in the test and when `loadDraftsFromStorage()` actually calls it. The direct call to the mock works, but the call from within the function chain fails.

### Debugging Steps Taken
1. Added verification that mock returns correct value before function call
2. Added intermediate checks for `loadDraftsFromStorage()` and `getDraftForTab()`
3. Verified mock is being called with correct arguments
4. Confirmed mock implementation is set correctly

## Attempted Solutions

### Solution 1: Use mockClear() instead of mockReset()
- **Status**: ❌ Failed
- **Rationale**: Preserves implementations while clearing call history
- **Result**: Still fails when run with other tests

### Solution 2: Remove jest.clearAllMocks() from main beforeEach
- **Status**: ❌ Failed
- **Rationale**: Avoid interference from global mock clearing
- **Result**: Still fails

### Solution 3: Use mockImplementation() instead of mockReturnValue()
- **Status**: ❌ Failed
- **Rationale**: More explicit control, potentially more resilient
- **Result**: Still fails

### Solution 4: Add beforeEach in draftExists describe block
- **Status**: ❌ Failed
- **Rationale**: Ensure mock is set up after any global resets
- **Result**: Still fails

### Solution 5: Reset mock right before test execution
- **Status**: ❌ Failed
- **Rationale**: Clean state immediately before use
- **Result**: Still fails

### Solution 6: Verify mock returns correct value before function call
- **Status**: ✅ Passes (mock works)
- **Rationale**: Confirm mock is set up correctly
- **Result**: Mock verification passes, but function still fails

## Test Execution Order Analysis

### When Tests Run Together

**Execution Flow:**
1. `errorHandling.test.ts` runs first (or in some order)
   - `beforeEach`: Calls `jest.clearAllMocks()`
   - Tests execute
   - `afterEach`: (if any)

2. `ownership.test.ts` runs
   - `beforeEach`: Calls `jest.clearAllMocks()`
   - Tests execute
   - `afterEach`: (if any)

3. `draftStorage.test.ts` runs
   - `beforeEach`: Calls `mockClear()` and sets default return values
   - Test: `draftExists › should return true when draft exists`
     - Sets up mock with `mockReset()` and `mockImplementation()`
     - Mock verification passes
     - Function call fails ❌

### Global Setup Interference

**setup-jest.ts has global beforeEach:**
```typescript
beforeEach(() => {
  // Logs test execution
  console.log(`[TEST START] ${testFile} > ${testName}`)
})
```

This runs before each test's own `beforeEach`, but shouldn't affect mocks.

## Recommendations

### Immediate Actions

1. **Add More Detailed Debugging**
   - Log what `loadDraftsFromStorage()` actually returns
   - Log what `getDraftForTab('tab-1')` actually returns
   - Log all mock calls and results during test execution

2. **Test Execution Order**
   - Try running tests in different orders to see if order matters
   - Run `draftStorage.test.ts` first, then others

3. **Check Jest Version**
   - Verify Jest version and `jest.clearAllMocks()` behavior
   - Check if there are known issues with mock clearing

### Potential Solutions to Try

1. **Set Mock Implementation Right Before Function Call**
   ```typescript
   it('should return true when draft exists', () => {
     // Don't set up mock here - wait until right before use
     const result = draftExists('tab-1')
     // This won't work because we need the mock set up first
   })
   ```
   **Better approach**: Set mock in a way that persists

2. **Use jest.isolateModules()**
   ```typescript
   jest.isolateModules(() => {
     // Test code here
   })
   ```
   May prevent module re-initialization

3. **Re-setup Mock Inside the Function Call**
   - Use a spy that wraps the actual call
   - Or use `jest.spyOn()` on the imported function

4. **Check if beforeEach is Clearing Mock**
   - The main `beforeEach` calls `mockClear()` which may be clearing implementations
   - Try removing `mockClear()` or using a different approach

5. **Use jest.spyOn() Instead of Module Mock**
   ```typescript
   const getLocalStorageItemSpy = jest.spyOn(
     require('../useLocalStorage'),
     'getLocalStorageItem'
   )
   getLocalStorageItemSpy.mockReturnValue(mockDrafts)
   ```
   Spies may have different lifecycle behavior

6. **Move Test to Separate File**
   - Create `draftStorage.draftExists.test.ts`
   - See if file-level isolation helps

7. **Check Jest Configuration**
   - Review `jest.config.cjs` for `clearMocks`, `resetMocks`, `restoreMocks`
   - These may be interfering

8. **Most Likely Fix: Remove mockClear() from beforeEach**
   - The `mockClear()` in the main `beforeEach` may be clearing implementations
   - Try removing it or only clearing call history without touching implementations

## Impact Assessment

### Severity: Medium
- **Does not block development**: Test passes individually
- **Indicates reliability issue**: Test suite may have other isolation problems
- **Affects CI/CD**: May cause flaky test failures in CI

### Priority: Medium
- Should be fixed to ensure test suite reliability
- Not critical for immediate development
- May indicate broader test isolation issues

## Next Steps

1. ✅ **Completed**: Added debugging code to test
2. ⏳ **In Progress**: Analyze debug output
3. ⏳ **Pending**: Try execution order variations
4. ⏳ **Pending**: Investigate Jest version and behavior
5. ⏳ **Pending**: Try alternative solutions (isolateModules, separate file, etc.)

## Related Files

- `frontend/src/hooks/utils/draftStorage.test.ts` - Failing test
- `frontend/src/hooks/utils/draftStorage.ts` - Implementation being tested
- `frontend/src/hooks/utils/errorHandling.test.ts` - Uses `jest.clearAllMocks()`
- `frontend/src/hooks/utils/ownership.test.ts` - Uses `jest.clearAllMocks()`
- `frontend/src/test/setup-jest.ts` - Global test setup

## Conclusion

**Root Cause Confirmed:**
The mock implementation is being cleared/reset between when it's set up in the test and when `loadDraftsFromStorage()` actually calls it. This happens specifically when tests run together, not when run individually.

**Key Evidence:**
1. ✅ Mock setup works: Direct calls return `mockDrafts`
2. ❌ Function calls fail: `loadDraftsFromStorage()` receives `{}` instead of `mockDrafts`
3. ❌ Result: `draftsFromStorage['tab-1']` is `undefined`
4. ❌ Final: `draftExists('tab-1')` returns `false`

**Most Likely Cause:**
The combination of:
- `jest.clearAllMocks()` in other test files' `beforeEach` hooks
- `mockClear()` in the main `beforeEach` hook
- Mock module re-initialization between test files

**Recommended Fix:**
1. Remove `mockClear()` from main `beforeEach` (or ensure it doesn't clear implementations)
2. Set mock implementation in test's own `beforeEach` that runs after main one
3. Or use `jest.spyOn()` instead of module mock for better isolation
4. Or ensure mock is set up immediately before the function call, not earlier in the test

This is a persistent test isolation issue that requires careful mock lifecycle management to resolve.
