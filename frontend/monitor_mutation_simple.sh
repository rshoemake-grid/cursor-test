#!/bin/bash

# Simple Mutation Testing Monitor
# Checks status every 5 minutes

PID_FILE="/tmp/mutation_test.pid"
STYKER_LOG="/Users/rshoemake/Documents/cursor/cursor-test/frontend/stryker.log"
MONITOR_LOG="frontend/MUTATION_TEST_MONITOR.log"
START_TIME=$(date +%s)

echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Mutation Testing Monitor" | tee -a "$MONITOR_LOG"
echo "Started: $(date)" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "" | tee -a "$MONITOR_LOG"

ITERATION=0
while true; do
    ITERATION=$((ITERATION + 1))
    ELAPSED=$(( $(date +%s) - START_TIME ))
    ELAPSED_MIN=$(( ELAPSED / 60 ))
    
    echo "[$(date)] Check #$ITERATION (${ELAPSED_MIN} minutes elapsed)" | tee -a "$MONITOR_LOG"
    
    # Check if main process is running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            ETIME=$(ps -p "$PID" -o etime= 2>/dev/null | tr -d ' ')
            echo "  ✓ Process running (PID: $PID, Runtime: $ETIME)" | tee -a "$MONITOR_LOG"
        else
            echo "  ✗ Process stopped!" | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            echo "=========================================" | tee -a "$MONITOR_LOG"
            echo "PROCESS COMPLETED OR CRASHED" | tee -a "$MONITOR_LOG"
            echo "=========================================" | tee -a "$MONITOR_LOG"
            break
        fi
    fi
    
    # Check stryker.log for progress
    if [ -f "$STYKER_LOG" ]; then
        echo "  Recent activity:" | tee -a "$MONITOR_LOG"
        tail -5 "$STYKER_LOG" 2>/dev/null | sed 's/^/    /' | tee -a "$MONITOR_LOG" || echo "    (No recent activity)" | tee -a "$MONITOR_LOG"
        
        # Check for progress indicators
        PROGRESS=$(tail -100 "$STYKER_LOG" 2>/dev/null | grep -E "(Mutant|Progress|%|mutants tested|Killed|Survived|Mutation score|Done)" | tail -3)
        if [ -n "$PROGRESS" ]; then
            echo "  Progress:" | tee -a "$MONITOR_LOG"
            echo "$PROGRESS" | sed 's/^/    /' | tee -a "$MONITOR_LOG"
        fi
        
        # Check for crashes
        CRASHES=$(tail -50 "$STYKER_LOG" 2>/dev/null | grep -iE "(crash|error|failed|killed|terminated|oom)" | tail -3)
        if [ -n "$CRASHES" ]; then
            echo "  ⚠ CRASH/ERROR DETECTED:" | tee -a "$MONITOR_LOG"
            echo "$CRASHES" | sed 's/^/    /' | tee -a "$MONITOR_LOG"
        fi
    fi
    
    # Check for completion
    if [ -f "$STYKER_LOG" ]; then
        if tail -20 "$STYKER_LOG" 2>/dev/null | grep -q "Done in"; then
            echo "" | tee -a "$MONITOR_LOG"
            echo "=========================================" | tee -a "$MONITOR_LOG"
            echo "MUTATION TESTING COMPLETED!" | tee -a "$MONITOR_LOG"
            echo "=========================================" | tee -a "$MONITOR_LOG"
            tail -30 "$STYKER_LOG" 2>/dev/null | grep -E "(Mutation score|Done|Killed|Survived)" | tee -a "$MONITOR_LOG"
            break
        fi
    fi
    
    echo "" | tee -a "$MONITOR_LOG"
    
    # Wait 5 minutes
    sleep 300
done

# Final summary
echo "" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Final Summary" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Total Duration: ${ELAPSED_MIN} minutes" | tee -a "$MONITOR_LOG"
echo "Full log: $STYKER_LOG" | tee -a "$MONITOR_LOG"
echo "Monitor log: $MONITOR_LOG" | tee -a "$MONITOR_LOG"
