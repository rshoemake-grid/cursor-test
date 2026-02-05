#!/bin/bash

LOG_FILE="stryker.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes in seconds
REPORT_FILE="mutation-test-results.txt"

echo "=========================================="
echo "Mutation Testing Monitor & Reporter"
echo "=========================================="
echo "Started: $(date)"
echo "Checking every 5 minutes until completion"
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
    tail -200 "$log" 2>/dev/null | grep -E "(Mutation testing|Initial test|DryRun|Instrumented|Found|Killed|Survived|Timeout|Mutation score|All mutants|progress|%)" | tail -25
    
    echo ""
    echo "--- Recent Activity ---"
    tail -20 "$log" 2>/dev/null
    
    echo ""
    echo "Log size: $(du -h "$log" 2>/dev/null | cut -f1) ($(wc -l < "$log" 2>/dev/null || echo 0) lines)"
  else
    echo "Log file not found yet..."
  fi
}

# Monitor loop
iteration=0
start_time=$(date +%s)

while is_running; do
  iteration=$((iteration + 1))
  elapsed=$(( $(date +%s) - start_time ))
  hours=$((elapsed / 3600))
  minutes=$(((elapsed % 3600) / 60))
  
  clear
  echo "=========================================="
  echo "Mutation Testing Monitor (Check #$iteration)"
  echo "Elapsed time: ${hours}h ${minutes}m"
  echo "=========================================="
  echo ""
  show_progress "$LOG_FILE"
  echo ""
  echo "--- Next check in 5 minutes ---"
  echo "Press Ctrl+C to stop monitoring (tests will continue running)"
  
  # Wait 5 minutes
  sleep $CHECK_INTERVAL
done

# Tests completed
clear
end_time=$(date +%s)
total_time=$((end_time - start_time))
hours=$((total_time / 3600))
minutes=$(((total_time % 3600) / 60))

echo "=========================================="
echo "Mutation Tests Completed!"
echo "Total time: ${hours}h ${minutes}m"
echo "Completed: $(date)"
echo "=========================================="
echo ""
show_progress "$LOG_FILE"
echo ""

# Generate comprehensive report
echo "=========================================="
echo "Generating Final Report..."
echo "=========================================="

{
  echo "Mutation Testing Results Report"
  echo "Generated: $(date)"
  echo "Total execution time: ${hours}h ${minutes}m"
  echo ""
  echo "=========================================="
  echo "FINAL SUMMARY"
  echo "=========================================="
  
  if [ -f "$LOG_FILE" ]; then
    echo ""
    echo "--- Mutation Score & Statistics ---"
    tail -500 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation testing|All tests|killed|survived|timed out|Test Suites|PASS|FAIL|Mutation score|Killed|Survived|Timeout|No coverage|mutant|Mutation score|All mutants|Final)" | tail -50
    
    echo ""
    echo "--- Detailed Results ---"
    tail -1000 "$LOG_FILE" 2>/dev/null | grep -E "(Killed|Survived|Timeout|No coverage)" | tail -100
  fi
  
  echo ""
  echo "=========================================="
  echo "Report Files"
  echo "=========================================="
  if [ -d "reports/mutation" ]; then
    echo "Mutation report directory: reports/mutation"
    ls -lh reports/mutation/ 2>/dev/null
    echo ""
    if [ -f "reports/mutation/mutation.html" ]; then
      echo "HTML report available at: reports/mutation/mutation.html"
    fi
  fi
  
} | tee "$REPORT_FILE"

echo ""
echo "=========================================="
echo "Report saved to: $REPORT_FILE"
echo "=========================================="
