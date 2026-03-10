# Java Backend – HIGH Severity Review (February 2026)

*Focused review for HIGH severity issues only*

---

## Summary

**HIGH severity:** 1 item (remaining).

**Previously fixed:** H1 (JwtUtil NPE), H3 (Content-Disposition CRLF), H4 (401 vs 403).

---

## Verified Fixes (Applied)

| Issue | File | Status |
|-------|------|--------|
| H1 JwtUtil NPE | JwtUtil.java | Fixed – `extractedUsername != null &&` check added |
| H3 Content-Disposition CRLF | ContentDispositionUtils.java | Fixed – `\r` and `\n` stripped before escaping |
| H4 401 vs 403 | AuthenticationHelper, GlobalExceptionHandler | Fixed – `UnauthorizedException` for auth required |

---

## Remaining HIGH Issue

### H2. AuthController `/token` Endpoint – Blank Credentials Not Rejected Early

**File:** `AuthController.java` lines 70–80

**Issue:** The `/token` endpoint (OAuth2 form-urlencoded login) does not validate that `username` and `password` are non-blank before calling `authService.login()`. `AuthService.login()` checks for `null` but not for blank strings. Empty strings (`""`) are passed through; `AuthenticationManager.authenticate()` will eventually fail with 401, but there is no explicit early validation or 400 for blank credentials.

**Impact:** Low–medium. Functionally, blank credentials still fail. However:
- No early 400 for obviously invalid input
- Slightly more load on `AuthenticationManager` for invalid requests
- Inconsistent with `/login` (JSON), which uses `@Valid` on `LoginRequest`

**Recommendation:** Add validation before calling `authService.login()`:

```java
if (username == null || username.isBlank() || password == null || password.isBlank()) {
    throw new ValidationException(ErrorMessages.USERNAME_PASSWORD_REQUIRED);
}
```

---

## No Other HIGH Issues Found

Review covered:

- **Security:** JWT validation (NPE fixed), auth flow, ownership checks, CORS, Content-Disposition
- **Correctness:** Exception handling, null safety, repository usage (parameterized queries)
- **Data integrity:** No raw SQL; Spring Data JPA used with parameters
- **IDOR:** Ownership enforced via `WorkflowOwnershipService`, `ExecutionOwnershipChecker`, etc.
- **Error leakage:** Generic handler uses `UNEXPECTED_ERROR`; domain exceptions use controlled messages

---

## Conclusion

One HIGH item remains: early validation of blank credentials on the `/token` endpoint. All other previously identified HIGH issues have been addressed.
