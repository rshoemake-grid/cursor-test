#!/bin/bash
# Monitor mutation test status every 5 minutes

LOG_FILE="/tmp/stryker-dryrun.log"
STATUS_FILE="/tmp/mutation_status.txt"
CHECK_INTERVAL=300  # 5 minutes

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Check if Stryker process is running
    if ! pgrep -f "stryker" > /dev/null; then
        echo "[$TIMESTAMP] ❌ CRASH DETECTED: Stryker process not found!" >> "$STATUS_FILE"
        echo "[$TIMESTAMP] Checking last log entries..." >> "$STATUS_FILE"
        tail -20 "$LOG_FILE" >> "$STATUS_FILE" 2>/dev/null || echo "Log file not accessible" >> "$STATUS_FILE"
        break
    fi
    
    # Get process info
    STRYKER_PID=$(pgrep -f "stryker" | head -1)
    CPU=$(ps -p "$STRYKER_PID" -o %cpu= 2>/dev/null | tr -d ' ' || echo "N/A")
    MEM=$(ps -p "$STRYKER_PID" -o %mem= 2>/dev/null | tr -d ' ' || echo "N/A")
    
    # Check log for progress
    if [ -f "$LOG_FILE" ]; then
        LAST_LINE=$(tail -1 "$LOG_FILE" 2>/dev/null)
        PROGRESS=$(grep -i "mutant\|progress\|survived\|killed" "$LOG_FILE" 2>/dev/null | tail -1)
    else
        LAST_LINE="Log file not found"
        PROGRESS="No progress info"
    fi
    
    # Write status
    echo "[$TIMESTAMP] ✅ Stryker running (PID: $STRYKER_PID, CPU: ${CPU}%, MEM: ${MEM}%)" >> "$STATUS_FILE"
    echo "  Progress: $PROGRESS" >> "$STATUS_FILE"
    echo "  Last log: $LAST_LINE" >> "$STATUS_FILE"
    echo "---" >> "$STATUS_FILE"
    
    # Display current status
    echo "[$TIMESTAMP] Status check complete"
    
    sleep "$CHECK_INTERVAL"
done
