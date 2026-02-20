#!/bin/bash

# Run Unit Tests with 8 Workers
# Optimized for parallel test execution

set -e

cd "$(dirname "$0")"

echo "========================================="
echo "Running Unit Tests with 8 Workers"
echo "Start Time: $(date)"
echo "========================================="
echo ""

# Set Jest maxWorkers to 8
export JEST_MAX_WORKERS=8

# Run tests with 8 workers
npm test -- --maxWorkers=8 "$@"

echo ""
echo "========================================="
echo "Tests Complete"
echo "End Time: $(date)"
echo "========================================="
