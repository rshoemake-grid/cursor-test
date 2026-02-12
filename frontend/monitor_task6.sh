#!/bin/bash

# Task 6 Mutation Test Monitor
# Checks progress every 5 minutes and reports results

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"
CHECK_INTERVAL=300  # 5 minutes

echo "========================================="
echo "Task 6: Mutation Test Monitor"
echo "Started: $(date)"
echo "Checking every 5 minutes..."
echo "========================================="
echo ""

# Function to check if process is running
is_running() {
    if [ ! -f "$PID_FILE" ]; then
        return 1
    fi
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -z "$PID" ]; then
        return 1
    fi
    ps -p "$PID" > /dev/null 2>&1
}

# Function to extract and display progress
show_progress() {
    local iteration=$1
    echo "========================================="
    echo "Progress Check #$iteration - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "========================================="
    echo ""
    
    if [ ! -f "$LOG_FILE" ]; then
        echo "⚠️  Log file not found yet..."
        return
    fi
    
    # Check if process is still running
    if ! is_running; then
        echo "✅ Mutation tests appear to have completed"
        echo ""
    fi
    
    # Extract key metrics
    echo "--- Current Status ---"
    tail -200 "$LOG_FILE" 2>/dev/null | grep -E "(Mutation testing|killed|survived|timed out|No coverage|Test Suites|PASS|FAIL|Mutation score|progress|mutant|DryRun|Initial test run|Instrumented|Found|Killed|Survived|Timeout|%|mutants tested|mutants remaining)" | tail -25
    
    echo ""
    echo "--- Recent Activity (last 10 lines) ---"
    tail -10 "$LOG_FILE" 2>/dev/null
    
    echo ""
    echo "--- Log Statistics ---"
    echo "Log size: $(du -h "$LOG_FILE" 2>/dev/null | cut -f1) ($(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) lines)"
    
    # Check for completion indicators
    if tail -100 "$LOG_FILE" 2>/dev/null | grep -qE "(Mutation test report|Mutation score|All mutants|Final|completed)"; then
        echo ""
        echo "🎉 COMPLETION DETECTED!"
    fi
}

# Initial check
show_progress 0

# Monitoring loop
iteration=1
while is_running; do
    echo ""
    echo "--- Waiting 5 minutes until next check ---"
    echo "Press Ctrl+C to stop monitoring (tests will continue)"
    echo ""
    sleep $CHECK_INTERVAL
    
    clear
    show_progress $iteration
    iteration=$((iteration + 1))
done

# Final report
clear
echo "========================================="
echo "Mutation Tests Completed!"
echo "Completion Time: $(date)"
echo "========================================="
echo ""

show_progress "FINAL"

echo ""
echo "========================================="
echo "Final Results Summary"
echo "========================================="
echo ""

if [ -f "$LOG_FILE" ]; then
    echo "--- Mutation Score ---"
    tail -500 "$LOG_FILE" | grep -E "(Mutation score|Mutation Score)" | tail -5
    
    echo ""
    echo "--- Final Statistics ---"
    tail -500 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error|mutants|Total)" | tail -20
    
    echo ""
    echo "--- No Coverage Mutations (Key Metric) ---"
    tail -500 "$LOG_FILE" | grep -iE "(no coverage|No Coverage)" | tail -10
fi

echo ""
echo "========================================="
echo "Report Location"
echo "========================================="
if [ -d "reports/mutation" ]; then
    echo "HTML Report: reports/mutation/html/index.html"
    ls -lh reports/mutation/ 2>/dev/null | head -5
fi
echo "Log File: $LOG_FILE"
echo ""
