#!/bin/bash

# Monitor mutation tests and check for crashes
# Run every 5 minutes

LOG_FILE="/tmp/mutation_monitor.log"
STRIKER_LOG="/tmp/stryker-dryrun.log"
STRIKER_CONF="stryker.conf.json"
MAX_WORKERS=4

echo "$(date): Starting mutation test monitor" >> "$LOG_FILE"

while true; do
    echo "$(date): Checking mutation test status..." >> "$LOG_FILE"
    
    # Check if Stryker is still running
    STRIKER_PID=$(ps aux | grep -i "stryker run" | grep -v grep | awk '{print $2}' | head -1)
    
    if [ -z "$STRIKER_PID" ]; then
        echo "$(date): WARNING - Stryker process not found!" >> "$LOG_FILE"
        echo "$(date): Checking if it crashed or completed..." >> "$LOG_FILE"
        
        # Check if there's an error in the log
        if [ -f "$STRIKER_LOG" ]; then
            ERROR_COUNT=$(tail -100 "$STRIKER_LOG" | grep -i "error\|crash\|killed\|signal" | wc -l)
            if [ "$ERROR_COUNT" -gt 0 ]; then
                echo "$(date): ERROR DETECTED in log file!" >> "$LOG_FILE"
                tail -50 "$STRIKER_LOG" >> "$LOG_FILE"
            fi
        fi
    else
        echo "$(date): Stryker is running (PID: $STRIKER_PID)" >> "$LOG_FILE"
        
        # Check memory usage
        MEMORY=$(ps -p "$STRIKER_PID" -o rss= 2>/dev/null | awk '{print $1/1024}')
        if [ ! -z "$MEMORY" ]; then
            echo "$(date): Stryker memory usage: ${MEMORY}MB" >> "$LOG_FILE"
            
            # If memory usage is very high (>8GB), reduce workers
            if (( $(echo "$MEMORY > 8192" | bc -l) )); then
                echo "$(date): WARNING - High memory usage detected!" >> "$LOG_FILE"
            fi
        fi
        
        # Check worker count
        WORKER_COUNT=$(ps aux | grep "child-process-proxy-worker" | grep -v grep | wc -l)
        echo "$(date): Active workers: $WORKER_COUNT" >> "$LOG_FILE"
        
        # Check if workers exceed max
        if [ "$WORKER_COUNT" -gt "$MAX_WORKERS" ]; then
            echo "$(date): WARNING - Worker count ($WORKER_COUNT) exceeds max ($MAX_WORKERS)" >> "$LOG_FILE"
        fi
    fi
    
    # Check for crash indicators
    if [ -f "$STRIKER_LOG" ]; then
        CRASH_INDICATORS=$(tail -100 "$STRIKER_LOG" | grep -i "killed\|segmentation\|abort\|crash\|signal 9\|signal 11" | wc -l)
        if [ "$CRASH_INDICATORS" -gt 0 ]; then
            echo "$(date): CRASH DETECTED! Reducing workers to $MAX_WORKERS" >> "$LOG_FILE"
            
            # Update stryker config to reduce workers
            if [ -f "$STRIKER_CONF" ]; then
                # Backup current config
                cp "$STRIKER_CONF" "${STRIKER_CONF}.backup"
                
                # Update concurrency to MAX_WORKERS
                if command -v jq &> /dev/null; then
                    jq ".concurrency = $MAX_WORKERS" "$STRIKER_CONF" > "${STRIKER_CONF}.tmp" && mv "${STRIKER_CONF}.tmp" "$STRIKER_CONF"
                    echo "$(date): Updated concurrency to $MAX_WORKERS in $STRIKER_CONF" >> "$LOG_FILE"
                else
                    # Fallback: use sed
                    sed -i.bak "s/\"concurrency\": [0-9]*/\"concurrency\": $MAX_WORKERS/" "$STRIKER_CONF"
                    echo "$(date): Updated concurrency to $MAX_WORKERS using sed" >> "$LOG_FILE"
                fi
            fi
            
            # Show recent log entries
            echo "$(date): Recent log entries:" >> "$LOG_FILE"
            tail -30 "$STRIKER_LOG" >> "$LOG_FILE"
        fi
    fi
    
    # Show progress from log
    if [ -f "$STRIKER_LOG" ]; then
        PROGRESS=$(tail -20 "$STRIKER_LOG" | grep -i "progress\|mutant\|test" | tail -3)
        if [ ! -z "$PROGRESS" ]; then
            echo "$(date): Recent progress:" >> "$LOG_FILE"
            echo "$PROGRESS" >> "$LOG_FILE"
        fi
    fi
    
    echo "---" >> "$LOG_FILE"
    
    # Wait 5 minutes
    sleep 300
done
