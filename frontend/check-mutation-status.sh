#!/bin/bash

LOG_FILE=$(ls -t mutation-test-run-*.log 2>/dev/null | head -1)

if [ -z "$LOG_FILE" ]; then
  echo "No mutation test log file found"
  exit 1
fi

echo "=== Mutation Test Status Check - $(date '+%Y-%m-%d %H:%M:%S') ==="
echo ""

if pgrep -f "stryker run" > /dev/null 2>&1 || pgrep -f "child-process-proxy-worker" > /dev/null 2>&1; then
  echo "Status: RUNNING"
  echo "Log file: $LOG_FILE"
  echo "Log size: $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) lines"
  echo ""
  echo "=== Latest Progress ==="
  tail -30 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation testing|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|progress|mutant|DryRun|Initial test run|Instrumented|Found|Mutant|Killed|Survived|Timeout)" | tail -8 || tail -8 "$LOG_FILE"
  echo ""
  echo "=== Worker Processes ==="
  WORKER_COUNT=$(ps aux | grep -E "stryker|child-process-proxy-worker" | grep -v grep | wc -l | xargs)
  echo "Active workers: $WORKER_COUNT"
else
  echo "Status: COMPLETED or STOPPED"
  echo ""
  echo "=== Final Results ==="
  tail -150 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|Killed|Survived|Timeout|No coverage|mutant|Mutation score|Final)" | tail -40
fi

echo ""
echo "Next check in 15 minutes..."
