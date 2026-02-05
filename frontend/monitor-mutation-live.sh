#!/bin/bash

LOG_FILE=$(ls -t mutation-test-run-*.log 2>/dev/null | head -1)
if [ -z "$LOG_FILE" ]; then
  echo "No mutation test log file found"
  exit 1
fi

PID_FILE="mutation-test.pid"
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  echo "Monitoring mutation tests (PID: $PID)"
else
  echo "No PID file found, but monitoring log: $LOG_FILE"
fi

echo "Log file: $LOG_FILE"
echo "Press Ctrl+C to stop monitoring (tests will continue running)"
echo ""

# Function to extract key metrics
extract_metrics() {
  local log=$1
  tail -100 "$log" 2>/dev/null | grep -E "(Mutation testing|killed|survived|timed out|No coverage|Test Suites|PASS|FAIL|Mutation score|progress|mutant|DryRun|Initial test run|Instrumented|Found)" | tail -20
}

# Monitor loop
while true; do
  if ! pgrep -f "stryker run" > /dev/null 2>&1; then
    echo ""
    echo "=== Mutation Tests Completed ==="
    echo ""
    extract_metrics "$LOG_FILE"
    echo ""
    echo "=== Final Summary ==="
    tail -200 "$LOG_FILE" | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|Killed|Survived|Timeout|No coverage|mutant)" | tail -50
    break
  fi
  
  clear
  echo "=== Mutation Test Progress - $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo ""
  extract_metrics "$LOG_FILE"
  echo ""
  echo "--- Refreshing every 15 seconds (tests still running...) ---"
  echo "Log file size: $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) lines"
  
  sleep 15
done
