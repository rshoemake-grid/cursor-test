# Fresh Code Review Remediation Plan

Plan to address findings from the fresh backend code review (Feb 2026). Status is tracked per item.

**Legend:**
- ⬜ Not started
- 🔄 In progress
- ✅ Done
- ⏸️ Deferred

---

## Critical

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| C-1 | ⬜ | python-jose 3.3.0 – CVEs | `requirements.txt` | Upgrade to `python-jose[cryptography]>=3.4.0`; CVE-2024-33663 (auth bypass), CVE-2024-33664 (JWE DoS) |
| C-2 | ✅ | Execution IDOR – unauthenticated access | `backend/api/routes/execution_routes.py` | Auth + ownership on get_execution, logs, cancel, list_workflow_executions, list_running_executions; list_executions requires auth |
| C-3 | ✅ | WebSocket execution stream IDOR | `backend/api/websocket_routes.py` | Token in query param; verify execution ownership before connect |

---

## High

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| H-1 | ✅ | CORS production fallback bug | `backend/main.py:75-76` | allow_origins = [] in prod when cors_origins was ["*"] |
| H-2 | ✅ | Health check leaks DB error details | `backend/main.py:254-258` | Generic "Database connection failed" in production |
| H-3 | ⬜ | Error details leaked in multiple routes | `workflow_routes`, `execution_routes`, etc. | In production, use generic messages; avoid `detail=str(e)` in HTTP responses |
| H-4 | ✅ | User registration input validation | `backend/models/schemas.py` | Pydantic validators for username, email, password (min 8 chars) |

---

## Medium

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| M-1 | ⬜ | Path validation skipped when base unset | `backend/utils/path_utils.py:25-27` | Document or require `LOCAL_FILE_BASE_PATH` in all environments where file access is used |
| M-2 | ⬜ | Metrics endpoint unauthenticated | `backend/main.py:288-329` | Restrict `/metrics` (auth, network, or both) or document infra protection |
| M-3 | ⬜ | list_executions IDOR risk | `backend/api/routes/execution_routes.py:124-151` | Require auth; restrict `user_id` to `current_user.id` when provided |
| M-4 | ⬜ | condition_evaluators still uses eval | `backend/utils/condition_evaluators.py:133` | Consider replacing `eval(compile(...))` with safer evaluator (custom interpreter) |
| M-5 | ⬜ | PythonExecutorTool exec() in development | `backend/tools/builtin_tools.py:161` | Use RestrictedPython or remove if not needed; sandbox may be bypassable |

---

## Low

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| L-1 | ⬜ | ast.Num and ast.Str deprecated | `backend/utils/condition_evaluators.py:107` | Replace with `ast.Constant`; handle both for backward compatibility |
| L-2 | ⬜ | CalculatorTool ast.Num usage | `backend/tools/builtin_tools.py:42` | Use `ast.Constant`; support both `ast.Num` and `ast.Constant` if needed |
| L-3 | ⬜ | Import file size limit | `backend/api/import_export_routes.py:137-140` | Add max file size; reject oversized workflow uploads |
| L-4 | ⬜ | Rate limiting on auth endpoints | `backend/api/auth_routes.py` | Add rate limiting for login, forgot-password, reset-password (e.g. slowapi) |

---

## Testing Gaps

| # | Status | Area | Gap |
|---|--------|------|-----|
| T-1 | ✅ | Execution IDOR | Tests for unauthenticated access to `get_execution`, `get_execution_logs`, `cancel_execution` |
| T-2 | ✅ | WebSocket auth | Tests for WebSocket auth and execution ownership |
| T-3 | ✅ | list_executions | Tests for `user_id` filtering and auth enforcement |
| T-4 | ✅ | User registration | Tests for input validation (username, email, password) |
| T-5 | ✅ | CORS | Tests for production CORS behavior when `cors_origins=["*"]` |
| T-6 | ✅ | Health check | Tests for sanitized error messages in production |

---

## Progress Summary

| Priority | Total | Done | In Progress | Not Started |
|----------|-------|------|-------------|-------------|
| Critical | 3 | 2 | 0 | 1 |
| High | 4 | 3 | 0 | 1 |
| Medium | 5 | 0 | 0 | 5 |
| Low | 4 | 0 | 0 | 4 |
| Tests | 6 | 6 | 0 | 0 |
| **Total** | **22** | **11** | **0** | **11** |

---

## How to Update Status

When working on an item:
1. Change `⬜` to `🔄` when starting
2. Change `🔄` to `✅` when complete
3. Update the Progress Summary table
4. Add a brief note in Revision History if the fix differed from the plan

---

## Revision History

| Date | Change |
|------|--------|
| 2026-02-23 | Initial plan from fresh code review |
| 2026-02-23 | T-1 through T-6: Added unit tests in test_fresh_review_*.py (tests marked xfail until C-2, H-1, H-2, H-4 fixed) |
