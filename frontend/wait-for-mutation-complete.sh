#!/bin/bash

# Wait for mutation tests to complete and display results
# Checks every 5 minutes

LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes

echo "🔍 Monitoring mutation tests..."
echo "Checking every 5 minutes..."
echo ""

iteration=0
while true; do
    iteration=$((iteration + 1))
    current_time=$(date '+%H:%M:%S')
    
    # Check if PID file exists and process is running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
            echo "[$current_time] Check #$iteration - ✅ Still running"
            if [ -f "$LOG_FILE" ]; then
                # Show recent progress
                echo "Recent progress:"
                tail -30 "$LOG_FILE" 2>/dev/null | grep -E "mutants|killed|survived|score|%|Testing|Running|DryRun" | tail -5 || echo "  Waiting for detailed output..."
            fi
            echo ""
            sleep $CHECK_INTERVAL
            continue
        fi
    fi
    
    # Process not running, check if complete
    echo "[$current_time] Process finished. Checking results..."
    
    if [ -f "$LOG_FILE" ]; then
        # Check for completion indicators
        if grep -q "Mutation testing complete\|Final mutation score\|All tests done\|Mutation score:" "$LOG_FILE" 2>/dev/null; then
            echo ""
            echo "=========================================="
            echo "🎉 MUTATION TESTING COMPLETE!"
            echo "=========================================="
            echo ""
            
            # Extract and display results
            echo "📊 FINAL RESULTS:"
            echo "----------------------------------------"
            
            # Overall score
            echo ""
            echo "Overall Mutation Score:"
            grep -E "Mutation score|Final mutation score|Overall" "$LOG_FILE" | tail -3
            
            # Summary statistics
            echo ""
            echo "Summary Statistics:"
            grep -E "Total|killed|survived|timeout|NoCoverage|Error" "$LOG_FILE" | grep -E "mutants|Total" | tail -10
            
            # Key files we refactored
            echo ""
            echo "Key Files (from our refactoring):"
            echo "----------------------------------------"
            for file in "WebSocketConnectionManager.ts" "ConditionNodeEditor.tsx" "useExecutionPolling.ts" "useMarketplaceIntegration.ts" "nodeConversion.ts"; do
                grep -i "$file" "$LOG_FILE" | grep -E "score|killed|survived" | tail -1 || echo "  $file: (check HTML report for details)"
            done
            
            # HTML report location
            HTML_REPORT="reports/mutation/mutation.html"
            if [ -f "$HTML_REPORT" ]; then
                echo ""
                echo "📊 Detailed HTML Report:"
                echo "file://$(pwd)/$HTML_REPORT"
            fi
            
            echo ""
            echo "Full log: $LOG_FILE"
            echo "=========================================="
            break
        else
            echo "⚠️ Process ended but completion message not found in log"
            echo "Last 20 lines of log:"
            tail -20 "$LOG_FILE"
            break
        fi
    else
        echo "❌ Log file not found: $LOG_FILE"
        break
    fi
done
