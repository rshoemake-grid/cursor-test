#!/bin/bash
# Quick test runner - runs tests without coverage for faster execution
# Usage: ./scripts/test-quick.sh [test-pattern]
# Or: npm run test:quick -- "pattern"

set -e

cd "$(dirname "$0")/.."

# Get pattern from arguments (handles both direct call and npm run)
PATTERN=""
for arg in "$@"; do
  if [[ "$arg" != "--"* ]]; then
    PATTERN="$arg"
    break
  fi
done

if [ -z "$PATTERN" ]; then
  echo "Running all tests (quick mode - no coverage)..."
  npm test -- --no-coverage
else
  echo "Running tests matching: $PATTERN"
  npm test -- --testPathPatterns="$PATTERN" --no-coverage
fi
