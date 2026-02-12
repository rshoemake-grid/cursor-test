#!/bin/bash
# Full test runner - runs all tests with coverage
# Usage: ./scripts/test-full.sh

set -e

cd "$(dirname "$0")/.."

echo "Running full test suite with coverage..."
npm test -- --coverage

echo ""
echo "✅ Full test suite complete!"
