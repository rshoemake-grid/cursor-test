#!/bin/bash
# Monitor mutation tests without interrupting them

LOG_FILE=$(ls -t mutation-test-*.log 2>/dev/null | head -1)

if [ -z "$LOG_FILE" ]; then
  echo "No mutation test log file found"
  exit 1
fi

echo "Monitoring mutation tests..."
echo "Log file: $LOG_FILE"
echo "Press Ctrl+C to stop monitoring (this won't stop the tests)"
echo ""

LAST_PROGRESS=""
PROGRESS_COUNT=0

while true; do
  # Check if Stryker process is still running
  if ! pgrep -f "stryker run" > /dev/null 2>&1; then
    echo ""
    echo "=== MUTATION TESTS COMPLETED ==="
    echo ""
    
    if [ -f "$LOG_FILE" ]; then
      echo "Final Results:"
      tail -200 "$LOG_FILE" | grep -E "(Mutation testing|killed|survived|timed out|Mutation score|All tests|Test Suites|completed|Summary)" | tail -50
      echo ""
      echo "Full final output:"
      tail -50 "$LOG_FILE"
    fi
    
    # Check for HTML report
    if [ -f "reports/mutation/mutation.html" ]; then
      echo ""
      echo "HTML report available at: reports/mutation/mutation.html"
    fi
    
    break
  fi
  
  # Show progress if log file exists and has new content
  if [ -f "$LOG_FILE" ]; then
    CURRENT_PROGRESS=$(tail -10 "$LOG_FILE" 2>/dev/null | grep "Mutation testing" | tail -1)
    
    if [ ! -z "$CURRENT_PROGRESS" ] && [ "$CURRENT_PROGRESS" != "$LAST_PROGRESS" ]; then
      echo "$(date '+%H:%M:%S') - $CURRENT_PROGRESS"
      LAST_PROGRESS="$CURRENT_PROGRESS"
      PROGRESS_COUNT=$((PROGRESS_COUNT + 1))
    fi
    
    # Show status every 10 progress updates
    if [ $PROGRESS_COUNT -gt 0 ] && [ $((PROGRESS_COUNT % 10)) -eq 0 ]; then
      echo "  [Still running... checked $PROGRESS_COUNT times]"
    fi
  fi
  
  sleep 60
done
