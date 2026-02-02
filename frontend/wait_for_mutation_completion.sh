#!/bin/bash
LOG_FILE=$(ls -t mutation-test-final-*.log 2>/dev/null | head -1)
if [ -z "$LOG_FILE" ]; then
  LOG_FILE=$(ls -t mutation-test-run-*.log 2>/dev/null | head -1)
fi

echo "Monitoring mutation tests..."
echo "Log file: $LOG_FILE"
echo ""

# Wait for completion
while pgrep -f "stryker run" > /dev/null 2>&1; do
  sleep 60
  if [ ! -z "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
    PROGRESS=$(tail -10 "$LOG_FILE" 2>/dev/null | grep "Mutation testing" | tail -1)
    if [ ! -z "$PROGRESS" ]; then
      echo "$(date '+%H:%M:%S') - $PROGRESS"
    fi
  fi
done

echo ""
echo "=== MUTATION TESTS COMPLETED ==="
echo ""

if [ ! -z "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
  echo "Final Results:"
  tail -150 "$LOG_FILE" | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|completed|killed|survived|No coverage)" | tail -40
fi

# Check for HTML report
if [ -f "reports/mutation/mutation.html" ]; then
  echo ""
  echo "HTML report available at: reports/mutation/mutation.html"
fi
