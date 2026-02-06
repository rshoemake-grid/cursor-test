#!/bin/bash

# Mutation Testing Monitor Script
# Checks progress every 5 minutes until completion

PID_FILE="mutation_test.pid"
LOG_FILE="mutation_test.log"
CHECK_INTERVAL=300  # 5 minutes in seconds

if [ ! -f "$PID_FILE" ]; then
    echo "Error: PID file not found. Mutation testing may not be running."
    exit 1
fi

PID=$(cat "$PID_FILE")
echo "Monitoring mutation testing (PID: $PID)"
echo "Log file: $LOG_FILE"
echo "Checking every 5 minutes..."
echo ""

# Function to check if process is running
is_running() {
    ps -p "$PID" > /dev/null 2>&1
}

# Function to get last few lines of log
show_progress() {
    echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
    if [ -f "$LOG_FILE" ]; then
        echo "Last 20 lines of log:"
        tail -20 "$LOG_FILE"
        echo ""
        echo "---"
    fi
}

# Monitor loop
while is_running; do
    show_progress
    echo "Waiting 5 minutes for next check..."
    sleep "$CHECK_INTERVAL"
done

# Process completed
echo ""
echo "=== Mutation Testing Completed ==="
echo "Final log output:"
tail -50 "$LOG_FILE"

# Clean up
rm -f "$PID_FILE"
echo ""
echo "Monitoring complete!"
