#!/bin/bash

LOG_FILE="stryker.log"
PID_FILE="mutation-test.pid"

echo "=== Mutation Testing Status Check ==="
echo ""

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p $PID > /dev/null 2>&1; then
    echo "✓ Mutation testing is RUNNING (PID: $PID)"
  else
    echo "✗ Mutation testing process NOT FOUND (may have completed)"
  fi
else
  echo "✗ PID file not found"
fi

echo ""
echo "=== Recent Log Activity ==="
if [ -f "$LOG_FILE" ]; then
  tail -30 "$LOG_FILE" 2>/dev/null
else
  echo "Log file not found yet..."
fi

echo ""
echo "=== Key Metrics ==="
if [ -f "$LOG_FILE" ]; then
  tail -500 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation testing|Initial test|DryRun|Instrumented|Found|Killed|Survived|Timeout|Mutation score|All mutants|progress|%)" | tail -15
fi
