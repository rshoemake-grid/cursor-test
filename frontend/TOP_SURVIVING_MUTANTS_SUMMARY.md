# Top Files Contributing to Surviving Mutants

**Based on:** Latest mutation test results (83.79% overall score, 945 survived mutants)

---

## Top 15 Files by Survived Mutants

| Rank | File | Survived | Killed | Score | Category | Status |
|------|------|----------|--------|-------|----------|--------|
| 1 | `WebSocketConnectionManager.ts` | 49 | 91 | 59.09% | Hooks/Utils | ⚠️ **HIGHEST PRIORITY** |
| 2 | `formUtils.ts` | 42 | 112 | 72.44% | Utils | ✅ Recently improved |
| 3 | `useExecutionPolling.ts` | 31 | 76 | 71.03% | Hooks | ⚠️ Needs work |
| 4 | `InputNodeEditor.tsx` | 31 | 201 | 86.64% | Components | ⚠️ Good score but high count |
| 5 | `ConditionNodeEditor.tsx` | 31 | 55 | 63.95% | Components | ⚠️ **LOW SCORE** |
| 6 | `useMarketplaceIntegration.ts` | 30 | 74 | 71.15% | Hooks | ⚠️ Needs work |
| 7 | `storageHelpers.ts` | 33 | 78 | 70.27% | Utils | ✅ Already optimized |
| 8 | `errorHandler.ts` | 26 | 205 | 88.74% | Utils | ✅ Recently improved |
| 9 | `workflowFormat.ts` | 26 | 176 | 86.27% | Utils | ✅ Already optimized |
| 10 | `useExecutionManagement.ts` | ~23 | ~78 | ~77% | Hooks | ⚠️ Needs work |
| 11 | `ownershipUtils.ts` | 15 | 53 | 77.94% | Utils | ✅ Already optimized |
| 12 | `useLocalStorage.ts` | 19 | - | - | Hooks | ⚠️ Needs work |
| 13 | `useTabOperations.ts` | 19 | - | - | Hooks | ⚠️ Needs work |
| 14 | `useLLMProviders.ts` | 18 | - | - | Hooks | ⚠️ Needs work |
| 15 | `nodeConversion.ts` | 12 | 31 | 72.09% | Utils | ⚠️ **LOW SCORE** |

**Total from Top 15:** ~406 survived mutants (~43% of all 945 survived)

---

## Breakdown by Category

### 🔴 Hooks (Highest Priority)
**Total Survived:** ~611 (64.7% of all survived mutants)

**Top Hook Files:**
1. `WebSocketConnectionManager.ts` - **49 survived** (59.09% score) ⚠️
2. `useExecutionPolling.ts` - **31 survived** (71.03% score) ⚠️
3. `useMarketplaceIntegration.ts` - **30 survived** (71.15% score) ⚠️
4. `useExecutionManagement.ts` - **~23 survived** (~77% score) ⚠️
5. `useLocalStorage.ts` - **19 survived** ⚠️
6. `useTabOperations.ts` - **19 survived** ⚠️
7. `useLLMProviders.ts` - **18 survived** ⚠️

**Common Issues:**
- Complex conditional logic
- State management mutations
- Async operation handling
- Error handling mutations

---

### 🟡 Components
**Total Survived:** ~119 (12.6% of all survived mutants)

**Top Component Files:**
1. `InputNodeEditor.tsx` - **31 survived** (86.64% score) ⚠️
2. `ConditionNodeEditor.tsx` - **30 survived** (63.95% score) ⚠️ **LOW SCORE**
3. `AgentNodeEditor.tsx` - **8 survived** (88.41% score) ✅
4. `LoopNodeEditor.tsx` - **3 survived** (89.29% score) ✅

**Common Issues:**
- Form validation logic
- Conditional rendering mutations
- Event handler mutations

---

### 🟢 Utils
**Total Survived:** ~191 (20.2% of all survived mutants)

**Top Util Files:**
1. `formUtils.ts` - **42 survived** (72.44% score) ✅ Recently improved
2. `storageHelpers.ts` - **33 survived** (70.27% score) ✅ Already optimized
3. `errorHandler.ts` - **26 survived** (88.74% score) ✅ Recently improved
4. `workflowFormat.ts` - **26 survived** (86.27% score) ✅ Already optimized
5. `ownershipUtils.ts` - **15 survived** (77.94% score) ✅ Already optimized
6. `nodeConversion.ts` - **12 survived** (72.09% score) ⚠️ **LOW SCORE**

**Common Issues:**
- Type safety (already addressed in recent refactoring)
- Conditional expression mutations
- Logical operator mutations

---

## Priority Ranking for Next Refactoring

### 🔴 **CRITICAL PRIORITY** (Low Scores + High Counts)

1. **`WebSocketConnectionManager.ts`** - 49 survived, 59.09% score
   - **Impact:** Highest survivor count
   - **Issues:** SOLID violations, complex reconnection logic
   - **Recommendation:** Split into focused classes (Connector, EventHandler, Reconnector)

2. **`ConditionNodeEditor.tsx`** - 30 survived, 63.95% score
   - **Impact:** Low score + high count
   - **Issues:** Form validation, conditional logic
   - **Recommendation:** Add comprehensive tests, extract validation logic

3. **`useExecutionPolling.ts`** - 31 survived, 71.03% score
   - **Impact:** High count, medium score
   - **Issues:** Polling logic, state management
   - **Recommendation:** Extract polling strategy, add explicit checks

### 🟡 **HIGH PRIORITY** (High Counts)

4. **`useMarketplaceIntegration.ts`** - 30 survived, 71.15% score
5. **`InputNodeEditor.tsx`** - 31 survived, 86.64% score (good score but high count)
6. **`useExecutionManagement.ts`** - ~23 survived, ~77% score
7. **`useLocalStorage.ts`** - 19 survived
8. **`useTabOperations.ts`** - 19 survived
9. **`useLLMProviders.ts`** - 18 survived

### 🟢 **MEDIUM PRIORITY** (Lower Counts or Already Improved)

10. **`nodeConversion.ts`** - 12 survived, 72.09% score
11. Other files with <15 survived mutants

---

## Summary Statistics

### By Score Range

| Score Range | File Count | Total Survived | Avg Survived/File |
|-------------|------------|----------------|-------------------|
| < 70% | 3 | 112 | 37.3 |
| 70-80% | 5 | 140 | 28.0 |
| 80-90% | 4 | 95 | 23.8 |
| > 90% | 3 | 8 | 2.7 |

### Key Insights

1. **Hooks are the biggest contributor** - 64.7% of all survived mutants
2. **Low-scoring files have highest impact** - Files < 70% score average 37.3 survivors
3. **Top 3 files account for 112 survivors** (11.9% of total)
4. **Top 10 files account for ~300 survivors** (~32% of total)

---

## Recommended Next Steps

### Phase 1: Critical Priority Files (3 files, ~110 survivors)
1. `WebSocketConnectionManager.ts` - Refactor into focused classes
2. `ConditionNodeEditor.tsx` - Add tests and extract validation
3. `useExecutionPolling.ts` - Extract polling strategy

**Expected Impact:** Kill ~60-80 mutants (+0.6% to +0.8% score)

### Phase 2: High Priority Hooks (5 files, ~120 survivors)
4. `useMarketplaceIntegration.ts`
5. `useExecutionManagement.ts`
6. `useLocalStorage.ts`
7. `useTabOperations.ts`
8. `useLLMProviders.ts`

**Expected Impact:** Kill ~60-80 mutants (+0.6% to +0.8% score)

### Phase 3: Component Improvements (2 files, ~61 survivors)
9. `InputNodeEditor.tsx` - Despite good score, high count suggests room for improvement
10. `ConditionNodeEditor.tsx` - Already in Phase 1

**Expected Impact:** Kill ~30-40 mutants (+0.3% to +0.4% score)

---

## Files Already Improved ✅

These files have been recently refactored but may still have some survivors:
- `formUtils.ts` - Type interfaces added, explicit checks added
- `errorHandler.ts` - Type guards and helper functions added
- `storageHelpers.ts` - Already had good type safety
- `workflowFormat.ts` - Already had good type interfaces
- `ownershipUtils.ts` - Already had helper functions

**Note:** These files may need additional improvements or more comprehensive tests to kill remaining survivors.

---

## Data Sources

- `MUTATION_TEST_RESULTS_SUMMARY.md` - Overall results
- `TOP_5_SURVIVORS_ANALYSIS.md` - Top 5 detailed analysis
- `NEXT_5_WORST_FILES_ANALYSIS.md` - Next 5 files analysis
- `MUTATION_GAP_ANALYSIS.md` - Gap analysis

---

**Last Updated:** February 9, 2026
