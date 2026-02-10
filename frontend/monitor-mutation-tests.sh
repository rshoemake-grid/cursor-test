#!/bin/bash

# Monitor mutation tests and display results when complete
# Checks every 5 minutes until completion

FRONTEND_DIR="/Users/rshoemake/Documents/cursor/cursor-test/frontend"
LOG_FILE="$FRONTEND_DIR/mutation-test-output.log"
PID_FILE="$FRONTEND_DIR/mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes in seconds

echo "🔍 Monitoring mutation tests..."
echo "Checking every 5 minutes..."
echo ""

# Function to check if process is still running
check_process() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0  # Process is running
        fi
    fi
    return 1  # Process is not running
}

# Function to check for completion indicators in log
check_completion() {
    if [ -f "$LOG_FILE" ]; then
        # Check for completion patterns
        if grep -q "Mutation testing complete\|Mutation score\|All tests done\|Final mutation score" "$LOG_FILE" 2>/dev/null; then
            return 0  # Completed
        fi
    fi
    return 1  # Not completed
}

# Function to display progress
show_progress() {
    if [ -f "$LOG_FILE" ]; then
        echo "📊 Current Progress (last 10 lines):"
        echo "----------------------------------------"
        tail -10 "$LOG_FILE" 2>/dev/null | grep -E "Mutation testing|mutants|killed|survived|score|%" || echo "Waiting for output..."
        echo "----------------------------------------"
        echo ""
    fi
}

# Initial check
iteration=0
while true; do
    iteration=$((iteration + 1))
    current_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$current_time] Check #$iteration"
    
    # Check if process is still running
    if ! check_process; then
        echo "⚠️  Process not found in PID file. Checking log for completion..."
        if check_completion; then
            echo "✅ Mutation testing appears to be complete!"
            break
        else
            echo "❓ Process status unclear. Checking log..."
        fi
    fi
    
    # Check for completion in log
    if check_completion; then
        echo "✅ Mutation testing complete!"
        break
    fi
    
    # Show progress
    show_progress
    
    # Wait 5 minutes before next check
    echo "⏳ Waiting 5 minutes until next check..."
    echo ""
    sleep $CHECK_INTERVAL
done

# Display final results
echo ""
echo "=========================================="
echo "🎉 MUTATION TESTING COMPLETE!"
echo "=========================================="
echo ""

if [ -f "$LOG_FILE" ]; then
    echo "📋 Final Results:"
    echo "----------------------------------------"
    # Extract key metrics
    echo ""
    echo "Overall Summary:"
    grep -E "Mutation score|Mutation testing complete|Final mutation score|Overall" "$LOG_FILE" | tail -5
    echo ""
    echo "Detailed Results:"
    grep -E "killed|survived|timeout|NoCoverage|Total" "$LOG_FILE" | tail -10
    echo ""
    echo "Full log available at: $LOG_FILE"
    echo ""
    
    # Try to find HTML report
    HTML_REPORT="$FRONTEND_DIR/reports/mutation/mutation.html"
    if [ -f "$HTML_REPORT" ]; then
        echo "📊 HTML Report: file://$HTML_REPORT"
    fi
fi

echo ""
echo "=========================================="
