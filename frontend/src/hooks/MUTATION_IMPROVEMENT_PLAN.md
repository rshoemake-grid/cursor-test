# Mutation Test Improvement Plan for useMarketplaceData.ts

**Current Status:**
- **Mutation Score:** 79.67% (covered: 81.54%)
- **Killed:** 238 mutants ✅
- **Survived:** 55 mutants ⚠️
- **No Coverage:** 7 mutants ⚠️
- **Timeout:** 5 mutants
- **Errors:** 0 ✅

**Goal:** Achieve 90%+ mutation score by addressing surviving and no-coverage mutants

---

## Phase 1: Address No Coverage Mutants (7 mutants)

### Priority: HIGH - These represent untested code paths

#### 1.1 Error Handling Paths (Estimated: 3-4 mutants)

**Location:** Lines 90-92, 155-157, 161-163, 242-244, 263-265, 292-294

**Issue:** Error catch blocks and logger.error calls may not be covered

**Action Items:**
- [ ] **Test fetchTemplates error handling**
  - Mock `httpClient.get` to throw error
  - Verify `logger.error` is called with correct message
  - Verify `setLoading(false)` is called in finally block
  - Verify `templates` state remains unchanged on error

- [ ] **Test fetchWorkflowsOfWorkflows error handling**
  - Test outer try-catch: Mock `httpClient.get` to throw
  - Test inner try-catch: Mock `httpClient.post` to throw for specific workflow
  - Verify `logger.error` is called for both outer and inner errors
  - Verify partial results are still set if some workflows succeed

- [ ] **Test fetchAgents error handling**
  - Mock `getLocalStorageItem` to throw error
  - Verify `logger.error` is called
  - Verify `setLoading(false)` is called
  - Verify `agents` state is set to empty array or default

- [ ] **Test fetchRepositoryAgents error handling**
  - Test `storage.getItem` throws error
  - Test `JSON.parse` throws error (invalid JSON)
  - Verify `logger.error` is called
  - Verify `agentsData` defaults to empty array
  - Verify `setLoading(false)` is called

**Test File:** `useMarketplaceData.error.test.ts`

#### 1.2 Default Values and Initialization (Estimated: 2-3 mutants)

**Location:** Lines 73-77 (initial state), 111 (empty array), 172 (default empty array)

**Issue:** Default array/object initializations may not be covered

**Action Items:**
- [ ] **Test initial state values**
  - Verify `templates` starts as empty array
  - Verify `workflowsOfWorkflows` starts as empty array
  - Verify `agents` starts as empty array
  - Verify `repositoryAgents` starts as empty array
  - Verify `loading` starts as `true`

- [ ] **Test empty array defaults**
  - Test `getLocalStorageItem` returns `undefined` → should use `[]`
  - Test `storage.getItem` returns `null` → should use `[]`
  - Test `workflowsOfWorkflows` array initialization

**Test File:** `useMarketplaceData.initialization.test.ts`

#### 1.3 Edge Case String Literals (Estimated: 1-2 mutants)

**Location:** Lines 190, 196-201 (logger.debug calls), 91, 156, 162, 243, 264, 293 (error messages)

**Issue:** String literals in logger calls and error messages may not be covered

**Action Items:**
- [ ] **Test logger.debug calls**
  - Verify debug logging when agents are updated with author info
  - Verify debug logging of loaded agents with author info
  - Mock logger.debug and verify it's called with correct parameters

- [ ] **Test error message strings**
  - Verify exact error messages match expected strings
  - Test all error paths trigger logger.error with correct messages

**Test File:** `useMarketplaceData.logging.test.ts`

---

## Phase 2: Address Surviving Mutants (55 mutants)

### Priority: MEDIUM-HIGH - These represent equivalent mutations or weak test assertions

#### 2.1 Array Declaration Mutants (Estimated: 6 mutants)

**Location:** Lines 73-76, 111, 172, 259

**Issue:** Mutations like `[]` → `[undefined]` or `[]` → `null` may be equivalent

**Action Items:**
- [ ] **Strengthen array initialization tests**
  - Test that empty arrays are truly empty (length === 0)
  - Test that array mutations would break functionality
  - Test array operations on empty arrays (filter, map, sort)
  - Verify array identity matters (not just truthiness)

**Test File:** `useMarketplaceData.arrays.test.ts`

#### 2.2 Boolean Literal Mutants (Estimated: 4-5 mutants)

**Location:** Lines 77 (loading: true), 219-220 (is_official checks), various conditionals

**Issue:** Mutations like `true` → `false` may not be caught if tests don't verify exact boolean values

**Action Items:**
- [ ] **Test exact boolean values**
  - Verify `loading` initial state is exactly `true` (not just truthy)
  - Test `is_official` boolean checks with exact `true`/`false` values
  - Test boolean mutations would change behavior (e.g., `!agent.author_id` vs `agent.author_id`)

**Test File:** `useMarketplaceData.booleans.test.ts`

#### 2.3 Conditional Expression Mutants (Estimated: 12-15 mutants)

**Location:** Lines 83-84, 102-103, 175, 178, 189, 204, 207, 226, 231, 269, 272, 283, 301-302, 307

**Issue:** Ternary operators and conditionals where mutations might be equivalent

**Action Items:**
- [ ] **Test all conditional branches**
  - Test `category` truthy/falsy with empty string, null, undefined
  - Test `searchQuery` truthy/falsy with empty string, null, undefined
  - Test `user && user.id && agentsData.length > 0` - all combinations
  - Test `!agent.author_id` vs `agent.author_id === null` vs `agent.author_id === undefined`
  - Test `updated && storage` - both must be truthy
  - Test `sortBy === 'popular'` vs `sortBy === 'recent'` vs other values
  - Test `activeTab === 'repository'` vs other values
  - Test `repositorySubTab === 'workflows'` vs other values

- [ ] **Test conditional expression mutations**
  - Verify mutations like `condition ? value1 : value2` → `condition ? value2 : value1` break tests
  - Test nested conditionals
  - Test short-circuit evaluation (&&, ||)

**Test File:** `useMarketplaceData.conditionals.test.ts`

#### 2.4 String Literal Mutants (Estimated: 10-12 mutants)

**Location:** Lines 85, 104, 183, 191, 226, 231, 283, 301, 302, 307, various error messages

**Issue:** String literal mutations may not be caught if tests use partial matching

**Action Items:**
- [ ] **Test exact string matches**
  - Test `sortBy` values: 'popular', 'recent', 'alphabetical' (exact matches)
  - Test `activeTab` values: 'agents', 'repository', 'workflows-of-workflows' (exact matches)
  - Test `repositorySubTab` values: 'workflows', 'agents' (exact matches)
  - Test URL construction with exact string literals
  - Test storage key strings: 'publishedAgents', STORAGE_KEYS values
  - Test error message strings match exactly

- [ ] **Test string mutations would break functionality**
  - Mutate 'popular' → 'Popular' (case sensitivity)
  - Mutate 'workflows' → 'workflow' (singular vs plural)
  - Mutate URL paths and verify requests fail

**Test File:** `useMarketplaceData.strings.test.ts`

#### 2.5 Logical Operator Mutants (Estimated: 5-6 mutants)

**Location:** Lines 133-136, 141-148, 150, 183, 210-212, 274-277

**Issue:** `&&` ↔ `||` mutations may not be caught

**Action Items:**
- [ ] **Test logical operator combinations**
  - Test `hasWorkflowId || description.includes(...) || name.includes(...) || tags.some(...)`
    - Test each OR condition independently
    - Test multiple conditions true
    - Test all conditions false
    - Verify mutation `||` → `&&` would break logic
  
  - Test `isWorkflowOfWorkflows` OR conditions
    - Test each description.includes condition
    - Test tags.some conditions
    - Test combinations
  
  - Test `hasWorkflowReference || isWorkflowOfWorkflows`
    - Test first true, second false
    - Test first false, second true
    - Test both true
    - Test both false
  
  - Test `user.username || user.email || null`
    - Test username exists, email doesn't
    - Test username doesn't exist, email does
    - Test both exist (should use username)
    - Test neither exists (should use null)
  
  - Test `a.name.toLowerCase().includes(query) || a.description.toLowerCase().includes(query) || a.tags.some(...)`
    - Test each OR condition independently
    - Test multiple matches
    - Verify mutation `||` → `&&` would break filtering

**Test File:** `useMarketplaceData.logical-operators.test.ts`

#### 2.6 Equality Operator Mutants (Estimated: 3-4 mutants)

**Location:** Lines 205, 226, 231, 283, 301, 302, 307

**Issue:** `===` ↔ `!==` or `===` ↔ `==` mutations may not be caught

**Action Items:**
- [ ] **Test exact equality checks**
  - Test `a.category === category` with exact matches
  - Test `sortBy === 'popular'` vs `sortBy === 'recent'` vs other values
  - Test `activeTab === 'repository'` vs other values
  - Test `repositorySubTab === 'workflows'` vs other values
  - Test with type coercion edge cases (verify `===` not `==`)

**Test File:** `useMarketplaceData.equality.test.ts`

#### 2.7 Object Literal Mutants (Estimated: 1-2 mutants)

**Location:** Lines 180-184 (agent object spread)

**Issue:** Object property mutations may not be caught

**Action Items:**
- [ ] **Test object property assignments**
  - Verify exact object structure when updating agent
  - Test all properties are set correctly: `author_id`, `author_name`
  - Test object spread preserves other properties
  - Verify mutations to object structure break tests

**Test File:** `useMarketplaceData.objects.test.ts`

---

## Phase 3: Address Timeout Mutants (5 mutants)

### Priority: LOW-MEDIUM - These may indicate slow tests or infinite loops

**Action Items:**
- [ ] **Investigate timeout causes**
  - Check if timeouts occur in `fetchWorkflowsOfWorkflows` (nested loops)
  - Check if timeouts occur in sorting operations with large arrays
  - Check if timeouts occur in filter operations with complex conditions
  - Consider increasing timeout for specific test cases if legitimate

- [ ] **Optimize slow operations**
  - Review `fetchWorkflowsOfWorkflows` loop performance
  - Consider batching or parallelizing workflow checks
  - Review filter/sort operations for performance

---

## Implementation Strategy

### Step 1: Create Test Files (Week 1)
1. Create `useMarketplaceData.error.test.ts` - Error handling tests
2. Create `useMarketplaceData.initialization.test.ts` - Initialization tests
3. Create `useMarketplaceData.logging.test.ts` - Logging tests
4. Create `useMarketplaceData.arrays.test.ts` - Array tests
5. Create `useMarketplaceData.booleans.test.ts` - Boolean tests
6. Create `useMarketplaceData.conditionals.test.ts` - Conditional tests
7. Create `useMarketplaceData.strings.test.ts` - String literal tests
8. Create `useMarketplaceData.logical-operators.test.ts` - Logical operator tests
9. Create `useMarketplaceData.equality.test.ts` - Equality operator tests
10. Create `useMarketplaceData.objects.test.ts` - Object tests

### Step 2: Implement Tests (Week 1-2)
- Start with Phase 1 (No Coverage) - highest priority
- Then Phase 2 (Surviving Mutants) - organized by mutator type
- Finally Phase 3 (Timeouts) - investigate and optimize

### Step 3: Verify Improvements (Week 2)
- Run mutation testing after each phase
- Verify mutation score improvements
- Document which mutants were killed
- Update this plan with actual results

### Step 4: Iterate (Week 2-3)
- Review remaining survivors
- Identify equivalent mutations (may be acceptable)
- Add additional tests for non-equivalent mutations
- Target 90%+ mutation score

---

## Success Metrics

- **Phase 1 Complete:** 0 no-coverage mutants (from 7)
- **Phase 2 Complete:** <20 surviving mutants (from 55)
- **Final Goal:** 90%+ mutation score (from 79.67%)

---

## Notes

- Some surviving mutants may be **equivalent mutations** (e.g., `[]` vs `[undefined]` functionally equivalent)
- Equivalent mutations are acceptable and don't need to be killed
- Focus on non-equivalent mutations that represent real bugs
- Use mutation testing HTML report to identify specific mutant locations
- Prioritize high-impact areas (error handling, core logic)

---

## Quick Reference: Mutant Types

| Mutant Type | Count | Priority | Location Focus |
|------------|-------|----------|----------------|
| No Coverage | 7 | HIGH | Error handling, initialization |
| ArrayDeclaration | ~6 | MEDIUM | Array initializations |
| BooleanLiteral | ~5 | MEDIUM | Boolean values |
| ConditionalExpression | ~15 | HIGH | Conditionals, ternaries |
| StringLiteral | ~12 | MEDIUM | String values, URLs |
| LogicalOperator | ~6 | HIGH | &&, \|\| operators |
| EqualityOperator | ~4 | MEDIUM | ===, !== operators |
| ObjectLiteral | ~2 | LOW | Object structures |
| **Total** | **55** | | |

---

**Last Updated:** 2026-02-03
**Next Review:** After Phase 1 completion
