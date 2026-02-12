#!/bin/bash

# Continuous monitoring script for mutation tests
# Checks every 5 minutes for crashes and reduces workers if needed

FRONTEND_DIR="/Users/rshoemake/Documents/cursor/cursor-test/frontend"
LOG_FILE="/tmp/stryker-monitor.log"
STUCK_THRESHOLD=300  # 5 minutes without progress

echo "$(date): Starting mutation test monitor" >> "$LOG_FILE"

while true; do
    echo "$(date): Checking mutation test status..." >> "$LOG_FILE"
    
    # Check if Stryker process is running
    if ! pgrep -f "stryker" > /dev/null; then
        echo "$(date): ERROR - Stryker process not found! Tests may have crashed." >> "$LOG_FILE"
        echo "$(date): ERROR - Stryker process not found! Tests may have crashed."
        break
    fi
    
    # Check for crash indicators in log
    if [ -f "/tmp/stryker-dryrun.log" ]; then
        if grep -q "Error\|FATAL\|crash\|killed\|SIGKILL\|SIGTERM" /tmp/stryker-dryrun.log 2>/dev/null; then
            echo "$(date): WARNING - Potential crash detected in log" >> "$LOG_FILE"
            echo "$(date): WARNING - Potential crash detected in log"
        fi
    fi
    
    # Check if process is stuck (no CPU usage for 5 minutes)
    STRYKER_PID=$(pgrep -f "stryker run" | head -1)
    if [ -n "$STRYKER_PID" ]; then
        # Check last modification time of log file
        if [ -f "/tmp/stryker-dryrun.log" ]; then
            LAST_MOD=$(stat -f %m /tmp/stryker-dryrun.log 2>/dev/null || stat -c %Y /tmp/stryker-dryrun.log 2>/dev/null)
            CURRENT_TIME=$(date +%s)
            TIME_DIFF=$((CURRENT_TIME - LAST_MOD))
            
            if [ $TIME_DIFF -gt $STUCK_THRESHOLD ]; then
                echo "$(date): WARNING - Stryker appears stuck (no log updates for ${TIME_DIFF}s)" >> "$LOG_FILE"
                echo "$(date): WARNING - Stryker appears stuck (no log updates for ${TIME_DIFF}s)"
                
                # Check if we need to reduce workers
                CURRENT_WORKERS=$(cd "$FRONTEND_DIR" && cat stryker.conf.json 2>/dev/null | grep -o '"concurrency": [0-9]*' | grep -o '[0-9]*' || echo "4")
                if [ "$CURRENT_WORKERS" -gt 4 ]; then
                    echo "$(date): Reducing workers from $CURRENT_WORKERS to 4" >> "$LOG_FILE"
                    echo "$(date): Reducing workers from $CURRENT_WORKERS to 4"
                    cd "$FRONTEND_DIR" && sed -i '' 's/"concurrency": [0-9]*/"concurrency": 4/' stryker.conf.json
                fi
            fi
        fi
    fi
    
    # Show current status
    echo "$(date): Stryker is running (PID: $STRYKER_PID)" >> "$LOG_FILE"
    
    # Wait 5 minutes before next check
    sleep 300
done

echo "$(date): Monitor stopped" >> "$LOG_FILE"
