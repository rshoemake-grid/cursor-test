#!/bin/bash

LOG_FILE="stryker.log"
PID_FILE="mutation-test.pid"
REPORT_FILE="mutation-test-results.txt"

echo "=========================================="
echo "Mutation Testing Status & Results"
echo "=========================================="
echo ""

# Check if still running
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p $PID > /dev/null 2>&1; then
    echo "Status: RUNNING (PID: $PID)"
    echo ""
    echo "--- Current Progress ---"
    if [ -f "$LOG_FILE" ]; then
      tail -200 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation testing|Initial test|DryRun|Instrumented|Found|Killed|Survived|Timeout|Mutation score|All mutants|progress|%)" | tail -20
    fi
  else
    echo "Status: COMPLETED"
    echo ""
    echo "--- Final Results ---"
    if [ -f "$LOG_FILE" ]; then
      tail -500 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|Killed|Survived|Timeout|No coverage|mutant|Mutation score|All mutants|Final)" | tail -50
    fi
    
    if [ -f "$REPORT_FILE" ]; then
      echo ""
      echo "--- Full Report Available ---"
      echo "See: $REPORT_FILE"
    fi
    
    if [ -d "reports/mutation" ]; then
      echo ""
      echo "--- HTML Report ---"
      echo "Location: reports/mutation/mutation.html"
      ls -lh reports/mutation/*.html 2>/dev/null | head -3
    fi
  fi
else
  echo "Status: PID file not found"
fi

echo ""
echo "--- Log File Info ---"
if [ -f "$LOG_FILE" ]; then
  echo "Size: $(du -h "$LOG_FILE" | cut -f1)"
  echo "Lines: $(wc -l < "$LOG_FILE")"
else
  echo "Log file not found"
fi
