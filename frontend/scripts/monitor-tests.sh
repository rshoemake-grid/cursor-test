#!/bin/bash
# Monitor test progress and show results as they happen

LOG_FILE="test-output.log"
COVERAGE_FILE="coverage/coverage-summary.json"

echo "Monitoring test execution..."
echo "Press Ctrl+C to stop monitoring (tests will continue running)"
echo ""

# Function to show current status
show_status() {
    if [ -f "$LOG_FILE" ]; then
        echo "=== Current Test Status ==="
        tail -100 "$LOG_FILE" | grep -E "PASS|FAIL" | tail -10
        echo ""
        
        if [ -f "$COVERAGE_FILE" ]; then
            echo "=== Current Coverage ==="
            python3 << 'PYTHON'
import json
import os
if os.path.exists('coverage/coverage-summary.json'):
    with open('coverage/coverage-summary.json', 'r') as f:
        data = json.load(f)
        total = data['total']
        print(f"Statements: {total['statements']['pct']:.1f}%")
        print(f"Branches: {total['branches']['pct']:.1f}%")
        print(f"Functions: {total['functions']['pct']:.1f}%")
        print(f"Lines: {total['lines']['pct']:.1f}%")
PYTHON
            echo ""
        fi
        
        # Check for failures
        FAILURES=$(tail -1000 "$LOG_FILE" | grep -c "FAIL src/" || echo "0")
        PASSES=$(tail -1000 "$LOG_FILE" | grep -c "PASS src/" || echo "0")
        echo "Recent: $PASSES passed, $FAILURES failed"
    else
        echo "Waiting for test log to be created..."
    fi
}

# Monitor loop
while true; do
    clear
    show_status
    sleep 5
done
