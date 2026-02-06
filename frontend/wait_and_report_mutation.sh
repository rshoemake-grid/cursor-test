#!/bin/bash

# Wait for mutation testing to complete and report results
# Checks every 5 minutes until completion

set -e

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$FRONTEND_DIR"

LOG_FILE="mutation_output.log"
MONITOR_LOG="mutation_monitor.log"
REPORT_FILE="mutation_final_report.txt"

echo "=========================================="
echo "Mutation Testing Monitor & Reporter"
echo "Start Time: $(date)"
echo "=========================================="
echo ""

# Function to check if mutation testing is running
is_running() {
    pgrep -f "stryker run" > /dev/null 2>&1 || pgrep -f "run_and_monitor_mutation" > /dev/null 2>&1
}

# Function to check if mutation testing completed
is_completed() {
    if [ ! -f "$LOG_FILE" ]; then
        return 1
    fi
    
    # Check for completion indicators
    if tail -200 "$LOG_FILE" | grep -qE "(Mutation test report|Mutation score|All mutants|Mutation testing.*completed)"; then
        return 0
    fi
    
    return 1
}

# Function to extract and display results
report_results() {
    echo ""
    echo "=========================================="
    echo "FINAL MUTATION TEST RESULTS"
    echo "Completion Time: $(date)"
    echo "=========================================="
    echo ""
    
    if [ ! -f "$LOG_FILE" ]; then
        echo "❌ Error: Mutation log file not found"
        return 1
    fi
    
    # Extract mutation score
    echo "=== MUTATION SCORE ==="
    tail -300 "$LOG_FILE" | grep -A 10 -E "(Mutation score|Mutation testing.*score)" | head -15 || echo "Score not found in expected format"
    echo ""
    
    # Extract summary statistics
    echo "=== SUMMARY STATISTICS ==="
    tail -300 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error|Tested|mutants)" | tail -20 || echo "Statistics not found"
    echo ""
    
    # Extract per-file breakdown if available
    echo "=== PER-FILE BREAKDOWN ==="
    tail -500 "$LOG_FILE" | grep -E "(\.ts|\.tsx).*\(.*%\)" | head -30 || echo "Per-file breakdown not available"
    echo ""
    
    # Show any errors or warnings
    echo "=== ERRORS OR WARNINGS ==="
    tail -300 "$LOG_FILE" | grep -iE "(error|warning|failed|exception)" | tail -10 || echo "No errors found"
    echo ""
    
    # Report location
    echo "=== REPORT LOCATION ==="
    if [ -d "reports/mutation/html" ]; then
        echo "HTML Report: reports/mutation/html/index.html"
        ls -lh reports/mutation/html/index.html 2>/dev/null || echo "HTML report not found"
    else
        echo "HTML report directory not found"
    fi
    echo ""
    echo "Full log: $LOG_FILE"
    echo ""
    
    # Save report to file
    {
        echo "Mutation Testing Final Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        tail -300 "$LOG_FILE" | grep -A 10 -E "(Mutation score|Mutation testing.*score)" | head -15
        echo ""
        tail -300 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error|Tested|mutants)" | tail -20
    } > "$REPORT_FILE"
    
    echo "Report saved to: $REPORT_FILE"
    echo ""
}

# Main monitoring loop
ITERATION=0
CHECK_INTERVAL=300  # 5 minutes

while true; do
    ITERATION=$((ITERATION + 1))
    ELAPSED=$((ITERATION * CHECK_INTERVAL / 60))
    
    echo "[$(date '+%H:%M:%S')] Check #$ITERATION (Elapsed: ${ELAPSED} minutes)"
    
    # Check if completed
    if is_completed; then
        echo "✅ Mutation testing completed!"
        sleep 5  # Wait for final log writes
        report_results
        break
    fi
    
    # Check if still running
    if is_running; then
        echo "⏳ Still running... (next check in 5 minutes)"
        
        # Show brief progress if available
        if [ -f "$LOG_FILE" ]; then
            PROGRESS=$(tail -50 "$LOG_FILE" | grep -E "(Mutant|progress|Tested)" | tail -1)
            if [ -n "$PROGRESS" ]; then
                echo "   Latest: $PROGRESS"
            fi
        fi
    else
        echo "⚠️  Mutation testing process not found"
        
        # Check if it completed before we noticed
        if is_completed; then
            echo "✅ Found completion in log!"
            report_results
            break
        else
            echo "❌ Process stopped unexpectedly"
            echo "Last 30 lines of log:"
            tail -30 "$LOG_FILE" 2>/dev/null || echo "Log file not found"
            exit 1
        fi
    fi
    
    echo ""
    
    # Wait 5 minutes
    sleep $CHECK_INTERVAL
done

echo ""
echo "=========================================="
echo "Monitoring Complete"
echo "End Time: $(date)"
echo "=========================================="
