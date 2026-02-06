#!/bin/bash

# Check mutation testing status and report results

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$FRONTEND_DIR"

LOG_FILE="mutation_output.log"
MONITOR_LOG="mutation_monitor.log"

echo "=========================================="
echo "Mutation Testing Status Check"
echo "Time: $(date)"
echo "=========================================="
echo ""

# Check if mutation testing is running
if pgrep -f "stryker run" > /dev/null 2>&1 || pgrep -f "run_and_monitor_mutation" > /dev/null 2>&1; then
    echo "✅ Mutation testing is RUNNING"
    echo ""
    
    # Show recent progress
    if [ -f "$LOG_FILE" ]; then
        echo "--- Recent Progress (last 30 lines) ---"
        tail -30 "$LOG_FILE" | grep -E "(Mutant|Killed|Survived|Timeout|No coverage|Mutation score|progress|Tested|DryRun|Initial test)" || tail -30 "$LOG_FILE"
        echo ""
        
        # Extract key metrics if available
        echo "--- Key Metrics ---"
        tail -200 "$LOG_FILE" | grep -E "(Mutation score|Killed|Survived|Timeout|No coverage|Tested|mutants)" | tail -10 || echo "Metrics not yet available"
    else
        echo "Log file not found yet - mutation testing may be initializing..."
    fi
    
    echo ""
    echo "--- Monitor Log (last 10 lines) ---"
    tail -10 "$MONITOR_LOG" 2>/dev/null || echo "Monitor log not available"
    
else
    echo "❌ Mutation testing is NOT running"
    echo ""
    
    # Check if it completed
    if [ -f "$LOG_FILE" ]; then
        echo "--- Checking for completion ---"
        if tail -100 "$LOG_FILE" | grep -qE "(Mutation test report|Mutation score|All mutants)"; then
            echo "✅ Mutation testing appears to have COMPLETED"
            echo ""
            echo "--- Final Results ---"
            tail -100 "$LOG_FILE" | grep -A 20 -E "(Mutation score|Killed|Survived|Timeout|No coverage)" | head -30
        else
            echo "⚠️  Process stopped but no completion found in log"
            echo "Last 20 lines:"
            tail -20 "$LOG_FILE"
        fi
    fi
fi

echo ""
echo "=========================================="
