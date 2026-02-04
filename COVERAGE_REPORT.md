# Test Coverage Report

Generated: February 4, 2026

## Overall Coverage Summary

| Metric | Coverage | Total | Covered |
|--------|----------|-------|---------|
| **Statements** | 88.12% | 18,422 | 16,234 |
| **Branches** | 92.00% | 2,951 | 2,715 |
| **Functions** | 82.21% | 624 | 513 |
| **Lines** | 88.12% | 18,422 | 16,234 |

## Test Execution Summary

- **Test Suites:** 173 passed, 3 failed, 1 skipped (176 of 177 total)
- **Tests:** 5,487 passed, 5 failed, 27 skipped (5,519 total)
- **Execution Time:** ~19.9 seconds

## Key Files Coverage

### src/hooks/ - Overall: 95.33% Statements, 95.1% Branches, 93.75% Functions

#### useAgentDeletion.ts ✅
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%
- **Status:** ✅ Perfect coverage

#### useWorkflowDeletion.ts ✅
- **Statements:** 100%
- **Branches:** 95.45% (1 uncovered branch on line 49)
- **Functions:** 100%
- **Lines:** 100%
- **Status:** ✅ Excellent coverage (1 branch uncovered)

#### useTemplateUsage.ts ✅
- **Statements:** 100%
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%
- **Status:** ✅ Perfect coverage

### src/hooks/utils/

| File | Statements | Branches | Functions | Lines | Status |
|------|-----------|----------|-----------|-------|--------|
| apiUtils.ts | 70.54% | 63.15% | 33.33% | 70.54% | ⚠️ Needs improvement |
| confirmations.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| draftStorage.ts | 0% | 0% | 0% | 0% | ❌ No tests |
| errorHandling.ts | 0% | 0% | 0% | 0% | ❌ No tests |
| formUtils.ts | 0% | 0% | 0% | 0% | ❌ No tests |
| nodePositioning.ts | 62.14% | 87.5% | 33.33% | 62.14% | ⚠️ Needs improvement |
| ownership.ts | 0% | 0% | 0% | 0% | ❌ No tests |
| tabUtils.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| validation.ts | 87.69% | 85.71% | 75% | 87.69% | ✅ Good |

### src/pages/

| File | Statements | Branches | Functions | Lines | Status |
|------|-----------|----------|-----------|-------|--------|
| AuthPage.tsx | 100% | 100% | 83.33% | 100% | ✅ Excellent |
| ForgotPasswordPage.tsx | 100% | 93.33% | 71.42% | 100% | ✅ Excellent |
| MarketplacePage.tsx | 53.83% | 85% | 27.27% | 53.83% | ⚠️ Needs improvement |
| ResetPasswordPage.tsx | 97.98% | 94.11% | 87.5% | 97.98% | ✅ Excellent |
| SettingsPage.tsx | 72.79% | 67.56% | 33.33% | 72.79% | ⚠️ Needs improvement |

### src/utils/

| File | Statements | Branches | Functions | Lines | Status |
|------|-----------|----------|-----------|-------|--------|
| confirm.tsx | 100% | 100% | 100% | 100% | ✅ Perfect |
| errorFactory.ts | 58.47% | 23.52% | 60% | 58.47% | ⚠️ Needs improvement |
| errorHandler.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| executionStatus.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| formUtils.ts | 66.66% | 88.88% | 33.33% | 66.66% | ⚠️ Needs improvement |
| logger.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| nodeConversion.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| nodeUtils.ts | 100% | 94.44% | 100% | 100% | ✅ Excellent |
| notifications.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| ownershipUtils.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| storageHelpers.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| validationUtils.ts | 100% | 100% | 100% | 100% | ✅ Perfect |
| workflowFormat.ts | 100% | 96.87% | 100% | 100% | ✅ Excellent |

## Files Requiring Attention

### ❌ Zero Coverage (No Tests)
1. `src/hooks/utils/draftStorage.ts` - 0% coverage
2. `src/hooks/utils/errorHandling.ts` - 0% coverage
3. `src/hooks/utils/formUtils.ts` - 0% coverage
4. `src/hooks/utils/ownership.ts` - 0% coverage
5. `src/types/workflow.ts` - 0% coverage
6. `src/types/workflowBuilder.ts` - 0% coverage
7. `src/test/setup.ts` - 0% coverage

### ⚠️ Low Coverage (< 70%)
1. `src/utils/errorFactory.ts` - 58.47% statements, 23.52% branches
2. `src/hooks/utils/nodePositioning.ts` - 62.14% statements
3. `src/hooks/utils/apiUtils.ts` - 70.54% statements, 33.33% functions
4. `src/pages/MarketplacePage.tsx` - 53.83% statements, 27.27% functions
5. `src/pages/SettingsPage.tsx` - 72.79% statements, 33.33% functions

## Test Failures

### Current Failures (5 tests)
1. **useDraftManagement.test.ts** - 4 test failures (mock expectation issues)
2. **useTemplateOperations.mutation.test.ts** - TypeScript compilation errors
3. **useWorkflowDeletion.test.ts** - TypeScript compilation errors (syntax issues)

## Recommendations

### High Priority
1. ✅ **useAgentDeletion.ts** - Already at 100% coverage (excellent!)
2. ✅ **useWorkflowDeletion.ts** - 100% statements, 95.45% branches (excellent!)
3. ✅ **useTemplateUsage.ts** - Already at 100% coverage (excellent!)
4. Fix TypeScript errors in `useWorkflowDeletion.test.ts` (syntax issues on lines 956, 986, 1012, 1035, 1062, 1087, 1115, 1145)
5. Fix test failures in `useDraftManagement.test.ts` (mock expectation mismatches)

### Medium Priority
1. Add tests for files with 0% coverage (especially utility files)
2. Improve coverage for `MarketplacePage.tsx` (currently 53.83%)
3. Improve coverage for `errorFactory.ts` (currently 58.47%)

### Low Priority
1. Improve function coverage overall (currently 82.21%)
2. Add tests for `SettingsPage.tsx` to improve coverage
3. Improve branch coverage for `useWorkflowDeletion.ts` (1 uncovered branch on line 49)

## Summary

The refactored test files (`useAgentDeletion`, `useWorkflowDeletion`, `useTemplateUsage`) show **excellent coverage**:
- **useAgentDeletion.ts**: 100% across all metrics ✅
- **useWorkflowDeletion.ts**: 100% statements, 95.45% branches ✅
- **useTemplateUsage.ts**: 100% across all metrics ✅

Overall project coverage is strong at **88.12% statements** and **92% branches**, with room for improvement in utility files and some page components.
