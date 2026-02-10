#!/bin/bash

# Monitor mutation testing every 5 minutes until completion
# Reports crashes and final results

LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes
STATUS_LOG="mutation-monitoring-status.log"

log_status() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$STATUS_LOG"
}

log_status "🔍 Starting continuous monitoring (every 5 minutes)"

iteration=0
last_oom_count=0

while true; do
    iteration=$((iteration + 1))
    current_time=$(date '+%H:%M:%S')
    
    log_status "=== Check #$iteration at $current_time ==="
    
    # Check if process is running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
            runtime=$(ps -p "$PID" -o etime= | tr -d ' ')
            log_status "✅ Process $PID is running (runtime: $runtime)"
        else
            # Check for stryker process
            if pgrep -f "stryker run" > /dev/null; then
                NEW_PID=$(pgrep -f "stryker run" | head -1)
                echo "$NEW_PID" > "$PID_FILE"
                log_status "⚠️ Updated PID to $NEW_PID"
                PID=$NEW_PID
            else
                log_status "❌ Process stopped - checking for completion..."
                break
            fi
        fi
    else
        if pgrep -f "stryker run" > /dev/null; then
            NEW_PID=$(pgrep -f "stryker run" | head -1)
            echo "$NEW_PID" > "$PID_FILE"
            log_status "⚠️ Recovered PID: $NEW_PID"
            PID=$NEW_PID
        else
            log_status "❌ No process found - checking for completion..."
            break
        fi
    fi
    
    # Check for OOM errors
    if [ -f "$LOG_FILE" ]; then
        oom_count=$(grep -c "ran out of memory" "$LOG_FILE" 2>/dev/null || echo "0")
        if [ "$oom_count" -gt "$last_oom_count" ]; then
            log_status "⚠️ OOM ERROR DETECTED! Total: $oom_count"
            last_oom_count=$oom_count
        else
            log_status "✅ OOM errors: $oom_count (no new errors)"
        fi
        
        # Check for progress
        progress=$(grep -oE "Mutation testing [0-9]+%" "$LOG_FILE" 2>/dev/null | tail -1 || echo "")
        if [ -n "$progress" ]; then
            log_status "📊 Progress: $progress"
        fi
        
        # Check for completion
        if grep -q "Final mutation score\|Mutation testing complete\|Done in" "$LOG_FILE" 2>/dev/null; then
            log_status "✅ COMPLETION DETECTED!"
            break
        fi
    fi
    
    log_status ""
    sleep $CHECK_INTERVAL
done

# Final status check
log_status ""
log_status "=========================================="
log_status "🎉 MUTATION TESTING COMPLETED"
log_status "=========================================="
log_status ""

# Final OOM count
final_oom=$(grep -c "ran out of memory" "$LOG_FILE" 2>/dev/null || echo "0")
log_status "📊 Final OOM Error Count: $final_oom"

if [ "$final_oom" -eq "0" ]; then
    log_status "✅ SUCCESS: Zero OOM errors! Memory leaks fixed!"
else
    log_status "⚠️ WARNING: $final_oom OOM errors detected"
fi

# Final mutation score
if [ -f "$LOG_FILE" ]; then
    final_score=$(grep -oE "Final mutation score of [0-9.]+" "$LOG_FILE" 2>/dev/null | tail -1 || echo "")
    if [ -n "$final_score" ]; then
        log_status "📊 $final_score"
    fi
    
    # Execution time
    exec_time=$(grep -oE "Done in [0-9]+ minutes? and [0-9]+ seconds?" "$LOG_FILE" 2>/dev/null | tail -1 || echo "")
    if [ -n "$exec_time" ]; then
        log_status "⏱️ Execution time: $exec_time"
    fi
    
    # Summary stats
    log_status ""
    log_status "📈 Summary Statistics:"
    grep -E "Test Suites:|Tests:|# killed|# survived|# timeout" "$LOG_FILE" 2>/dev/null | tail -5 | tee -a "$STATUS_LOG"
fi

log_status ""
log_status "Monitoring complete. Check $STATUS_LOG for full details."
