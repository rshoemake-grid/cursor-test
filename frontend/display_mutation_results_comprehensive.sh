#!/bin/bash

# Comprehensive Mutation Results Display
# Combines features from display-mutation-results.sh and get-mutation-results.sh
# Displays mutation testing results with comprehensive information

set -e

# Support multiple log file locations
LOG_FILE="${MUTATION_LOG_FILE:-mutation-test-output.log}"
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-stryker.log}"
fi
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-mutation_test.log}"
fi

HTML_REPORT="reports/mutation/mutation.html"
if [ ! -f "$HTML_REPORT" ]; then
    HTML_REPORT="reports/mutation/html/index.html"
fi

echo ""
echo "=========================================="
echo "🎉 MUTATION TESTING RESULTS"
echo "=========================================="
echo ""

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Log file not found: $LOG_FILE"
    echo "Tried: mutation-test-output.log, stryker.log, mutation_test.log"
    exit 1
fi

# Extract overall score
echo "📊 OVERALL MUTATION SCORE:"
echo "----------------------------------------"
grep -E "Mutation score|Final mutation score|Overall mutation score" "$LOG_FILE" | tail -3 || echo "Score not found"
echo ""

# Extract summary statistics
echo "📈 SUMMARY STATISTICS:"
echo "----------------------------------------"
grep -E "Total.*mutants|killed|survived|timeout|NoCoverage|Error" "$LOG_FILE" | grep -iE "total|mutants|killed|survived" | tail -10 || echo "Statistics not found"
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

# Per-file breakdown if available
echo "📋 PER-FILE BREAKDOWN:"
echo "----------------------------------------"
tail -500 "$LOG_FILE" | grep -E "(\.ts|\.tsx).*\(.*%\)" | head -30 || echo "Per-file breakdown not available"
echo ""

# Errors or warnings
echo "⚠️  ERRORS OR WARNINGS:"
echo "----------------------------------------"
tail -300 "$LOG_FILE" | grep -iE "(error|warning|failed|exception)" | tail -10 || echo "No errors found"
echo ""

# HTML report
if [ -f "$HTML_REPORT" ]; then
    echo "📊 Detailed HTML Report:"
    echo "file://$(pwd)/$HTML_REPORT"
    echo ""
elif [ -d "reports/mutation" ]; then
    echo "📊 HTML Report Location:"
    find reports/mutation -name "*.html" -type f | head -3
    echo ""
fi

echo "Full log: $LOG_FILE"
echo "=========================================="
