#!/bin/bash

LOG_FILE="mutation-test-output.log"
HTML_REPORT="reports/mutation/mutation.html"

echo ""
echo "=========================================="
echo "🎉 MUTATION TESTING RESULTS"
echo "=========================================="
echo ""

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    exit 1
fi

# Extract overall score
echo "📊 OVERALL MUTATION SCORE:"
echo "----------------------------------------"
grep -E "Mutation score|Final mutation score|Overall mutation score" "$LOG_FILE" | tail -3
echo ""

# Extract summary statistics
echo "📈 SUMMARY STATISTICS:"
echo "----------------------------------------"
grep -E "Total.*mutants|killed|survived|timeout|NoCoverage|Error" "$LOG_FILE" | grep -iE "total|mutants|killed|survived" | tail -10
echo ""

# Key files we refactored
echo "🔧 KEY REFACTORED FILES:"
echo "----------------------------------------"
for file in "WebSocketConnectionManager" "ConditionNodeEditor" "useExecutionPolling" "useMarketplaceIntegration" "nodeConversion" "formUtils" "errorHandler" "storageHelpers" "workflowFormat" "ownershipUtils"; do
    result=$(grep -i "$file" "$LOG_FILE" | grep -E "score|killed|survived|%" | tail -1)
    if [ -n "$result" ]; then
        echo "$file: $result"
    fi
done
echo ""

# HTML report
if [ -f "$HTML_REPORT" ]; then
    echo "📊 Detailed HTML Report:"
    echo "file://$(pwd)/$HTML_REPORT"
    echo ""
fi

echo "Full log: $LOG_FILE"
echo "=========================================="
