# Surviving Mutants Priority Analysis

**Analysis Date:** January 26, 2026  
**Total Surviving Mutants:** 724

---

## Top Priority Files (Most Surviving Mutants)

### 🔴 Critical Priority

#### 1. **useMarketplaceData.ts** - 80 survived mutants
- **Current Score:** 67.54%
- **Killed:** 204 | **Survived:** 80 | **No Coverage:** 19
- **Risk:** High - Marketplace functionality is user-facing
- **Action:** Add tests for edge cases, error handling, and conditional branches

#### 2. **useWebSocket.ts** - 73 survived mutants  
- **Current Score:** 60.32%
- **Killed:** 147 | **Survived:** 73 | **No Coverage:** 25
- **Risk:** Critical - WebSocket is essential for real-time updates
- **Action:** Add tests for connection states, error recovery, and edge cases

#### 3. **useCanvasEvents.ts** - 50 survived mutants
- **Current Score:** 61.05%
- **Killed:** 105 | **Survived:** 50 | **No Coverage:** 17
- **Risk:** Medium - Canvas interactions are important for UX
- **Action:** Add tests for event handling, edge cases, and conditional logic

#### 4. **useTemplateOperations.ts** - 47 survived mutants
- **Current Score:** 81.68%
- **Killed:** 223 | **Survived:** 47 | **No Coverage:** 3
- **Risk:** Medium - Template operations are important but score is already good
- **Action:** Add tests for remaining edge cases

#### 5. **useWorkflowExecution.ts** - 47 survived mutants
- **Current Score:** 53.21%
- **Killed:** 55 | **Survived:** 47 | **No Coverage:** 4
- **Risk:** Critical - Workflow execution is core functionality
- **Action:** Add comprehensive tests for execution flows and error handling

#### 6. **useLLMProviders.ts** - 44 survived mutants
- **Current Score:** 64.34%
- **Killed:** 76 | **Survived:** 44 | **No Coverage:** 2
- **Risk:** Medium - LLM provider management
- **Action:** Add tests for provider switching and configuration

### 🟡 Medium Priority

#### 7. **useExecutionManagement.ts** - 37 survived mutants
- **Current Score:** 81.55%
- **Killed:** 167 | **Survived:** 37 | **No Coverage:** 1
- **Risk:** Medium - Already has good score
- **Action:** Fine-tune tests for remaining edge cases

#### 8. **useMarketplacePublishing.ts** - 36 survived mutants
- **Current Score:** 37.10%
- **Killed:** 13 | **Survived:** 36 | **No Coverage:** 3
- **Risk:** Medium - Publishing functionality
- **Action:** Improve overall test coverage significantly

#### 9. **useWorkflowUpdates.ts** - 39 survived mutants
- **Current Score:** 70.45%
- **Killed:** 88 | **Survived:** 39 | **No Coverage:** 0
- **Risk:** Medium - Already above 70% threshold
- **Action:** Add tests for remaining conditional branches

#### 10. **useMarketplaceIntegration.ts** - 41 survived mutants
- **Current Score:** 31.34%
- **Killed:** 42 | **Survived:** 41 | **No Coverage:** 51
- **Risk:** High - Low score with many no-coverage mutants
- **Action:** Add comprehensive test suite

---

## Common Patterns in Surviving Mutants

### 1. Conditional Expressions
- Logical operators (`&&`, `||`) mutations surviving
- Ternary operators not fully tested
- **Example:** `if (condition && otherCondition)` - need tests for both true/false combinations

### 2. Comparison Operators
- Equality checks (`===`, `!==`) surviving
- Comparison operators (`>`, `<`, `>=`, `<=`) not fully tested
- **Example:** `if (value > threshold)` - need tests for boundary cases

### 3. Array Operations
- Array methods (`.map()`, `.filter()`, `.find()`) mutations surviving
- Array length checks not fully covered
- **Example:** `array.length > 0` - need tests for empty arrays

### 4. String Operations
- String methods (`.startsWith()`, `.includes()`) mutations surviving
- String concatenation not fully tested
- **Example:** `str.startsWith('prefix')` - need tests for exact matches

### 5. Object Property Access
- Optional chaining (`?.`) mutations surviving
- Property existence checks not fully covered
- **Example:** `obj?.property` - need tests for null/undefined objects

---

## Recommended Test Strategies

### For Conditional Logic
1. Test both branches of `if/else` statements
2. Test all combinations of logical operators
3. Test boundary conditions for comparisons
4. Test null/undefined/empty cases

### For Array Operations
1. Test with empty arrays
2. Test with single-item arrays
3. Test with multiple items
4. Test with null/undefined arrays

### For String Operations
1. Test exact matches
2. Test partial matches
3. Test empty strings
4. Test null/undefined strings

### For Object Operations
1. Test with null objects
2. Test with undefined objects
3. Test with missing properties
4. Test with nested properties

---

## Expected Impact

### Phase 1: Top 5 Files (Critical Priority)
- **Files:** useMarketplaceData, useWebSocket, useCanvasEvents, useTemplateOperations, useWorkflowExecution
- **Current Surviving:** 297 mutants
- **Target:** Reduce to <100 mutants
- **Expected Score Improvement:** +5-7% overall

### Phase 2: Medium Priority Files
- **Files:** useLLMProviders, useExecutionManagement, useMarketplacePublishing, useWorkflowUpdates, useMarketplaceIntegration
- **Current Surviving:** 193 mutants
- **Target:** Reduce to <80 mutants
- **Expected Score Improvement:** +3-5% overall

### Overall Goal
- **Current Overall Score:** 70.20%
- **Target Score:** 75%+ (after Phase 1)
- **Long-term Target:** 80%+ (after Phase 2)

---

## Next Steps

1. ✅ Identify files with most surviving mutants
2. ⏭️ Analyze specific surviving mutants in priority files
3. ⏭️ Add targeted tests to kill surviving mutants
4. ⏭️ Rerun mutation testing to verify improvements
5. ⏭️ Iterate on remaining survivors

---

**Priority Order:**
1. useMarketplaceData.ts (80 survivors)
2. useWebSocket.ts (73 survivors)
3. useCanvasEvents.ts (50 survivors)
4. useTemplateOperations.ts (47 survivors)
5. useWorkflowExecution.ts (47 survivors)
