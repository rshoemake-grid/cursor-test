#!/bin/bash
LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes
MONITOR_LOG="mutation-monitor-complete.log"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$MONITOR_LOG"
echo "🔍 Mutation Testing Monitor - Started at $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$MONITOR_LOG"
echo "Checking every 5 minutes for crashes and completion..." | tee -a "$MONITOR_LOG"
echo "" | tee -a "$MONITOR_LOG"

iteration=0
last_pid=""
crashed=false

while true; do
    iteration=$((iteration + 1))
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$MONITOR_LOG"
    echo "=== Check #$iteration at $timestamp ===" | tee -a "$MONITOR_LOG"
    echo "" | tee -a "$MONITOR_LOG"
    
    # Check if process is running
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        PID=$(cat "$PID_FILE")
        runtime=$(ps -p $PID -o etime= | tr -d ' ')
        
        # Detect if PID changed (process restarted/crashed)
        if [ -n "$last_pid" ] && [ "$PID" != "$last_pid" ]; then
            echo "⚠️  CRASH DETECTED: Process restarted!" | tee -a "$MONITOR_LOG"
            echo "   Previous PID: $last_pid" | tee -a "$MONITOR_LOG"
            echo "   New PID: $PID" | tee -a "$MONITOR_LOG"
            crashed=true
        fi
        last_pid=$PID
        
        echo "✅ Process RUNNING" | tee -a "$MONITOR_LOG"
        echo "   PID: $PID" | tee -a "$MONITOR_LOG"
        echo "   Runtime: $runtime" | tee -a "$MONITOR_LOG"
        
        # Check for OOM errors
        if grep -q "ran out of memory" "$LOG_FILE" 2>/dev/null; then
            oom_count=$(grep -c "ran out of memory" "$LOG_FILE" 2>/dev/null | head -1)
            echo "   ⚠️  WARNING: $oom_count OOM error(s) detected!" | tee -a "$MONITOR_LOG"
            crashed=true
        else
            echo "   ✅ No memory leaks detected" | tee -a "$MONITOR_LOG"
        fi
        
        # Check for other errors
        error_count=$(grep -cE "ERROR|Error: Something went wrong" "$LOG_FILE" 2>/dev/null | head -1 || echo "0")
        if [ "$error_count" -gt 0 ]; then
            echo "   ⚠️  $error_count error(s) found in log" | tee -a "$MONITOR_LOG"
        fi
        
        # Check if completed
        if grep -q "Final mutation score\|Done in\|Mutation testing complete" "$LOG_FILE" 2>/dev/null; then
            echo "" | tee -a "$MONITOR_LOG"
            echo "🎉🎉🎉 MUTATION TESTING COMPLETED! 🎉🎉🎉" | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            
            if [ "$crashed" = true ]; then
                echo "⚠️  NOTE: Process experienced crashes/restarts during execution" | tee -a "$MONITOR_LOG"
                echo "" | tee -a "$MONITOR_LOG"
            fi
            
            echo "=== Final Results ===" | tee -a "$MONITOR_LOG"
            grep -E "Final mutation score|Done in" "$LOG_FILE" | tail -5 | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            
            echo "=== Mutation Score Breakdown ===" | tee -a "$MONITOR_LOG"
            grep -E "[0-9]+ (killed|survived|timeout|no coverage|error)" "$LOG_FILE" | tail -15 | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            
            if [ -d "reports/mutation" ]; then
                echo "=== HTML Report ===" | tee -a "$MONITOR_LOG"
                echo "file://$(pwd)/reports/mutation/mutation.html" | tee -a "$MONITOR_LOG"
            fi
            
            echo "" | tee -a "$MONITOR_LOG"
            echo "✅ Monitoring complete - Results reported above" | tee -a "$MONITOR_LOG"
            break
        fi
        
        # Show progress
        echo "" | tee -a "$MONITOR_LOG"
        echo "📊 Current Progress:" | tee -a "$MONITOR_LOG"
        if grep -q "Mutation testing [0-9]+%" "$LOG_FILE" 2>/dev/null; then
            progress_line=$(grep -E "Mutation testing [0-9]+%" "$LOG_FILE" 2>/dev/null | tail -1)
            if [ -n "$progress_line" ]; then
                echo "   $progress_line" | tee -a "$MONITOR_LOG"
            fi
            stats=$(grep -E "[0-9]+ tested|[0-9]+ survived|[0-9]+ killed" "$LOG_FILE" 2>/dev/null | tail -3)
            if [ -n "$stats" ]; then
                echo "$stats" | sed 's/^/   /' | tee -a "$MONITOR_LOG"
            fi
        else
            echo "   Initial test run phase (DryRunExecutor)..." | tee -a "$MONITOR_LOG"
            last_line=$(tail -1 "$LOG_FILE" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-120)
            if [ -n "$last_line" ]; then
                echo "   $last_line" | tee -a "$MONITOR_LOG"
            fi
        fi
        
        echo "" | tee -a "$MONITOR_LOG"
        echo "⏳ Next check in 5 minutes..." | tee -a "$MONITOR_LOG"
        echo "" | tee -a "$MONITOR_LOG"
        sleep $CHECK_INTERVAL
        
    else
        echo "❌ Process STOPPED" | tee -a "$MONITOR_LOG"
        
        # Check if it completed successfully
        if grep -q "Final mutation score\|Done in\|Mutation testing complete" "$LOG_FILE" 2>/dev/null; then
            echo "" | tee -a "$MONITOR_LOG"
            echo "🎉🎉🎉 MUTATION TESTING COMPLETED! 🎉🎉🎉" | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            
            if [ "$crashed" = true ]; then
                echo "⚠️  NOTE: Process experienced crashes/restarts during execution" | tee -a "$MONITOR_LOG"
                echo "" | tee -a "$MONITOR_LOG"
            fi
            
            echo "=== Final Results ===" | tee -a "$MONITOR_LOG"
            grep -E "Final mutation score|Done in" "$LOG_FILE" | tail -5 | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            
            echo "=== Mutation Score Breakdown ===" | tee -a "$MONITOR_LOG"
            grep -E "[0-9]+ (killed|survived|timeout|no coverage|error)" "$LOG_FILE" | tail -15 | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            
            if [ -d "reports/mutation" ]; then
                echo "=== HTML Report ===" | tee -a "$MONITOR_LOG"
                echo "file://$(pwd)/reports/mutation/mutation.html" | tee -a "$MONITOR_LOG"
            fi
        else
            echo "" | tee -a "$MONITOR_LOG"
            echo "⚠️  CRASH DETECTED: Process stopped unexpectedly!" | tee -a "$MONITOR_LOG"
            crashed=true
            echo "" | tee -a "$MONITOR_LOG"
            echo "=== Last 30 lines of log ===" | tee -a "$MONITOR_LOG"
            tail -30 "$LOG_FILE" 2>/dev/null | sed 's/^/   /' | tee -a "$MONITOR_LOG"
            echo "" | tee -a "$MONITOR_LOG"
            echo "=== Error Summary ===" | tee -a "$MONITOR_LOG"
            if grep -q "ERROR\|Error" "$LOG_FILE" 2>/dev/null; then
                echo "Errors found:" | tee -a "$MONITOR_LOG"
                grep -E "ERROR|Error" "$LOG_FILE" | tail -5 | sed 's/^/   /' | tee -a "$MONITOR_LOG"
            fi
            if grep -q "ran out of memory" "$LOG_FILE" 2>/dev/null; then
                oom_total=$(grep "ran out of memory" "$LOG_FILE" | wc -l | tr -d ' ')
                echo "OOM errors: $oom_total" | tee -a "$MONITOR_LOG"
            fi
            if grep -q "timed out\|timeout" "$LOG_FILE" 2>/dev/null; then
                echo "Timeout detected" | tee -a "$MONITOR_LOG"
            fi
        fi
        break
    fi
done

echo "" | tee -a "$MONITOR_LOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$MONITOR_LOG"
echo "✅ Monitoring complete at $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$MONITOR_LOG"
