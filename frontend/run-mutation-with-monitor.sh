#!/bin/bash

# Mutation Testing Runner with Crash Monitor
# Updates every 5 minutes

set -e

cd "$(dirname "$0")"

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"
MONITOR_LOG="mutation_monitor.log"
CHECK_INTERVAL=300  # 5 minutes in seconds
MAX_CRASHES=3

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Mutation Testing with Crash Monitor"
echo "Start Time: $(date)"
echo "Updates every 5 minutes"
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
    if tail -200 "$LOG_FILE" | grep -qiE "(ChildProcessCrashedError|exited unexpectedly|FATAL|CRASH|killed|segmentation fault|out of memory|Error:|Failed)"; then
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
    
    # Extract progress information
    PROGRESS=$(tail -200 "$LOG_FILE" | grep -oE "Mutation testing [0-9]+%|tested.*[0-9]+/[0-9]+|Killed.*[0-9]+|Survived.*[0-9]+" | tail -1)
    
    if [ -z "$PROGRESS" ]; then
        PROGRESS=$(tail -100 "$LOG_FILE" | grep -E "tested|mutant|%" | tail -1)
    fi
    
    echo "$PROGRESS"
}

# Function to extract metrics
extract_metrics() {
    if [ ! -f "$LOG_FILE" ]; then
        return
    fi
    
    # Extract key metrics
    tail -500 "$LOG_FILE" | grep -E "Killed|Survived|Timeout|No coverage|Mutation score|%" | tail -10
}

# Function to check if completed
is_completed() {
    if [ ! -f "$LOG_FILE" ]; then
        return 1
    fi
    
    # Check for completion indicators
    if tail -100 "$LOG_FILE" | grep -qiE "(Done in|Mutation score|All tests|completed)"; then
        return 0
    fi
    
    return 1
}

# Function to display results
display_results() {
    echo ""
    echo "${BLUE}=========================================${NC}"
    echo "${BLUE}Final Results${NC}"
    echo "${BLUE}=========================================${NC}"
    
    if [ -f "$LOG_FILE" ]; then
        extract_metrics
        echo ""
        echo "Full log: $LOG_FILE"
        echo "HTML report: reports/mutation/mutation.html"
    fi
}

# Start mutation testing in background
echo "${BLUE}Starting mutation testing...${NC}"
STRYKER_RUNNING=1 npm run test:mutation > "$LOG_FILE" 2>&1 &
MUTATION_PID=$!
echo $MUTATION_PID > "$PID_FILE"

echo "${GREEN}Mutation testing started (PID: $MUTATION_PID)${NC}"
echo "Log file: $LOG_FILE"
echo "Monitor log: $MONITOR_LOG"
echo ""

# Monitor loop
ITERATION=0
CRASH_COUNT=0
LAST_PROGRESS=""

while true; do
    ITERATION=$((ITERATION + 1))
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$TIMESTAMP] Check #$ITERATION" | tee -a "$MONITOR_LOG"
    echo "----------------------------------------" | tee -a "$MONITOR_LOG"
    
    # Check if process is running
    if ! is_running; then
        echo "${YELLOW}Mutation process not running${NC}" | tee -a "$MONITOR_LOG"
        
        # Check if completed successfully
        if is_completed; then
            echo "${GREEN}✅ Mutation testing completed successfully!${NC}" | tee -a "$MONITOR_LOG"
            display_results | tee -a "$MONITOR_LOG"
            break
        else
            echo "${RED}❌ Mutation testing stopped unexpectedly${NC}" | tee -a "$MONITOR_LOG"
            echo "Last 20 lines of log:" | tee -a "$MONITOR_LOG"
            tail -20 "$LOG_FILE" | tee -a "$MONITOR_LOG"
            exit 1
        fi
    else
        echo "${GREEN}✅ Process running (PID: $MUTATION_PID)${NC}" | tee -a "$MONITOR_LOG"
    fi
    
    # Check for crashes
    if check_crashes; then
        CRASH_COUNT=0
        echo "${GREEN}✅ No crashes detected${NC}" | tee -a "$MONITOR_LOG"
    else
        CRASH_COUNT=$((CRASH_COUNT + 1))
        echo "${RED}⚠️  Potential crash detected (count: $CRASH_COUNT)${NC}" | tee -a "$MONITOR_LOG"
        tail -10 "$LOG_FILE" | grep -iE "(error|crash|failed)" | head -5 | tee -a "$MONITOR_LOG"
        
        if [ $CRASH_COUNT -ge $MAX_CRASHES ]; then
            echo "${RED}❌ Too many crashes detected. Stopping.${NC}" | tee -a "$MONITOR_LOG"
            kill $MUTATION_PID 2>/dev/null || true
            exit 1
        fi
    fi
    
    # Check progress
    PROGRESS=$(extract_progress)
    if [ "$PROGRESS" != "$LAST_PROGRESS" ] && [ -n "$PROGRESS" ]; then
        echo "${BLUE}📊 Progress: $PROGRESS${NC}" | tee -a "$MONITOR_LOG"
        LAST_PROGRESS="$PROGRESS"
    fi
    
    # Show recent metrics
    METRICS=$(extract_metrics)
    if [ -n "$METRICS" ]; then
        echo "${BLUE}📈 Recent Metrics:${NC}" | tee -a "$MONITOR_LOG"
        echo "$METRICS" | tee -a "$MONITOR_LOG"
    fi
    
    echo "" | tee -a "$MONITOR_LOG"
    
    # Wait before next check
    sleep $CHECK_INTERVAL
done

# Cleanup
rm -f "$PID_FILE"
echo "${GREEN}Monitoring complete.${NC}"
