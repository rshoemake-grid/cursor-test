#!/bin/bash

LOG_FILE="mutation-test-output.log"
echo "=== Mutation Test Progress Monitor ==="
echo "Monitoring: $LOG_FILE"
echo "Press Ctrl+C to stop"
echo ""

while true; do
  if [ ! -f "$LOG_FILE" ]; then
    echo "Log file not found. Waiting..."
    sleep 5
    continue
  fi

  # Check if mutation test is still running
  if ! pgrep -f "stryker run" > /dev/null; then
    echo ""
    echo "=== Mutation Tests Completed ==="
    echo ""
    tail -100 "$LOG_FILE" | grep -E "(Mutation testing|All tests|killed|survived|timed out|Mutation score|Final)" | tail -30
    echo ""
    echo "=== Final Summary ==="
    tail -50 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No Coverage|Mutation score|Final)" | tail -10
    break
  fi

  clear
  echo "=== Mutation Test Progress Monitor ==="
  echo "Time: $(date '+%H:%M:%S')"
  echo ""
  
  # Get latest progress line
  PROGRESS=$(tail -100 "$LOG_FILE" | grep "Mutation testing" | tail -1)
  if [ ! -z "$PROGRESS" ]; then
    echo "Current Progress:"
    echo "$PROGRESS"
    echo ""
  fi

  # Get statistics
  echo "=== Statistics ==="
  tail -200 "$LOG_FILE" | grep -E "(tested|survived|timed out)" | tail -5
  echo ""
  
  # Get any errors or warnings
  ERRORS=$(tail -100 "$LOG_FILE" | grep -iE "(error|fail)" | tail -3)
  if [ ! -z "$ERRORS" ]; then
    echo "=== Recent Errors/Warnings ==="
    echo "$ERRORS"
    echo ""
  fi

  echo "---"
  echo "Checking again in 30 seconds..."
  sleep 30
done
