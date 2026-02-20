#!/bin/bash

# Automated Mutation Testing Monitor
# Runs monitor script every 5 minutes until completion or crash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/monitor-mutation-test.sh"
LOG_FILE="$SCRIPT_DIR/monitoring.log"
ALERT_FILE="$SCRIPT_DIR/mutation-test-alert.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Starting Automated Mutation Test Monitor"
echo "=========================================="
echo "Monitor script: $MONITOR_SCRIPT"
echo "Check interval: 5 minutes"
echo "Log file: $LOG_FILE"
echo "Alert file: $ALERT_FILE"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo "=========================================="
echo ""

# Function to check for completion
check_completion() {
    local status_file="$SCRIPT_DIR/mutation-test-status.json"
    if [ -f "$status_file" ]; then
        local progress=$(grep -o '"progress":"[^"]*"' "$status_file" | cut -d'"' -f4)
        if [[ "$progress" == COMPLETED* ]]; then
            return 0
        fi
    fi
    return 1
}

# Function to check for crash
check_crash() {
    local status_file="$SCRIPT_DIR/mutation-test-status.json"
    if [ -f "$status_file" ]; then
        local process_status=$(grep -o '"process_status":"[^"]*"' "$status_file" | cut -d'"' -f4)
        if [[ "$process_status" == "STOPPED" ]]; then
            # Check if it completed successfully
            local progress=$(grep -o '"progress":"[^"]*"' "$status_file" | cut -d'"' -f4)
            if [[ "$progress" != COMPLETED* ]]; then
                return 0  # Crashed
            fi
        fi
    fi
    return 1
}

# Function to send alert
send_alert() {
    local message="$1"
    echo ""
    echo -e "${RED}=========================================="
    echo -e "🚨 ALERT: $message"
    echo -e "==========================================${NC}"
    echo ""
    
    # Write to alert file
    cat > "$ALERT_FILE" << EOF
ALERT: Mutation Testing Crash Detected
Time: $(date '+%Y-%m-%d %H:%M:%S')
Message: $message

=== Status ===
$(cat "$SCRIPT_DIR/mutation-test-status.json" 2>/dev/null || echo "Status file not found")

=== Recent Log Entries ===
$(tail -50 "$SCRIPT_DIR/stryker.log" 2>/dev/null || echo "Log file not found")
EOF
    
    echo "Alert saved to: $ALERT_FILE"
}

# Function to report completion
report_completion() {
    echo ""
    echo -e "${GREEN}=========================================="
    echo -e "✅ Mutation Testing Completed!"
    echo -e "==========================================${NC}"
    echo ""
    
    # Extract final results
    echo "=== FINAL RESULTS ==="
    if [ -f "$SCRIPT_DIR/stryker.log" ]; then
        tail -100 "$SCRIPT_DIR/stryker.log" | grep -iE "mutation score|killed|survived|timeout|no coverage|Done in" | tail -20
    fi
    
    echo ""
    echo "=== Full Report ==="
    echo "Check: $SCRIPT_DIR/reports/mutation/mutation.html"
    echo ""
    
    # Save completion report
    cat > "$SCRIPT_DIR/mutation-test-completion-report.txt" << EOF
Mutation Testing Completion Report
==================================
Completed: $(date '+%Y-%m-%d %H:%M:%S')

=== Final Results ===
$(tail -100 "$SCRIPT_DIR/stryker.log" 2>/dev/null | grep -iE "mutation score|killed|survived|timeout|no coverage|Done in" | tail -20)

=== Full Report Location ===
$SCRIPT_DIR/reports/mutation/mutation.html

=== Status History ===
$(tail -20 "$SCRIPT_DIR/mutation-test-progress.txt" 2>/dev/null || echo "No progress history")
EOF
    
    echo "Completion report saved to: mutation-test-completion-report.txt"
}

# Main monitoring loop
iteration=0
while true; do
    iteration=$((iteration + 1))
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] Check #$iteration"
    echo "----------------------------------------"
    
    # Run monitor script
    "$MONITOR_SCRIPT" | tee -a "$LOG_FILE"
    
    # Check for completion
    if check_completion; then
        report_completion
        echo ""
        echo "Monitoring stopped - Test completed successfully"
        break
    fi
    
    # Check for crash
    if check_crash; then
        send_alert "Mutation testing process stopped unexpectedly (CRASH DETECTED)"
        echo ""
        echo "Monitoring stopped - Crash detected"
        break
    fi
    
    echo ""
    echo "Next check in 5 minutes..."
    echo ""
    
    # Wait 5 minutes (300 seconds)
    sleep 300
done
