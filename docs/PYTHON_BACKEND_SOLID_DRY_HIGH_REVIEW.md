# Python Backend – SOLID & DRY Review (HIGH Violations)

*Review conducted February 2026*

---

## Summary

This review identifies **HIGH-severity** SOLID/DRY violations in the Python backend. These pose security risks (IDOR, inconsistent authorization) or significant maintainability issues.

---

## HIGH Violations Found

### 1. DRY + Security: Duplicated and inconsistent workflow ownership checks

**Location:** `api/sharing_routes.py`, `api/routes/workflow_routes.py`, `api/routes/execution_routes.py`, `api/import_export_routes.py`

**Issue:** Ownership checks are duplicated across 8+ route handlers with inline logic:
- `workflow.owner_id != current_user.id` (sharing_routes: 5×, workflow_routes: 1×)
- `getattr(workflow, "owner_id", None) != current_user.id` (execution_routes)
- `not workflow.is_public and workflow.owner_id != (current_user.id if current_user else None)` (import_export_routes)

`WorkflowService._check_workflow_ownership` exists but is used only by `update_workflow`, `delete_workflow`, and `apply_chat_changes`. Routes bypass it and implement their own checks.

**Security risk:** Inconsistent logic increases IDOR risk. `get_workflow_versions` (sharing_routes:244) correctly allows owner OR shared-with; other endpoints only check owner. Shared access is not considered in execution_routes or import_export export.

**Fix:** Create `WorkflowOwnershipService` (or extend `WorkflowService`) with:
- `assert_owner(workflow, user_id)` – owner only
- `assert_can_read(workflow, user_id)` – owner or public
- `assert_can_read_or_share(workflow, user_id, db)` – owner, public, or shared with user

Inject and use in all routes. Mirror Java backend `WorkflowOwnershipService` pattern.

---

### 2. Security: Workflow chat context has no access control

**Location:** `api/workflow_chat/context.py` – `get_workflow_context(db, workflow_id)`

**Issue:** Fetches workflow and returns context (nodes, edges, names) without checking if the caller can access the workflow. Any authenticated or anonymous user can pass any `workflow_id` and receive workflow structure in the chat context.

**Fix:** Add `user_id: Optional[str]` parameter. Before returning context, assert user can read workflow (owner, public, or shared). Use `WorkflowOwnershipService.assert_can_read_or_share` (or equivalent). Update `workflow_chat/routes.py` to pass `user_id` when calling `get_workflow_context`.

---

### 3. DRY: Routes perform DB access instead of delegating to services

**Location:** `api/sharing_routes.py`, `api/import_export_routes.py`

**Issue:** Routes execute `select(WorkflowDB).where(...)` directly and check ownership inline. Business logic (workflow fetch + ownership) belongs in a service layer. Java backend uses `WorkflowService` + `WorkflowOwnershipService`; Python routes bypass `WorkflowService` for sharing and import/export.

**Fix:** Add `SharingService` (or extend `WorkflowService`) with methods like `get_workflow_and_assert_owner(workflow_id, user_id)`, `assert_can_read_for_export(workflow, user_id)`. Routes call service; service performs DB access and ownership checks.

---

### 4. Inconsistent shared-access handling

**Location:** `api/sharing_routes.py` – `get_workflow_versions` (lines 244–255) vs. other endpoints

**Issue:** Only `get_workflow_versions` checks owner OR shared-with. `revoke_share`, `create_workflow_version`, `restore_workflow_version` correctly require owner. But `list_executions` (execution_routes) and `export_workflow` (import_export) do not consider shared access—a user with "view" or "execute" share cannot list executions or export, even though they can view versions.

**Fix:** Align with intended sharing model. If shared users should list executions or export, add `assert_can_read_or_share` to those endpoints. Centralize logic in `WorkflowOwnershipService`.

---

## Prioritized Actions

| # | Violation | Severity | Status |
|---|-----------|----------|--------|
| 1 | Duplicated/inconsistent ownership checks | High | ✅ Fixed |
| 2 | Workflow chat context no access control | High | ✅ Fixed |
| 3 | Routes perform DB access instead of services | High | ✅ Fixed |
| 4 | Inconsistent shared-access handling | High | ✅ Fixed |

---

## Fixes Applied

1. **WorkflowOwnershipService** – Created `backend/services/workflow_ownership_service.py` with:
   - `assert_owner(workflow, user_id, action)` – owner only
   - `assert_can_read(workflow, user_id)` – owner or public
   - `assert_can_read_or_share(workflow, user_id)` – owner, public, or shared
   - `get_workflow_and_assert_owner`, `get_workflow_and_assert_can_read`, `get_workflow_and_assert_can_read_or_share` – fetch + assert helpers

2. **Dependencies** – Added `WorkflowOwnershipServiceDep`; routes inject and use it.

3. **sharing_routes** – All endpoints use `ownership_service.get_workflow_and_assert_owner` or `get_workflow_and_assert_can_read_or_share` (for `get_workflow_versions`).

4. **workflow_routes** – `publish_workflow` uses `get_workflow_and_assert_owner`.

5. **execution_routes** – `list_executions` (by workflow) uses `get_workflow_and_assert_owner`.

6. **import_export_routes** – `export_workflow` uses `get_workflow_and_assert_can_read` (owner or public).

7. **workflow_chat/context.py** – `get_workflow_context` accepts `user_id` and `ownership_service`; when `workflow_id` is provided, calls `assert_can_read_or_share` before returning context.

8. **main.py** – Exception handlers for `WorkflowNotFoundError` and `WorkflowForbiddenError` (convert to 404/403 JSON).

---

---

## Re-Review (Post-Fix)

*Conducted after fixes for violations 1–4*

### Remaining HIGH Violations

#### 5. Security: `get_workflow` has no access control (IDOR)

**Location:** `api/routes/workflow_routes.py` – `get_workflow` (line 257)

**Issue:** Endpoint fetches any workflow by ID with no auth or ownership check. Unauthenticated and authenticated users can read any workflow, including private ones. Java backend uses `assertCanRead` before returning.

**Fix:** Require `get_optional_user`; use `ownership_service.get_workflow_and_assert_can_read(workflow_id, user_id)` (or `assert_can_read_or_share` if shared users should view). Return 403 when access is denied.

---

#### 6. Security: `execute_workflow` has no workflow access check (IDOR)

**Location:** `api/routes/execution_routes.py` – `execute_workflow`; `services/execution_orchestrator.py` – `_get_workflow`

**Issue:** `ExecutionOrchestrator.prepare_execution` calls `workflow_service.get_workflow(workflow_id)` with no ownership or read check. Any user can execute any workflow.

**Fix:** Before preparing execution, call `ownership_service.get_workflow_and_assert_can_read(workflow_id, user_id)` (or `assert_can_read_or_share` if shared users with "execute" should run). Inject `WorkflowOwnershipService` into `ExecutionOrchestrator` and use it in `prepare_execution`.

---

#### 7. Security: Debug routes lack workflow/execution ownership checks (IDOR)

**Location:** `api/debug_routes.py`

**Issue:**
- `validate_workflow` – Requires auth but no workflow ownership; user A can validate user B’s workflow.
- `get_execution_history` – No workflow ownership; user A can see execution history of user B’s workflow.
- `get_execution_timeline`, `get_node_execution_details` – No execution ownership; user A can see user B’s execution details.

**Fix:** Use `WorkflowOwnershipService.get_workflow_and_assert_can_read_or_share` for workflow-based debug endpoints. Use `ExecutionService` (or equivalent) with ownership checks for execution-based endpoints, or add an `ExecutionOwnershipService` that asserts `execution.user_id == current_user.id`.

---

## Prioritized Actions (Updated)

| # | Violation | Severity | Status |
|---|-----------|----------|--------|
| 1 | Duplicated/inconsistent ownership checks | High | ✅ Fixed |
| 2 | Workflow chat context no access control | High | ✅ Fixed |
| 3 | Routes perform DB access instead of services | High | ✅ Fixed |
| 4 | Inconsistent shared-access handling | High | ✅ Fixed |
| 5 | get_workflow no access control | High | ✅ Fixed |
| 6 | execute_workflow no workflow access check | High | ✅ Fixed |
| 7 | Debug routes lack ownership checks | High | ✅ Fixed |

---

### Fixes for Violations 5–7

5. **get_workflow** – Added `get_optional_user` and `ownership_service`; uses `get_workflow_and_assert_can_read_or_share` before returning. Handles `WorkflowForbiddenError` → 403.

6. **execute_workflow** – Added `ownership_service`; calls `get_workflow_and_assert_can_read_or_share` before `prepare_execution`.

7. **debug_routes** – Workflow-based: `validate_workflow`, `get_execution_history`, `get_workflow_stats` use `get_workflow_and_assert_can_read_or_share`. Execution-based: `get_execution_timeline`, `get_node_execution_details`, `export_execution` use `_assert_execution_owner(execution, current_user.id)`.

---

---

## Re-Review #2 (February 2026)

*Focused on remaining HIGH violations only*

### Previously Fixed (Verified)

All 7 ownership/IDOR violations (1–7) remain fixed. Routes use `WorkflowOwnershipService` consistently.

### Previously Identified HIGH Items from SOLID_DRY_BACKEND_ANALYSIS.md – Status

| Item | Original | Current Status |
|------|----------|----------------|
| **SRP: executor_v3.py** | ~600 lines, many responsibilities | **Addressed** – Refactored to 348 lines; extracted `workflow_graph_builder`, `ExecutionBroadcaster`, `NodeExecutorRegistry` |
| **SRP: unified_llm_agent.py** | ~1000 lines | **Addressed** – Refactored to 270 lines; uses `ProviderRegistry` strategy pattern |
| **SRP: settings_routes.py** | DB access in routes | **Addressed** – `save_llm_settings` and `get_llm_settings` delegate to `SettingsService` |
| **OCP: unified_llm_agent** | Provider if/elif chain | **Addressed** – Uses `ProviderRegistry.get(provider_type)` |
| **DIP: unified_llm_agent** | Depends on api.settings_routes | **Addressed** – Injects `settings_service`; fallback to `SettingsService()` only when not injected |
| **DRY: workflow_service** | Edge duplication | **Addressed** – `_process_edges`, `_to_dict`, `_serialize_node` shared |
| **DRY: unified_llm_agent** | Message building duplication | **Addressed** – Provider strategies encapsulate per-provider logic |

### New HIGH Violation Found

#### 8. Security: `like_workflow` has no access control (IDOR)

**Location:** `api/marketplace_routes.py` – `like_workflow` (lines 100–143)

**Issue:** Endpoint fetches workflow by ID and creates a like without checking if the user can read the workflow. Any authenticated user can like any workflow (including private workflows they do not own or have share access to) by guessing or enumerating workflow IDs. This is an IDOR.

**Fix:** Inject `WorkflowOwnershipServiceDep` and call `get_workflow_and_assert_can_read(workflow_id, current_user.id)` before creating the like. Use `assert_can_read` (owner or public) since users should only be able to like workflows they can discover/see.

**Applied:** `like_workflow` now injects `ownership_service` and calls `get_workflow_and_assert_can_read` before creating the like. `WorkflowNotFoundError` and `WorkflowForbiddenError` are handled by main.py exception handlers (404/403).

---

### Prioritized Actions (Re-Review #2)

| # | Violation | Severity | Status |
|---|-----------|----------|--------|
| 1–7 | (Previous ownership/IDOR fixes) | High | ✅ Fixed |
| 8 | like_workflow no access control | High | ✅ Fixed |

---

## Re-Review #3 (February 2026)

*Focused on remaining HIGH violations only*

### Scope

Verified all workflow/execution-accessing routes, SRP/OCP/DIP/DRY items from prior analysis, and marketplace endpoints.

### Ownership & Access Control – Verified

| Area | Status |
|------|--------|
| **workflow_routes** | `get_workflow`, `publish_workflow` use `ownership_service` |
| **execution_routes** | `execute_workflow` uses `get_workflow_and_assert_can_read_or_share`; `list_workflow_executions` uses `get_workflow_and_assert_owner`; `get_execution`, `get_execution_logs`, `download_execution_logs`, `cancel_execution` use `ExecutionService` with `user_id=current_user.id` |
| **sharing_routes** | All endpoints use `ownership_service` |
| **import_export_routes** | `export_workflow` uses `get_workflow_and_assert_can_read`; `export_all` filters by `owner_id` |
| **debug_routes** | Workflow endpoints use `get_workflow_and_assert_can_read_or_share`; execution endpoints use `_assert_execution_owner` |
| **workflow_chat** | `get_workflow_context` receives `ownership_service` and calls `assert_can_read_or_share` |
| **marketplace_routes** | `like_workflow` uses `get_workflow_and_assert_can_read`; `discover`, `trending` filter by `is_public`/`is_template`; `unlike_workflow` only updates user's own like; `get_my_liked_workflows` returns workflows from user's like records (no IDOR) |
| **websocket_routes** | `_verify_websocket_auth_and_ownership` checks `execution.user_id == user.id` |
| **template_routes** | Templates are public; `delete_template` checks `author_id` or `is_admin` |

### SOLID/DRY – Verified

| Item | Status |
|------|--------|
| **SRP** | executor_v3 (348 lines), unified_llm_agent (270), settings_routes (183), workflow_service (343) – reasonable; settings delegates to `SettingsService` |
| **OCP** | unified_llm_agent uses `ProviderRegistry`; settings_routes uses `_LLM_TEST_REGISTRY` |
| **DIP** | unified_llm_agent injects `settings_service` |
| **DRY** | workflow_service uses `_process_edges`, `_to_dict`, `_serialize_node`; ownership centralized in `WorkflowOwnershipService` |

### Result

**No new HIGH violations found.** All 8 prior violations remain fixed. Ownership checks are consistent across workflow and execution endpoints.

---

## Related

- [SOLID_DRY_BACKEND_ANALYSIS.md](./SOLID_DRY_BACKEND_ANALYSIS.md) – Broader analysis; many items already addressed
- [JAVA_BACKEND_SOLID_DRY_REVIEW.md](./JAVA_BACKEND_SOLID_DRY_REVIEW.md) – Java backend patterns to mirror (e.g. `WorkflowOwnershipService`)
