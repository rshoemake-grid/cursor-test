#!/bin/bash

# Continuous monitoring loop - checks every 5 minutes
# Run this script to continuously monitor mutation testing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_SCRIPT="$SCRIPT_DIR/check_mutation_progress.sh"
PID_FILE="$SCRIPT_DIR/mutation_test.pid"
LOG_FILE="$SCRIPT_DIR/mutation_test.log"
INTERVAL=300  # 5 minutes

echo "Starting continuous monitoring..."
echo "Will check every 5 minutes until mutation testing completes"
echo "Press Ctrl+C to stop monitoring (won't stop mutation testing)"
echo ""

# Function to check if mutation testing is still running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        ps -p "$PID" > /dev/null 2>&1
    else
        # Check for stryker process
        pgrep -f "stryker run" > /dev/null 2>&1
    fi
}

# Check counter
CHECK_COUNT=0

while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    echo ""
    echo "=========================================="
    echo "Check #$CHECK_COUNT - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    
    # Run progress check
    "$CHECK_SCRIPT"
    
    # Check if mutation testing is still running
    if ! is_running; then
        echo ""
        echo "🎉 Mutation testing appears to have completed!"
        echo "Showing final results..."
        echo ""
        
        # Show final log output
        if [ -f "$LOG_FILE" ]; then
            echo "=== Final Log Output ==="
            tail -100 "$LOG_FILE"
        fi
        
        echo ""
        echo "Monitoring complete. Exiting."
        exit 0
    fi
    
    echo ""
    echo "Next check in 5 minutes..."
    sleep "$INTERVAL"
done
