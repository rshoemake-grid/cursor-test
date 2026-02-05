#!/bin/bash

LOG_FILE=$(ls -t mutation-test-run-*.log 2>/dev/null | head -1)
if [ -z "$LOG_FILE" ]; then
  echo "No mutation test log file found"
  exit 1
fi

echo "Monitoring mutation tests..."
echo "Log file: $LOG_FILE"
echo "Press Ctrl+C to stop (tests will continue running)"
echo ""

while true; do
  if ! pgrep -f "stryker run" > /dev/null 2>&1 && ! pgrep -f "child-process-proxy-worker" > /dev/null 2>&1; then
    echo ""
    echo "=== Mutation Tests Completed ==="
    echo ""
    tail -200 "$LOG_FILE" | grep -E "(Mutation testing|All tests|killed|survived|timed out|Mutation score|Killed|Survived|Timeout|Final|File|total|covered)" | tail -60
    break
  fi
  
  clear
  echo "=== Mutation Test Progress - $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo ""
  tail -20 "$LOG_FILE" | grep -E "(Mutation testing|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|progress|mutant|DryRun|Initial test run|Instrumented|Found)" | tail -8 || tail -8 "$LOG_FILE"
  echo ""
  echo "Log size: $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) lines"
  echo "Workers: $(ps aux | grep -E "stryker|child-process-proxy-worker" | grep -v grep | wc -l | xargs)"
  echo ""
  echo "--- Refreshing every 30 seconds ---"
  
  sleep 30
done
