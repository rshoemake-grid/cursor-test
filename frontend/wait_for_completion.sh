#!/bin/bash

# Wait for mutation testing completion and report results
# Checks every 5 minutes until completion

LOG_FILE="mutation_test.log"
CHECK_INTERVAL=300  # 5 minutes

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "Waiting for Mutation Testing Completion"
echo "Start Time: $(date)"
echo "Check Interval: Every 5 minutes"
echo "========================================="
echo ""

ITERATION=0

while true; do
    ITERATION=$((ITERATION + 1))
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$TIMESTAMP] Check #$ITERATION"
    
    if [ ! -f "$LOG_FILE" ]; then
        echo "  ⏳ Waiting for log file..."
        sleep 60
        continue
    fi
    
    # Check for completion
    if tail -200 "$LOG_FILE" | grep -qE "Mutation test report|Mutation score"; then
        echo ""
        echo "${GREEN}✅ MUTATION TESTING COMPLETED!${NC}"
        echo ""
        echo "--- Final Mutation Score ---"
        tail -200 "$LOG_FILE" | grep -A 15 "Mutation score" | head -20
        echo ""
        echo "--- Summary Statistics ---"
        tail -200 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error|Tested)" | tail -10
        echo ""
        echo "--- Report Location ---"
        echo "HTML Report: reports/mutation/html/index.html"
        echo "Log File: $LOG_FILE"
        echo ""
        echo "Completion Time: $(date)"
        echo "========================================="
        break
    fi
    
    # Show progress
    PROGRESS=$(tail -50 "$LOG_FILE" | grep -E "Mutation testing.*%" | tail -1)
    if [ -n "$PROGRESS" ]; then
        echo "  Progress: $PROGRESS"
    else
        echo "  Status: Initializing..."
    fi
    
    # Check for excessive crashes
    CRASH_COUNT=$(tail -200 "$LOG_FILE" | grep -cE "ChildProcessCrashedError" || echo "0")
    if [ "$CRASH_COUNT" -gt 50 ]; then
        echo ""
        echo "${RED}❌ Too many crashes detected ($CRASH_COUNT). Stopping monitoring.${NC}"
        exit 1
    fi
    
    echo "  Next check in 5 minutes..."
    echo ""
    sleep $CHECK_INTERVAL
done
