#!/bin/bash

# Extract file-level mutation statistics from stryker log
LOG_FILE="stryker.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "Stryker log file not found: $LOG_FILE"
    exit 1
fi

echo "=== Analyzing mutation test results by file ==="
echo ""
echo "Extracting file-level statistics from stryker.log..."
echo ""

# Extract file paths and their mutation statuses
# Look for patterns like "src/hooks/useX.ts" followed by status indicators
tail -200000 "$LOG_FILE" 2>/dev/null | \
    grep -E "(survived|killed|timeout|NoCoverage)" | \
    grep -E "src/" | \
    grep -v "TRACE" | \
    sed -E 's/.*(src\/[^[:space:]]+\.(ts|tsx)).*/\1/' | \
    sort | uniq -c | sort -rn > /tmp/file_mutations.txt

# Also try to extract from mutation test output
if [ -f "mutation-test-output.log" ]; then
    echo "Current progress from mutation-test-output.log:"
    tail -5 mutation-test-output.log | grep "Mutation testing" | tail -1
    echo ""
fi

echo "Files with most mutations (from log analysis):"
echo "Count  File"
echo "-----  ----"
head -30 /tmp/file_mutations.txt

echo ""
echo "Note: This is an approximation based on log file analysis."
echo "For accurate results, wait for the mutation test to complete"
echo "and check the HTML report at reports/mutation/mutation.html"
