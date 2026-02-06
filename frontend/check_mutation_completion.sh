#!/bin/bash

# Check mutation testing completion and report results

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "Mutation Testing Status Check"
echo "Time: $(date)"
echo "========================================="
echo ""

# Check if process is running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "${GREEN}✅ Mutation testing is running (PID: $PID)${NC}"
    else
        echo "${YELLOW}⚠️  PID file exists but process not running${NC}"
    fi
else
    echo "${YELLOW}⚠️  No PID file found${NC}"
fi

echo ""

# Check for completion
if [ -f "$LOG_FILE" ]; then
    # Check if completed
    if tail -200 "$LOG_FILE" | grep -qE "Mutation test report|Mutation score"; then
        echo "${GREEN}✅ MUTATION TESTING COMPLETED!${NC}"
        echo ""
        echo "--- Final Results ---"
        tail -200 "$LOG_FILE" | grep -A 20 "Mutation score" | head -25
        echo ""
        echo "--- Summary ---"
        tail -200 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error|Tested)" | tail -10
        echo ""
        echo "Full report: reports/mutation/html/index.html"
    else
        # Show current progress
        PROGRESS=$(tail -50 "$LOG_FILE" | grep -E "Mutation testing.*%" | tail -1)
        if [ -n "$PROGRESS" ]; then
            echo "Current Progress:"
            echo "$PROGRESS"
        else
            echo "Initializing..."
        fi
        
        # Check for crashes
        CRASHES=$(tail -100 "$LOG_FILE" 2>/dev/null | grep -cE "ChildProcessCrashedError|exited unexpectedly" 2>/dev/null)
        CRASHES=${CRASHES:-0}
        if [ "$CRASHES" -gt 0 ] 2>/dev/null; then
            echo ""
            echo "${YELLOW}⚠️  Detected $CRASHES crash(es) in recent logs${NC}"
            echo "Recent crashes:"
            tail -100 "$LOG_FILE" | grep -E "ChildProcessCrashedError|exited unexpectedly" | tail -3
        fi
    fi
else
    echo "${YELLOW}⚠️  Log file not found${NC}"
fi

echo ""
echo "========================================="
