# Refactoring Implementation Guide

**Date**: 2026-02-18  
**Purpose**: Step-by-step guide for implementing refactoring recommendations

---

## Overview

This guide provides a step-by-step process for implementing the refactoring recommendations for `nodeConversion.ts` and `environment.ts`.

---

## Phase 1: nodeConversion.ts Refactoring

### Step 1.1: Backup Current Implementation

```bash
cd frontend/src/utils
cp nodeConversion.ts nodeConversion.ts.backup
```

### Step 1.2: Review Refactored Version

Review the refactored version:
- `nodeConversion.refactored.ts` - Complete refactored implementation

### Step 1.3: Implement Changes

**Option A: Replace Entire File** (Recommended if confident)
```bash
cp nodeConversion.refactored.ts nodeConversion.ts
```

**Option B: Incremental Changes** (Safer approach)

1. Add helper functions first:
   ```typescript
   // Add after imports, before convertNodesForExecutionInput
   function isValidNonEmptyString(value: unknown): value is string {
     return typeof value === 'string' && 
            value !== null && 
            value !== undefined && 
            value !== ''
   }
   
   function extractValidString(value: unknown): string | null {
     return isValidNonEmptyString(value) ? value : null
   }
   
   function extractNodeName(nodeData: any): string | null {
     const nameValue = extractValidString(nodeData.name)
     const labelValue = extractValidString(nodeData.label)
     return nameValue ?? labelValue
   }
   ```

2. Add convertSingleNode helper:
   ```typescript
   function convertSingleNode(node: Node): WorkflowNode {
     const name = extractNodeName(node.data) ?? ''
     const inputs = coalesceArray(node.data.inputs, [])
     
     return {
       id: node.id,
       type: node.type as any,
       name,
       description: node.data.description,
       agent_config: (node.data as any).agent_config,
       condition_config: (node.data as any).condition_config,
       loop_config: node.data.loop_config,
       input_config: node.data.input_config,
       inputs,
       position: node.position,
     }
   }
   ```

3. Update main function:
   ```typescript
   export function convertNodesForExecutionInput(nodes: Node[]): WorkflowNode[] {
     return nodes.map(convertSingleNode)
   }
   ```

4. Remove old code (lines 17-23):
   ```typescript
   // DELETE these lines:
   // const hasName = node.data.name !== null && node.data.name !== undefined && node.data.name !== ''
   // const nameValue = hasName === true ? node.data.name : null
   // const isStringLabel = typeof node.data.label === 'string'
   // const hasLabel = isStringLabel === true && node.data.label !== null && node.data.label !== undefined && node.data.label !== ''
   // const labelValue = hasLabel === true ? node.data.label : null
   // const name = coalesceStringChain('', nameValue, labelValue)
   ```

### Step 1.4: Verify Tests

```bash
cd frontend
npm test -- nodeConversion.test.ts
```

**Expected**: All 54 tests should pass ✅

### Step 1.5: Verify Mutation Tests

```bash
cd frontend
STRYKER_RUNNING=1 npx stryker run stryker.conf.quick-test.json
```

**Expected**: Mutation score should be maintained or improved ✅

---

## Phase 2: environment.ts Refactoring

### Step 2.1: Backup Current Implementation

```bash
cd frontend/src/utils
cp environment.ts environment.ts.backup
```

### Step 2.2: Review Refactored Version

Review the refactored version:
- `environment.refactored.ts` - Complete refactored implementation

### Step 2.3: Implement Changes

**Option A: Replace Entire File** (Recommended)
```bash
cp environment.refactored.ts environment.ts
```

**Option B: Incremental Changes**

1. Add helper function:
   ```typescript
   // Add before isBrowserEnvironment
   function getWindowType(): string {
     return typeof window
   }
   ```

2. Update isBrowserEnvironment:
   ```typescript
   export function isBrowserEnvironment(): boolean {
     const windowType = getWindowType()
     return windowType !== 'undefined'
   }
   ```

3. Update isServerEnvironment:
   ```typescript
   export function isServerEnvironment(): boolean {
     const windowType = getWindowType()
     return windowType === 'undefined'
   }
   ```

### Step 2.4: Verify Tests

```bash
cd frontend
npm test -- environment.test.ts
```

**Expected**: All 18 tests should pass ✅

### Step 2.5: Verify Mutation Tests

```bash
cd frontend
STRYKER_RUNNING=1 npx stryker run stryker.conf.quick-test.json
```

**Expected**: Mutation score should be maintained or improved ✅

---

## Phase 3: Final Verification

### Step 3.1: Run Full Test Suite

```bash
cd frontend
npm test
```

**Expected**: All tests pass ✅

### Step 3.2: Run Mutation Tests

```bash
cd frontend
npm run test:mutation
```

**Expected**: 
- Overall mutation score maintained or improved
- No new survivors introduced
- Per-file scores maintained

### Step 3.3: Code Review

1. Review changes with team
2. Get approval for refactoring
3. Address any feedback

### Step 3.4: Cleanup

```bash
# Remove backup files if everything is working
rm frontend/src/utils/nodeConversion.ts.backup
rm frontend/src/utils/environment.ts.backup

# Optional: Remove refactored versions
rm frontend/src/utils/nodeConversion.refactored.ts
rm frontend/src/utils/environment.refactored.ts
```

---

## Rollback Plan

If issues arise:

### Rollback nodeConversion.ts

```bash
cd frontend/src/utils
cp nodeConversion.ts.backup nodeConversion.ts
npm test -- nodeConversion.test.ts
```

### Rollback environment.ts

```bash
cd frontend/src/utils
cp environment.ts.backup environment.ts
npm test -- environment.test.ts
```

---

## Success Criteria

### Code Quality
- ✅ No DRY violations
- ✅ SOLID principles followed
- ✅ Code is more readable
- ✅ Functions have single responsibility

### Testing
- ✅ All existing tests pass
- ✅ Mutation test scores maintained/improved
- ✅ No regressions introduced

### Documentation
- ✅ Code comments updated
- ✅ JSDoc comments added
- ✅ Refactoring documented

---

## Troubleshooting

### Issue: Tests Fail After Refactoring

**Solution**:
1. Check that helper functions are exported if needed
2. Verify function signatures match
3. Check for any missing imports
4. Review test error messages carefully

### Issue: Mutation Score Decreases

**Solution**:
1. Verify that explicit checks are still present
2. Ensure type guards are working correctly
3. Check that null coalescing logic is preserved
4. Review surviving mutations in HTML report

### Issue: Type Errors

**Solution**:
1. Verify type guard functions are correct
2. Check that `value is string` syntax is correct
3. Ensure TypeScript version supports type guards
4. Review type definitions

---

## Next Steps After Refactoring

1. **Monitor**: Watch for any issues in production
2. **Document**: Update team documentation
3. **Share**: Share learnings with team
4. **Iterate**: Consider further improvements

---

**Last Updated**: 2026-02-18  
**Status**: Ready for Implementation
