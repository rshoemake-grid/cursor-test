#!/bin/bash
LOG_FILE=$(ls -t mutation-test-run-*.log 2>/dev/null | head -1)
if [ -z "$LOG_FILE" ]; then
  echo "No mutation test log file found"
  exit 1
fi

echo "Monitoring mutation tests. Log file: $LOG_FILE"
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
  if ! pgrep -f "stryker run" > /dev/null; then
    echo ""
    echo "Mutation tests completed!"
    echo ""
    tail -100 "$LOG_FILE" | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score)" | tail -20
    echo ""
    echo "Full results:"
    tail -50 "$LOG_FILE"
    break
  fi
  
  PROGRESS=$(tail -20 "$LOG_FILE" 2>/dev/null | grep "Mutation testing" | tail -1)
  if [ ! -z "$PROGRESS" ]; then
    echo "$(date '+%H:%M:%S') - $PROGRESS"
  fi
  
  sleep 30
done
