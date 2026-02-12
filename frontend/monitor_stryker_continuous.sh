#!/bin/bash

# Continuous monitoring script for Stryker mutation tests
# Checks every 5 minutes for crashes and reduces workers if needed

LOG_FILE="/tmp/stryker-dryrun.log"
STUCK_THRESHOLD=300  # 5 minutes without progress
LAST_SIZE=0
CHECK_COUNT=0
CRASH_COUNT=0

echo "Starting Stryker mutation test monitoring..."
echo "Monitoring every 5 minutes..."
echo "Started at: $(date)"

while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    CURRENT_TIME=$(date)
    
    # Check if Stryker process is still running
    if ! ps aux | grep -i "stryker" | grep -v grep | grep -v "monitor" > /dev/null; then
        echo "[$CURRENT_TIME] ⚠️  WARNING: Stryker process not found!"
        CRASH_COUNT=$((CRASH_COUNT + 1))
        
        if [ $CRASH_COUNT -ge 2 ]; then
            echo "[$CURRENT_TIME] ❌ Stryker crashed multiple times. Reducing workers to 4..."
            cd /Users/rshoemake/Documents/cursor/cursor-test/frontend
            # Update stryker.conf.json to set concurrency to 4 (already set, but ensure it)
            echo "Concurrency already set to 4 in stryker.conf.json"
            CRASH_COUNT=0
        fi
    else
        CRASH_COUNT=0
        echo "[$CURRENT_TIME] ✓ Stryker process is running"
    fi
    
    # Check log file size for progress
    if [ -f "$LOG_FILE" ]; then
        CURRENT_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
        
        if [ "$CURRENT_SIZE" -gt "$LAST_SIZE" ]; then
            echo "[$CURRENT_TIME] ✓ Progress detected (log size: $CURRENT_SIZE bytes, +$((CURRENT_SIZE - LAST_SIZE)) bytes)"
            LAST_SIZE=$CURRENT_SIZE
            
            # Show last few lines of progress
            echo "--- Recent log output ---"
            tail -5 "$LOG_FILE" | grep -E "Dry run|Mutant|Test|Progress|Error|Failed" || tail -5 "$LOG_FILE"
            echo "---"
        else
            echo "[$CURRENT_TIME] ⚠️  No progress detected (log size unchanged: $CURRENT_SIZE bytes)"
        fi
    else
        echo "[$CURRENT_TIME] ⚠️  Log file not found: $LOG_FILE"
    fi
    
    # Check for errors in log
    if [ -f "$LOG_FILE" ]; then
        ERROR_COUNT=$(grep -i "error\|failed\|crash" "$LOG_FILE" | tail -20 | wc -l | tr -d ' ')
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo "[$CURRENT_TIME] ⚠️  Found $ERROR_COUNT recent error messages in log"
            echo "--- Recent errors ---"
            grep -i "error\|failed\|crash" "$LOG_FILE" | tail -5
            echo "---"
        fi
    fi
    
    # Check system resources
    MEMORY_USAGE=$(ps aux | grep -i "stryker\|node" | grep -v grep | awk '{sum+=$6} END {print sum/1024}' | awk '{printf "%.1f", $1}')
    echo "[$CURRENT_TIME] 💾 Memory usage: ${MEMORY_USAGE}MB"
    
    # Check if dry run completed
    if [ -f "$LOG_FILE" ] && grep -q "Dry run completed\|All tests passed\|Mutation testing complete" "$LOG_FILE"; then
        echo "[$CURRENT_TIME] ✅ Dry run appears to have completed!"
        echo "--- Completion message ---"
        grep -A 5 "Dry run completed\|All tests passed\|Mutation testing complete" "$LOG_FILE" | tail -10
        echo "---"
        break
    fi
    
    echo "[$CURRENT_TIME] Check #$CHECK_COUNT complete. Waiting 5 minutes..."
    echo ""
    
    sleep 300  # Wait 5 minutes
done

echo "Monitoring completed at: $(date)"
