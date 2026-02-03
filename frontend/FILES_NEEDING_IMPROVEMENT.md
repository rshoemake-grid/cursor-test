# Files Lacking Coverage & Having Most Survivors

**Date:** February 3, 2026  
**Based on:** Mutation Test Results (5,016 mutants tested)

---

## 🔴 Top Priority Files (Most Surviving Mutants)

### Files with 15+ Surviving Mutants

| Rank | File | Survived | Killed | Total | Score | Priority |
|------|------|----------|--------|-------|-------|----------|
| 1 | `src/hooks/useWebSocket.ts` | **34** | 150 | 184 | 81.5% | 🔴 High |
| 2 | `src/hooks/useMarketplaceData.ts` | **31** | 239 | 270 | 88.5% | 🟡 Medium |
| 3 | `src/hooks/useTemplateOperations.ts` | **30** | 218 | 248 | 87.9% | 🟡 Medium |
| 4 | `src/hooks/useMarketplaceIntegration.ts` | **25** | 104 | 129 | 80.6% | 🔴 High |
| 5 | `src/hooks/useExecutionManagement.ts` | **23** | 173 | 196 | 88.3% | 🟡 Medium |
| 6 | `src/types/adapters.ts` | **20** | 89 | 109 | 81.7% | 🔴 High |
| 7 | `src/hooks/useLocalStorage.ts` | **19** | 112 | 131 | 85.5% | 🟡 Medium |
| 8 | `src/hooks/useTabOperations.ts` | **19** | 114 | 133 | 85.7% | 🟡 Medium |
| 9 | `src/hooks/useLLMProviders.ts` | **18** | 97 | 115 | 84.3% | 🟡 Medium |
| 10 | `src/hooks/useKeyboardShortcuts.ts` | **18** | 71 | 89 | 79.8% | 🔴 High |
| 11 | `src/hooks/useOfficialAgentSeeding.ts` | **18** | 168 | 186 | 90.3% | 🟢 Low |
| 12 | `src/hooks/useWorkflowExecution.ts` | **17** | 84 | 101 | 83.2% | 🟡 Medium |
| 13 | `src/utils/workflowFormat.ts` | **17** | 162 | 179 | 90.5% | 🟢 Low |
| 14 | `src/utils/storageHelpers.ts` | **16** | 67 | 83 | 80.7% | 🔴 High |
| 15 | `src/hooks/useAuthenticatedApi.ts` | **15** | 122 | 137 | 89.1% | 🟢 Low |
| 16 | `src/components/editors/InputNodeEditor.tsx` | **15** | 201 | 216 | 93.1% | 🟢 Low |

---

## 🟡 Medium Priority Files (10-14 Surviving Mutants)

| File | Survived | Killed | Total | Score | Priority |
|------|----------|--------|-------|-------|----------|
| `src/hooks/useNodeOperations.ts` | 12 | 103 | 115 | 89.6% | 🟢 Low |
| `src/components/editors/DatabaseNodeEditor.tsx` | 12 | 60 | 72 | 83.3% | 🟡 Medium |
| `src/hooks/useCanvasEvents.ts` | 12 | 160 | 172 | 93.0% | 🟢 Low |
| `src/components/editors/FirebaseNodeEditor.tsx` | 10 | 68 | 78 | 87.2% | 🟢 Low |
| `src/components/editors/BigQueryNodeEditor.tsx` | 9 | 59 | 68 | 86.8% | 🟢 Low |
| `src/hooks/useTabInitialization.ts` | 9 | 38 | 47 | 80.9% | 🔴 High |
| `src/hooks/useTabRenaming.ts` | 9 | 56 | 65 | 86.2% | 🟢 Low |
| `src/hooks/useWorkflowUpdates.ts` | 9 | 119 | 128 | 93.0% | 🟢 Low |

---

## 🔴 Critical Files (Low Score + High Survivors)

### Files with Score < 82% AND 15+ Survivors

1. **`src/hooks/useWebSocket.ts`** - 34 survivors, 81.5% score
   - **Issue:** Highest number of survivors
   - **Action:** Review mutation tests, add edge case coverage

2. **`src/hooks/useMarketplaceIntegration.ts`** - 25 survivors, 80.6% score
   - **Issue:** Just above threshold, many survivors
   - **Action:** Add targeted tests for surviving mutants

3. **`src/types/adapters.ts`** - 20 survivors, 81.7% score
   - **Issue:** Type adapter logic needs better coverage
   - **Action:** Review adapter edge cases

4. **`src/hooks/useKeyboardShortcuts.ts`** - 18 survivors, 79.8% score
   - **Issue:** Below 80% threshold
   - **Action:** Critical - needs immediate attention

5. **`src/utils/storageHelpers.ts`** - 16 survivors, 80.7% score
   - **Issue:** Utility functions need better coverage
   - **Action:** Add storage operation edge case tests

6. **`src/hooks/useTabInitialization.ts`** - 9 survivors, 80.9% score
   - **Issue:** Tab initialization logic
   - **Action:** Review initialization edge cases

---

## 📊 Summary Statistics

### By Category

**Hooks:**
- Total files: 20+
- Files with 15+ survivors: 10
- Average score: ~85%

**Utils:**
- Total files: 5+
- Files with 15+ survivors: 2
- Average score: ~85%

**Types:**
- Total files: 2+
- Files with 15+ survivors: 1
- Average score: ~82%

**Components:**
- Total files: 10+
- Files with 15+ survivors: 1
- Average score: ~90%

---

## 🎯 Recommended Action Plan

### Phase 1: Critical Files (< 82% score)
1. **`useKeyboardShortcuts.ts`** (79.8%) - Add keyboard event tests
2. **`useWebSocket.ts`** (81.5%) - Review WebSocket edge cases
3. **`useMarketplaceIntegration.ts`** (80.6%) - Add integration tests
4. **`adapters.ts`** (81.7%) - Review adapter logic
5. **`storageHelpers.ts`** (80.7%) - Add storage operation tests

### Phase 2: High Survivor Count (> 20 survivors)
1. **`useWebSocket.ts`** (34 survivors)
2. **`useMarketplaceData.ts`** (31 survivors)
3. **`useTemplateOperations.ts`** (30 survivors)
4. **`useMarketplaceIntegration.ts`** (25 survivors)
5. **`useExecutionManagement.ts`** (23 survivors)

### Phase 3: Medium Priority (10-19 survivors)
- Review remaining files with 10+ survivors
- Add targeted tests for specific mutant types
- Focus on conditional expressions and logical operators

---

## 📈 Expected Impact

**Addressing Top 5 Files:**
- **Current survivors:** 34 + 31 + 30 + 25 + 23 = **143 survivors**
- **Expected reduction:** 50-70% → **71-100 fewer survivors**
- **Expected score improvement:** +2-4% mutation score

**Addressing Critical Files (< 82%):**
- **Current survivors:** 34 + 25 + 20 + 18 + 16 + 9 = **122 survivors**
- **Expected reduction:** 60-80% → **73-98 fewer survivors**
- **Expected score improvement:** +3-5% mutation score

**Combined Impact:**
- **Target:** Reduce survivors from 790 to ~650-700
- **Target Score:** Improve from 83% to **85-88%**

---

## 🔍 Next Steps

1. **Review HTML Report**
   ```bash
   open frontend/reports/mutation/mutation.html
   ```

2. **Filter by File**
   - Sort by "Survived" count
   - Review specific mutants in top files
   - Identify patterns (mutator types)

3. **Create Targeted Tests**
   - Focus on files with < 82% score
   - Add tests for specific surviving mutants
   - Verify mutants are killed

4. **Re-run Mutation Tests**
   ```bash
   npm run test:mutation
   ```

---

## 📝 Notes

- Files with high scores (> 90%) but many survivors may have equivalent mutants (not bugs)
- Focus on files with **low scores** (< 82%) first for maximum impact
- Some files may need refactoring rather than just more tests
- Review the HTML report for specific mutant locations and types

---

**Last Updated:** February 3, 2026  
**Total Surviving Mutants:** 790  
**Files Analyzed:** 30+ source files
