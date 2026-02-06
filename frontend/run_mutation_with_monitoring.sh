#!/bin/bash

# Mutation Testing Runner with Continuous Monitoring
# Runs mutation testing and monitors until completion, checking for crashes

set -e

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"
MONITOR_LOG="monitor_output.log"
STATUS_FILE="mutation_status.txt"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "Mutation Testing Runner"
echo "Start Time: $(date)"
echo "========================================="

# Function to check if regular tests pass
check_tests_pass() {
    echo "[$(date '+%H:%M:%S')] Checking if regular tests pass..."
    if npm test -- --passWithNoTests 2>&1 | grep -q "Test Suites:.*passed"; then
        echo "${GREEN}✅ All regular tests passing${NC}"
        return 0
    else
        echo "${RED}❌ Regular tests failing - fixing before mutation testing${NC}"
        return 1
    fi
}

# Function to check for crashes in mutation log
check_for_crashes() {
    if [ ! -f "$LOG_FILE" ]; then
        return 0
    fi
    
    # Check for common crash patterns
    if tail -100 "$LOG_FILE" | grep -qE "(ChildProcessCrashedError|exited unexpectedly|TypeError.*undefined|Cannot read properties)"; then
        echo "${YELLOW}⚠️  Potential crashes detected in mutation log${NC}"
        tail -20 "$LOG_FILE" | grep -E "(ChildProcessCrashedError|TypeError|Cannot read)" | head -5
        return 1
    fi
    return 0
}

# Function to check mutation progress
check_mutation_progress() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "Log file not found"
        return 1
    fi
    
    # Extract progress
    PROGRESS=$(tail -50 "$LOG_FILE" | grep -E "Mutation testing.*%" | tail -1)
    if [ -n "$PROGRESS" ]; then
        echo "$PROGRESS"
        return 0
    fi
    
    # Check for completion
    if tail -100 "$LOG_FILE" | grep -qE "(Mutation test report|Mutation score|All tests)"; then
        echo "COMPLETED"
        return 0
    fi
    
    return 1
}

# Function to check if mutation process is running
is_mutation_running() {
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

# Function to display final results
display_results() {
    echo ""
    echo "========================================="
    echo "FINAL MUTATION TEST RESULTS"
    echo "========================================="
    echo ""
    
    if [ -f "$LOG_FILE" ]; then
        echo "--- Mutation Score ---"
        tail -200 "$LOG_FILE" | grep -A 15 "Mutation score" | head -20
        
        echo ""
        echo "--- Summary Statistics ---"
        tail -200 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error|Tested)" | tail -10
        
        echo ""
        echo "--- Full Report Location ---"
        echo "HTML Report: reports/mutation/html/index.html"
        echo "Log File: $LOG_FILE"
    fi
}

# Step 1: Verify regular tests pass
echo ""
echo "Step 1: Verifying regular tests pass..."
if ! check_tests_pass; then
    echo "${RED}Please fix failing tests before running mutation testing${NC}"
    exit 1
fi

# Step 2: Clean up any previous runs
echo ""
echo "Step 2: Cleaning up previous runs..."
rm -f "$LOG_FILE" "$PID_FILE" "$STATUS_FILE"
rm -rf .stryker-tmp reports/mutation 2>/dev/null || true

# Step 3: Start mutation testing
echo ""
echo "Step 3: Starting mutation testing..."
npm run test:mutation > "$LOG_FILE" 2>&1 &
MUTATION_PID=$!
echo "$MUTATION_PID" > "$PID_FILE"
echo "Mutation testing started with PID: $MUTATION_PID"

# Step 4: Monitor loop
echo ""
echo "Step 4: Starting monitoring loop (checking every 5 minutes)..."
echo "Press Ctrl+C to stop monitoring (mutation testing will continue)"
echo ""

ITERATION=0
LAST_PROGRESS=""
CRASH_COUNT=0
MAX_CRASHES=10

while true; do
    ITERATION=$((ITERATION + 1))
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$TIMESTAMP] Check #$ITERATION"
    echo "----------------------------------------"
    
    # Check if process is running
    if ! is_mutation_running; then
        echo "${YELLOW}Mutation process not running${NC}"
        
        # Check if it completed successfully
        if tail -100 "$LOG_FILE" | grep -qE "(Mutation test report|Mutation score)"; then
            echo "${GREEN}✅ Mutation testing completed successfully!${NC}"
            display_results
            break
        else
            echo "${RED}❌ Mutation testing stopped unexpectedly${NC}"
            echo "Last 20 lines of log:"
            tail -20 "$LOG_FILE"
            exit 1
        fi
    else
        echo "${GREEN}✅ Process running (PID: $(cat $PID_FILE))${NC}"
    fi
    
    # Check for crashes
    if check_for_crashes; then
        CRASH_COUNT=0
    else
        CRASH_COUNT=$((CRASH_COUNT + 1))
        if [ $CRASH_COUNT -ge $MAX_CRASHES ]; then
            echo "${RED}❌ Too many crashes detected. Stopping.${NC}"
            kill $(cat "$PID_FILE") 2>/dev/null || true
            exit 1
        fi
    fi
    
    # Check progress
    PROGRESS=$(check_mutation_progress)
    if [ "$PROGRESS" != "$LAST_PROGRESS" ] && [ -n "$PROGRESS" ]; then
        echo "Progress: $PROGRESS"
        LAST_PROGRESS="$PROGRESS"
        
        # Check if completed
        if [ "$PROGRESS" = "COMPLETED" ]; then
            echo "${GREEN}✅ Mutation testing completed!${NC}"
            sleep 5  # Wait for final log writes
            display_results
            break
        fi
    else
        echo "Still running..."
    fi
    
    # Save status
    echo "$TIMESTAMP - $PROGRESS" >> "$STATUS_FILE"
    
    echo "--- Waiting 5 minutes until next check ---"
    echo ""
    sleep 300  # Wait 5 minutes
done

echo ""
echo "========================================="
echo "Monitoring Complete"
echo "End Time: $(date)"
echo "========================================="
