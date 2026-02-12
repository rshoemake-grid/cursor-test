# Chunked Testing Plan

**Date Created**: 2026-01-26  
**Total Test Files**: 299  
**Status**: 🔄 IN PROGRESS

## Overview

This document breaks down the 299 test files into manageable chunks for systematic testing and verification. Each chunk is designed to:
- Run in a reasonable time (< 5 minutes per chunk)
- Group related tests together
- Allow progress tracking
- Enable parallel work if needed

## Test File Distribution

| Category | Count | Percentage |
|----------|-------|------------|
| Components | 65 | 21.7% |
| Hooks | 178 | 59.5% |
| - Execution hooks | 20 | 6.7% |
| - Marketplace hooks | 58 | 19.4% |
| - Other hooks | ~100 | 33.4% |
| Utils | 84 | 28.1% |
| Pages | 8 | 2.7% |
| Mutation/Enhanced tests | 21 | 7.0% |
| **Total** | **299** | **100%** |

*Note: Some files may be counted in multiple categories*

---

## Chunk Strategy

### Chunk Size Guidelines
- **Small chunks**: 10-15 files (quick verification)
- **Medium chunks**: 20-30 files (standard testing)
- **Large chunks**: 30-50 files (comprehensive suites)

### Chunk Organization
1. **Priority-based**: Start with critical/core functionality
2. **Category-based**: Group by component/hook/utils
3. **Dependency-based**: Test dependencies before dependents
4. **Known-issues**: Separate known problem areas

---

## Testing Chunks

### ✅ CHUNK 0: Verification (COMPLETED)
**Status**: ✅ COMPLETED  
**Files**: 2  
**Purpose**: Verify ExecutionConsole fixes

| File | Status | Notes |
|------|--------|-------|
| `components/ExecutionConsole.test.tsx` | ✅ PASS | Fixed missing helper |
| `components/ExecutionConsole.additional.test.tsx` | ✅ PASS | Fixed resilient pattern |

**Command**:
```bash
npm test -- --testPathPatterns="ExecutionConsole"
```

---

### CHUNK 1: Core Components (Priority: HIGH)
**Status**: ⏳ PENDING  
**Files**: ~15  
**Purpose**: Test critical UI components

**Files**:
- `components/WorkflowBuilder.test.tsx`
- `components/WorkflowTabs.test.tsx`
- `components/WorkflowChat.test.tsx`
- `components/WorkflowList.test.tsx`
- `components/PropertyPanel.test.tsx`
- `components/NodePanel.test.tsx`
- `components/MarketplaceDialog.test.tsx`
- `components/PublishModal.test.tsx`
- `components/ExecutionViewer.test.tsx`
- `components/editors/AgentNodeEditor.test.tsx`
- `components/editors/InputNodeEditor.test.tsx`
- `components/editors/ConditionNodeEditor.test.tsx`
- `pages/MarketplacePage.test.tsx`
- `pages/AuthPage.test.tsx`
- `App.test.tsx`

**Command**:
```bash
npm test -- --testPathPatterns="(WorkflowBuilder|WorkflowTabs|WorkflowChat|WorkflowList|PropertyPanel|NodePanel|MarketplaceDialog|PublishModal|ExecutionViewer|AgentNodeEditor|InputNodeEditor|ConditionNodeEditor|MarketplacePage|AuthPage|App\.test)"
```

**Estimated Time**: 3-5 minutes

---

### CHUNK 2: Execution Hooks - Basic
**Status**: ⏳ PENDING  
**Files**: ~20  
**Purpose**: Test core execution functionality

**Files**:
- `hooks/execution/useWorkflowExecution.test.ts`
- `hooks/execution/useWebSocket.test.ts`
- `hooks/execution/useWebSocket.messages.test.ts`
- `hooks/execution/useWebSocket.errors.test.ts`
- `hooks/execution/useWebSocket.edges.basic.test.ts`
- `hooks/execution/useExecutionManagement.test.ts`
- `hooks/execution/useExecutionPolling.test.ts`
- `hooks/execution/useWebSocket.test.setup.ts` (if test file)
- Other basic execution hook tests

**Command**:
```bash
npm test -- --testPathPatterns="hooks/execution" --testPathIgnorePatterns="(mutation|enhanced|comprehensive)"
```

**Estimated Time**: 4-6 minutes  
**Known Issues**: Some failures documented in `TEST_FIXES_PROGRESS.md`

---

### CHUNK 3: Execution Hooks - Mutation Tests
**Status**: ⏳ PENDING  
**Files**: ~15  
**Purpose**: Test mutation-specific execution scenarios

**Files**:
- `hooks/execution/useWebSocket.mutation.basic.test.ts`
- `hooks/execution/useWebSocket.mutation.advanced.test.ts`
- `hooks/execution/useWebSocket.mutation.kill-remaining.test.ts`
- `hooks/execution/useWorkflowExecution.no-coverage.test.ts`
- Other mutation test files

**Command**:
```bash
npm test -- --testPathPatterns="hooks/execution.*mutation"
```

**Estimated Time**: 5-7 minutes  
**Known Issues**: Some failures documented

---

### CHUNK 4: Execution Hooks - Comprehensive/Edge Tests
**Status**: ⏳ PENDING  
**Files**: ~10  
**Purpose**: Test edge cases and comprehensive scenarios

**Files**:
- `hooks/execution/useWebSocket.edges.comprehensive.1.test.ts`
- `hooks/execution/useWebSocket.edges.comprehensive.2.test.ts`
- `hooks/execution/useWebSocket.edges.comprehensive.3.test.ts`
- Other comprehensive/edge test files

**Command**:
```bash
npm test -- --testPathPatterns="hooks/execution.*(comprehensive|edges)"
```

**Estimated Time**: 6-8 minutes  
**Known Issues**: Multiple failures documented

---

### CHUNK 5: Marketplace Hooks - Core
**Status**: ⏳ PENDING  
**Files**: ~10  
**Purpose**: Test core marketplace functionality

**Files**:
- `hooks/marketplace/useMarketplaceData.test.ts`
- `hooks/marketplace/useMarketplaceData.methods.test.ts`
- `hooks/marketplace/useMarketplaceData.error.test.ts`
- `hooks/marketplace/useMarketplaceData.logging.test.ts`
- `hooks/marketplace/useMarketplaceData.initialization.test.ts`
- Other core marketplace tests

**Command**:
```bash
npm test -- --testPathPatterns="hooks/marketplace/useMarketplaceData\.(test|methods|error|logging|initialization)"
```

**Estimated Time**: 4-6 minutes  
**Known Issues**: Some failures documented

---

### CHUNK 6: Marketplace Hooks - Mutation Tests
**Status**: ⏳ PENDING  
**Files**: ~20  
**Purpose**: Test mutation-specific marketplace scenarios

**Files**:
- `hooks/marketplace/useMarketplaceData.mutation.test.ts`
- `hooks/marketplace/useMarketplaceData.conditionals.test.ts`
- `hooks/marketplace/useMarketplaceData.logical-operators.test.ts`
- `hooks/marketplace/useMarketplaceData.edge-cases.test.ts`
- `hooks/marketplace/useMarketplaceData.complex-patterns.test.ts`
- `hooks/marketplace/useMarketplaceData.complex-logical.test.ts`
- `hooks/marketplace/useMarketplaceData.no-coverage.test.ts`
- `hooks/marketplace/useMarketplaceData.string-methods.test.ts`
- `hooks/marketplace/useMarketplaceData.fallbacks.test.ts`
- `hooks/marketplace/useMarketplaceData.strings.test.ts`
- `hooks/marketplace/useMarketplaceData.branches.test.ts`
- `hooks/marketplace/useMarketplaceData.targeted.test.ts`
- `hooks/marketplace/useMarketplaceData.equality.test.ts`
- `hooks/marketplace/useMarketplaceData.arrays.test.ts`
- `hooks/marketplace/useMarketplaceData.useEffect-routing.test.ts`
- `hooks/marketplace/useMarketplaceData.property-access.test.ts`
- `hooks/marketplace/useMarketplaceData.workflow-detection.test.ts`
- `hooks/marketplace/useMarketplaceData.date-operations.test.ts`
- `hooks/marketplace/useMarketplaceData.array-methods.test.ts`
- `hooks/marketplace/useMarketplaceData.http-methods.test.ts`
- `hooks/marketplace/useMarketplaceData.state-setters.test.ts`
- `hooks/marketplace/useMarketplaceData.response-ok.test.ts`
- `hooks/marketplace/useMarketplaceData.assignment.test.ts`

**Command**:
```bash
npm test -- --testPathPatterns="hooks/marketplace/useMarketplaceData\."
```

**Estimated Time**: 10-15 minutes  
**Note**: Large chunk - 58 marketplace hook test files (many mutation tests)

---

### CHUNK 7: Provider Hooks
**Status**: ⏳ PENDING  
**Files**: ~5  
**Purpose**: Test provider-related hooks

**Files**:
- `hooks/providers/useLLMProviders.test.ts`
- `hooks/providers/useLLMProviders.mutation.test.ts`
- `hooks/providers/useLLMProviders.mutation.enhanced.test.ts`
- Other provider hook tests

**Command**:
```bash
npm test -- --testPathPatterns="hooks/providers"
```

**Estimated Time**: 2-3 minutes

---

### CHUNK 8: Other Hooks
**Status**: ⏳ PENDING  
**Files**: ~100+  
**Purpose**: Test remaining hook files

**Sub-chunks**:
- 8a: Workflow hooks (~20 files)
- 8b: Node hooks (~15 files)
- 8c: Form/validation hooks (~15 files)
- 8d: Data fetching hooks (~10 files)
- 8e: Other utility hooks (~40+ files)

**Command** (example for workflow hooks):
```bash
npm test -- --testPathPatterns="hooks/workflow"
```

**Estimated Time**: 15-20 minutes total (split into sub-chunks)

---

### CHUNK 9: Utils - Core Utilities
**Status**: ⏳ PENDING  
**Files**: ~20  
**Purpose**: Test core utility functions

**Files**:
- `utils/confirm.mutation.enhanced.test.ts`
- `utils/validationHelpers.test.ts`
- `utils/storageHelpers.test.ts`
- `utils/nodeUtils.test.ts`
- `utils/ownershipUtils.test.ts`
- `utils/environment.test.ts`
- Other core utility tests

**Command**:
```bash
npm test -- --testPathPatterns="utils/(confirm|validation|storage|node|ownership|environment)"
```

**Estimated Time**: 4-6 minutes  
**Known Issues**: Some failures in `confirm.mutation.enhanced.test.ts`

---

### CHUNK 10: Utils - Mutation Tests
**Status**: ⏳ PENDING  
**Files**: ~30  
**Purpose**: Test mutation-specific utility scenarios

**Files**:
- All `utils/*.mutation.test.ts` files
- Other mutation utility tests

**Command**:
```bash
npm test -- --testPathPatterns="utils.*mutation"
```

**Estimated Time**: 6-8 minutes

---

### CHUNK 11: Utils - Remaining
**Status**: ⏳ PENDING  
**Files**: ~34  
**Purpose**: Test remaining utility files

**Command**:
```bash
npm test -- --testPathPatterns="utils" --testPathIgnorePatterns="(mutation|enhanced)"
```

**Estimated Time**: 5-7 minutes

---

### CHUNK 12: Remaining Components
**Status**: ⏳ PENDING  
**Files**: ~50  
**Purpose**: Test remaining component files

**Sub-chunks**:
- 12a: Editor components (~10 files)
- 12b: Dialog/Modal components (~10 files)
- 12c: Badge/Status components (~5 files)
- 12d: Other components (~25 files)

**Command** (example):
```bash
npm test -- --testPathPatterns="components" --testPathIgnorePatterns="(WorkflowBuilder|WorkflowTabs|WorkflowChat|WorkflowList|PropertyPanel|NodePanel|MarketplaceDialog|PublishModal|ExecutionViewer|ExecutionConsole)"
```

**Estimated Time**: 10-15 minutes total

---

### CHUNK 13: Pages & App
**Status**: ⏳ PENDING  
**Files**: ~8  
**Purpose**: Test page components

**Files**:
- All `pages/*.test.tsx` files
- `App.test.tsx` (if not in Chunk 1)

**Command**:
```bash
npm test -- --testPathPatterns="pages"
```

**Estimated Time**: 2-3 minutes

---

## Progress Tracking

### Overall Progress
- **Total Chunks**: 13 (+ 1 completed)
- **Completed**: 1 (Chunk 0)
- **In Progress**: 0
- **Pending**: 13

### Chunk Status Legend
- ✅ COMPLETED - All tests passing
- 🔄 IN PROGRESS - Currently being tested
- ⏳ PENDING - Not started
- ⚠️ ISSUES - Some failures found
- ❌ FAILED - Critical failures

---

## Testing Workflow

### For Each Chunk:

1. **Run Tests**:
   ```bash
   cd frontend
   npm test -- --testPathPatterns="[CHUNK_PATTERN]"
   ```

2. **Record Results**:
   - Update chunk status in this document
   - Note any failures
   - Record execution time

3. **Document Issues**:
   - Create issue document if failures found
   - Note known issues from documentation
   - Track progress in `TESTING_CHUNK_PROGRESS.md`

4. **Move to Next Chunk**:
   - Mark current chunk as completed
   - Start next chunk

---

## Known Issues Reference

### Documented Failures
- `TEST_FIXES_PROGRESS.md` - Lists 218 remaining failures
- `STRYKER_TEST_FAILURES_ANALYSIS_AND_FIXES.md` - Stryker-specific issues
- `PHASE10_TASK6_TEST_FAILURE_FIX_PLAN.md` - Specific test failures

### Problem Areas
1. **useWebSocket tests** - Multiple comprehensive/edge test failures
2. **useMarketplaceData tests** - Some logging/error test failures
3. **confirm.mutation.enhanced.test.ts** - Mock setup issues
4. **Stryker instrumentation** - Tests pass locally but fail under Stryker

---

## Next Steps

1. ✅ **Complete Chunk 0** (Verification) - DONE
2. ⏳ **Start Chunk 1** (Core Components) - Next priority
3. Continue through chunks systematically
4. Document all findings
5. Prioritize fixes based on impact

---

## Commands Reference

### Run Specific Chunk
```bash
# Example: Chunk 1 (Core Components)
npm test -- --testPathPatterns="(WorkflowBuilder|WorkflowTabs|WorkflowChat)"
```

### Run with Verbose Output
```bash
npm test -- --testPathPatterns="[PATTERN]" --verbose
```

### Run Single Test File
```bash
npm test -- --testPathPatterns="ExecutionConsole.test.tsx"
```

### List Files in Chunk
```bash
npm test -- --listTests | grep "[PATTERN]"
```

---

## Notes

- Chunks are designed to run independently
- Some chunks may take longer due to test complexity
- Known issues should be addressed after initial verification
- Progress should be tracked in `TESTING_CHUNK_PROGRESS.md`
