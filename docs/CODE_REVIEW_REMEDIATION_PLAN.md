# Code Review Remediation Plan

Plan to address findings from the backend code review. Status is tracked per item.

**Legend:**
- ⬜ Not started
- 🔄 In progress
- ✅ Done
- ⏸️ Deferred

---

## P1 – Critical (Security)

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| P1-1 | ✅ | Workflow authorization bypass | `backend/services/workflow_service.py` (update_workflow, delete_workflow) | Enforce `workflow.owner_id == user_id`; reject if not authorized |
| P1-2 | ✅ | Publish workflow without ownership check | `backend/api/routes/workflow_routes.py:361-371` | Add `if workflow.owner_id != current_user.id: raise HTTPException(403)` before publishing |
| P1-3 | ✅ | Path traversal when LOCAL_FILE_BASE_PATH unset | `backend/utils/path_utils.py:25-26` | When `ENVIRONMENT=production`, require `LOCAL_FILE_BASE_PATH` and fail startup if unset |
| P1-4 | ✅ | `eval()` on user-controlled input | `backend/utils/condition_evaluators.py:124` | Replace with safe expression evaluator (ast.literal_eval, DSL, or restricted parser) |
| P1-5 | ✅ | `exec()` on user-controlled code | `backend/tools/builtin_tools.py:160` | Restrict to sandbox (RestrictedPython) or remove if not essential |
| P1-6 | ✅ | FileReaderTool path traversal | `backend/tools/builtin_tools.py:207-213` | Use `path_utils.validate_path_within_base` before opening files |

---

## P2 – High (Security & Architecture)

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| P2-1 | ✅ | Password reset token in dev response | `backend/api/auth_routes.py:301-306` | Remove token/URL from non-production API response; use email or secure channel |
| P2-2 | ✅ | IDOR on user executions | `backend/api/routes/execution_routes.py:175-198` | Restrict `GET /users/{user_id}/executions` so users can only list their own executions |
| P2-3 | ✅ | Debug routes unauthenticated | `backend/api/debug_routes.py` | Add auth; consider disabling in production |
| P2-4 | ✅ | API key preview in logs | `backend/agents/unified_llm_agent.py:163` | Log only provider type and model; remove `api_key_preview` |
| P2-5 | ✅ | Duplicate login logic | `backend/api/auth_routes.py:106-171, 174-262` | Extract shared helper for token creation and refresh |
| P2-6 | ✅ | Bare `except` in verify_password | `backend/auth/auth.py:54-55, 59-60` | Use specific exceptions; avoid `except Exception: pass` |
| P2-7 | ✅ | User-facing error details leak internals | `backend/utils/error_handling.py` | Use generic message in production; avoid `str(e)` in response |
| P2-8 | ✅ | handle_execution_errors not used | `backend/api/routes/execution_routes.py` | Apply `@handle_execution_errors` to execute endpoint |
| P2-9 | ✅ | LOCAL_FILE_BASE_PATH optional in prod | `docs/KEYS_AND_SECRETS.md` | Fail startup in production if unset (covered by P1-3) |
| P2-10 | ✅ | get_settings() cache prevents test reload | `backend/config.py:74-76` | Add cache invalidation for tests (e.g., `get_settings.cache_clear()`) |
| P2-11 | ✅ | Blocking I/O in storage node | `backend/engine/nodes/storage_node_executor.py:73-79, 86-92` | Consider bounded ThreadPoolExecutor for concurrent executions |
| P2-12 | ✅ | GCP Pub/Sub blocking | `backend/inputs/input_sources.py:296` | Add timeout to future.result() |
| P2-13 | ✅ | Duplicate import | `backend/api/routes/execution_routes.py:12-13` | Remove redundant `from typing import Optional, List` |
| P2-14 | ✅ | WorkflowService authorization centralization | `backend/services/workflow_service.py` | Moved into service via `_check_workflow_ownership` |

---

## P3 – Medium (Hardening & Quality)

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| P3-1 | ✅ | Development secret key fallback | `backend/auth/auth.py:25` | Document risk; consider failing in dev if SECRET_KEY looks like default |
| P3-2 | ✅ | CORS fallback to ["*"] | `backend/main.py:74` | Production should explicitly restrict origins; fail or warn if * in prod |
| P3-3 | ✅ | Credentials in input config | `backend/inputs/input_sources.py` | Never log full config (keys only) |
| P3-4 | ✅ | Magic number: filename increment cap | `backend/inputs/input_sources.py:424` | Extract `MAX_FILENAME_INCREMENT_ATTEMPTS = 10000` |
| P3-5 | ✅ | Magic number: log download limit | `backend/api/routes/execution_routes.py:264` | Add config or constant `LOG_DOWNLOAD_LIMIT` |
| P3-6 | ✅ | reload=True default | `backend/config.py:49` | Default `reload=False` in production; document in config |
| P3-7 | ✅ | Silent callback failure | `backend/agents/unified_llm_agent.py:248` | Add debug logging for `except Exception: pass` |
| P3-8 | ✅ | datetime.utcnow() deprecated | Multiple files | Replace with `datetime.now(timezone.utc)` |
| P3-9 | ✅ | s3_client.exceptions.NoSuchKey | `backend/inputs/input_sources.py:182` | Use `botocore.exceptions.ClientError` with error code check |
| P3-10 | ✅ | List all blobs without pagination | `backend/inputs/input_sources.py:108` | Add max_results for list_blobs |
| P3-11 | ✅ | Log download memory | `backend/api/routes/execution_routes.py:264` | Documented; consider streaming for 100k+ |
| P3-12 | ✅ | workflow_chat_routes re-export | `backend/api/workflow_chat_routes.py` | Document deprecation path |
| P3-13 | ✅ | Legacy executor usage | `backend/engine/legacy/executor.py` | Documented in README; v3 only used |

---

## Testing Additions

| # | Status | Test | Action |
|---|--------|------|--------|
| T-1 | ✅ | Workflow ownership | Add tests: update/delete/publish reject when user != owner |
| T-2 | ✅ | Path validation in production | Test startup fails when ENVIRONMENT=production and LOCAL_FILE_BASE_PATH unset |
| T-3 | ✅ | Condition evaluator eval | Test malicious/edge expressions; verify safe evaluator |
| T-4 | ✅ | FileReaderTool path validation | Test rejects paths outside base |
| T-5 | ✅ | Execution routes IDOR | Test GET /users/{user_id}/executions returns 403 for other users |
| T-6 | ✅ | Debug routes auth | Test debug endpoints require auth |

---

## Rate Limiting (Future)

| # | Status | Endpoint | Action |
|---|--------|----------|--------|
| R-1 | ⬜ | Login, password reset | Add rate limiting on sensitive auth endpoints |

---

## Progress Summary

| Priority | Total | Done | In Progress | Not Started |
|----------|-------|------|-------------|-------------|
| P1 | 6 | 6 | 0 | 0 |
| P2 | 14 | 14 | 0 | 0 |
| P3 | 13 | 13 | 0 | 0 |
| Tests | 6 | 6 | 0 | 0 |
| **Total** | **39** | **38** | **0** | **1** |

---

## How to Update Status

When working on an item:
1. Change `⬜` to `🔄` when starting
2. Change `🔄` to `✅` when complete
3. Update the Progress Summary table
4. Add a brief note below if the fix differed from the plan

---

## Revision History

| Date | Change |
|------|--------|
| 2026-03-05 | Initial plan from code review |
| 2026-03-05 | P1-1 through P1-6 completed: workflow auth, publish check, LOCAL_FILE_BASE_PATH startup check, safe condition eval, python_executor disabled in prod, FileReaderTool path validation |
| 2026-03-05 | P2-1 through P2-4, P2-7, P2-13: password reset token removed, IDOR fix on user executions, debug routes require auth, API key preview removed from logs, generic 500 message in prod, duplicate import removed |
| 2026-03-05 | P3-4, P3-5: MAX_FILENAME_INCREMENT_ATTEMPTS, LOG_DOWNLOAD_LIMIT constants |
| 2026-03-05 | T-6: Debug route tests updated for auth (get_current_active_user override, current_user param) |
| 2026-03-05 | P2-5, P2-6, P2-8, P2-10, P3-7: _create_login_response helper, verify_password specific exceptions, handle_execution_errors on execute, clear_settings_cache in conftest, log callback debug logging |
| 2026-03-05 | P2-11, P3-9, T-1, T-2, T-5: Bounded ThreadPoolExecutor for storage, S3 ClientError for NoSuchKey, workflow ownership tests, path validation startup test, execution IDOR test |
| 2026-03-05 | T-3, T-4, P3-1, P3-2, P3-6, P3-12: Condition evaluator safe tests, FileReaderTool path tests, dev secret key doc, CORS prod warning, reload disabled in prod, workflow_chat deprecation doc |
| 2026-03-05 | P2-12, P3-3, P3-8, P3-10, P3-11, P3-13: Pub/Sub timeout, credentials audit, datetime.utcnow, GCP list_blobs pagination, log download doc, legacy executor doc |
