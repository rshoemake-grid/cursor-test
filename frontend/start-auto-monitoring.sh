#!/bin/bash

# Start automated monitoring that runs every 5 minutes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MONITOR_SCRIPT="auto-monitor.sh"
LOG_FILE="mutation-monitor.log"

echo "Starting automated mutation testing monitoring..."
echo "Monitoring every 5 minutes..."
echo "Logs will be written to: $LOG_FILE"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Initialize start time
echo "$(date +%s)" > .mutation-start-time

# Run monitoring loop
while true; do
    "$MONITOR_SCRIPT"
    sleep 300  # 5 minutes = 300 seconds
done
