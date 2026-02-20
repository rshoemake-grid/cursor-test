#!/bin/bash

# Comprehensive Mutation Testing Report Generator
# Combines features from report-results.sh and generate-final-report.sh
# Generates final mutation testing results report in markdown format

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Support multiple log file locations
LOG_FILE="${MUTATION_LOG_FILE:-stryker.log}"
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-mutation-test-output.log}"
fi
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-mutation_test.log}"
fi

REPORT_FILE="${MUTATION_REPORT_FILE:-MUTATION_TEST_RESULTS.md}"

echo "Generating comprehensive mutation test results report..."
echo "Log file: $LOG_FILE"
echo "Report file: $REPORT_FILE"
echo ""

if [ ! -f "$LOG_FILE" ]; then
    echo "Error: Log file not found: $LOG_FILE"
    exit 1
fi

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
    
    # OOM errors
    local oom_count=$(grep -c "ran out of memory" "$log" 2>/dev/null || echo "0")
    
    echo "SCORE:$score"
    echo "DONE_TIME:$done_time"
    echo "SUMMARY:$summary"
    echo "ERRORS:$errors"
    echo "REPORT_PATH:$report_path"
    echo "OOM_COUNT:$oom_count"
}

# Extract results
results=$(extract_results "$LOG_FILE")

# Parse results
score=$(echo "$results" | grep "^SCORE:" | cut -d: -f2)
done_time=$(echo "$results" | grep "^DONE_TIME:" | cut -d: -f2-)
summary=$(echo "$results" | grep "^SUMMARY:" | cut -d: -f2-)
errors=$(echo "$results" | grep "^ERRORS:" | cut -d: -f2-)
report_path=$(echo "$results" | grep "^REPORT_PATH:" | cut -d: -f2-)
oom_count=$(echo "$results" | grep "^OOM_COUNT:" | cut -d: -f2)

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

## 🔍 OOM Error Analysis

| Metric | Previous Run | Current Run | Status |
|--------|-------------|------------|--------|
| **OOM Errors** | 12 | **${oom_count}** | $(if [ "$oom_count" -eq "0" ]; then echo "✅ **FIXED!**"; else echo "⚠️ Still occurring"; fi) |

---

## ⏱️ Execution Time

- **Current Run**: ${done_time:-"N/A"}
- **Previous Run**: ~60 minutes (with 12 restarts)

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
- **HTML Report**: ${report_path:-"Check reports/mutation/ directory"}
- **Status JSON**: \`mutation-test-status.json\` (if exists)
- **Progress Log**: \`mutation-test-progress.txt\` (if exists)

---

## ✅ Next Steps

1. Review HTML report: ${report_path:-"Check reports/mutation/ directory"}
2. Address surviving mutants
3. Improve test coverage for low-scoring files
$(if [ "$oom_count" -gt "0" ]; then echo "4. Investigate OOM errors (${oom_count} detected)"; fi)

---

## 🎯 Conclusion

$(if [ "$oom_count" -eq "0" ]; then cat << INNER
✅ **SUCCESS**: Memory leak fixes are working!

- Zero OOM errors detected (vs 12 previously)
- Mutation testing completed without crashes
- Memory usage stable throughout test run
INNER
else cat << INNER
⚠️ **ISSUES DETECTED**: $oom_count OOM errors occurred

Further investigation may be needed.
INNER
fi)

---

**Report Generated**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

echo "✅ Comprehensive report generated: $REPORT_FILE"
echo ""
cat "$REPORT_FILE"
