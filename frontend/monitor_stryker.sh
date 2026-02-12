#!/bin/bash

# Monitor Stryker mutation tests and check for crashes every 5 minutes
# This script will run until manually stopped or Stryker completes

LOG_FILE="/tmp/stryker-monitor.log"
DRYRUN_LOG="/tmp/stryker-dryrun.log"
CHECK_INTERVAL=300  # 5 minutes in seconds

echo "$(date): Starting Stryker monitoring..." >> "$LOG_FILE"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check if Stryker process is still running
    STRYKER_PID=$(ps aux | grep -E "stryker[[:space:]]" | grep -v grep | awk '{print $2}' | head -1)
    
    if [ -z "$STRYKER_PID" ]; then
        echo "$TIMESTAMP: ⚠️  WARNING: Stryker process not found!" >> "$LOG_FILE"
        echo "$TIMESTAMP: ⚠️  WARNING: Stryker process not found!"
        
        # Check if it completed successfully or crashed
        if [ -f "$DRYRUN_LOG" ]; then
            LAST_LINE=$(tail -1 "$DRYRUN_LOG")
            if echo "$LAST_LINE" | grep -qE "Done|completed|success"; then
                echo "$TIMESTAMP: ✅ Stryker appears to have completed successfully" >> "$LOG_FILE"
                echo "$TIMESTAMP: ✅ Stryker appears to have completed successfully"
            else
                echo "$TIMESTAMP: ❌ CRASH DETECTED: Stryker process stopped unexpectedly!" >> "$LOG_FILE"
                echo "$TIMESTAMP: ❌ CRASH DETECTED: Stryker process stopped unexpectedly!"
                echo "Last log line: $LAST_LINE" >> "$LOG_FILE"
                echo "Last log line: $LAST_LINE"
            fi
        fi
        break
    fi
    
    # Check log for errors
    if [ -f "$DRYRUN_LOG" ]; then
        ERROR_COUNT=$(grep -iE "error|crash|failed|exception" "$DRYRUN_LOG" | wc -l | tr -d ' ')
        LAST_ERROR=$(grep -iE "error|crash|failed|exception" "$DRYRUN_LOG" | tail -1)
        
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo "$TIMESTAMP: ⚠️  Found $ERROR_COUNT error(s) in log" >> "$LOG_FILE"
            echo "$TIMESTAMP: ⚠️  Found $ERROR_COUNT error(s) in log"
            if [ -n "$LAST_ERROR" ]; then
                echo "  Last error: $LAST_ERROR" >> "$LOG_FILE"
                echo "  Last error: $LAST_ERROR"
            fi
        fi
    fi
    
    # Get process status
    CPU=$(ps -p "$STRYKER_PID" -o %cpu= 2>/dev/null | tr -d ' ')
    MEM=$(ps -p "$STRYKER_PID" -o %mem= 2>/dev/null | tr -d ' ')
    
    echo "$TIMESTAMP: ✅ Stryker running (PID: $STRYKER_PID, CPU: ${CPU}%, MEM: ${MEM}%)" >> "$LOG_FILE"
    echo "$TIMESTAMP: ✅ Stryker running (PID: $STRYKER_PID, CPU: ${CPU}%, MEM: ${MEM}%)"
    
    sleep "$CHECK_INTERVAL"
done

echo "$(date): Monitoring stopped." >> "$LOG_FILE"
