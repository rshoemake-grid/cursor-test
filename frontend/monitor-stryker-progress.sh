#!/bin/bash

LOG_FILE="stryker.log"
PID_FILE="mutation-test.pid"

if [ ! -f "$LOG_FILE" ]; then
  echo "stryker.log not found. Waiting for it to be created..."
  while [ ! -f "$LOG_FILE" ]; do sleep 2; done
fi

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  echo "Monitoring Stryker mutation tests (PID: $PID)"
else
  echo "Monitoring Stryker mutation tests (checking for running process)"
fi

echo "Log file: $LOG_FILE ($(du -h "$LOG_FILE" 2>/dev/null | cut -f1))"
echo "Press Ctrl+C to stop monitoring (tests will continue running)"
echo ""

# Function to show progress
show_progress() {
  local log=$1
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo ""
  
  # Extract key metrics
  tail -100 "$log" 2>/dev/null | grep -E "(Mutation testing|killed|survived|timed out|No coverage|Test Suites|PASS|FAIL|Mutation score|progress|mutant|DryRun|Initial test run|Instrumented|Found|Killed|Survived|Timeout|%)" | tail -15
  
  # Show recent activity
  echo ""
  echo "--- Recent Activity ---"
  tail -10 "$log" 2>/dev/null | tail -5
  
  echo ""
  echo "Log size: $(du -h "$log" 2>/dev/null | cut -f1) ($(wc -l < "$log" 2>/dev/null || echo 0) lines)"
}

# Check if stryker is running
check_stryker() {
  if [ -f "$PID_FILE" ]; then
    ps -p $(cat "$PID_FILE") > /dev/null 2>&1
  else
    pgrep -f "stryker run" > /dev/null 2>&1
  fi
}

# Monitor loop
while check_stryker; do
  clear
  show_progress "$LOG_FILE"
  echo ""
  echo "--- Refreshing every 15 seconds ---"
  sleep 15
done

clear
echo "=== Mutation Tests Completed ==="
echo ""
show_progress "$LOG_FILE"
echo ""
echo "=== Final Summary ==="
tail -200 "$LOG_FILE" | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|Killed|Survived|Timeout|No coverage|mutant|Mutation score|All mutants)" | tail -50
