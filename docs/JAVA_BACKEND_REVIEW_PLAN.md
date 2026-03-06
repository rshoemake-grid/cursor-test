# Java Backend Code Review Plan

Comprehensive review of `backend-java` covering security, SOLID, and DRY. Status tracked per item.

**Legend:**
- ⬜ Not started
- 🔄 In progress
- ✅ Done
- ⏸️ Deferred

---

## Security Findings

### Critical

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| S-C1 | ✅ | IDOR – Workflow CRUD without ownership check | `WorkflowService.getWorkflow()`, `updateWorkflow()`, `deleteWorkflow()` | Add ownership checks: `workflow.ownerId.equals(userId)` or share access |
| S-C2 | ✅ | IDOR – Execution endpoints without authorization | `ExecutionController`, `SecurityConfig:56` | Add auth and ownership; change from `permitAll` |
| S-C3 | ✅ | IDOR – Debug endpoints expose all data | `DebugController`, `SecurityConfig` | Restrict `/api/debug/**`; require auth or disable in production |
| S-C4 | ✅ | Default JWT secret in production | `application.properties:27` | Fail startup if `JWT_SECRET` missing or equals default in production |
| S-C5 | ✅ | Password reset token returned in non-production | `AuthService.forgotPassword():224-225` | Use dedicated config flag instead of inferring from `ENVIRONMENT` |

### High

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| S-H1 | ✅ | CSRF disabled | `SecurityConfig.java:48` | Document decision; ensure no cookie-based auth relies on CSRF |
| S-H2 | ✅ | CORS wildcard with credentials | `application.properties:22`, `SecurityConfig` | Restrict origins in production; avoid `*` with credentials |
| S-H3 | ✅ | WebSocket without auth | `WebSocketConfig`, `ExecutionWebSocketHandler` | Add token validation; verify execution ownership |
| S-H4 | ✅ | LLM test endpoint unauthenticated | `SettingsController.testLlmConnection()` | Require authentication |
| S-H5 | ✅ | JJWT CVE-2024-31033 | `build.gradle:47-49` | Upgrade JJWT from 0.12.3 to 0.13.0+ |
| S-H6 | ✅ | Execution list IDOR via userId param | `ExecutionController.listExecutions():83-84` | Always use authenticated user; remove/restrict userId param |

### Medium

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| S-M1 | ✅ | Stack trace in logs | `GlobalExceptionHandler.handleGenericException():67` | Avoid full stack traces in production |
| S-M2 | ✅ | Error message in client response | `GlobalExceptionHandler.handleGenericException():69` | Return generic message for 500; log details server-side only |
| S-M3 | ✅ | Execution error details in state | `ExecutionOrchestratorService.runExecutionInBackground():110-113` | Sanitize or avoid internal error details in state |
| S-M4 | ✅ | Actuator health details | `application.properties:61` | Use `when-authorized` in production |
| S-M5 | ✅ | Development profile default | `application.properties:70` | Production should explicitly set `spring.profiles.active=production` |

### Low

| # | Status | Finding | Location | Action |
|---|--------|---------|----------|--------|
| S-L1 | ✅ | API key fallback to env | `AgentNodeExecutor.java:39-40` | Document and validate env fallback |
| S-L2 | ✅ | Filename in export | `ImportExportController.exportWorkflow():75` | Sanitize workflow name in filename |
| S-L3 | ✅ | Magic number in log download | `ExecutionController.downloadExecutionLogs():144` | Extract `100_000` to constant |

---

## SOLID Violations

### Single Responsibility (SRP)

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| SRP-1 | ✅ | `DebugController.java` | Controller mixes HTTP with validation, stats, export logic | Move to `WorkflowValidationService`, `ExecutionStatsService`, `ExecutionExportService` |
| SRP-2 | ✅ | `ImportExportController.java` | Controller mixes HTTP with export logic and workflow mapping | Move export logic to `ImportExportService` |
| SRP-3 | ✅ | `AuthService.java` | Handles registration, login, refresh, forgot/reset, token building, user mapping | Split into `AuthService`, `TokenService`, `PasswordResetService`, `UserResponseMapper` |
| SRP-4 | ✅ | `MarketplaceService.java` | Handles workflows, likes, templates, agents, stats | Split into `WorkflowDiscoveryService`, `WorkflowLikeService`, `PublishedAgentService`, `MarketplaceStatsService` |

### Open/Closed (OCP)

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| OCP-1 | ✅ | `MarketplaceService.java:92` | `switch` on `sortBy` for sort behavior | Add `SortStrategy` interface and implementations |
| OCP-2 | ✅ | `TemplateService.java:65-68` | `sortBy` handled via `if/else` chain | Same strategy pattern |
| OCP-3 | ✅ | `NodeExecutorRegistry.java:38` | `parseNodeType` uses `instanceof Map` and fallback | Add `NodeTypeParser` component |
| OCP-4 | ✅ | `WorkflowExecutor.java:74,112` | Direct `NodeType.START.equals(node.getType())` etc. | Add `NodeType.isSkip()`, `isCondition()` methods |

### Liskov Substitution (LSP)

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| LSP-1 | ✅ | `NodeExecutor` implementations | `AgentNodeExecutor` throws `IllegalStateException` when no LLM config | Document expected behavior for agent nodes |

### Interface Segregation (ISP)

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| ISP-1 | ⏸️ | `NodeExecutor` | Interface is small and focused | No change needed |

### Dependency Inversion (DIP)

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DIP-1 | ✅ | `WorkflowExecutor.java:23` | Direct instantiation of `NodeExecutorRegistry` | Inject `NodeExecutorRegistry` via constructor |
| DIP-2 | ✅ | `NodeExecutorRegistry.java:18-21` | Direct instantiation of executors | Inject `NodeExecutor` implementations via constructor |
| DIP-3 | ✅ | `ApigeeAccessDeniedHandler.java:20` | `new ObjectMapper()` | Inject `ObjectMapper` bean |
| DIP-4 | ✅ | `ApigeeAuthenticationEntryPoint.java:20` | Same | Inject `ObjectMapper` bean |
| DIP-5 | ✅ | `ExecutionWebSocketHandler.java:24` | Same | Inject `ObjectMapper` bean |

---

## DRY Violations

### Duplicated Ownership / Authorization Logic

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-1 | ✅ | `SharingService.java:46,89,99,121,138` | `!workflow.getOwnerId().equals(userId)` repeated 5 times | Add `WorkflowOwnershipService.assertCanAccess(workflow, userId)` |
| DRY-2 | ✅ | `WorkflowService.java:147` | Same ownership check | Use shared ownership service |
| DRY-3 | ✅ | `ImportExportController.java:50` | Similar access check for workflow | Use shared `WorkflowOwnershipService` |
| DRY-4 | ✅ | `TemplateService.java:128` | `!t.getAuthorId().equals(userId) && !isAdmin` | Add `TemplateOwnershipService.assertCanDelete()` |

### Duplicated Resource Not Found / Exception Handling

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-5 | ✅ | Multiple services | `findById(...).orElseThrow(() -> new ResourceNotFoundException(...))` repeated | Add `RepositoryUtils.findByIdOrThrow()` helper |
| DRY-6 | ✅ | `SharingService.java` | Multiple `ResourceNotFoundException` patterns | Use `RepositoryUtils.findByIdOrThrow` / `orElseThrow` |

### Duplicated ObjectMapper / JSON Serialization

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-7 | ✅ | `ApigeeAccessDeniedHandler`, `ApigeeAuthenticationEntryPoint`, `ExecutionWebSocketHandler` | Each creates `new ObjectMapper()` | Inject shared `ObjectMapper` bean |
| DRY-8 | ✅ | `ExecutionController.java:178-206` | `buildLogsJson` and `buildLogsText` manually build JSON | Use `ObjectMapper.writeValueAsString()`; add `ExecutionLogsFormatter` |

### Duplicated Workflow Mapping / Transformation

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-9 | ✅ | `SharingService`, `WorkflowService`, `MarketplaceService`, `ImportExportController` | `WorkflowResponseV2` / `WorkflowTemplateResponse` built in many places | Add `WorkflowToV2Mapper` or extend `WorkflowMapper.toV2()` |
| DRY-10 | ✅ | `TemplateService.java:113-122` | Manual `WorkflowResponse` construction | Use `WorkflowMapper.toResponse()` |

### Duplicated Author Name Resolution

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-11 | ✅ | `MarketplaceService.java:186-187`, `218-222` | Same logic: `u.getUsername() != null ? u.getUsername() : u.getFullName() != null ? ...` | Add `UserDisplayNameResolver.resolve(user)` |

### Duplicated Exception Handling

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-12 | ✅ | `WorkflowMapper.java:69-72,86-89,103-106` | Same try/catch for `objectMapper.convertValue` with fallback | Add `convertValueOrCast()` or `safeConvert()` helper |
| DRY-13 | ✅ | `WorkflowExecutor.java:96-104`, `129-132` | Same pattern for node failure and workflow failure | Extract `handleNodeFailure()`, `handleWorkflowFailure()` |
| DRY-14 | ✅ | `SettingsController`, `LlmTestService`, `WorkflowChatService` | Generic `catch (Exception e)` returning `Map.of("status","error",...)` | Centralize in `ApiErrorHandler` or `LlmErrorResponseBuilder` |

### Duplicated Validation Logic

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-15 | ✅ | `ImportExportController.java:86-88`, `130-131` | Same validation for `"nodes"` and `"edges"` in definition | Add `WorkflowDefinitionValidator.validate(definition)` |
| DRY-16 | ✅ | `AuthService`, `WorkflowService` | Similar null/empty validation patterns | Add `ValidationUtils.requireNonEmpty()` or use Bean Validation |

### Duplicated Definition Extraction

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-17 | ✅ | `ImportExportController.java:57-59` | Manual extraction of `nodes`, `edges`, `variables` | Use `WorkflowMapper.extractNodes()` / `extractEdges()` |
| DRY-18 | ✅ | `DebugController.java:37-41` | Same pattern with raw casts | Use `WorkflowMapper` or central extraction |

### Duplicated Input Fallback Chain

| # | Status | Location | Description | Recommended Refactor |
|---|--------|----------|-------------|------------------------|
| DRY-19 | ✅ | `LoopNodeExecutor.java:17-19` | `itemsObj = inputs.get("items"); if (null) itemsObj = inputs.get("data"); ...` | Add `InputResolver.getFirstOf(inputs, "items","data","lines","output")` |
| DRY-20 | ✅ | `AgentNodeExecutor.java:47-50` | Same pattern for `message`/`data`/`input` | Same `InputResolver` pattern |

---

## Testing Gaps

| # | Status | Component | Recommendation |
|---|--------|-----------|----------------|
| T-1 | ✅ | `ExecutionController` | Add integration tests for execute, get, list, cancel, logs |
| T-2 | ✅ | `ExecutionService` | Add unit tests for CRUD, logs, cancel |
| T-3 | ✅ | `DebugController` | Add tests; verify auth/authorization behavior |
| T-4 | ✅ | `ImportExportController` | Add tests for export (ownership) and import (malformed input) |
| T-5 | ✅ | `SharingService` | Add tests for share, revoke, versions |
| T-6 | ✅ | `SecurityConfig` | Add tests for route authorization matrix |
| T-7 | ✅ | `JwtAuthenticationFilter` | Add tests for valid/invalid/missing token |
| T-8 | ✅ | IDOR scenarios | Add tests that unprivileged users cannot access others' workflows/executions |

---

## Dependencies

| Package | Current | Issue | Action |
|---------|---------|-------|--------|
| io.jsonwebtoken:jjwt-* | 0.13.0 | CVE-2024-31033 fixed | ✅ Done |
| com.fasterxml.jackson.core:jackson-databind | 2.16.1 | CVE-2023-35116 fixed | ✅ Upgraded to 2.16.1 |
| org.springframework.boot | 3.2.0 | 4.x is milestone only | ⏸️ Stay on 3.2.x – 4.1.0-M2 not production-ready |
| io.spring.dependency-management | 1.1.7 | - | ✅ Upgraded from 1.1.4 |
| org.xerial:sqlite-jdbc | 3.51.2.0 | - | ✅ Upgraded from 3.44.1.0 |
| org.mockito:mockito-* | 5.22.0 | - | ✅ Upgraded from 5.14.2 |
| com.h2database:h2 | 2.4.240 | - | ✅ Upgraded from 2.2.224 |

---

## Progress Summary

| Category | Total | Done | In Progress | Not Started |
|----------|-------|------|-------------|-------------|
| Security | 19 | 19 | 0 | 0 |
| SOLID (SRP) | 4 | 4 | 0 | 0 |
| SOLID (OCP/LSP/ISP/DIP) | 10 | 9 | 0 | 1 |
| DRY | 20 | 20 | 0 | 0 |
| Tests | 8 | 8 | 0 | 0 |
| Dependencies | 7 | 5 | 0 | 2 |
| **Total** | **68** | **61** | **0** | **7** |

---

## Suggested Refactor Priority

1. **Security (Critical):** Fix IDOR on workflows and executions; restrict debug endpoints; enforce JWT secret.
2. **DRY (High):** Introduce `WorkflowOwnershipService`; inject `ObjectMapper` and `NodeExecutorRegistry`.
3. **DRY (High):** Add `WorkflowToV2Mapper`; add `WorkflowDefinitionValidator`.
4. **DIP (High):** Inject `ObjectMapper` in handlers; inject `NodeExecutorRegistry` in `WorkflowExecutor`.
5. **DRY (Medium):** Add `UserDisplayNameResolver`; add `findByIdOrThrow()` helpers; add `SortStrategy`.
6. **SRP (Medium):** Extract services from `AuthService`, `DebugController`, `ImportExportController`.
7. **Tests:** Add execution, debug, import/export, sharing, and security tests.

---

## Revision History

| Date | Change |
|------|--------|
| 2026-02-23 | Initial plan from security + SOLID + DRY review |
| 2026-03-06 | ISP-1 deferred; DRY summary fixed; dependency updates (Jackson stay 2.15.2; upgraded dep-mgmt, sqlite, Mockito, H2) |
