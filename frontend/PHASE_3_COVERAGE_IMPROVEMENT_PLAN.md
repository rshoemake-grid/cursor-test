# Phase 3: Coverage Improvement Plan

## Overview
This document outlines the plan for improving test coverage for remaining low-coverage files in Phase 3.

**Status**: 🔄 IN PROGRESS  
**Created**: Task 3, Step 3.1  
**Target Coverage Threshold**: 80%+

---

## Files Identified for Coverage Improvement

Based on analysis of existing test coverage and the TESTING_ANALYSIS.md document, the following files need coverage improvements:

### Priority 1: High Priority (Below 70% Coverage)

1. **`src/hooks/utils/formUtils.ts`** - 0% coverage
   - **Type**: Re-export file (barrel export)
   - **Priority**: Low (re-export file, actual logic tested in utils/formUtils.ts)
   - **Action**: Add simple export verification tests
   - **Target**: 100% (verify exports)

2. **`src/hooks/utils/positioningStrategies.ts`** - 64.66% coverage
   - **Type**: Strategy pattern implementation
   - **Priority**: Medium
   - **Current Tests**: ✅ Has test file (`positioningStrategies.test.ts`)
   - **Gaps**: Edge cases, factory function edge cases, negative counts, zero spacing
   - **Target**: 85%+

3. **`src/utils/formUtils.ts`** - 67.50% coverage
   - **Type**: Pure utility functions
   - **Priority**: Medium
   - **Current Tests**: ✅ Has test file (`formUtils.test.ts`)
   - **Gaps**: Edge cases, error paths, complex nested structures
   - **Target**: 85%+

### Priority 2: Medium Priority (70-80% Coverage)

4. **`src/hooks/utils/pathParser.ts`** - 70% coverage
   - **Type**: Pure utility functions
   - **Priority**: Medium
   - **Current Tests**: ✅ Has test file (`pathParser.test.ts`)
   - **Gaps**: Additional edge cases, invalid input handling
   - **Target**: 85%+

5. **`src/hooks/utils/nodePositioning.ts`** - 72.18% coverage
   - **Type**: Utility functions using Strategy pattern
   - **Priority**: Medium
   - **Current Tests**: ✅ Has test file (`nodePositioning.test.ts`)
   - **Gaps**: Function coverage (2/7 functions), edge cases
   - **Target**: 85%+

6. **`src/hooks/utils/apiUtils.ts`** - 77.56% coverage
   - **Type**: Pure utility functions
   - **Priority**: Medium
   - **Current Tests**: ✅ Has test file (`apiUtils.test.ts`)
   - **Gaps**: Function coverage (3/7 functions), error handling edge cases
   - **Target**: 85%+

### Priority 3: Lower Priority (Above 80% Coverage)

7. **`src/pages/SettingsPage.tsx`** - 78.16% → 96.51% coverage ✅
   - **Status**: Already improved in Phase 2
   - **Action**: None needed

8. **`src/components/WorkflowBuilder.tsx`** - 13.69% → 93.5% coverage ✅
   - **Status**: Already improved in Phase 2
   - **Action**: None needed

---

## Coverage Improvement Strategy

### Step 1: Verify Current Coverage Status
- [x] Identify files with low coverage
- [x] Check which files have existing test files
- [x] Document coverage gaps
- [ ] Run coverage report to get exact numbers

### Step 2: Prioritize Files
- [x] Sort by coverage percentage
- [x] Consider file importance
- [x] Consider test complexity
- [x] Create priority list

### Step 3: Improve Coverage for Priority Files

#### File 1: `src/hooks/utils/formUtils.ts` (0% → Target: 100%)
**Status**: ⏭️ PENDING

**Action Items**:
- [ ] Create test file: `hooks/utils/formUtils.test.ts`
- [ ] Test that `getNestedValue` is exported
- [ ] Test that `setNestedValue` is exported
- [ ] Test that `hasNestedValue` is exported
- [ ] Verify exports match source file exports

**Estimated Effort**: Low (simple re-export verification)

#### File 2: `src/hooks/utils/positioningStrategies.ts` (64.66% → Target: 85%+)
**Status**: ⏭️ PENDING

**Current Test Coverage**: Has tests but needs edge cases

**Action Items**:
- [ ] Review existing test file
- [ ] Add tests for edge cases:
  - [ ] Negative count handling
  - [ ] Zero spacing
  - [ ] Very large counts
  - [ ] Factory function with invalid type (fallback)
  - [ ] Custom columnsPerRow edge cases
- [ ] Verify coverage improvement

**Estimated Effort**: Medium (edge case tests)

#### File 3: `src/utils/formUtils.ts` (67.50% → Target: 85%+)
**Status**: ⏭️ PENDING

**Current Test Coverage**: Has tests but needs more edge cases

**Action Items**:
- [ ] Review existing test file
- [ ] Add tests for uncovered branches:
  - [ ] Complex nested structures
  - [ ] Array cloning edge cases
  - [ ] Object cloning edge cases
  - [ ] Error paths
  - [ ] Circular reference handling (if applicable)
- [ ] Verify coverage improvement

**Estimated Effort**: Medium (edge case tests)

#### File 4: `src/hooks/utils/pathParser.ts` (70% → Target: 85%+)
**Status**: ⏭️ PENDING

**Current Test Coverage**: Has comprehensive tests

**Action Items**:
- [ ] Review existing test file
- [ ] Identify uncovered branches
- [ ] Add tests for:
  - [ ] Additional edge cases
  - [ ] Invalid input combinations
  - [ ] Path validation edge cases
- [ ] Verify coverage improvement

**Estimated Effort**: Low-Medium (additional edge cases)

#### File 5: `src/hooks/utils/nodePositioning.ts` (72.18% → Target: 85%+)
**Status**: ⏭️ PENDING

**Current Test Coverage**: Has tests but missing function coverage (2/7 functions)

**Action Items**:
- [ ] Review existing test file
- [ ] Identify untested functions:
  - [ ] `mergeOptions` function (if not tested)
  - [ ] Other untested functions
- [ ] Add tests for untested functions
- [ ] Add edge case tests
- [ ] Verify coverage improvement

**Estimated Effort**: Medium (function coverage + edge cases)

#### File 6: `src/hooks/utils/apiUtils.ts` (77.56% → Target: 85%+)
**Status**: ⏭️ PENDING

**Current Test Coverage**: Has tests but missing function coverage (3/7 functions)

**Action Items**:
- [ ] Review existing test file
- [ ] Identify untested functions
- [ ] Add tests for untested functions:
  - [ ] Additional error extraction scenarios
  - [ ] Response parsing edge cases
  - [ ] Status code edge cases
- [ ] Verify coverage improvement

**Estimated Effort**: Medium (function coverage + edge cases)

---

## Execution Plan

### Phase 1: Quick Wins (Low Effort, High Impact)
1. **File 1**: `hooks/utils/formUtils.ts` - Simple export verification (15 minutes)
2. **File 4**: `hooks/utils/pathParser.ts` - Additional edge cases (30 minutes)

### Phase 2: Medium Effort Improvements
3. **File 2**: `hooks/utils/positioningStrategies.ts` - Edge cases (1-2 hours)
4. **File 3**: `utils/formUtils.ts` - Edge cases (1-2 hours)

### Phase 3: Function Coverage Improvements
5. **File 5**: `hooks/utils/nodePositioning.ts` - Function coverage (1-2 hours)
6. **File 6**: `hooks/utils/apiUtils.ts` - Function coverage (1-2 hours)

---

## Success Criteria

- [ ] All priority files achieve 80%+ coverage
- [ ] All new tests pass
- [ ] No regressions introduced
- [ ] Coverage report shows improvement
- [ ] Documentation updated

---

## Progress Tracking

### Completed
- ✅ Identified files needing coverage improvements
- ✅ Created priority list
- ✅ Documented coverage gaps
- ✅ Created improvement plan

### In Progress
- 🔄 Creating test files for priority files

### Pending
- ⏭️ File 1: `hooks/utils/formUtils.ts` - Export verification tests
- ⏭️ File 2: `hooks/utils/positioningStrategies.ts` - Edge case tests
- ⏭️ File 3: `utils/formUtils.ts` - Edge case tests
- ⏭️ File 4: `hooks/utils/pathParser.ts` - Additional edge cases
- ⏭️ File 5: `hooks/utils/nodePositioning.ts` - Function coverage
- ⏭️ File 6: `hooks/utils/apiUtils.ts` - Function coverage

---

**Last Updated**: Task 3, Step 3.1 - Coverage improvement plan created
