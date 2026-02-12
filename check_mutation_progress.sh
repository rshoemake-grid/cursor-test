#!/bin/bash

# Quick progress checker for mutation tests
# Run this to check current status

LOG_FILE="frontend/mutation_test.log"
PID_FILE="frontend/mutation_test.pid"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Mutation Test Progress Check"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# Check if PID file exists
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "${GREEN}✅ Mutation tests running (PID: $PID)${NC}"
    else
        echo "${RED}❌ Process not running (PID file exists but process dead)${NC}"
    fi
else
    # Check for any stryker process
    if pgrep -f "stryker run" > /dev/null; then
        echo "${GREEN}✅ Stryker process found running${NC}"
    else
        echo "${YELLOW}⚠️  No mutation test process found${NC}"
    fi
fi

echo ""

# Check log file
if [ -f "$LOG_FILE" ]; then
    echo "--- Progress ---"
    tail -100 "$LOG_FILE" | grep -E "Mutation testing|tested|killed|survived|timeout|No coverage|Mutation score|%" | tail -10
    
    echo ""
    echo "--- Recent Activity ---"
    tail -5 "$LOG_FILE" | sed 's/^/  /'
    
    echo ""
    echo "--- Crash Detection ---"
    if tail -200 "$LOG_FILE" | grep -qiE "(crash|error|fatal|killed|out of memory)"; then
        echo "${RED}⚠️  Potential issues detected:${NC}"
        tail -200 "$LOG_FILE" | grep -iE "(crash|error|fatal|killed|out of memory)" | tail -5
    else
        echo "${GREEN}✅ No crash indicators found${NC}"
    fi
    
    echo ""
    echo "--- Completion Check ---"
    if tail -300 "$LOG_FILE" | grep -qiE "(Mutation test report|Mutation score|All mutants|Final|completed)"; then
        echo "${GREEN}✅ Tests appear to be completed${NC}"
        echo ""
        echo "--- Final Results ---"
        tail -500 "$LOG_FILE" | grep -E "(Mutation score|Killed|Survived|Timeout|No coverage|Error)" | tail -20
    else
        echo "${YELLOW}⏳ Tests still running...${NC}"
    fi
    
    echo ""
    echo "Log size: $(du -h "$LOG_FILE" 2>/dev/null | cut -f1) ($(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) lines)"
else
    echo "${YELLOW}Log file not found yet...${NC}"
fi

echo ""
echo "========================================="
