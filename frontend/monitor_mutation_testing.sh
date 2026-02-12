#!/bin/bash

# Comprehensive mutation testing monitor
# Checks every 5 minutes for progress, crashes, and completion

LOG_FILE="/tmp/stryker-mutation.log"
PROGRESS_LOG="/tmp/mutation-progress.log"
LAST_SIZE=0
CHECK_COUNT=0
CRASH_COUNT=0
START_TIME=$(date)
STUCK_THRESHOLD=600  # 10 minutes without progress

echo "==========================================" | tee -a "$PROGRESS_LOG"
echo "Mutation Testing Monitor Started" | tee -a "$PROGRESS_LOG"
echo "Started at: $START_TIME" | tee -a "$PROGRESS_LOG"
echo "Monitoring every 5 minutes..." | tee -a "$PROGRESS_LOG"
echo "==========================================" | tee -a "$PROGRESS_LOG"
echo ""

while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    CURRENT_TIME=$(date)
    
    echo "[$CURRENT_TIME] Check #$CHECK_COUNT" | tee -a "$PROGRESS_LOG"
    echo "----------------------------------------" | tee -a "$PROGRESS_LOG"
    
    # Check if Stryker process is still running (check for both "stryker run" and "stryker" processes)
    STRYKER_PID=$(ps aux | grep -iE "stryker run|^[^ ]+ +[0-9]+ +[0-9.]+ +[0-9.]+ +[0-9]+ +[0-9]+ +[^ ]+ +[^ ]+ +[^ ]+ +stryker[^a-z]" | grep -v grep | grep -v "monitor" | awk '{print $2}' | head -1)
    
    # If not found, try simpler pattern
    if [ -z "$STRYKER_PID" ]; then
        STRYKER_PID=$(ps aux | grep -i "stryker" | grep -v grep | grep -v "monitor" | grep -v "worker" | awk '{print $2}' | head -1)
    fi
    
    if [ -z "$STRYKER_PID" ]; then
        echo "[$CURRENT_TIME] ⚠️  WARNING: Stryker process not found!" | tee -a "$PROGRESS_LOG"
        CRASH_COUNT=$((CRASH_COUNT + 1))
        
        if [ $CRASH_COUNT -ge 2 ]; then
            echo "[$CURRENT_TIME] ❌ CRASH DETECTED: Stryker has crashed!" | tee -a "$PROGRESS_LOG"
            echo "[$CURRENT_TIME] Stryker process stopped unexpectedly" | tee -a "$PROGRESS_LOG"
            echo "[$CURRENT_TIME] Check logs for error details" | tee -a "$PROGRESS_LOG"
            
            # Check for completion
            if [ -f "$LOG_FILE" ] && grep -q "Mutation testing\|Done in\|Your report can be found" "$LOG_FILE"; then
                echo "[$CURRENT_TIME] ✅ Mutation testing appears to have completed!" | tee -a "$PROGRESS_LOG"
                break
            else
                echo "[$CURRENT_TIME] ❌ Mutation testing crashed before completion" | tee -a "$PROGRESS_LOG"
                break
            fi
        fi
    else
        CRASH_COUNT=0
        echo "[$CURRENT_TIME] ✓ Stryker process running (PID: $STRYKER_PID)" | tee -a "$PROGRESS_LOG"
        
        # Check process status
        PROCESS_INFO=$(ps -p "$STRYKER_PID" -o etime,pcpu,pmem,state 2>/dev/null | tail -1)
        echo "[$CURRENT_TIME] Process info: $PROCESS_INFO" | tee -a "$PROGRESS_LOG"
    fi
    
    # Check log file for progress
    if [ -f "$LOG_FILE" ]; then
        CURRENT_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
        SIZE_DIFF=$((CURRENT_SIZE - LAST_SIZE))
        
        if [ "$CURRENT_SIZE" -gt "$LAST_SIZE" ]; then
            echo "[$CURRENT_TIME] ✓ Progress detected (log size: $CURRENT_SIZE bytes, +$SIZE_DIFF bytes)" | tee -a "$PROGRESS_LOG"
            LAST_SIZE=$CURRENT_SIZE
            
            # Extract progress information
            echo "--- Recent Progress ---" | tee -a "$PROGRESS_LOG"
            
            # Check for mutation progress
            MUTATION_PROGRESS=$(grep -E "Mutation testing|tested|survived|killed|timeout" "$LOG_FILE" | tail -3)
            if [ -n "$MUTATION_PROGRESS" ]; then
                echo "$MUTATION_PROGRESS" | tee -a "$PROGRESS_LOG"
            fi
            
            # Check for test progress
            TEST_PROGRESS=$(grep -E "Test Suites|Tests:|PASS|FAIL" "$LOG_FILE" | tail -3)
            if [ -n "$TEST_PROGRESS" ]; then
                echo "$TEST_PROGRESS" | tee -a "$PROGRESS_LOG"
            fi
            
            # Show last few lines
            tail -5 "$LOG_FILE" | grep -v "^$" | tee -a "$PROGRESS_LOG"
            echo "---" | tee -a "$PROGRESS_LOG"
        else
            echo "[$CURRENT_TIME] ⚠️  No progress detected (log size unchanged: $CURRENT_SIZE bytes)" | tee -a "$PROGRESS_LOG"
            
            # Check if stuck
            if [ "$SIZE_DIFF" -eq 0 ] && [ "$CHECK_COUNT" -gt 2 ]; then
                echo "[$CURRENT_TIME] ⚠️  Warning: No progress for multiple checks" | tee -a "$PROGRESS_LOG"
            fi
        fi
        
        # Check for errors
        ERROR_COUNT=$(grep -i "error\|failed\|crash\|exception" "$LOG_FILE" | tail -20 | wc -l | tr -d ' ')
        if [ "$ERROR_COUNT" -gt 0 ]; then
            echo "[$CURRENT_TIME] ⚠️  Found $ERROR_COUNT recent error messages" | tee -a "$PROGRESS_LOG"
            echo "--- Recent Errors ---" | tee -a "$PROGRESS_LOG"
            grep -i "error\|failed\|crash\|exception" "$LOG_FILE" | tail -3 | tee -a "$PROGRESS_LOG"
            echo "---" | tee -a "$PROGRESS_LOG"
        fi
        
        # Check for completion
        if grep -q "Mutation testing.*complete\|Done in\|Your report can be found\|Mutation score" "$LOG_FILE"; then
            echo "[$CURRENT_TIME] ✅ Mutation testing appears to have completed!" | tee -a "$PROGRESS_LOG"
            echo "--- Completion Details ---" | tee -a "$PROGRESS_LOG"
            grep -A 10 "Mutation testing.*complete\|Done in\|Your report can be found\|Mutation score" "$LOG_FILE" | tail -15 | tee -a "$PROGRESS_LOG"
            echo "---" | tee -a "$PROGRESS_LOG"
            break
        fi
    else
        echo "[$CURRENT_TIME] ⚠️  Log file not found: $LOG_FILE" | tee -a "$PROGRESS_LOG"
    fi
    
    # Check system resources
    MEMORY_USAGE=$(ps aux | grep -E "stryker|node.*stryker" | grep -v grep | awk '{sum+=$6} END {print sum/1024}' | awk '{printf "%.1f", $1}')
    echo "[$CURRENT_TIME] 💾 Memory usage: ${MEMORY_USAGE}MB" | tee -a "$PROGRESS_LOG"
    
    # Calculate elapsed time
    ELAPSED=$(($(date +%s) - $(date -d "$START_TIME" +%s 2>/dev/null || date +%s)))
    ELAPSED_MIN=$((ELAPSED / 60))
    echo "[$CURRENT_TIME] ⏱️  Elapsed time: ${ELAPSED_MIN} minutes" | tee -a "$PROGRESS_LOG"
    
    echo "[$CURRENT_TIME] Check #$CHECK_COUNT complete. Waiting 5 minutes..." | tee -a "$PROGRESS_LOG"
    echo "" | tee -a "$PROGRESS_LOG"
    
    sleep 300  # Wait 5 minutes
done

END_TIME=$(date)
echo "==========================================" | tee -a "$PROGRESS_LOG"
echo "Monitoring completed at: $END_TIME" | tee -a "$PROGRESS_LOG"
echo "Total checks: $CHECK_COUNT" | tee -a "$PROGRESS_LOG"
echo "==========================================" | tee -a "$PROGRESS_LOG"
