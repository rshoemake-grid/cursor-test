# Java Backend – Code Review (May 2026)

*Fresh review after remediation of HIGH severity issues*

---

## Summary

**HIGH severity:** None found. Exception handling, execution state, and Apigee handlers use generic messages.

**MEDIUM severity:** 3 issues (exception message exposure, validation API, LlmErrorResponseBuilder).

**DRY:** 2 minor issues (dead code, inline API docs).

---

## HIGH Severity

**None.** Verified:

- **GlobalExceptionHandler** – Generic `Exception` handler returns `ErrorMessages.UNEXPECTED_ERROR`.
- **WorkflowExecutor** – Uses `ErrorMessages.EXECUTION_FAILED` for state/logs.
- **ExecutionOrchestratorService** – Uses `ErrorMessages.EXECUTION_FAILED` for persisted state.

---

## MEDIUM Severity

### 1. GlobalExceptionHandler returns `e.getMessage()` for app exceptions

**Location:** `GlobalExceptionHandler.java` lines 42, 49, 56, 63

**Issue:** Handlers for `ResourceNotFoundException`, `ValidationException`, `IllegalArgumentException`, and `ForbiddenException` return `e.getMessage()` to clients. Messages are typically from `ErrorMessages`, but `workflowNotFound(id)` and `executionNotCancellable(executionId, status)` expose IDs.

**Recommendation:** Use fixed generic messages per exception type, or keep current behavior but document that IDs are intentionally exposed for debugging.

---

### 2. MethodArgumentNotValidException exposes field errors

**Location:** `GlobalExceptionHandler.java` lines 79–82

**Issue:** Returns `fieldName: defaultMessage` from `@Valid` validation errors.

**Risk:** Low–medium. Field names and messages can reveal structure. Usually acceptable for validation APIs.

---

### 3. LlmErrorResponseBuilder.error(Exception e) – risky API

**Location:** `LlmErrorResponseBuilder.java` lines 26–27

**Issue:** `error(Exception e)` returns `e.getMessage()` to clients. Not currently used; callers use `error(String)` with controlled messages.

**Risk:** Future use could leak exception details.

**Recommendation:** Remove `error(Exception e)` or change it to return a generic message.

---

## DRY Issues

### 1. Dead code in ExecutionLogConstants

**Location:** `ExecutionLogConstants.java` – `nodeFailed(String)`, `workflowExecutionFailed(String)`, `NODE_FAILED_PREFIX`, `WORKFLOW_EXECUTION_FAILED_PREFIX`

**Issue:** WorkflowExecutor uses `ErrorMessages.EXECUTION_FAILED` directly; these methods are unused.

**Recommendation:** Remove dead code or wire into WorkflowExecutor for consistency.

---

### 2. Inline strings in API docs

**Location:** Controllers – `@ApiResponse` descriptions

**Issue:** Inline strings like `"Workflow not found"`, `"Not authorized"` instead of `ErrorMessages` constants.

**Recommendation:** Use shared constants for consistency (low priority).

---

## Verified Compliant

| Area | Status |
|------|--------|
| Exception exposure (generic handler) | Uses `ErrorMessages.UNEXPECTED_ERROR` |
| Execution state/logs | Uses `ErrorMessages.EXECUTION_FAILED` |
| Apigee handlers | Use `ErrorMessages.FORBIDDEN` / `UNAUTHORIZED` |
| IDOR | Ownership enforced via `WorkflowOwnershipService`, `ExecutionService`, `TemplateOwnershipService` |
| Auth bypass | Protected endpoints use `extractUserIdRequired` |
| LlmTestService / SettingsController | Use generic messages |
| ErrorMessages | Centralized |

---

## Conclusion

The backend is in good shape. Remaining work is mainly:

1. **MEDIUM:** Tighten `GlobalExceptionHandler` to avoid returning `e.getMessage()` for app exceptions.
2. **MEDIUM:** Remove or harden `LlmErrorResponseBuilder.error(Exception e)`.
3. **DRY:** Remove dead code in `ExecutionLogConstants`.
