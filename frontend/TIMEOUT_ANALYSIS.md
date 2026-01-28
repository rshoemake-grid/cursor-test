# Timeout Analysis and Recommendations

**Date:** January 26, 2026  
**Purpose:** Identify all async operations that need timeout handling to prevent test hangs

## Executive Summary

After analyzing the codebase, I've identified **multiple categories** of operations that require timeout handling:

1. **Test `waitFor` calls** - Many lack explicit timeouts
2. **Network/API calls** - HTTP requests, fetch calls
3. **WebSocket operations** - Real-time connections
4. **Component rendering** - Async state updates
5. **User interactions** - Form submissions, button clicks

## Recommended Timeout Values by Operation Type

### Test Operations (`waitFor`)

| Operation Type | Recommended Timeout | Rationale |
|---------------|-------------------|-----------|
| **Component Rendering** | 2000ms (2s) | Components should render quickly in tests |
| **API Call Completion** | 3000ms (3s) | Network calls may take longer, but should complete quickly in tests |
| **User Interaction Feedback** | 2000ms (2s) | UI updates should be immediate |
| **Form Submission** | 3000ms (3s) | Form submissions involve API calls |
| **Error Message Display** | 2000ms (2s) | Error states should appear quickly |
| **Storage Operations** | 2000ms (2s) | localStorage operations are synchronous but async in tests |
| **WebSocket Messages** | 5000ms (5s) | WebSocket operations may take longer |
| **Complex State Updates** | 3000ms (3s) | Multiple state updates may cascade |

### Network/API Operations

| Operation Type | Recommended Timeout | Rationale |
|---------------|-------------------|-----------|
| **GET Requests** | 10000ms (10s) | Standard HTTP timeout |
| **POST Requests** | 15000ms (15s) | May involve processing |
| **File Uploads** | 30000ms (30s) | Large files take time |
| **LLM API Calls** | 300000ms (5min) | Already implemented in backend |
| **WebSocket Connection** | 10000ms (10s) | Connection establishment |
| **WebSocket Reconnect** | 5000ms (5s) | Reconnection attempts |

## Files Requiring Timeout Fixes

### Critical Priority (Tests Currently Hanging)

#### 1. `components/WorkflowChat.test.tsx`
**Issues Found:** 24 `waitFor` calls, most without timeouts

**Recommendations:**
```typescript
// Current (NO TIMEOUT - CAN HANG):
await waitFor(() => {
  expect(mockAuthenticatedPost).toHaveBeenCalled()
})

// Recommended:
await waitFor(() => {
  expect(mockAuthenticatedPost).toHaveBeenCalled()
}, { timeout: 3000 }) // API call completion
```

**Specific Fixes Needed:**
- Line 215-240: API call verification → 3000ms
- Line 274-280: Message rendering → 2000ms
- Line 300-302: Error display → 2000ms
- Line 348-351: Storage operations → 2000ms
- Line 369-384: Message history → 2000ms
- Line 480-482: Network errors → 2000ms
- Line 511-513: Loading states → 2000ms
- Line 568-574: Dependency injection → 3000ms
- Line 601-610: Custom API base URL → 3000ms
- Line 643-648: Workflow updates → 3000ms
- Line 699-701: Response rendering → 2000ms
- Line 722-724: Error handling → 2000ms
- Line 763-766: Storage save → 2000ms

#### 2. `pages/ForgotPasswordPage.test.tsx`
**Issues Found:** 18 `waitFor` calls, many without timeouts

**Recommendations:**
- Line 35-37: Component rendering → 2000ms
- Line 48-55: Form interaction → 2000ms
- Line 56-60: API call → 3000ms
- Line 76-86: Success message → 3000ms
- Line 97-107: Token display → 3000ms
- Line 118-128: Error message → 2000ms
- Line 134-137: Navigation → 2000ms
- Line 150-158: Keyboard interaction → 3000ms
- Line 175-183: Dependency injection → 3000ms
- Line 210-224: Custom API URL → 3000ms
- Line 237-247: Network errors → 2000ms

#### 3. `pages/ResetPasswordPage.test.tsx`
**Issues Found:** 13 `waitFor` calls, many without timeouts

**Recommendations:**
- Line 41-43: Component rendering → 2000ms
- Line 54-56: Error display → 2000ms
- Line 76-78: Token validation → 2000ms
- Line 98-101: API call → 3000ms
- Line 122-124: Validation errors → 2000ms
- Line 139-141: Password validation → 2000ms
- Line 177-179: Success message → 3000ms
- Line 199-201: Error message → 2000ms
- Line 217-220: Form rendering → 2000ms
- Line 229-231: API call → 3000ms
- Line 273-276: Dependency injection → 3000ms
- Line 309-312: Custom API URL → 3000ms
- Line 337-339: Network errors → 2000ms

#### 4. `components/MarketplaceDialog.test.tsx`
**Issues Found:** 27 `waitFor` calls, most without timeouts

**Recommendations:**
- Line 83-86: Component rendering → 2000ms
- Line 131-134: Success notification → 3000ms
- Line 190-197: Publish workflow → 3000ms
- Line 316-323: Error handling → 2000ms
- Line 372-374: Auth errors → 2000ms
- Line 388-390: Validation errors → 2000ms
- Line 408-410: Publish errors → 2000ms
- Line 425-427: Success callbacks → 3000ms
- Line 447-449: Success callbacks → 3000ms
- Line 473-475: Success callbacks → 3000ms
- Line 501-503: Success callbacks → 3000ms
- Line 536-538: Storage operations → 2000ms
- Line 568-575: Dependency injection → 3000ms
- Line 601-624: Error scenarios → 2000ms
- Line 652-659: Workflow errors → 2000ms
- Line 675-677: Success scenarios → 3000ms
- Line 731-743: Form interactions → 2000ms
- Line 766-779: Time input → 2000ms

#### 5. `pages/SettingsPage.test.tsx`
**Issues Found:** Many `waitFor` calls, some without timeouts

**Recommendations:**
- All component rendering → 2000ms
- All API calls → 3000ms
- All form interactions → 2000ms
- All storage operations → 2000ms

### Medium Priority

#### 6. `components/WorkflowTabs.test.tsx`
**Recommendations:**
- Tab switching → 2000ms
- Workflow operations → 3000ms
- API calls → 3000ms

#### 7. `components/WorkflowBuilder.test.tsx`
**Recommendations:**
- Component rendering → 2000ms
- Node operations → 2000ms
- Canvas interactions → 2000ms

#### 8. `components/PropertyPanel.test.tsx`
**Recommendations:**
- Form rendering → 2000ms
- Input changes → 2000ms
- Save operations → 3000ms

#### 9. `components/ExecutionConsole.test.tsx`
**Recommendations:**
- Log rendering → 2000ms
- Execution updates → 3000ms
- WebSocket messages → 5000ms

#### 10. `hooks/useWebSocket.test.ts`
**Recommendations:**
- Connection establishment → 10000ms
- Message sending → 5000ms
- Reconnection → 5000ms

## Implementation Strategy

### Phase 1: Create Helper Function (IMMEDIATE)

Add to all test files:

```typescript
// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (
  callback: () => void | Promise<void>, 
  timeout = 2000,
  options?: { timeout?: number }
) => {
  return waitFor(callback, { timeout: options?.timeout || timeout, ...options })
}
```

### Phase 2: Replace All `waitFor` Calls

**Automated Approach:**
```bash
# Find all waitFor calls without timeout
grep -rn "waitFor(() =>" src --include="*.test.tsx" --include="*.test.ts"

# Replace with waitForWithTimeout
sed -i '' 's/await waitFor(() =>/await waitForWithTimeout(() =>/g' src/**/*.test.tsx
```

**Manual Review Required:**
- Check each replacement
- Adjust timeout values based on operation type
- Ensure proper error handling

### Phase 3: Add Timeouts to Network Operations

**For HTTP Client:**
```typescript
// In types/adapters.ts or api/client.ts
interface HttpClient {
  get(url: string, headers?: HeadersInit, timeout?: number): Promise<Response>
  post(url: string, body: any, headers?: HeadersInit, timeout?: number): Promise<Response>
  // ... etc
}
```

**For WebSocket:**
```typescript
// In hooks/useWebSocket.ts
const DEFAULT_CONNECTION_TIMEOUT = 10000 // 10 seconds
const DEFAULT_MESSAGE_TIMEOUT = 5000 // 5 seconds
```

## Quick Fix Script

Create `frontend/scripts/add-timeouts-to-tests.sh`:

```bash
#!/bin/bash

# Add timeout helper to test files
for file in $(find src -name "*.test.tsx" -o -name "*.test.ts"); do
  if ! grep -q "waitForWithTimeout" "$file"; then
    # Add helper after imports
    sed -i '' '/^import.*waitFor/a\
\
// Helper to ensure all waitFor calls have timeouts\
const waitForWithTimeout = (callback: () => void | Promise<void>, timeout = 2000) => {\
  return waitFor(callback, { timeout })\
}' "$file"
  fi
  
  # Replace waitFor with waitForWithTimeout (but keep existing timeouts)
  sed -i '' 's/await waitFor(() =>/await waitForWithTimeout(() =>/g' "$file"
done
```

## Testing the Fixes

After implementing timeouts:

```bash
# Run tests with aggressive timeout to catch any remaining hangs
npm test -- --testTimeout=5000 --forceExit --maxWorkers=1

# Check for any tests that still timeout
npm test -- --testTimeout=3000 --bail
```

## Summary of Required Changes

| File | waitFor Calls | Missing Timeouts | Priority |
|------|--------------|------------------|----------|
| `WorkflowChat.test.tsx` | 24 | ~20 | CRITICAL |
| `ForgotPasswordPage.test.tsx` | 18 | ~12 | CRITICAL |
| `ResetPasswordPage.test.tsx` | 13 | ~8 | CRITICAL |
| `MarketplaceDialog.test.tsx` | 27 | ~22 | CRITICAL |
| `SettingsPage.test.tsx` | 50+ | ~30 | HIGH |
| `WorkflowTabs.test.tsx` | 20+ | ~15 | HIGH |
| `WorkflowBuilder.test.tsx` | 10+ | ~8 | MEDIUM |
| `PropertyPanel.test.tsx` | 15+ | ~10 | MEDIUM |
| `ExecutionConsole.test.tsx` | 10+ | ~8 | MEDIUM |
| `useWebSocket.test.ts` | 5+ | ~5 | MEDIUM |

**Total Estimated:** ~150 `waitFor` calls need timeout fixes

## Next Steps

1. ✅ Create timeout helper function
2. ✅ Add helper to all test files
3. ✅ Replace `waitFor` with `waitForWithTimeout`
4. ✅ Adjust timeout values based on operation type
5. ✅ Run full test suite to verify no hangs
6. ✅ Document timeout values in code comments
