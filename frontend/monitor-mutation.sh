#!/bin/bash
PID_FILE="mutation-test.pid"
LOG_FILE="mutation-test-output.log"
STRYKER_LOG="stryker.log"

if [ ! -f "$PID_FILE" ]; then
    echo "No mutation test PID file found"
    exit 1
fi

PID=$(cat "$PID_FILE")

if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "Process $PID is not running"
    exit 1
fi

echo "=== Mutation Test Status ==="
echo "PID: $PID"
echo "Status: Running"
echo ""

# Check progress from output log
if [ -f "$LOG_FILE" ]; then
    echo "=== Progress from output log ==="
    tail -20 "$LOG_FILE" | grep -E "(Mutation testing|tested|survived|killed|timeout|noCoverage|error)" | tail -5
    echo ""
fi

# Check for errors
if [ -f "$LOG_FILE" ]; then
    ERROR_COUNT=$(grep -c "Child process.*exited unexpectedly\|Error\|error" "$LOG_FILE" 2>/dev/null || echo "0")
    echo "Error count in log: $ERROR_COUNT"
fi

# Check stryker log size
if [ -f "$STRYKER_LOG" ]; then
    LOG_SIZE=$(du -h "$STRYKER_LOG" | cut -f1)
    echo "Stryker log size: $LOG_SIZE"
fi

echo ""
echo "Last updated: $(date)"
