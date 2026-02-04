# Phase 4 Plan - Targeted Improvements

**Date:** 2026-02-04  
**Status:** 🟡 In Progress

---

## Phase 4 Goals

### Primary Targets
1. **Eliminate No Coverage Mutants:** 5 → 0
2. **Reduce Surviving Mutants:** 42 → <20 (reduce by 22+)
3. **Improve Mutation Score:** 84.59% → 90%+ (gain 5.41%+)

---

## Current Status

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Mutation Score | 84.59% | 90%+ | 5.41% |
| Survived | 42 | <20 | 22 mutants |
| No Coverage | 5 | 0 | 5 mutants |

---

## Strategy

### Priority 1: No Coverage Mutants (5 mutants) 🔴 HIGHEST PRIORITY
- These represent completely untested code paths
- Should be easiest to address
- Highest impact on mutation score

**Approach:**
1. Identify specific no-coverage mutants from HTML report
2. Create targeted tests for each
3. Verify coverage

### Priority 2: Surviving Mutants (42 mutants) 🟡 HIGH PRIORITY
- Need to reduce by 22+ mutants
- May include equivalent mutations (acceptable)
- Require targeted testing

**Approach:**
1. Analyze HTML report for specific surviving mutants
2. Categorize by mutator type
3. Identify patterns
4. Create targeted tests for non-equivalent mutations
5. Document equivalent mutations

---

## Test Files to Create

### Phase 4.1: No Coverage Mutants
- `useMarketplaceData.no-coverage.test.ts` - Targeted tests for 5 no-coverage mutants

### Phase 4.2: Surviving Mutants Analysis
- Analyze HTML report
- Categorize mutants
- Create targeted tests based on analysis

### Phase 4.3: Targeted Improvements
- Additional test files based on analysis
- Focus on specific patterns identified

---

## Success Criteria

- ✅ No Coverage: 5 → 0
- ✅ Survived: 42 → <20
- ✅ Mutation Score: 84.59% → 90%+

---

## Phase 4.1: No Coverage Mutants ✅ COMPLETE

**Test File Created:**
- `useMarketplaceData.no-coverage.test.ts` - 11 tests
  - Array initialization (workflowsOfWorkflows: Template[] = [])
  - Array push operation (workflowsOfWorkflows.push())
  - Early return in fetchRepositoryAgents (!storage)
  - Map operation for logging (agentsData.map())
  - Filter and sort chain operations

**Status:** ✅ Phase 4.1 Complete

## Phase 4.2: Surviving Mutants Analysis ✅ IN PROGRESS

**Test Files Created:**
- `useMarketplaceData.targeted.test.ts` - 14 tests
  - Sort comparison (aIsOfficial !== bIsOfficial)
  - Subtraction operations (bIsOfficial - aIsOfficial, dateB - dateA)
  - Ternary operators (is_official ? 1 : 0, published_at ? getTime() : 0)
  - Boolean conversion (!!a.author_id)
  - Array.isArray check

- `useMarketplaceData.assignment.test.ts` - 8 tests
  - Assignment operation (updated = true)
  - Conditional check (if (updated && storage))
  - Array assignments (map, filter, sort)

**Total Phase 4.2:** 87 tests
- Targeted tests: 14 tests
- Assignment tests: 8 tests
- URL parameter tests: 10 tests
- HTTP method tests: 9 tests
- Storage operation tests: 11 tests
- State setter tests: 9 tests
- Property access tests: 11 tests
- Length operation tests: 8 tests
- User property tests: 7 tests

**Status:** ✅ Phase 4.2 In Progress  
**Next:** Continue with additional targeted tests or run mutation testing
