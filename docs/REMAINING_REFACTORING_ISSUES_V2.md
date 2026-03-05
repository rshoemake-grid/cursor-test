# Remaining Refactoring Issues - Second Analysis

## Summary
After second analysis, found **2 additional issues**. Both have been **RESOLVED** (March 2026).

---

## ✅ Resolved Issues

### 1. Magic Strings: ExecutionStatus in debug_routes.py
**Location**: `backend/api/debug_routes.py:261-263`
**Status**: **RESOLVED**
- Uses `ExecutionStatus.COMPLETED.value` and `ExecutionStatus.FAILED.value` (not magic strings)

---

### 2. Direct Database Access in workflow_chat_routes.py
**Location**: `backend/api/workflow_chat/` (refactored from workflow_chat_routes.py)
**Status**: **RESOLVED**
- `workflow_chat/routes.py` uses `settings_service.get_user_settings()` and `settings_service.get_active_llm_config()` via dependency injection
- `workflow_chat/context.py` queries `WorkflowDB` for workflow definition (appropriate - workflow data, not settings)
- Architecture layers respected: settings via SettingsService, workflow data via DB/repository

---

## Additional Fixes (March 2026)

- **DIP in unified_llm_agent**: Injects `settings_service` when `provider_resolver` not set; ExecutionOrchestrator passes both to executor
- **DRY in workflow_service**: Added `_to_dict()` helper; `_serialize_node` and `_process_edges` use it
- **Deprecated helpers**: `get_active_llm_config`, `get_provider_for_model`, `get_user_settings` already accept optional `settings_service`
