# Testing Guidelines

**Date**: 2026-01-26  
**Status**: Active

---

## Overview

This document provides guidelines for writing, running, and maintaining tests in the frontend codebase.

---

## Quick Reference

### Test Commands

```bash
# Quick test run (no coverage, faster)
npm run test:quick
# Or directly:
./scripts/test-quick.sh

# Quick test run for specific pattern
./scripts/test-quick.sh "useWebSocket"

# Full test suite with coverage
npm run test:full
# Or directly:
./scripts/test-full.sh

# Watch mode (auto-rerun on changes)
npm run test:watch-script
# Or directly:
./scripts/test-watch.sh

# Watch mode for specific pattern
./scripts/test-watch.sh "ExecutionConsole"

# Standard Jest commands (also available)
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage       # With coverage
npm test -- --testPathPatterns="pattern"  # Specific pattern
```

---

## When to Run Tests

### Before Starting Work
- ✅ Run quick test suite to verify baseline
- ✅ Check for any existing failures

### During Development
- ✅ Run tests for files you're modifying
- ✅ Use watch mode for active development
- ✅ Run tests before committing

### Before Committing
- ✅ Run quick test suite
- ✅ Verify no new failures
- ✅ Check for regressions

### Before Pushing
- ✅ Run full test suite
- ✅ Verify coverage hasn't decreased
- ✅ Check for any warnings

---

## Test File Naming Conventions

### Standard Test Files
- `ComponentName.test.tsx` - Main test file for component
- `hookName.test.ts` - Main test file for hook
- `utilityName.test.ts` - Main test file for utility

### Specialized Test Files
- `*.additional.test.tsx` - Additional coverage tests
- `*.mutation.test.ts` - Mutation testing coverage
- `*.mutation.advanced.test.ts` - Advanced mutation tests
- `*.edges.test.ts` - Edge case tests
- `*.comprehensive.test.ts` - Comprehensive test coverage
- `*.basic.test.ts` - Basic functionality tests

---

## Writing Tests

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  })

  afterEach(() => {
    // Cleanup
  })

  it('should do something', () => {
    // Test implementation
  })
})
```

### Using Fake Timers

When using `jest.useFakeTimers()`, use the fake timers version of `waitForWithTimeout`:

```typescript
import { waitForWithTimeoutFakeTimers } from '../test/utils/waitForWithTimeout'

const waitForWithTimeout = waitForWithTimeoutFakeTimers

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})
```

### Async Operations

Always use `waitForWithTimeout` instead of `waitFor`:

```typescript
await waitForWithTimeout(() => {
  expect(screen.getByText('Hello')).toBeInTheDocument()
}, { timeout: 3000 })
```

---

## Test Patterns

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react'

const { result } = renderHook(() => useMyHook({ prop: 'value' }))

await waitForWithTimeout(() => {
  expect(result.current.data).toBeDefined()
})
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react'

render(<MyComponent prop="value" />)

expect(screen.getByText('Hello')).toBeInTheDocument()
```

### Testing Async Operations

```typescript
// Use try/catch pattern with waitForWithTimeout
let operationCompleted = false
try {
  await waitForWithTimeout(
    () => {
      if (!someCondition) {
        throw new Error('Not ready yet')
      }
    },
    2000
  )
  operationCompleted = true
} catch {
  operationCompleted = false
}
```

---

## Common Issues and Solutions

### Issue: Test Hangs/Timeouts

**Solution**:
- Check for infinite loops
- Verify timer cleanup (`jest.useRealTimers()` in `afterEach`)
- Add explicit timeouts
- Use `waitForWithTimeout` instead of `waitFor`

### Issue: Fake Timers Conflict

**Solution**:
- Use `waitForWithTimeoutFakeTimers` when using fake timers
- Ensure `jest.useRealTimers()` in cleanup
- Advance timers before async operations

### Issue: Async State Updates

**Solution**:
- Use `act()` for state updates
- Use `waitForWithTimeout` for async assertions
- Wait for loading states to complete

---

## Test Coverage Goals

### Minimum Coverage
- **Components**: 80%+
- **Hooks**: 85%+
- **Utils**: 90%+

### Mutation Testing
- Run mutation tests for critical paths
- Aim for high mutation kill rate
- Document surviving mutants

---

## Best Practices

### ✅ Do
- Write descriptive test names
- Test behavior, not implementation
- Use meaningful assertions
- Clean up after tests
- Use shared test utilities
- Document complex test logic

### ❌ Don't
- Test implementation details
- Use magic numbers without explanation
- Leave tests hanging
- Skip cleanup
- Duplicate test utilities
- Write flaky tests

---

## Test Utilities

### Available Utilities

Located in `src/test/utils/`:

- `waitForWithTimeout.ts` - Async waiting with timeout support
  - `waitForWithTimeout` - For normal timers
  - `waitForWithTimeoutFakeTimers` - For fake timers
  - `waitForWithTimeoutAuto` - Auto-detecting version

### Usage Example

```typescript
import { waitForWithTimeoutFakeTimers } from '../test/utils/waitForWithTimeout'

const waitForWithTimeout = waitForWithTimeoutFakeTimers

await waitForWithTimeout(() => {
  expect(condition).toBe(true)
}, { timeout: 3000 })
```

---

## Debugging Tests

### Run Single Test

```bash
npm test -- --testPathPatterns="MyComponent.test" --testNamePattern="specific test name"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --testPathPatterns="MyComponent.test"
```

### Verbose Output

```bash
npm test -- --testPathPatterns="MyComponent.test" --verbose
```

---

## Continuous Integration

### Pre-commit Checks
- Run quick test suite
- Verify no failures
- Check linting

### CI Pipeline
- Run full test suite
- Generate coverage report
- Check coverage thresholds

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Test Utilities README](./src/test/utils/README.md)
- [Testing Progress Tracker](./TESTING_CHUNK_PROGRESS.md)

---

## Questions?

- Check existing test files for patterns
- Review test utilities documentation
- Consult team members
- Review testing progress documents

---

**Last Updated**: 2026-01-26
