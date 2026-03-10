# Java Backend – MEDIUM Issues Review (February 2026)

*Focused review for MEDIUM severity only*

---

## Summary

| Category   | Count |
|------------|-------|
| DRY        | 1     |
| Security   | 1     |
| Consistency| 2     |
| HTTP Semantics | 1 |

**Total MEDIUM issues:** 5

---

## Previously Fixed (Verified)

| Area | Status |
|------|--------|
| ContentDispositionUtils | Filename escaping for `\` and `"` |
| LlmTestService | URL encoding for `model` and `apiKey` in Gemini URL |
| Template use | `POST /api/templates/*/use` requires auth; uses `extractUserIdRequired` |
| Auth parameter naming | Standardized to `authentication` across controllers |
| Password reset | Configurable `password-reset.base-url`; production warning for return-token |
| ErrorMessages | Centralized constants (SETTINGS_SAVED_SUCCESS, CONNECTED_SUCCESSFULLY, etc.) |
| AuthController.me | Returns JSON via `ErrorResponseBuilder.unauthorized()` |
| ImportExportController | Uses ContentDispositionUtils, EXPORT_ALL_FILENAME, extractUsernameNullable |

---

## 1. HTTP Semantics – LLM Test Error Status

**File:** `SettingsController.java` lines 75–77  
**Issue:** When `LlmTestService.testProvider()` returns an error map (`status: "error"`), the controller returns `ResponseEntity.ok(result)` (HTTP 200). Only the `catch` block returns 422.  
**Impact:** Clients cannot distinguish success from failure by status code; they must parse the response body.  
**Recommendation:** Check `result.get("status")` and return `ResponseEntity.unprocessableEntity().body(result)` when status is `"error"`.

---

## 2. Security – JSON Injection in LLM Test Payload

**File:** `LlmTestService.java` line 95  
**Issue:** `buildOpenAiCompatiblePayload(model, maxTokens)` concatenates `model` directly into JSON: `"{\"model\":\"" + model + "\",...}"`. If `model` contains `"` or `\`, the JSON is malformed or can break structure.  
**Risk:** Low–medium; model names are typically alphanumeric, but user input should be escaped.  
**Recommendation:** Use `ObjectMapper.writeValueAsString()` or escape `model` for JSON (e.g. `\"` → `\\\"`, `\` → `\\\\`), or use a proper JSON builder.

---

## 3. Consistency – Exception Types for User Input Validation

**Issue:** Similar validation failures use different exception types:

| Exception Type       | Usage |
|----------------------|-------|
| ValidationException  | ImportValidator, ImportParser, PasswordResetService, AuthService, WorkflowService, TokenService |
| IllegalArgumentException | WorkflowDefinitionValidator, NodeExecutorRegistry, ExecutionService, WebClientLlmApiClient, ExecutionCreationService |
| IllegalStateException | AgentNodeExecutor, LlmConfigUtils, SecurityConfig, JwtSecretValidator |

**Recommendation:** Prefer `ValidationException` for user-provided input validation (e.g. workflow definition, import data). Use `IllegalArgumentException` for internal/API contract violations, `IllegalStateException` for config/bootstrap.  
**Candidates to change:** `WorkflowDefinitionValidator` (workflow definition is user input) – throw `ValidationException` instead of `IllegalArgumentException`.

---

## 4. Consistency – extractUserIdNullable vs extractUserIdRequired

**File:** `ImportExportController.java` lines 38–39, 50–51, 58–59  
**Issue:** `exportWorkflow`, `importWorkflow`, and `importFile` use `extractUserIdNullable`. These endpoints are under `anyRequest().authenticated()`, so auth is required. Using nullable is inconsistent with `exportAll`, which uses `extractUserIdRequired`.  
**Recommendation:** Use `extractUserIdRequired` for import/export endpoints if auth is always required, or document why nullable is needed (e.g. future anonymous import).

---

## 5. DRY – Duplicate JSON Building in LlmTestService

**File:** `LlmTestService.java` lines 94–99  
**Issue:** `buildOpenAiCompatiblePayload` and `buildGeminiPayload` manually construct JSON strings. This is fragile (no escaping) and duplicates pattern.  
**Recommendation:** Use `ObjectMapper` or a small JSON builder utility to construct payloads safely. Alternatively, introduce a DTO and serialize with Jackson.

---

## Files to Update

| File | Issues |
|------|--------|
| `SettingsController.java` | 1 (LLM test error status) |
| `LlmTestService.java` | 2 (JSON injection), 5 (DRY payload building) |
| `WorkflowDefinitionValidator.java` | 3 (ValidationException) |
| `ImportExportController.java` | 4 (extractUserIdRequired) |

---

## Conclusion

The backend is in good shape. Remaining MEDIUM items are incremental improvements. Highest impact:

1. **LLM test error status** – Return 422 when test fails so clients can rely on HTTP status.
2. **JSON injection in model** – Escape or use proper serialization for the LLM test payload.
3. **Exception consistency** – Use `ValidationException` for workflow definition validation.
