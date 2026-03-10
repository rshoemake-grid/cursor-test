# Java Backend – Code Review (June 2026)

*Fresh review after MEDIUM violations fixes*

---

## Summary

**HIGH severity:** None.

**MEDIUM severity:** 6 items (incremental improvements).

---

## Verified Fixes (Applied)

| Area | Status |
|------|--------|
| SettingsController | Uses `SETTINGS_SAVED_SUCCESS`, `LLM_TEST_REQUIRED_FIELDS`; LLM test failure returns 422 |
| LlmTestService | Uses `CONNECTED_SUCCESSFULLY` |
| PasswordResetService | Uses `PASSWORD_RESET_*` constants; production warning for `return-token-in-response` |
| AuthController | 401 uses `ErrorResponseBuilder.unauthorized()` (JSON) |
| ImportExportController | Uses `ContentDispositionUtils`, `extractUsernameNullable`, `EXPORT_ALL_FILENAME` |
| ContentDispositionUtils | Centralized header building |
| Exception leakage | Generic handler uses `UNEXPECTED_ERROR`; execution state uses `EXECUTION_FAILED` |

---

## MEDIUM Severity Issues

### 1. Content-Disposition filename escaping

**File:** `ContentDispositionUtils.java`  
**Issue:** Filename is embedded without escaping. If it contains `"` or `\`, the header can be malformed.  
**Risk:** Low – callers use sanitized or UUID-based filenames.  
**Recommendation:** Escape `\` and `"` in the filename.

### 2. LlmTestService URL encoding

**File:** `LlmTestService.java` line 71  
**Issue:** `model` and `apiKey` are concatenated into the URL without encoding.  
**Risk:** Special characters can break the URL or cause injection.  
**Recommendation:** Use `URLEncoder.encode()` for query parameters.

### 3. Template use without auth

**Files:** `SecurityConfig.java`, `TemplateController.java`  
**Issue:** `POST /api/templates/{id}/use` is `permitAll()`; `extractUserIdNullable` can return null; workflows created with `ownerId = null`.  
**Risk:** Orphan workflows, possible resource exhaustion.  
**Recommendation:** Require auth for template use, or document and accept anonymous use.

### 4. Inconsistent authentication parameter naming

**Issue:** Controllers use both `Authentication authentication` and `Authentication auth`.  
**Recommendation:** Standardize on one name (e.g. `authentication`).

### 5. Inconsistent exception types for validation

**Issue:** Similar validation failures use `ValidationException`, `IllegalArgumentException`, or `IllegalStateException`.  
**Recommendation:** Prefer `ValidationException` for user input; document in coding standards.

### 6. Password reset URL (dev mode)

**File:** `PasswordResetService.java`  
**Issue:** `reset_url` is hardcoded as relative path `"/reset-password?token=" + resetToken`.  
**Recommendation:** Add configurable base URL (e.g. `password-reset.base-url`) for dev when `return-token-in-response` is enabled.

---

## Conclusion

The backend is in good shape. No HIGH severity issues. MEDIUM items are incremental improvements. Highest impact:

1. Template use auth – clarify or restrict anonymous template use  
2. LlmTestService URL encoding – avoid injection and malformed URLs  
3. Content-Disposition escaping – harden the shared utility
