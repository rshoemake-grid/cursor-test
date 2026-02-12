#!/bin/bash

# Monitor Stryker Dry Run - Check every 5 minutes
# Detects crashes and completion

LOG_FILE="stryker-dryrun-monitor.log"
CHECK_INTERVAL=300  # 5 minutes
ITERATION=0

echo "========================================="
echo "Stryker Dry Run Monitor"
echo "Started: $(date)"
echo "Checking every 5 minutes"
echo "========================================="
echo ""

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_process_status() {
    # Check if main Stryker process is running
    if ps aux | grep -E "stryker.*dryRunOnly|74857" | grep -v grep | grep -q "stryker"; then
        return 0  # Running
    else
        return 1  # Not running
    fi
}

check_for_completion() {
    # Check for completion indicators in any log files
    local found_completion=false
    
    # Check for completion messages
    if find frontend -name "*.log" -type f -mmin -10 2>/dev/null | xargs grep -l "Dry run completed\|All tests passed\|Mutation test report" 2>/dev/null | head -1 | grep -q .; then
        found_completion=true
    fi
    
    # Check for error messages
    if find frontend -name "*.log" -type f -mmin -10 2>/dev/null | xargs grep -l "Something went wrong\|ConfigError\|Failed tests" 2>/dev/null | head -1 | grep -q .; then
        echo "ERROR_DETECTED"
        return 2
    fi
    
    if [ "$found_completion" = true ]; then
        return 0  # Completed
    fi
    
    return 1  # Still running
}

while true; do
    ITERATION=$((ITERATION + 1))
    current_time=$(date '+%H:%M:%S')
    
    log_message "=== Check #$ITERATION at $current_time ==="
    
    # Check if process is running
    if check_process_status; then
        log_message "✅ Stryker process is running"
        
        # Count processes
        process_count=$(ps aux | grep -E "stryker|jest" | grep -v grep | wc -l | tr -d ' ')
        log_message "   Active processes: $process_count"
        
        # Check for completion
        completion_status=$(check_for_completion)
        case $? in
            0)
                log_message "✅ DRY RUN COMPLETED SUCCESSFULLY!"
                log_message "Checking results..."
                break
                ;;
            2)
                log_message "❌ ERROR DETECTED IN LOGS!"
                log_message "Dry run may have failed"
                break
                ;;
        esac
        
    else
        log_message "⚠️  Stryker process NOT FOUND - may have completed or crashed"
        
        # Check for completion indicators
        completion_status=$(check_for_completion)
        case $? in
            0)
                log_message "✅ Process completed (checking for success indicators)"
                break
                ;;
            2)
                log_message "❌ ERROR DETECTED - Process may have crashed"
                break
                ;;
            *)
                log_message "❌ CRASH DETECTED - Process stopped but no completion found"
                break
                ;;
        esac
    fi
    
    log_message "   Next check in 5 minutes..."
    echo ""
    
    sleep $CHECK_INTERVAL
done

log_message ""
log_message "========================================="
log_message "Monitoring Complete"
log_message "========================================="
log_message ""
log_message "Checking final results..."

# Display final status
if check_for_completion | grep -q "ERROR_DETECTED"; then
    log_message "❌ DRY RUN FAILED"
    log_message "Check log files for details"
else
    log_message "✅ DRY RUN COMPLETED"
    log_message "Review results above"
fi
