# Java Backend – HIGH Severity Review Only

*Focused review for HIGH severity issues only (March 2026)*

---

## Summary

**2 HIGH severity issues** found, both related to **exception message leakage** when the `production` profile is not active.

---

## HIGH Severity Issues

### 1. Raw Exception Messages Exposed to Clients (Non-Production)

**Location:** `GlobalExceptionHandler.java` lines 95–97

**Issue:** When the `production` profile is not active, the generic `Exception` handler returns `e.getMessage()` to the client.

**Risk:** Exception messages can expose internal details (SQL, file paths, hostnames). If the app is deployed without the `production` profile (e.g. staging/QA), these messages are returned in API responses.

**Severity:** HIGH – information disclosure via configuration-dependent behavior.

---

### 2. Raw Exception Messages Persisted in Execution State (Non-Production)

**Locations:**
- `WorkflowExecutor.java` lines 131–148
- `ExecutionOrchestratorService.java` lines 86–91

**Issue:** When not in production, `e.getMessage()` is stored in execution state and logs. These values are persisted in the database and returned when clients fetch execution status or logs.

**Risk:** Internal exception details (e.g. LLM API errors, connection strings) can be persisted and later exposed via execution status/log APIs.

**Severity:** HIGH – persistent information leakage that survives beyond the original request.

---

## No Other Critical Issues

| Area | Assessment |
|------|------------|
| **IDOR** | Ownership checks centralized; `ExecutionService`, `WorkflowOwnershipService` enforce access |
| **Auth bypass** | Protected endpoints use `extractUserIdRequired` consistently |
| **Production behavior** | With `production` profile active, generic messages are used |
| **Critical DRY/SRP** | No duplicated security-critical logic; ownership in dedicated services |

---

## Recommendation

Ensure the `production` profile is active in all non-local environments (staging, QA, production). Alternatively, remove the non-production branch and always use generic messages for client-facing and stored content, logging full details server-side only.
