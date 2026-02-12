#!/bin/bash
# Watch mode test runner - runs tests in watch mode
# Usage: ./scripts/test-watch.sh [test-pattern]
# Or: npm run test:watch-script -- "pattern"

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
  echo "Running tests in watch mode..."
  npm test -- --watch
else
  echo "Running tests matching '$PATTERN' in watch mode..."
  npm test -- --testPathPatterns="$PATTERN" --watch
fi
