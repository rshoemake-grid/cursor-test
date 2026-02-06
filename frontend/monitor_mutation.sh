#!/bin/bash

# Mutation Testing Monitor Script
# Checks progress every 5 minutes until completion

PID_FILE="mutation_test.pid"
LOG_FILE="mutation_test.log"
MONITOR_LOG="monitor_output.log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Mutation Testing Monitor Started" | tee -a "$MONITOR_LOG"
echo "Start Time: $(date)" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"

# Function to check if process is running
check_process() {
    if [ ! -f "$PID_FILE" ]; then
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to extract progress from log
extract_progress() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "Log file not found"
        return
    fi
    
    # Extract key metrics from Stryker output
    tail -100 "$LOG_FILE" | grep -E "(Mutant|Killed|Survived|Timeout|No coverage|Mutation score|All tests|Dry run)" | tail -20
}

# Function to check for completion
check_completion() {
    if [ ! -f "$LOG_FILE" ]; then
        return 1
    fi
    
    # Check for Stryker completion patterns
    if tail -50 "$LOG_FILE" | grep -q "Mutation test report"; then
        return 0
    fi
    
    if tail -50 "$LOG_FILE" | grep -q "Mutation score"; then
        return 0
    fi
    
    return 1
}

# Function to display summary
display_summary() {
    echo "" | tee -a "$MONITOR_LOG"
    echo "=========================================" | tee -a "$MONITOR_LOG"
    echo "FINAL MUTATION TEST RESULTS" | tee -a "$MONITOR_LOG"
    echo "=========================================" | tee -a "$MONITOR_LOG"
    echo "" | tee -a "$MONITOR_LOG"
    
    # Extract final results
    if [ -f "$LOG_FILE" ]; then
        echo "--- Mutation Score ---" | tee -a "$MONITOR_LOG"
        tail -100 "$LOG_FILE" | grep -A 10 "Mutation score" | tee -a "$MONITOR_LOG"
        
        echo "" | tee -a "$MONITOR_LOG"
        echo "--- Summary Statistics ---" | tee -a "$MONITOR_LOG"
        tail -200 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error)" | tail -10 | tee -a "$MONITOR_LOG"
        
        echo "" | tee -a "$MONITOR_LOG"
        echo "--- Full Log Available At ---" | tee -a "$MONITOR_LOG"
        echo "$(pwd)/$LOG_FILE" | tee -a "$MONITOR_LOG"
    fi
}

# Main monitoring loop
ITERATION=0
while true; do
    ITERATION=$((ITERATION + 1))
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "" | tee -a "$MONITOR_LOG"
    echo "[$TIMESTAMP] Check #$ITERATION" | tee -a "$MONITOR_LOG"
    echo "----------------------------------------" | tee -a "$MONITOR_LOG"
    
    # Check if process is still running
    if ! check_process; then
        echo "${YELLOW}Process not running (may have completed)${NC}" | tee -a "$MONITOR_LOG"
        
        # Check if it completed successfully
        if check_completion; then
            echo "${GREEN}Mutation testing appears to have completed!${NC}" | tee -a "$MONITOR_LOG"
            display_summary
            break
        else
            echo "${RED}Process stopped but completion not detected. Check logs.${NC}" | tee -a "$MONITOR_LOG"
            break
        fi
    else
        echo "${GREEN}Process is running (PID: $(cat $PID_FILE))${NC}" | tee -a "$MONITOR_LOG"
    fi
    
    # Extract and display progress
    echo "--- Recent Progress ---" | tee -a "$MONITOR_LOG"
    extract_progress | tee -a "$MONITOR_LOG"
    
    # Check for completion even if process is running
    if check_completion; then
        echo "${GREEN}Completion detected in logs!${NC}" | tee -a "$MONITOR_LOG"
        display_summary
        break
    fi
    
    echo "--- Waiting 5 minutes until next check ---" | tee -a "$MONITOR_LOG"
    sleep 300  # Wait 5 minutes
done

echo "" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Monitoring Complete" | tee -a "$MONITOR_LOG"
echo "End Time: $(date)" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
