#!/bin/bash

LOG_FILE="stryker.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=60  # Check every minute
MAX_CHECKS=300     # Max 5 hours of monitoring

check_status() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      return 0  # Running
    else
      return 1  # Completed
    fi
  else
    return 1  # No PID file, assume completed
  fi
}

show_progress() {
  if [ -f "$LOG_FILE" ]; then
    echo "--- Progress Update ($(date '+%H:%M:%S')) ---"
    tail -300 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation score|All mutants|Killed|Survived|Timeout|Found|Instrumented|Initial test|DryRun|progress|%)" | tail -10
    echo ""
    echo "Log: $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) lines, $(du -h "$LOG_FILE" 2>/dev/null | cut -f1)"
  fi
}

checks=0
while [ $checks -lt $MAX_CHECKS ]; do
  if ! check_status; then
    echo "=========================================="
    echo "Mutation Testing COMPLETED!"
    echo "=========================================="
    echo ""
    show_progress
    echo ""
    echo "--- Final Results ---"
    tail -1000 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation score|All mutants|Killed|Survived|Timeout|Final)" | tail -20
    echo ""
    if [ -f "mutation-test-results.txt" ]; then
      echo "Full report: mutation-test-results.txt"
    fi
    exit 0
  fi
  
  checks=$((checks + 1))
  if [ $((checks % 5)) -eq 0 ]; then
    # Every 5 minutes, show progress
    echo "[Check #$checks - $(date '+%H:%M:%S')] Still running..."
    show_progress
  fi
  
  sleep $CHECK_INTERVAL
done

echo "Monitoring timeout reached. Checking final status..."
check_status || {
  echo "Tests completed!"
  tail -500 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation score|All mutants|Killed|Survived|Timeout|Final)" | tail -20
}
