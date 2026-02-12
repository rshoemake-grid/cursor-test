#!/bin/bash

# Task 6 Mutation Test Monitor
# Monitors mutation testing every 5 minutes, detects crashes, reports results

set -e

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"
CHECK_INTERVAL=300  # 5 minutes in seconds
START_TIME=$(date +%s)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Task 6: Mutation Test Monitor"
echo "Start Time: $(date)"
echo "========================================="
echo ""

# Function to check if process is running
is_running() {
    if [ ! -f "$PID_FILE" ]; then
        return 1
    fi
    
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -z "$PID" ]; then
        return 1
    fi
    
    if ps -p "$PID" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check for crashes
check_crashes() {
    if [ ! -f "$LOG_FILE" ]; then
        return 0
    fi
    
    # Check for crash patterns
    if tail -200 "$LOG_FILE" | grep -qiE "(ChildProcessCrashedError|exited unexpectedly|FATAL|CRASH|killed|segmentation fault|out of memory)"; then
        return 1
    fi
    
    return 0
}

# Function to extract progress
extract_progress() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "Log file not found"
        return
    fi
    
    # Try multiple patterns to find progress
    PROGRESS=$(tail -200 "$LOG_FILE" | grep -oE "[0-9]+/[0-9]+.*tested|Mutation testing.*[0-9]+%|progress.*[0-9]+%" | tail -1)
    
    if [ -z "$PROGRESS" ]; then
        # Try to find any progress indicators
        PROGRESS=$(tail -100 "$LOG_FILE" | grep -E "tested|mutant|%" | tail -1)
    fi
    
    echo "$PROGRESS"
}

# Function to extract key metrics
extract_metrics() {
    if [ ! -f "$LOG_FILE" ]; then
        return
    fi
    
    # Extract killed, survived, timeout, no coverage, errors
    tail -500 "$LOG_FILE" | grep -E "Killed|Survived|Timeout|No coverage|Error|Mutation score" | tail -10
}

# Function to check if completed
is_completed() {
    if [ ! -f "$LOG_FILE" ]; then
        return 1
    fi
    
    # Check for completion indicators
    if tail -300 "$LOG_FILE" | grep -qiE "(Mutation test report|Mutation score|All mutants|Final|completed)"; then
        return 0
    fi
    
    return 1
}

# Start mutation tests if not already running
if [ ! -f "$PID_FILE" ] || ! is_running; then
    echo "${BLUE}Starting mutation test suite...${NC}"
    echo ""
    
    # Clean up old logs
    rm -f "$LOG_FILE" "$PID_FILE"
    
    # Start mutation tests in background
    cd "$(dirname "$0")"
    npm run test:mutation > "$LOG_FILE" 2>&1 &
    MUTATION_PID=$!
    echo "$MUTATION_PID" > "$PID_FILE"
    
    echo "${GREEN}✅ Mutation tests started (PID: $MUTATION_PID)${NC}"
    echo "Log file: $LOG_FILE"
    echo ""
    sleep 10  # Wait a bit for initial output
fi

# Monitoring loop
iteration=0
last_progress=""
stuck_count=0
MAX_STUCK_CHECKS=6  # Alert after 30 minutes of no progress

echo "${BLUE}Monitoring mutation tests (checking every 5 minutes)...${NC}"
echo "Press Ctrl+C to stop monitoring (tests will continue running)"
echo ""

while true; do
    iteration=$((iteration + 1))
    elapsed=$(( $(date +%s) - START_TIME ))
    elapsed_min=$((elapsed / 60))
    
    echo ""
    echo "========================================="
    echo "${BLUE}Check #$iteration - $(date '+%H:%M:%S') - Elapsed: ${elapsed_min} minutes${NC}"
    echo "========================================="
    
    # Check if process is running
    if ! is_running; then
        echo ""
        echo "${RED}❌ CRASH DETECTED: Mutation test process is not running!${NC}"
        echo ""
        
        # Check for crash indicators in log
        if check_crashes; then
            echo "No explicit crash detected in logs, but process stopped unexpectedly"
        else
            echo "${RED}Crash indicators found in log:${NC}"
            tail -50 "$LOG_FILE" | grep -iE "(crash|error|fatal|killed)" | tail -10
        fi
        
        # Check if it completed normally
        if is_completed; then
            echo ""
            echo "${GREEN}✅ Tests appear to have completed normally${NC}"
            break
        else
            echo ""
            echo "${RED}Tests did not complete normally - checking final log state...${NC}"
            break
        fi
    fi
    
    # Check for crashes in log
    if ! check_crashes; then
        echo ""
        echo "${RED}⚠️  CRASH INDICATORS DETECTED IN LOG:${NC}"
        tail -50 "$LOG_FILE" | grep -iE "(crash|error|fatal|killed|out of memory)" | tail -10
        echo ""
    fi
    
    # Show progress
    current_progress=$(extract_progress)
    
    if [ -n "$current_progress" ] && [ "$current_progress" != "$last_progress" ]; then
        echo "${GREEN}📊 Progress: $current_progress${NC}"
        last_progress="$current_progress"
        stuck_count=0
    else
        stuck_count=$((stuck_count + 1))
        if [ "$stuck_count" -ge "$MAX_STUCK_CHECKS" ]; then
            echo "${YELLOW}⚠️  No progress detected for $((stuck_count * 5)) minutes${NC}"
        else
            echo "${YELLOW}⏳ Waiting for progress update...${NC}"
        fi
    fi
    
    # Show recent metrics if available
    metrics=$(extract_metrics)
    if [ -n "$metrics" ]; then
        echo ""
        echo "--- Current Metrics ---"
        echo "$metrics"
    fi
    
    # Show recent log activity
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "--- Recent Activity (last 10 lines) ---"
        tail -10 "$LOG_FILE" | sed 's/^/  /'
        echo ""
        echo "Log size: $(du -h "$LOG_FILE" 2>/dev/null | cut -f1) ($(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) lines)"
    fi
    
    # Check if completed
    if is_completed; then
        echo ""
        echo "${GREEN}✅ Mutation tests completed!${NC}"
        break
    fi
    
    echo ""
    echo "--- Next check in 5 minutes ---"
    
    # Wait 5 minutes
    sleep $CHECK_INTERVAL
done

# Final results
echo ""
echo "========================================="
echo "${GREEN}MUTATION TEST RESULTS${NC}"
echo "========================================="
echo ""

if [ -f "$LOG_FILE" ]; then
    echo "--- Final Summary ---"
    tail -500 "$LOG_FILE" | grep -E "(Mutation score|Killed|Survived|Timeout|No coverage|Error|Total|mutant|All tests)" | tail -30
    
    echo ""
    echo "--- No Coverage Mutations (Key Metric) ---"
    tail -500 "$LOG_FILE" | grep -iE "no coverage|No coverage" | tail -10
    
    echo ""
    echo "--- Full Log Location ---"
    echo "Log: $LOG_FILE"
fi

if [ -d "reports/mutation/html" ]; then
    echo ""
    echo "--- HTML Report Available ---"
    echo "Location: reports/mutation/html/index.html"
fi

echo ""
echo "========================================="
echo "Monitoring complete at $(date)"
echo "========================================="
