#!/bin/bash

# Mutation Testing Progress Checker
# Run this script to check current progress

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"

echo "=========================================="
echo "Mutation Testing Progress Check"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo ""

# Check if process is running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✅ Mutation testing is RUNNING (PID: $PID)"
    else
        echo "❌ Mutation testing process NOT RUNNING (PID: $PID)"
        echo "   Process may have completed or crashed."
    fi
else
    echo "⚠️  PID file not found. Checking if mutation testing is running..."
    if pgrep -f "stryker run" > /dev/null; then
        echo "✅ Mutation testing appears to be running (found stryker process)"
    else
        echo "❌ No mutation testing process found"
    fi
fi

echo ""

# Show log progress
if [ -f "$LOG_FILE" ]; then
    echo "=== Recent Log Output (last 40 lines) ==="
    tail -40 "$LOG_FILE"
    echo ""
    
    # Extract key metrics if available
    echo "=== Key Metrics ==="
    
    # Check for mutant counts
    if grep -q "mutant" "$LOG_FILE"; then
        echo "Mutant information found in log"
        grep -i "mutant\|killed\|survived\|timeout\|error" "$LOG_FILE" | tail -10
    fi
    
    # Check for completion
    if grep -q "Mutation test run completed\|All tests passed\|Mutation score" "$LOG_FILE"; then
        echo ""
        echo "🎉 MUTATION TESTING APPEARS TO BE COMPLETE!"
        echo "Final results:"
        grep -A 20 "Mutation test run completed\|Mutation score\|All mutants" "$LOG_FILE" | tail -30
    fi
    
    # Show file size
    LOG_SIZE=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
    echo ""
    echo "Log file has $LOG_SIZE lines"
else
    echo "⚠️  Log file not found: $LOG_FILE"
fi

echo ""
echo "=========================================="
echo "To view live updates: tail -f $LOG_FILE"
echo "=========================================="
