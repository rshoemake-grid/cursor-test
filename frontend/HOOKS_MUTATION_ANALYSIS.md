# Hooks Folder Mutation Test Analysis

**Date:** January 26, 2026  
**Purpose:** Analyze surviving mutants in hook files, coverage gaps, and recommendations

---

## Executive Summary

This document analyzes all hook files in `frontend/src/hooks/` to:
1. Identify surviving mutants from mutation testing
2. Document statement and branch coverage
3. Provide recommendations for killing surviving mutants
4. Suggest code reorganization if needed to improve coverage

**Total Hook Files:** 33 files  
**Files with Mutation Test Results:** Based on previous analysis  
**Overall Mutation Score:** 81.58% (from latest test run)

---

## Coverage Data Summary

### Files with Coverage Data Available

| File | Statements | Branches | Functions | Lines | Notes |
|------|-----------|----------|-----------|-------|-------|
| `useAuthenticatedApi.ts` | 100% (107/107) | 100% (11/11) | 100% (1/1) | 100% (107/107) | ✅ Perfect coverage |
| `useFormField.ts` | 100% (110/110) | 96.55% (28/29) | 100% (3/3) | 100% (110/110) | ⚠️ 1 branch uncovered |
| `useLocalStorage.ts` | 95.14% (196/206) | 73.46% (36/49) | 100% (5/5) | 95.14% (196/206) | ⚠️ Low branch coverage |
| `useWebSocket.ts` | 87.71% (250/285) | 84.81% (67/79) | 100% (5/5) | 87.71% (250/285) | ⚠️ Missing statements/branches |
| `useWorkflowAPI.ts` | 100% (108/108) | 100% (16/16) | 100% (1/1) | 100% (108/108) | ✅ Perfect coverage |

**Note:** Many hook files don't appear in coverage summary, likely because they're not directly imported in test runs or have no test files.

---

## Detailed Analysis by File

### 1. `useWebSocket.ts`

**Coverage:**
- **Statements:** 87.71% (250/285) - 35 statements uncovered
- **Branches:** 84.81% (67/79) - 12 branches uncovered
- **Functions:** 100% (5/5)
- **Lines:** 87.71% (250/285)

**Previous Mutation Test Results (from FILES_NEEDING_IMPROVEMENT.md):**
- **Survived:** 34 mutants (highest in hooks folder)
- **Mutation Score:** 81.5%
- **Priority:** 🔴 High

**Surviving Mutants Analysis:**
Based on code review and previous analysis, likely surviving mutants include:

1. **WebSocket State Handling:**
   - Mutations in `wsState === WebSocket.CONNECTING/OPEN/CLOSING/CLOSED` checks
   - **How to Kill:** Test all WebSocket state transitions explicitly
   - **Location:** Lines 168-170, 195-199, 218-221, 225-227, 235-237, 247-249, 265-267

2. **Reconnection Logic:**
   - Mutations in `reconnectAttempts.current < maxReconnectAttempts` checks
   - Mutations in exponential backoff calculation: `Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)`
   - **How to Kill:** Test reconnection scenarios with various attempt counts
   - **Location:** Lines around 195-199

3. **Message Handler Conditionals:**
   - Mutations in `message.log && onLog` checks
   - Mutations in `message.status && onStatus` checks
   - Mutations in `message.node_state && onNodeUpdate` checks
   - **How to Kill:** Test all combinations of message properties and callback presence
   - **Location:** Lines around 100-150

4. **Protocol/Host Detection:**
   - Mutations in `windowLocation?.protocol === 'https:'` checks
   - Mutations in `windowLocation?.host || 'localhost:8000'` fallback
   - **How to Kill:** Test with different windowLocation configurations (https/http/undefined)
   - **Location:** Lines 82-84

5. **Execution Status Checks:**
   - Mutations in `executionStatus || lastKnownStatusRef.current` logic
   - Mutations in `currentStatus === 'completed' || currentStatus === 'failed'` checks
   - **How to Kill:** Test all status combinations and transitions
   - **Location:** Lines 67-71

**Code Reorganization Recommendations:**
- **Extract WebSocket State Machine:** Create a separate function/class for WebSocket state management
- **Extract Reconnection Logic:** Move reconnection logic to a separate function for easier testing
- **Simplify Conditional Chains:** Break down complex conditionals into smaller, testable functions

**Test Files:** 
- `useWebSocket.connection.test.ts`
- `useWebSocket.cleanup.test.ts`
- `useWebSocket.mutation.advanced.test.ts`
- `useWebSocket.mutation.kill-remaining.test.ts`
- `useWebSocket.no-coverage.test.ts`
- Multiple edge case test files

**Action Items:**
1. Add tests for all WebSocket state transitions
2. Test reconnection logic with various attempt counts
3. Test all message handler conditional branches
4. Test protocol/host detection edge cases
5. Test execution status transition scenarios

---

### 2. `useMarketplaceData.ts`

**Coverage:**
- **Statements:** Not in coverage summary (likely not directly tested)
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 31 mutants (second highest)
- **Mutation Score:** 88.5%
- **Priority:** 🟡 Medium

**Surviving Mutants Analysis:**
Based on code structure and previous analysis:

1. **Filtering Logic:**
   - Mutations in category filtering: `category && params.append('category', category)`
   - Mutations in search query filtering: `searchQuery && params.append('search', searchQuery)`
   - **How to Kill:** Test with empty strings, null, undefined for filters
   - **Location:** Lines 83-84

2. **Sorting Logic:**
   - Mutations in sort operations
   - **How to Kill:** Test all sort combinations and edge cases
   - **Location:** Various sort functions

3. **User Property Access:**
   - Mutations in `user.id`, `user.username`, `user.email` access
   - **How to Kill:** Test with user objects missing properties
   - **Location:** Throughout file

4. **Response Handling:**
   - Mutations in `response.ok` checks
   - Mutations in JSON parsing
   - **How to Kill:** Test error responses and malformed JSON
   - **Location:** Fetch functions

5. **Conditional Logic:**
   - Mutations in `activeTab` and `repositorySubTab` conditionals
   - **How to Kill:** Test all tab combinations
   - **Location:** useEffect hooks

**Code Reorganization Recommendations:**
- **Extract Filter Logic:** Create separate functions for filtering
- **Extract Sort Logic:** Move sorting to utility functions
- **Simplify Conditional Chains:** Break down complex useEffect conditionals

**Test Files:**
- `useMarketplaceData.test.ts`
- `useMarketplaceData.branches.test.ts`
- `useMarketplaceData.*.test.ts` (many specialized test files)

**Action Items:**
1. Add tests for all filter combinations (empty, null, undefined)
2. Test all sort operations
3. Test user property access edge cases
4. Test error response handling
5. Test all tab/subtab combinations

---

### 3. `useTemplateOperations.ts`

**Coverage:**
- **Statements:** Not in coverage summary
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 30 mutants
- **Mutation Score:** 87.9%
- **Priority:** 🟡 Medium

**Surviving Mutants Analysis:**

1. **Template CRUD Operations:**
   - Mutations in create/update/delete operations
   - **How to Kill:** Test all CRUD operations with various inputs
   - **Location:** CRUD functions

2. **Validation Logic:**
   - Mutations in template validation
   - **How to Kill:** Test invalid templates, edge cases
   - **Location:** Validation functions

3. **Error Handling:**
   - Mutations in try-catch blocks
   - **How to Kill:** Test error scenarios explicitly
   - **Location:** All async operations

**Test Files:**
- `useTemplateOperations.test.ts`
- `useTemplateOperations.branches.test.ts`
- `useTemplateOperations.no-coverage.test.ts`

**Action Items:**
1. Test all CRUD operations
2. Test validation edge cases
3. Test error scenarios

---

### 4. `useMarketplaceIntegration.ts`

**Coverage:**
- **Statements:** Not in coverage summary
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 25 mutants
- **Mutation Score:** 80.6%
- **Priority:** 🔴 High (low score)

**Surviving Mutants Analysis:**

1. **Integration Logic:**
   - Mutations in integration checks
   - **How to Kill:** Test integration scenarios
   - **Location:** Integration functions

2. **API Calls:**
   - Mutations in API request/response handling
   - **How to Kill:** Test API error cases
   - **Location:** API call functions

**Test Files:**
- `useMarketplaceIntegration.mutation.test.ts`
- `useMarketplaceIntegration.test.ts`

**Action Items:**
1. Add comprehensive integration tests
2. Test API error scenarios
3. Test edge cases

---

### 5. `useExecutionManagement.ts`

**Coverage:**
- **Statements:** Not in coverage summary
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 23 mutants
- **Mutation Score:** 88.3%
- **Priority:** 🟡 Medium

**Surviving Mutants Analysis:**

1. **Execution State Management:**
   - Mutations in state transitions
   - **How to Kill:** Test all state transitions
   - **Location:** State management functions

2. **Execution Lifecycle:**
   - Mutations in start/stop/pause logic
   - **How to Kill:** Test lifecycle edge cases
   - **Location:** Lifecycle functions

**Test Files:**
- `useExecutionManagement.mutation.test.ts`

**Action Items:**
1. Test all state transitions
2. Test lifecycle edge cases

---

### 6. `useLocalStorage.ts`

**Coverage:**
- **Statements:** 95.14% (196/206) - 10 statements uncovered
- **Branches:** 73.46% (36/49) - 13 branches uncovered ⚠️
- **Functions:** 100% (5/5)
- **Lines:** 95.14% (196/206)

**Previous Mutation Test Results:**
- **Survived:** 19 mutants
- **Mutation Score:** 85.5%
- **Priority:** 🟡 Medium

**Surviving Mutants Analysis:**

1. **Storage Null/Undefined Handling:**
   - Mutations in `if (!storage)` checks
   - Mutations in `storage ? ... : ...` ternary operators
   - **How to Kill:** Test with null storage adapter
   - **Location:** Lines 23-24, 48, 65, 75-76

2. **JSON Parsing Edge Cases:**
   - Mutations in `item ? JSON.parse(item) : initialValue`
   - Mutations in error handling for JSON.parse
   - **How to Kill:** Test with invalid JSON strings, null values
   - **Location:** Lines 28-29, 82-84

3. **Undefined to Null Conversion:**
   - Mutations in `valueToStore === undefined ? JSON.stringify(null) : JSON.stringify(valueToStore)`
   - **How to Kill:** Test with undefined values explicitly
   - **Location:** Line 51

4. **Storage Event Handling:**
   - Mutations in `e.key === key && e.newValue` checks
   - Mutations in storage event listener setup/teardown
   - **How to Kill:** Test storage events with various key/newValue combinations
   - **Location:** Lines 80, 89-90

**Code Reorganization Recommendations:**
- **Extract Storage Operations:** Create separate functions for get/set/remove operations
- **Simplify Conditional Logic:** Break down complex conditionals
- **Extract Error Handling:** Create utility functions for JSON parsing with error handling

**Test Files:**
- `useLocalStorage.test.ts`
- `useLocalStorage.branches.test.ts`

**Action Items:**
1. ✅ Already has branch tests - verify they cover all 13 missing branches
2. Test null storage adapter scenarios
3. Test invalid JSON parsing
4. Test undefined value handling
5. Test storage event edge cases

---

### 7. `useTabOperations.ts`

**Coverage:**
- **Statements:** Not in coverage summary
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 19 mutants
- **Mutation Score:** 85.7%
- **Priority:** 🟡 Medium

**Surviving Mutants Analysis:**

1. **Tab CRUD Operations:**
   - Mutations in create/delete/update operations
   - **How to Kill:** Test all tab operations
   - **Location:** Tab operation functions

2. **Tab State Management:**
   - Mutations in active tab logic
   - **How to Kill:** Test tab switching scenarios
   - **Location:** State management

**Test Files:**
- `useTabOperations.test.ts`

**Action Items:**
1. Test all tab operations
2. Test tab state transitions

---

### 8. `useLLMProviders.ts`

**Coverage:**
- **Statements:** Not in coverage summary
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 18 mutants
- **Mutation Score:** 84.3%
- **Priority:** 🟡 Medium

**Surviving Mutants Analysis:**

1. **Provider Configuration:**
   - Mutations in provider setup/validation
   - **How to Kill:** Test provider configuration edge cases
   - **Location:** Provider functions

2. **API Key Handling:**
   - Mutations in API key validation/storage
   - **How to Kill:** Test invalid/missing API keys
   - **Location:** API key handling

**Test Files:**
- `useLLMProviders.test.ts`
- `useLLMProviders.mutation.test.ts`

**Action Items:**
1. Test provider configuration
2. Test API key edge cases

---

### 9. `useKeyboardShortcuts.ts`

**Coverage:**
- **Statements:** Not in coverage summary
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 18 mutants
- **Mutation Score:** 79.8% ⚠️ **BELOW 80% THRESHOLD**
- **Priority:** 🔴 High (critical - below threshold)

**Surviving Mutants Analysis:**

1. **Keyboard Event Handling:**
   - Mutations in key combination checks
   - Mutations in modifier key checks (Ctrl/Cmd/Shift/Alt)
   - **How to Kill:** Test all key combinations explicitly
   - **Location:** Event handler functions

2. **Conditional Logic:**
   - Mutations in `if (condition)` checks for shortcuts
   - **How to Kill:** Test all conditional branches
   - **Location:** Shortcut handlers

**Code Reorganization Recommendations:**
- **Extract Key Matching Logic:** Create separate function for key matching
- **Simplify Conditional Chains:** Break down complex conditionals

**Test Files:**
- `useKeyboardShortcuts.test.ts`
- `useKeyboardShortcuts.mutation.test.ts`

**Action Items:**
1. **CRITICAL:** Add tests for all key combinations
2. Test modifier key combinations
3. Test conditional branches
4. Improve mutation score above 80%

---

### 10. `useTabInitialization.ts`

**Coverage:**
- **Statements:** Not in coverage summary
- **Branches:** Not available
- **Functions:** Not available
- **Lines:** Not available

**Previous Mutation Test Results:**
- **Survived:** 9 mutants
- **Mutation Score:** 80.9%
- **Priority:** 🔴 High (just above threshold)

**Surviving Mutants Analysis:**

1. **Initialization Logic:**
   - Mutations in initialization checks
   - **How to Kill:** Test initialization edge cases
   - **Location:** Initialization functions

**Test Files:**
- `useTabInitialization.test.ts`

**Action Items:**
1. Test initialization edge cases
2. Improve mutation score

---

## Files with Perfect Coverage

### ✅ `useAuthenticatedApi.ts`
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%
- **Status:** ✅ No action needed

### ✅ `useWorkflowAPI.ts`
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%
- **Status:** ✅ No action needed

---

## Files Needing Attention

### 🔴 Critical Priority (Below 80% or High Survivors)

1. **`useKeyboardShortcuts.ts`** - 79.8% score, 18 survivors
2. **`useWebSocket.ts`** - 81.5% score, 34 survivors (highest)
3. **`useMarketplaceIntegration.ts`** - 80.6% score, 25 survivors
4. **`useTabInitialization.ts`** - 80.9% score, 9 survivors

### 🟡 Medium Priority (80-85% or Medium Survivors)

1. **`useMarketplaceData.ts`** - 88.5% score, 31 survivors
2. **`useTemplateOperations.ts`** - 87.9% score, 30 survivors
3. **`useExecutionManagement.ts`** - 88.3% score, 23 survivors
4. **`useLocalStorage.ts`** - 85.5% score, 19 survivors, 73.46% branch coverage
5. **`useTabOperations.ts`** - 85.7% score, 19 survivors
6. **`useLLMProviders.ts`** - 84.3% score, 18 survivors

---

## Common Patterns in Surviving Mutants

### 1. Conditional Logic Mutations
**Pattern:** Mutations in `if (condition)`, `condition ? a : b`, `condition && action`
**Solution:** Test both truthy and falsy branches explicitly

### 2. Null/Undefined Handling
**Pattern:** Mutations in `value || defaultValue`, `value?.property`
**Solution:** Test with null, undefined, and valid values

### 3. Error Handling
**Pattern:** Mutations in try-catch blocks, error condition checks
**Solution:** Test error scenarios explicitly

### 4. Complex Conditionals
**Pattern:** Mutations in `a && b`, `a || b`, `a && b && c`
**Solution:** Test all combinations of conditions

### 5. Default Values
**Pattern:** Mutations in `value || 'default'`, `value ?? 'default'`
**Solution:** Test with falsy values, null, undefined

---

## Code Reorganization Recommendations

### General Principles

1. **Extract Complex Conditionals:**
   - Move complex conditionals to named functions
   - Makes testing easier and code more readable

2. **Separate Concerns:**
   - Split large hooks into smaller, focused hooks
   - Extract utility functions for common operations

3. **Simplify Error Handling:**
   - Create consistent error handling patterns
   - Extract error handling to utility functions

4. **Reduce Nesting:**
   - Use early returns to reduce nesting
   - Makes branches easier to test

### Specific Recommendations

#### `useWebSocket.ts`
- Extract WebSocket state machine to separate module
- Extract reconnection logic to separate function
- Simplify message handler conditionals

#### `useLocalStorage.ts`
- Extract storage operations to utility functions
- Simplify conditional logic with early returns
- Extract JSON parsing with error handling

#### `useKeyboardShortcuts.ts`
- Extract key matching logic to utility function
- Simplify conditional chains
- Create testable key combination matcher

#### `useMarketplaceData.ts`
- Extract filter logic to separate functions
- Extract sort logic to utility functions
- Simplify useEffect conditionals

---

## Action Plan

### Phase 1: Critical Files (Week 1)
1. **`useKeyboardShortcuts.ts`** - Improve to >80%
2. **`useWebSocket.ts`** - Reduce survivors from 34
3. **`useMarketplaceIntegration.ts`** - Improve score

### Phase 2: High Survivor Files (Week 2)
1. **`useMarketplaceData.ts`** - Reduce 31 survivors
2. **`useTemplateOperations.ts`** - Reduce 30 survivors
3. **`useExecutionManagement.ts`** - Reduce 23 survivors

### Phase 3: Branch Coverage (Week 3)
1. **`useLocalStorage.ts`** - Improve branch coverage from 73.46%
2. **`useFormField.ts`** - Cover remaining 1 branch
3. **`useWebSocket.ts`** - Improve branch coverage

### Phase 4: Remaining Files (Week 4)
1. Review all remaining files
2. Add missing tests
3. Verify mutation score improvements

---

## Testing Strategy

### For Each Hook File:

1. **Identify Uncovered Branches:**
   - Review coverage report
   - Identify missing branch combinations

2. **Identify Surviving Mutants:**
   - Review mutation test report
   - Identify mutant types and locations

3. **Create Targeted Tests:**
   - Write tests for each uncovered branch
   - Write tests to kill each surviving mutant

4. **Verify Improvements:**
   - Re-run mutation tests
   - Verify mutants are killed
   - Verify coverage improvements

---

## Conclusion

**Key Findings:**
- 4 files need critical attention (below 80% or high survivors)
- 6 files need medium attention
- 2 files have perfect coverage
- Common patterns: conditional logic, null handling, error handling

**Priority Actions:**
1. Fix `useKeyboardShortcuts.ts` (below 80% threshold)
2. Reduce survivors in `useWebSocket.ts` (34 survivors)
3. Improve branch coverage in `useLocalStorage.ts` (73.46%)

**Expected Impact:**
- Addressing top 5 files could reduce survivors by 50-70%
- Improving branch coverage could improve mutation scores by 2-5%
- Code reorganization could make future testing easier

---

**Last Updated:** January 26, 2026  
**Next Review:** After implementing Phase 1 improvements
