#!/bin/bash

# Run mutation testing and monitor every 5 minutes until completion
# Then report the results

set -e

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$FRONTEND_DIR"

echo "=========================================="
echo "Starting Mutation Testing"
echo "Time: $(date)"
echo "=========================================="

# Start mutation testing in background
echo "Starting mutation tests..."
npm run test:mutation > mutation_output.log 2>&1 &
MUTATION_PID=$!

echo "Mutation testing started with PID: $MUTATION_PID"
echo "Monitoring every 5 minutes..."
echo ""

# Function to check if mutation testing is still running
check_running() {
    if ps -p $MUTATION_PID > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to get progress from log
get_progress() {
    if [ -f mutation_output.log ]; then
        tail -50 mutation_output.log | grep -E "(Mutant|Killed|Survived|Timeout|No coverage|Mutation score)" | tail -5
    fi
}

# Monitor loop
ITERATION=0
while check_running; do
    ITERATION=$((ITERATION + 1))
    ELAPSED=$((ITERATION * 5))
    
    echo "----------------------------------------"
    echo "Check #$ITERATION - Elapsed: ${ELAPSED} minutes"
    echo "Time: $(date)"
    echo "Status: Running (PID: $MUTATION_PID)"
    
    # Show recent progress
    PROGRESS=$(get_progress)
    if [ -n "$PROGRESS" ]; then
        echo ""
        echo "Recent progress:"
        echo "$PROGRESS"
    else
        echo "Waiting for progress updates..."
    fi
    
    echo ""
    
    # Wait 5 minutes
    sleep 300
done

# Wait for process to fully complete
wait $MUTATION_PID 2>/dev/null || true
EXIT_CODE=$?

echo "=========================================="
echo "Mutation Testing Completed"
echo "Time: $(date)"
echo "Exit Code: $EXIT_CODE"
echo "=========================================="
echo ""

# Extract and report results
echo "Final Results:"
echo "----------------------------------------"

if [ -f mutation_output.log ]; then
    # Extract summary
    echo ""
    echo "=== Mutation Test Summary ==="
    tail -100 mutation_output.log | grep -A 20 -E "(Mutation score|Killed|Survived|Timeout|No coverage|Error)" || echo "Could not extract summary"
    
    echo ""
    echo "=== Full Log (last 50 lines) ==="
    tail -50 mutation_output.log
    
    # Try to find stryker report
    if [ -d "reports/mutation" ]; then
        echo ""
        echo "=== Mutation Report Location ==="
        find reports/mutation -name "*.html" -o -name "*.json" | head -5
    fi
else
    echo "Error: mutation_output.log not found"
fi

echo ""
echo "=========================================="
echo "Monitoring Complete"
echo "=========================================="

exit $EXIT_CODE
