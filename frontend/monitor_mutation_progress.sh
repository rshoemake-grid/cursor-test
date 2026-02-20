#!/bin/bash

# Mutation Testing Progress Monitor
# Checks progress every 5 minutes and reports crashes

LOG_FILE="/tmp/mutation_test.log"
PID_FILE="/tmp/mutation_test.pid"
MONITOR_LOG="frontend/MUTATION_TEST_MONITOR.log"
START_TIME=$(date +%s)

echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Mutation Testing Monitor Started" | tee -a "$MONITOR_LOG"
echo "Start Time: $(date)" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "" | tee -a "$MONITOR_LOG"

# Function to check if process is running
check_process() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        return 1
    fi
}

# Function to extract progress from log
extract_progress() {
    if [ -f "$LOG_FILE" ]; then
        # Look for progress indicators in Stryker output
        tail -100 "$LOG_FILE" | grep -E "(Mutant|Progress|%|mutants tested|Killed|Survived)" | tail -5
    fi
}

# Function to check for crashes
check_crashes() {
    if [ -f "$LOG_FILE" ]; then
        # Look for crash indicators
        tail -50 "$LOG_FILE" | grep -iE "(crash|error|failed|killed|terminated|oom|out of memory)" | tail -3
    fi
}

# Monitor loop
ITERATION=0
while true; do
    ITERATION=$((ITERATION + 1))
    ELAPSED=$(( $(date +%s) - START_TIME ))
    ELAPSED_MIN=$(( ELAPSED / 60 ))
    
    echo "[$(date)] Check #$ITERATION (${ELAPSED_MIN} minutes elapsed)" | tee -a "$MONITOR_LOG"
    
    # Check if process is still running
    if check_process; then
        echo "  ✓ Process is running (PID: $(cat "$PID_FILE"))" | tee -a "$MONITOR_LOG"
    else
        echo "  ✗ Process has stopped!" | tee -a "$MONITOR_LOG"
        echo "" | tee -a "$MONITOR_LOG"
        echo "=========================================" | tee -a "$MONITOR_LOG"
        echo "MUTATION TESTING COMPLETED OR CRASHED" | tee -a "$MONITOR_LOG"
        echo "=========================================" | tee -a "$MONITOR_LOG"
        break
    fi
    
    # Check for crashes
    CRASHES=$(check_crashes)
    if [ -n "$CRASHES" ]; then
        echo "  ⚠ CRASH DETECTED:" | tee -a "$MONITOR_LOG"
        echo "$CRASHES" | tee -a "$MONITOR_LOG"
    fi
    
    # Extract progress
    PROGRESS=$(extract_progress)
    if [ -n "$PROGRESS" ]; then
        echo "  Progress:" | tee -a "$MONITOR_LOG"
        echo "$PROGRESS" | sed 's/^/    /' | tee -a "$MONITOR_LOG"
    else
        echo "  (No progress indicators found yet)" | tee -a "$MONITOR_LOG"
    fi
    
    # Show last few lines of log
    echo "  Recent log output:" | tee -a "$MONITOR_LOG"
    tail -3 "$LOG_FILE" 2>/dev/null | sed 's/^/    /' | tee -a "$MONITOR_LOG" || echo "    (Log file not available yet)" | tee -a "$MONITOR_LOG"
    
    echo "" | tee -a "$MONITOR_LOG"
    
    # Wait 5 minutes before next check
    sleep 300
done

# Final status
echo "" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Final Status Check" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Total Duration: ${ELAPSED_MIN} minutes" | tee -a "$MONITOR_LOG"
echo "" | tee -a "$MONITOR_LOG"

# Extract final results
if [ -f "$LOG_FILE" ]; then
    echo "Final Results:" | tee -a "$MONITOR_LOG"
    tail -100 "$LOG_FILE" | grep -E "(Mutation score|Killed|Survived|Total|mutants)" | tail -20 | tee -a "$MONITOR_LOG"
fi

echo "" | tee -a "$MONITOR_LOG"
echo "Full log available at: $LOG_FILE" | tee -a "$MONITOR_LOG"
echo "Monitor log: $MONITOR_LOG" | tee -a "$MONITOR_LOG"
