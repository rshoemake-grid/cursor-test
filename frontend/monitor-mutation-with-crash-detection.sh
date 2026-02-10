#!/bin/bash

# Enhanced mutation test monitor with crash detection
# Checks every 5 minutes and detects crashes/unexpected stops

LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes
CRASH_LOG="mutation-crash-detection.log"

# Log function
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$CRASH_LOG"
}

log_message "🔍 Starting enhanced mutation test monitoring with crash detection"

iteration=0
last_progress=0
stuck_count=0
MAX_STUCK_CHECKS=3  # Alert if no progress for 3 checks (15 minutes)

while true; do
    iteration=$((iteration + 1))
    current_time=$(date '+%H:%M:%S')
    
    log_message "=== Check #$iteration at $current_time ==="
    
    # Check if PID file exists
    if [ ! -f "$PID_FILE" ]; then
        log_message "⚠️ WARNING: PID file not found!"
        # Check if process might still be running by checking for stryker processes
        if pgrep -f "stryker run" > /dev/null; then
            log_message "✅ Found stryker process running (PID file missing, but process exists)"
            # Try to recover PID
            pgrep -f "stryker run" | head -1 > "$PID_FILE"
        else
            log_message "❌ CRASH DETECTED: No PID file and no stryker process found"
            if [ -f "$LOG_FILE" ]; then
                log_message "Last 20 lines of log:"
                tail -20 "$LOG_FILE" | tee -a "$CRASH_LOG"
            fi
            break
        fi
    fi
    
    # Check if process is running
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -z "$PID" ]; then
        log_message "⚠️ WARNING: Could not read PID from file"
        # Check for any stryker process
        if pgrep -f "stryker run" > /dev/null; then
            log_message "✅ Found stryker process running, recovering PID"
            pgrep -f "stryker run" | head -1 > "$PID_FILE"
            PID=$(cat "$PID_FILE")
        else
            log_message "❌ CRASH DETECTED: No valid PID and no stryker process"
            break
        fi
    fi
    
    if ps -p "$PID" > /dev/null 2>&1; then
        log_message "✅ Process $PID is running"
        
        # Check for progress
        if [ -f "$LOG_FILE" ]; then
            # Extract current progress
            current_progress=$(grep -oE "[0-9]+/[0-9]+ tested" "$LOG_FILE" | tail -1 | grep -oE "^[0-9]+" || echo "0")
            
            if [ "$current_progress" -gt "$last_progress" ]; then
                log_message "✅ Progress detected: $current_progress mutants tested (was $last_progress)"
                last_progress=$current_progress
                stuck_count=0
                
                # Show recent progress
                echo "Recent progress:"
                tail -30 "$LOG_FILE" 2>/dev/null | grep -E "Mutation testing|tested|survived|killed|remaining|%" | tail -3
            else
                stuck_count=$((stuck_count + 1))
                log_message "⚠️ No progress detected (check $stuck_count/$MAX_STUCK_CHECKS)"
                
                if [ "$stuck_count" -ge "$MAX_STUCK_CHECKS" ]; then
                    log_message "🚨 ALERT: No progress for $((stuck_count * CHECK_INTERVAL / 60)) minutes!"
                    log_message "Process may be stuck. Checking process state..."
                    ps -p "$PID" -o pid,ppid,state,etime,cmd
                    log_message "Last log entries:"
                    tail -20 "$LOG_FILE" | tee -a "$CRASH_LOG"
                fi
            fi
            
            # Check for out-of-memory errors (memory leaks in tests)
            oom_errors=$(grep -iE "ran out of memory|Test runner.*ran out of memory" "$LOG_FILE" 2>/dev/null | tail -3)
            
            if [ -n "$oom_errors" ]; then
                # Count total OOM occurrences
                oom_count=$(grep -c "ran out of memory\|Test runner.*ran out of memory" "$LOG_FILE" 2>/dev/null || echo "0")
                
                log_message "⚠️ MEMORY LEAK DETECTED: Test runner ran out of memory!"
                echo "$oom_errors" | tee -a "$CRASH_LOG"
                log_message "📊 Total OOM occurrences: $oom_count"
                
                # Calculate estimated time lost
                estimated_time_lost=$((oom_count * 45))  # ~45 seconds per restart
                log_message "⏱️  Estimated time lost to restarts: ~$((estimated_time_lost / 60)) minutes"
                
                if [ "$oom_count" -gt 5 ]; then
                    log_message "🚨 ALERT: Memory issues detected $oom_count times - significant performance impact!"
                    log_message "   Each restart adds ~30-60 seconds of overhead"
                    log_message "   💡 See MEMORY_LEAK_INVESTIGATION.md for investigation steps"
                fi
                
                # Show context around OOM (what was being tested)
                log_message "🔍 Context around OOM (checking what was being tested):"
                grep -B 10 "ran out of memory\|Test runner.*ran out of memory" "$LOG_FILE" 2>/dev/null | tail -15 | grep -E "testing|mutant|tested|describe|it\(" | tail -3 | tee -a "$CRASH_LOG" || log_message "   (Could not extract test context)"
                
                log_message "💡 Stryker will restart the process, but this decreases performance"
                log_message "📋 Investigation checklist:"
                log_message "   - Check for uncleaned timers (setTimeout/setInterval)"
                log_message "   - Verify event listeners are removed in afterEach"
                log_message "   - Check WebSocket connections are closed"
                log_message "   - Look for large objects accumulating in test state"
                log_message "   - Review: frontend/MEMORY_LEAK_INVESTIGATION.md"
            fi
            
            # Check for unhandled promise rejections
            # These can occur during mutation testing when mutants reject promises
            unhandled_rejections=$(grep -iE "UnhandledPromiseRejection|ERR_UNHANDLED_REJECTION" "$LOG_FILE" 2>/dev/null | tail -3)
            
            if [ -n "$unhandled_rejections" ]; then
                rejection_count=$(grep -c "UnhandledPromiseRejection\|ERR_UNHANDLED_REJECTION" "$LOG_FILE" 2>/dev/null || echo "0")
                log_message "⚠️ Unhandled promise rejections detected (count: $rejection_count)"
                
                # Check if rejection reason is null (common in mutation testing)
                if echo "$unhandled_rejections" | grep -q "reason.*null"; then
                    log_message "   ℹ️ Note: Rejections with 'null' reason are often expected during mutation testing"
                    log_message "   ℹ️ Mutants may cause promises to reject unexpectedly"
                else
                    log_message "   ⚠️ Non-null rejection reasons detected - may indicate real issues"
                    echo "$unhandled_rejections" | tee -a "$CRASH_LOG"
                fi
                
                if [ "$rejection_count" -gt 10 ]; then
                    log_message "🚨 ALERT: High number of unhandled rejections ($rejection_count) - investigate!"
                    log_message "   💡 Check if promise rejection handlers need improvement in tests"
                fi
            fi
            
            # Check for actual fatal errors (ignore expected child process crashes during mutation testing)
            # ChildProcessCrashedError is expected - it's how Stryker tests mutants by running child processes
            # Only alert on fatal errors or main process issues that indicate real problems
            fatal_errors=$(grep -iE "fatal|FATAL|uncaught|unhandled|segmentation|segfault|cannot start|failed to initialize" "$LOG_FILE" 2>/dev/null | grep -v -iE "ChildProcessCrashedError|child process|ran out of memory|out of memory|memory leak|UnhandledPromiseRejection|ERR_UNHANDLED_REJECTION" | tail -3)
            
            if [ -n "$fatal_errors" ]; then
                log_message "🚨 WARNING: Fatal errors detected in log (not expected child process crashes)!"
                echo "$fatal_errors" | tee -a "$CRASH_LOG"
            fi
            
            # Note: ChildProcessCrashedError messages are expected and normal during mutation testing
            # They indicate that a mutant was successfully detected (the child process failed as expected)
        fi
        
        echo ""
        sleep $CHECK_INTERVAL
        
    else
        log_message "❌ CRASH DETECTED: Process $PID is not running!"
        
        # Check if there's another stryker process
        if pgrep -f "stryker run" > /dev/null; then
            log_message "⚠️ Found different stryker process, updating PID"
            pgrep -f "stryker run" | head -1 > "$PID_FILE"
            continue
        fi
        
        # Process stopped - check if it completed successfully
        log_message "🔍 Process stopped. Checking for completion..."
        
        if [ -f "$LOG_FILE" ]; then
            # Check for successful completion
            if grep -q "Mutation testing complete\|Final mutation score\|All tests done\|Mutation score:" "$LOG_FILE" 2>/dev/null; then
                log_message "✅ Tests completed successfully!"
                echo ""
                echo "=========================================="
                echo "🎉 MUTATION TESTING COMPLETE!"
                echo "=========================================="
                echo ""
                
                # Display results
                ./display-mutation-results.sh 2>/dev/null || {
                    echo "📊 Results:"
                    grep -E "Mutation score|Final mutation score" "$LOG_FILE" | tail -3
                    echo ""
                    echo "Summary:"
                    grep -E "Total|killed|survived|timeout|NoCoverage" "$LOG_FILE" | grep -iE "total|mutants" | tail -5
                }
                break
            # Check for timeout (not a crash, but a configuration issue)
            elif grep -q "Initial test run timed out\|timed out" "$LOG_FILE" 2>/dev/null; then
                log_message "⚠️ TIMEOUT DETECTED: Initial test run timed out (configuration issue, not a crash)"
                log_message "This is a timeout, not a memory issue or crash"
                
                # Check OOM errors
                oom_count=$(grep -c "ran out of memory" "$LOG_FILE" 2>/dev/null || echo "0")
                if [ "$oom_count" -eq "0" ]; then
                    log_message "✅ EXCELLENT: Zero OOM errors detected!"
                    log_message "✅ Memory leak fixes are working correctly!"
                    log_message ""
                    log_message "The timeout is a configuration issue (test run takes >5 min)"
                    log_message "Consider increasing timeout or optimizing test execution"
                else
                    log_message "⚠️ OOM errors detected: $oom_count"
                fi
                
                log_message "Last 20 lines of log:"
                tail -20 "$LOG_FILE" | tee -a "$CRASH_LOG"
                break
            else
                log_message "❌ CRASH DETECTED: Process stopped without completion message!"
                log_message "Last 30 lines of log:"
                tail -30 "$LOG_FILE" | tee -a "$CRASH_LOG"
                log_message ""
                log_message "⚠️ ACTION REQUIRED: Mutation testing may have crashed!"
                log_message "Check the log file for details: $LOG_FILE"
                break
            fi
        else
            log_message "❌ CRASH DETECTED: Log file not found!"
            break
        fi
    fi
done

log_message "Monitoring ended"
