#!/bin/bash

# Mutation Testing Runner with Crash Monitor
# Updates every 5 minutes

set -e

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"
MONITOR_LOG="mutation_monitor.log"
CHECK_INTERVAL=300  # 5 minutes in seconds

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
    
    if tail -200 "$LOG_FILE" | grep -qiE "(Mutation test report|Mutation score|All tests|completed)"; then
        return 0
    fi
    
    return 1
}

# Function to display results
display_results() {
    echo ""
    echo "========================================="
    echo "Final Results"
    echo "========================================="
    
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "Mutation Score:"
        grep -E "Mutation score|Killed|Survived" "$LOG_FILE" | tail -5
        
        echo ""
        echo "Summary:"
        extract_metrics
    fi
    
    echo ""
    echo "Full log: $LOG_FILE"
    echo "HTML report: reports/mutation/mutation.html"
}

# Start mutation testing in background
echo "Starting mutation testing..."
cd "$(dirname "$0")"

# Start mutation test
STRYKER_RUNNING=1 npm run test:mutation > "$LOG_FILE" 2>&1 &
MUTATION_PID=$!

# Save PID
echo $MUTATION_PID > "$PID_FILE"
echo "Mutation test started (PID: $MUTATION_PID)"
echo "Log file: $LOG_FILE"
echo "Monitor log: $MONITOR_LOG"
echo ""

# Monitoring loop
ITERATION=0
LAST_PROGRESS=""
CRASH_COUNT=0
MAX_CRASHES=3

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
        
        # Show metrics
        METRICS=$(extract_metrics)
        if [ -n "$METRICS" ]; then
            echo "Metrics:" | tee -a "$MONITOR_LOG"
            echo "$METRICS" | tee -a "$MONITOR_LOG"
        fi
        
        # Check if completed
        if is_completed; then
            echo "${GREEN}✅ Mutation testing completed!${NC}" | tee -a "$MONITOR_LOG"
            sleep 5  # Wait for final log writes
            display_results | tee -a "$MONITOR_LOG"
            break
        fi
    else
        echo "Still running..." | tee -a "$MONITOR_LOG"
    fi
    
    echo "--- Waiting 5 minutes until next check ---" | tee -a "$MONITOR_LOG"
    echo "" | tee -a "$MONITOR_LOG"
    
    # Wait 5 minutes
    sleep $CHECK_INTERVAL
done

echo ""
echo "========================================="
echo "Monitoring Complete"
echo "End Time: $(date)"
echo "========================================="
