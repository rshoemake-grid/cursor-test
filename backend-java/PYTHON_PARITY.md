# Python ↔ Java backend parity (living checklist)

**Source of truth:** `backend/` (FastAPI). **Java target:** `backend-java/` (Spring Boot).

**How to use:** When you change either backend, update the relevant row and bump **Last reviewed**. For **Partial** / **Gap** items, link a PR or issue in the Notes column (optional).

**Last reviewed:** 2026-04-16

**Maintainers:** Update this file when adding or changing API routes, executors, or workflow-chat behavior on either backend. Prefer linking to the PR that closed a **Gap** or promoted **Partial → Match**.

---

## 1. HTTP API (`/api` prefix)

| Check | Python | Java | Status | Notes |
|-------|--------|------|--------|-------|
| Workflows CRUD + publish + bulk-delete | `api/routes/workflow_routes.py` | `WorkflowController` | Match | |
| Execute + executions + logs + cancel + running | `api/routes/execution_routes.py` | `ExecutionController` | Match | RUNNING DB snapshots: `execution.state-persist-interval-sec` / `EXECUTION_STATE_PERSIST_INTERVAL_SEC` |
| Auth (register, login, `/token`, refresh, forgot/reset, `/me`) | `api/auth_routes.py` | `AuthController` | Match | |
| Settings LLM GET/POST/test | `api/settings_routes.py` | `SettingsController` | Match | |
| Marketplace | `api/marketplace_routes.py` | `MarketplaceController` | Match | |
| Templates | `api/template_routes.py` | `TemplateController` | Match | |
| Sharing + versions | `api/sharing_routes.py` | `SharingController` | Match | |
| Import/export | `api/import_export_routes.py` | `ImportExportController` | Match | |
| Workflow chat | `api/workflow_chat/routes.py` | `WorkflowChatController` | Match | |
| Debug | `api/debug_routes.py` | `DebugController` | Match | |
| Storage explorer | `api/storage_explorer_routes.py` | `StorageExplorerController` | Match | |
| Health | `GET /health` | `HealthController` | Match | `timestamp` is UTC ISO-8601 (`Instant`) |
| Metrics | `GET /metrics` | `MetricsController` | Match | Includes `last_reset`; `MetricsCollector.reset()` mirrors Python |

---

## 2. WebSocket

| Check | Python | Java | Status | Notes |
|-------|--------|------|--------|-------|
| Path | `/ws/executions/{execution_id}` | `/ws/executions/*` | Match | No `/api` prefix |
| JWT query + ownership | `api/websocket_routes.py` | `WebSocketAuthHandshakeInterceptor` + `ExecutionService.canOpenExecutionStream` | Match | Guest run: `execution.userId` null → workflow `owner_id` may stream (Python parity) |
| Message types | `websocket/manager.py` (`status`, `node_update`, `log`, `completion`, `error`) | `ExecutionWebSocketHandler` | Match | Timestamp: string of JVM uptime seconds (Python: `str(loop.time())`) |

---

## 3. Node types & registry

| Check | Python | Java | Status | Notes |
|-------|--------|------|--------|-------|
| Enum values | `models/schemas.py` `NodeType` | `dto/NodeType.java` | Match | |
| Registry (agent/condition/loop, tool, start/end, storage ×4) | `engine/nodes/node_executor_registry.py` | `NodeExecutorRegistry` + executors | Match | |

---

## 4. Storage / local filesystem read

| Check | Python | Java | Status | Notes |
|-------|--------|------|--------|-------|
| `read_mode`: `full`, `lines`, `batch`, `tail` | `inputs/local_file_read_modes.py` | `storage/LocalFileReadModes.java` + `WorkflowInputSourceService` | Match | See tests |
| Directory + `file_pattern` read | `input_sources.py` `LocalFileSystemHandler.read` | `WorkflowInputSourceService.readLocal` | Match | Traversal checks under base |
| Lines/batch executor output shape (`data`, `items`, `source`, …) | `engine/nodes/storage_node_executor.py` `_read_mode_output` | `StorageNodeExecutor.wrapReadOutput` | Match | |
| Variable substitution in config | `resolve_config_variables` | `ConfigVariableResolver` | Match | |
| GCS / S3 / Pub/Sub I/O | `input_sources.py` | `WorkflowInputSourceService` + `CloudInputSourceReadSupport` | Match | Missing GCS object → `FileNotFoundException` (404); bucket list capped (10k); S3 list paginated + capped; `NoSuchKey` → `FileNotFoundError` parity; Pub/Sub resource-not-found → `[]` like Python |

---

## 5. Execution engine

| Check | Python | Java | Status | Notes |
|-------|--------|------|--------|-------|
| DAG / parallelism | `WorkflowExecutorV3` (async) | `WorkflowExecutor` (thread pool + parallel batch) | Match | Wavefront scheduling + `asyncio.gather`-style await of full batch; per-node `NODE_EXECUTION_TIMEOUT_SEC` / `workflow.node-execution-timeout-sec` (Python `await_with_node_timeout`); fail detail uses node error text |
| WebSocket payloads | `websocket/manager.py` + `execution_broadcaster.py` | `ExecutionWebSocketHandler` + `WorkflowExecutor` | Match | Orchestrator uses DB `executionId` + `stream_updates=true`; `WebSocketExecutionStreamBroadcaster` |
| Persisted execution `state` JSON | `ExecutionState` in `schemas.py` | `ExecutionState.toStateMap()` | Match | `execution_id`, `workflow_id`, `variables`, `started_at`, `completed_at` + existing fields |

---

## 6. Workflow chat

| Check | Python | Java | Status | Notes |
|-------|--------|------|--------|-------|
| Tools + loop + iteration cap | `workflow_chat/*` | `WorkflowChatService` + `WorkflowChatToolDispatcher` | Match | |
| Apply/persist | `apply_chat_changes` | `WorkflowService.applyChatChanges` / `ChatChangesService` | Match | |
| LLM provider matrix | Multiple providers (`unified_llm_agent`, provider strategies) | `SettingsService.getProviderConfigForModel`, `AgentNodeExecutor` (type switch), `WebClientLlmApiClient` (OpenAI / Anthropic / Gemini) | Match | Agent nodes: per-type HTTP. Chat: `getLlmConfigForWorkflowChat` + top-level `default_model` in `getActiveLlmConfig` (Python parity); tools loop uses OpenAI-compatible `chat/completions` like Python `AsyncOpenAI` factory. |

---

## 7. Cross-cutting

| Check | Python | Java | Status | Notes |
|-------|--------|------|--------|-------|
| Request size limit / gzip / security headers | `main.py` middleware | `ApigeeFilter` + `server.compression` + Tomcat | Match | Filter order fixed (`ApigeeFilter` before `MetricsFilter`); 413 uses `ErrorResponseBuilder` (`detail` + `error`) |
| Structured errors | FastAPI handlers (`detail` + `error` object) | `ErrorResponseBuilder` / `GlobalExceptionHandler` | Match | Top-level `detail` string mirrors Python alongside nested `error` |
| OpenAPI | Auto | Springdoc (`/api-docs`) | Match | Contract guard: `OpenApiContractTest` asserts OpenAPI 3.x + core paths (`/api/workflows`, executions, workflow-chat, settings, auth, health, metrics) |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-16 | Initial checklist. Added `LocalFileReadModes` (`full` / `lines` / `batch` / `tail` + `tail_follow`), directory reads with `file_pattern`, `encoding` on local reads, and `StorageNodeExecutor` output shaping for `lines`/`batch`/`tail` to mirror Python `storage_node_executor.py`. |
| 2026-04-16 | Health `timestamp` → UTC `Instant` ISO-8601. Metrics: `last_reset`, `reset()`. WebSocket: Python-shaped `broadcastStatus` / `broadcastNodeUpdate` / `broadcastLog` / `broadcastCompletion` / `broadcastError` (replaced generic envelope). Tests: `MetricsCollectorTest`, `ExecutionWebSocketHandlerTest`. |
| 2026-04-16 | `ExecutionStreamBroadcaster` + `WebSocketExecutionStreamBroadcaster`; `WorkflowExecutor.execute(executionId, …, streamUpdates)` mirrors Python `ExecutionBroadcaster` (status, logs, node updates, completion / error). `ExecutionOrchestratorService` passes real `executionId` and `streamUpdates=true`. Tests: `WorkflowExecutorStreamingTest`. |
| 2026-04-16 | RUNNING execution DB heartbeat: `WorkflowExecutor.peekRunningStateSnapshot`, `ExecutionService.updateRunningExecutionSnapshot`, daemon thread in `ExecutionOrchestratorService` (config mirrors Python). Tests: `ExecutionServiceTest`, `WorkflowExecutorPersistPeekTest`. |
| 2026-04-16 | `ExecutionState.toStateMap()` aligned with Python `ExecutionState` JSON (`execution_id`, `workflow_id`, `variables`, timestamps). Test: `ExecutionStateTest`. |
| 2026-04-16 | WebSocket stream auth: `canOpenExecutionStream` (workflow owner when execution has no `userId`). Tests: `ExecutionServiceTest`, `WebSocketAuthHandshakeInterceptorTest`. |
| 2026-04-16 | API errors: `ErrorResponseBuilder` adds top-level `detail` (same string as `error.message`) for Python/FastAPI JSON parity. |
| 2026-04-16 | `ApigeeFilter`: `@Order` overflow fix (runs before `MetricsFilter`); 413 payload via `ErrorResponseBuilder`; tests `ApigeeFilterTest`. |
| 2026-04-16 | LLM provider matrix: `SettingsService.getProviderConfigForModel`, `AgentNodeExecutor` routes `openai`/`custom` vs `anthropic` vs `gemini`; `WebClientLlmApiClient` Messages + `generateContent`; `LlmConfigUtils` `ANTHROPIC_API_KEY` / type-aware env fallback. Tests: `SettingsServiceTest`, `AgentNodeExecutorTest`, `WebClientLlmApiClientTest`, `LlmConfigUtilsTest`. |
| 2026-04-16 | Workflow chat LLM resolution: `SettingsService.getLlmConfigForWorkflowChat` (`chat_assistant_model`); `getActiveLlmConfig` prefers top-level `default_model` / `defaultModel` when that model exists on an enabled provider. `WorkflowChatService.chat` uses `getLlmConfigForWorkflowChat`. Tests: `SettingsServiceTest`, `WorkflowChatServiceTest`. |
| 2026-04-16 | OpenAPI parity guard: `OpenApiContractTest` validates Springdoc `/api-docs` (OpenAPI 3.x + required path templates). |
| 2026-04-16 | Cloud input sources: `CloudInputSourceReadSupport` (GCS 404 → `FileNotFoundException`, list cap 10k; S3 pagination + cap, `NoSuchKey` mapping; Pub/Sub catch not-found → empty list). Tests: `CloudInputSourceReadSupportTest`. |
| 2026-04-16 | DAG executor: parallel batch awaits all futures before applying state (Python `gather`); `NodeExecutionTimeout` + env `NODE_EXECUTION_TIMEOUT_SEC` / property `workflow.node-execution-timeout-sec`. Tests: `NodeExecutionTimeoutTest`, `WorkflowExecutorTest`. |
