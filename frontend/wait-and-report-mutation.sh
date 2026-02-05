#!/bin/bash

LOG_FILE="stryker.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes in seconds

echo "=== Mutation Testing Monitor ==="
echo "Checking every 5 minutes until completion..."
echo ""

if [ ! -f "$PID_FILE" ]; then
  echo "Error: PID file not found. Mutation testing may not be running."
  exit 1
fi

PID=$(cat "$PID_FILE")
echo "Monitoring mutation tests (PID: $PID)"
echo "Log file: $LOG_FILE"
echo ""

# Function to check if process is running
is_running() {
  if [ -f "$PID_FILE" ]; then
    ps -p $(cat "$PID_FILE") > /dev/null 2>&1
  else
    pgrep -f "stryker run" > /dev/null 2>&1
  fi
}

# Function to show progress
show_progress() {
  local log=$1
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo ""
  
  if [ -f "$log" ]; then
    # Extract key metrics
    echo "--- Current Status ---"
    tail -100 "$log" 2>/dev/null | grep -E "(Mutation testing|killed|survived|timed out|No coverage|Test Suites|PASS|FAIL|Mutation score|progress|mutant|DryRun|Initial test run|Instrumented|Found|Killed|Survived|Timeout|%)" | tail -20
    
    echo ""
    echo "--- Recent Activity ---"
    tail -15 "$log" 2>/dev/null
    
    echo ""
    echo "Log size: $(du -h "$log" 2>/dev/null | cut -f1) ($(wc -l < "$log" 2>/dev/null || echo 0) lines)"
  else
    echo "Log file not found yet..."
  fi
}

# Monitor loop
iteration=0
while is_running; do
  iteration=$((iteration + 1))
  clear
  echo "=== Mutation Testing Monitor (Check #$iteration) ==="
  echo ""
  show_progress "$LOG_FILE"
  echo ""
  echo "--- Next check in 5 minutes ---"
  
  # Wait 5 minutes
  sleep $CHECK_INTERVAL
done

# Tests completed
clear
echo "=== Mutation Tests Completed ==="
echo ""
show_progress "$LOG_FILE"
echo ""
echo "=== Final Summary ==="
if [ -f "$LOG_FILE" ]; then
  tail -300 "$LOG_FILE" | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|Killed|Survived|Timeout|No coverage|mutant|Mutation score|All mutants|Final)" | tail -50
fi

echo ""
echo "=== Checking for mutation report ==="
if [ -d "reports/mutation" ]; then
  echo "Mutation report directory found: reports/mutation"
  ls -lh reports/mutation/ 2>/dev/null | head -10
fi
