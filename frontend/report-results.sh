#!/bin/bash

# Generate final mutation testing results report

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/stryker.log"
REPORT_FILE="$SCRIPT_DIR/MUTATION_TEST_RESULTS.md"

echo "Generating mutation test results report..."

# Extract key information from log
extract_results() {
    local log="$1"
    
    # Final mutation score
    local score=$(grep -i "mutation score" "$log" | tail -1 | grep -oE "[0-9]+\.[0-9]+" | head -1)
    
    # Completion time
    local done_time=$(grep -i "Done in" "$log" | tail -1)
    
    # Summary table
    local summary=$(grep -A 20 "All files" "$log" | tail -20)
    
    # Errors
    local errors=$(grep -iE "ERROR|failed tests" "$log" | tail -10)
    
    # Report file location
    local report_path=$(grep -i "report can be found at" "$log" | tail -1 | grep -oE "file://[^ ]+")
    
    echo "SCORE:$score"
    echo "DONE_TIME:$done_time"
    echo "SUMMARY:$summary"
    echo "ERRORS:$errors"
    echo "REPORT_PATH:$report_path"
}

if [ ! -f "$LOG_FILE" ]; then
    echo "Error: Log file not found: $LOG_FILE"
    exit 1
fi

# Extract results
results=$(extract_results "$LOG_FILE")

# Parse results
score=$(echo "$results" | grep "^SCORE:" | cut -d: -f2)
done_time=$(echo "$results" | grep "^DONE_TIME:" | cut -d: -f2-)
summary=$(echo "$results" | grep "^SUMMARY:" | cut -d: -f2-)
errors=$(echo "$results" | grep "^ERRORS:" | cut -d: -f2-)
report_path=$(echo "$results" | grep "^REPORT_PATH:" | cut -d: -f2-)

# Generate report
cat > "$REPORT_FILE" << EOF
# Mutation Testing Results Report

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Log File**: $LOG_FILE

---

## 📊 Summary

**Mutation Score**: ${score:-"Not found"}  
**Completion Time**: ${done_time:-"Not found"}  
**Report Location**: ${report_path:-"Not found"}

---

## 📈 Detailed Results

\`\`\`
${summary:-"Summary not found in log"}
\`\`\`

---

## ⚠️ Errors/Warnings

\`\`\`
${errors:-"No errors found"}
\`\`\`

---

## 📁 Files

- **Full Log**: \`$LOG_FILE\`
- **HTML Report**: ${report_path:-"Not found"}
- **Status JSON**: \`mutation-test-status.json\`
- **Progress Log**: \`mutation-test-progress.txt\`

---

## ✅ Next Steps

1. Review HTML report: ${report_path:-"Check reports/mutation/ directory"}
2. Address surviving mutants
3. Improve test coverage for low-scoring files

---

**Report Generated**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo "Results report generated: $REPORT_FILE"
cat "$REPORT_FILE"
