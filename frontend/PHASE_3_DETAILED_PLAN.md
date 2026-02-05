# Phase 3: Error Mutations - Detailed Execution Plan

## Overview
**Target:** Eliminate 63 error mutations  
**Expected Impact:** +0.9% to +1.1% mutation score  
**Time Estimate:** 2-3 days

---

## Root Cause Analysis

### Error Mutation Causes
1. **Null/Undefined Access** - Accessing properties on null/undefined
2. **Type Mismatches** - Wrong type assumptions
3. **Optional Chaining Mutations** - `?.` mutated to `.`
4. **Error Object Access** - Accessing error.message without checks
5. **JSON Parsing Errors** - Not handling parse failures
6. **Property Access** - Accessing nested properties without guards

---

## Files to Fix

### 1. `errorHandler.ts` ✅ PARTIALLY FIXED

#### Current Status
- ✅ Enhanced error message extraction
- ✅ Added null/undefined guards
- ✅ Enhanced type checking

#### Remaining Work
- [ ] Add comprehensive tests for error handling
- [ ] Verify all error paths are covered
- [ ] Test error object property access

#### Tests to Add
```typescript
describe('Error handling guards', () => {
  it('should handle null error object', () => {
    const result = handleApiError(null)
    expect(result).toBe('An error occurred')
  })
  
  it('should handle undefined error object', () => {
    const result = handleApiError(undefined)
    expect(result).toBe('An error occurred')
  })
  
  it('should handle error without message property', () => {
    const error = { code: 500 }
    const result = handleApiError(error)
    expect(result).toBe('An error occurred')
  })
  
  it('should handle error.response.data.detail', () => {
    const error = {
      response: {
        data: { detail: 'Custom error' }
      }
    }
    const result = handleApiError(error)
    expect(result).toBe('Custom error')
  })
  
  it('should handle error.response.data.message', () => {
    const error = {
      response: {
        data: { message: 'Error message' }
      }
    }
    const result = handleApiError(error)
    expect(result).toBe('Error message')
  })
  
  it('should handle string error', () => {
    const result = handleError('String error')
    expect(result).toBe('String error')
  })
  
  it('should handle Error instance', () => {
    const error = new Error('Error message')
    const result = handleError(error)
    expect(result).toBe('Error message')
  })
})
```

---

### 2. `storageHelpers.ts`

#### Current Status
- Already has good error handling
- Try-catch blocks in place
- Error handler called correctly

#### Verification Needed
- [ ] Verify all error paths are tested
- [ ] Test error object access in catch blocks
- [ ] Test context parameter handling

#### Tests to Add
```typescript
describe('Storage error handling', () => {
  it('should handle getItem throwing error', () => {
    mockStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error')
    })
    const result = safeStorageGet(mockStorage, 'key', 'default')
    expect(result).toBe('default')
    expect(handleStorageError).toHaveBeenCalled()
  })
  
  it('should handle setItem throwing error', () => {
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error')
    })
    const result = safeStorageSet(mockStorage, 'key', 'value')
    expect(result).toBe(false)
    expect(handleStorageError).toHaveBeenCalled()
  })
  
  it('should handle JSON.parse error', () => {
    mockStorage.getItem.mockReturnValue('invalid json')
    const result = safeStorageGet(mockStorage, 'key', 'default')
    expect(result).toBe('default')
    expect(handleStorageError).toHaveBeenCalled()
  })
  
  it('should handle error without message property', () => {
    mockStorage.getItem.mockImplementation(() => {
      throw { code: 'QUOTA_EXCEEDED' }
    })
    const result = safeStorageGet(mockStorage, 'key', 'default')
    expect(result).toBe('default')
    expect(handleStorageError).toHaveBeenCalled()
  })
})
```

---

### 3. `formUtils.ts`

#### Issues to Check
- Nested property access (`obj.a.b.c`)
- Path parsing errors
- Object traversal on null/undefined

#### Action Items
- [ ] Review all property access patterns
- [ ] Add null checks where needed
- [ ] Add tests for error scenarios

#### Code Review Points
```typescript
// Check for patterns like:
getNestedValue(obj, 'a.b.c') // obj could be null
setNestedValue(obj, 'a.b.c', value) // obj could be null
hasNestedValue(obj, 'a.b.c') // obj could be null
```

#### Tests to Add
```typescript
describe('Form utils error handling', () => {
  it('should handle null object in getNestedValue', () => {
    const result = getNestedValue(null, 'path', 'default')
    expect(result).toBe('default')
  })
  
  it('should handle undefined object in getNestedValue', () => {
    const result = getNestedValue(undefined, 'path', 'default')
    expect(result).toBe('default')
  })
  
  it('should handle null path in getNestedValue', () => {
    const result = getNestedValue({}, null, 'default')
    expect(result).toBe('default')
  })
  
  it('should handle invalid path format', () => {
    const result = getNestedValue({}, '', 'default')
    expect(result).toBe('default')
  })
})
```

---

### 4. `workflowFormat.ts`

#### Issues to Check
- JSON parsing errors
- Object property access
- Type conversion errors

#### Action Items
- [ ] Review JSON.parse usage
- [ ] Add error handling for parsing
- [ ] Add null checks for object access
- [ ] Add tests for error scenarios

---

### 5. `nodeUtils.ts` and `nodeConversion.ts`

#### Issues to Check
- Node property access
- Type conversions
- Null/undefined handling

#### Action Items
- [ ] Review all property access
- [ ] Add null checks
- [ ] Add type guards
- [ ] Add tests

---

### 6. All Hooks with Error Handling

#### Files to Review
- All hooks in `src/hooks/`
- Check catch blocks
- Check error object access
- Check optional chaining usage

#### Action Items
- [ ] Search for `catch (error)` blocks
- [ ] Verify error object access is safe
- [ ] Replace `error?.property` with explicit checks where needed
- [ ] Add tests for error scenarios

---

## Execution Steps

### Step 1: Complete errorHandler.ts
1. Add comprehensive error handling tests
2. Verify all error paths
3. Test all error object types

### Step 2: Review and Fix Storage Helpers
1. Verify error handling is comprehensive
2. Add missing error path tests
3. Test all error scenarios

### Step 3: Review and Fix Form Utils
1. Add null checks for property access
2. Add error handling tests
3. Test all edge cases

### Step 4: Review Other Utility Files
1. Review workflowFormat.ts
2. Review nodeUtils.ts
3. Review nodeConversion.ts
4. Add error handling where needed

### Step 5: Review All Hooks
1. Search for error handling patterns
2. Add guards where needed
3. Add tests for error scenarios

---

## Test Strategy

### Test Patterns
1. **Null/Undefined Tests**
   - Test with null input
   - Test with undefined input
   - Test with null properties

2. **Error Object Tests**
   - Test Error instance
   - Test plain object with message
   - Test object without message
   - Test string error

3. **Property Access Tests**
   - Test nested property access
   - Test optional chaining mutations
   - Test property existence checks

4. **Type Conversion Tests**
   - Test JSON.parse errors
   - Test type conversion errors
   - Test invalid type inputs

---

## Success Criteria

- [ ] All error object access is guarded
- [ ] All property access has null checks
- [ ] All JSON parsing has error handling
- [ ] All optional chaining is mutation-resistant
- [ ] All tests pass
- [ ] No error mutations remain

---

## Expected Results

- **Before:** 63 error mutations
- **After:** 0 error mutations
- **Score Improvement:** +0.9% to +1.1%
