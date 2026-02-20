#!/bin/bash

# Mutation Testing Startup Script
# Runs mutation testing in background with logging
# Use this to avoid Cursor crashes

cd "$(dirname "$0")"

echo "=========================================="
echo "Starting Mutation Testing"
echo "=========================================="
echo ""
echo "This will run in the background to avoid Cursor crashes"
echo "Monitor progress with: ./monitor-mutation-test.sh"
echo ""

# Check if already running
if ps aux | grep -E "stryker.*run|npm.*mutation" | grep -v grep > /dev/null; then
    echo "⚠️  Mutation testing is already running!"
    echo "Check status with: ./monitor-mutation-test.sh"
    exit 1
fi

# Start mutation testing in background
echo "Starting mutation testing..."
npm run test:mutation > mutation-test-output.log 2>&1 &
MUTATION_PID=$!

echo "✓ Mutation testing started (PID: $MUTATION_PID)"
echo "✓ Output logged to: mutation-test-output.log"
echo "✓ Monitor with: ./monitor-mutation-test.sh"
echo ""
echo "Expected duration: 60-70 minutes"
echo ""
echo "To check status:"
echo "  ./monitor-mutation-test.sh"
echo ""
echo "To view live output:"
echo "  tail -f mutation-test-output.log"
echo ""
echo "To stop mutation testing:"
echo "  kill $MUTATION_PID"
echo ""

# Save PID for reference
echo $MUTATION_PID > mutation-test.pid
echo "PID saved to: mutation-test.pid"
