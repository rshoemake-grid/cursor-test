# Issues Found During Health Check

**Date**: 2026-01-26  
**Status**: Issues identified, need investigation

---

## Issue 1: ExecutionConsole.additional.test.tsx - Jest Parsing Error

**Status**: ⚠️ CRITICAL  
**Type**: Syntax/Parsing Error  
**Impact**: Test suite cannot run

**Error**: 
```
Jest encountered an unexpected token
Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.
```

**Possible Causes**:
1. Syntax error in test file
2. Missing import/export
3. Jest configuration issue
4. TypeScript/JSX parsing issue

**Action Required**: 
- Investigate file syntax
- Check Jest configuration
- Verify file can be parsed

**Priority**: HIGH

---

## Issue 2: Marketplace Methods Test Failure

**Status**: ⚠️ FAILING  
**Type**: Assertion Failure  
**Impact**: 1 test failing

**File**: `useMarketplaceData.methods.test.ts`  
**Line**: 612  
**Test**: "should verify some() callback uses toLowerCase().includes() in tags check"

**Error**:
```
expect(received).toBeGreaterThan(expected)
Expected: > 0
Received:   0
```

**Context**:
```typescript
// Verify workflow was added (tags include 'workflow')
expect(result.current.workflowsOfWorkflows.length).toBeGreaterThan(0)
```

**Possible Causes**:
1. Workflow not being added correctly
2. Tags check not working as expected
3. Mock data issue
4. Test setup issue

**Action Required**:
- Review test logic
- Check mock data
- Verify workflow addition logic
- Fix assertion or test setup

**Priority**: MEDIUM

---

## Issue 3: Previously Known - Chunk 5 Hanging File

**Status**: ⚠️ KNOWN ISSUE  
**File**: `useMarketplaceData.test.ts`  
**Impact**: File hangs when run

**Action Required**: See Task 2 in execution plan

**Priority**: MEDIUM

---

## Issue 4: Previously Known - Chunk 10 Mutation Tests

**Status**: ⚠️ KNOWN ISSUE  
**Impact**: Multiple mutation test files hang

**Action Required**: See Task 3 in execution plan

**Priority**: LOW

---

## Summary

**Total Issues**: 4
- **Critical**: 1 (ExecutionConsole parsing error)
- **Failing Tests**: 1 (Marketplace methods)
- **Hanging Files**: 2 (Chunk 5 and Chunk 10)

**Recommended Actions**:
1. **IMMEDIATE**: Fix ExecutionConsole parsing error
2. **SOON**: Fix Marketplace methods test
3. **WHEN TIME PERMITS**: Investigate hanging files

---

**Last Updated**: 2026-01-26
