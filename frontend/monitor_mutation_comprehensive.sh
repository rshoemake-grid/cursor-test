#!/bin/bash

# Comprehensive Mutation Testing Monitor
# Combines features from monitor_mutation.sh, monitor_mutation_progress.sh, and monitor_mutation_status.sh
# Checks progress every 5 minutes until completion, detects crashes, reports results

set -e

# Configuration - supports multiple log file locations
LOG_FILE="${MUTATION_LOG_FILE:-mutation_test.log}"
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-mutation-test-output.log}"
fi
if [ ! -f "$LOG_FILE" ]; then
    LOG_FILE="${MUTATION_LOG_FILE:-stryker.log}"
fi

PID_FILE="${MUTATION_PID_FILE:-mutation_test.pid}"
if [ ! -f "$PID_FILE" ]; then
    PID_FILE="${MUTATION_PID_FILE:-mutation-test.pid}"
fi

MONITOR_LOG="mutation_monitor.log"
STATUS_FILE="mutation_status.txt"
CHECK_INTERVAL=300  # 5 minutes
START_TIME=$(date +%s)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Comprehensive Mutation Testing Monitor" | tee -a "$MONITOR_LOG"
echo "Start Time: $(date)" | tee -a "$MONITOR_LOG"
echo "Log File: $LOG_FILE" | tee -a "$MONITOR_LOG"
echo "PID File: $PID_FILE" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo ""

# Function to check if process is running
check_process() {
    # Check PID file first
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Fallback: check for stryker process
    if pgrep -f "stryker run" > /dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# Function to get process info
get_process_info() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
            CPU=$(ps -p "$PID" -o %cpu= 2>/dev/null | tr -d ' ' || echo "N/A")
            MEM=$(ps -p "$PID" -o %mem= 2>/dev/null | tr -d ' ' || echo "N/A")
            ETIME=$(ps -p "$PID" -o etime= 2>/dev/null | tr -d ' ' || echo "N/A")
            echo "$PID|$CPU|$MEM|$ETIME"
            return 0
        fi
    fi
    
    # Try to find stryker process
    STRYKER_PID=$(pgrep -f "stryker run" | head -1)
    if [ -n "$STRYKER_PID" ]; then
        CPU=$(ps -p "$STRYKER_PID" -o %cpu= 2>/dev/null | tr -d ' ' || echo "N/A")
        MEM=$(ps -p "$STRYKER_PID" -o %mem= 2>/dev/null | tr -d ' ' || echo "N/A")
        ETIME=$(ps -p "$STRYKER_PID" -o etime= 2>/dev/null | tr -d ' ' || echo "N/A")
        echo "$STRYKER_PID|$CPU|$MEM|$ETIME"
        return 0
    fi
    
    return 1
}

# Function to extract progress from log
extract_progress() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "Log file not found"
        return
    fi
    
    # Extract key metrics from Stryker output
    tail -200 "$LOG_FILE" | grep -E "(Mutant|Killed|Survived|Timeout|No coverage|Mutation score|All tests|Dry run|Progress|mutants tested|%)" | tail -20
}

# Function to check for crashes
check_crashes() {
    if [ ! -f "$LOG_FILE" ]; then
        return 0
    fi
    
    # Look for crash indicators
    tail -100 "$LOG_FILE" | grep -iE "(crash|error|failed|killed|terminated|oom|out of memory|ChildProcessCrashedError|exited unexpectedly)" | tail -5
}

# Function to check for completion
check_completion() {
    if [ ! -f "$LOG_FILE" ]; then
        return 1
    fi
    
    # Check for Stryker completion patterns
    if tail -200 "$LOG_FILE" | grep -qE "(Mutation test report|Mutation score|All mutants|Mutation testing.*completed|Done in)"; then
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
        tail -200 "$LOG_FILE" | grep -A 10 -E "(Mutation score|Mutation testing.*score)" | head -20 | tee -a "$MONITOR_LOG"
        
        echo "" | tee -a "$MONITOR_LOG"
        echo "--- Summary Statistics ---" | tee -a "$MONITOR_LOG"
        tail -300 "$LOG_FILE" | grep -E "(Killed|Survived|Timeout|No coverage|Error|Tested|mutants)" | tail -20 | tee -a "$MONITOR_LOG"
        
        echo "" | tee -a "$MONITOR_LOG"
        echo "--- Report Location ---" | tee -a "$MONITOR_LOG"
        if [ -d "reports/mutation/html" ]; then
            echo "HTML Report: reports/mutation/html/index.html" | tee -a "$MONITOR_LOG"
            ls -lh reports/mutation/html/index.html 2>/dev/null | tee -a "$MONITOR_LOG" || echo "HTML report not found" | tee -a "$MONITOR_LOG"
        else
            echo "HTML report directory not found" | tee -a "$MONITOR_LOG"
        fi
        
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
    ELAPSED=$(( $(date +%s) - START_TIME ))
    ELAPSED_MIN=$(( ELAPSED / 60 ))
    
    echo "" | tee -a "$MONITOR_LOG"
    echo "[$TIMESTAMP] Check #$ITERATION (Elapsed: ${ELAPSED_MIN} minutes)" | tee -a "$MONITOR_LOG"
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
            
            # Check for crashes
            CRASHES=$(check_crashes)
            if [ -n "$CRASHES" ]; then
                echo "${RED}⚠ CRASH DETECTED:${NC}" | tee -a "$MONITOR_LOG"
                echo "$CRASHES" | tee -a "$MONITOR_LOG"
            fi
            
            # Show last log entries
            if [ -f "$LOG_FILE" ]; then
                echo "" | tee -a "$MONITOR_LOG"
                echo "--- Last 30 lines of log ---" | tee -a "$MONITOR_LOG"
                tail -30 "$LOG_FILE" | tee -a "$MONITOR_LOG"
            fi
            
            break
        fi
    else
        # Get process info
        PROCESS_INFO=$(get_process_info)
        if [ -n "$PROCESS_INFO" ]; then
            PID=$(echo "$PROCESS_INFO" | cut -d'|' -f1)
            CPU=$(echo "$PROCESS_INFO" | cut -d'|' -f2)
            MEM=$(echo "$PROCESS_INFO" | cut -d'|' -f3)
            ETIME=$(echo "$PROCESS_INFO" | cut -d'|' -f4)
            echo "${GREEN}Process is running (PID: $PID, CPU: ${CPU}%, MEM: ${MEM}%, Runtime: $ETIME)${NC}" | tee -a "$MONITOR_LOG"
        else
            echo "${GREEN}Process is running${NC}" | tee -a "$MONITOR_LOG"
        fi
    fi
    
    # Check for crashes
    CRASHES=$(check_crashes)
    if [ -n "$CRASHES" ]; then
        echo "${YELLOW}⚠ Potential issues detected:${NC}" | tee -a "$MONITOR_LOG"
        echo "$CRASHES" | sed 's/^/  /' | tee -a "$MONITOR_LOG"
    else
        echo "${GREEN}✓ No crashes detected${NC}" | tee -a "$MONITOR_LOG"
    fi
    
    # Extract and display progress
    echo "" | tee -a "$MONITOR_LOG"
    echo "--- Recent Progress ---" | tee -a "$MONITOR_LOG"
    PROGRESS=$(extract_progress)
    if [ -n "$PROGRESS" ]; then
        echo "$PROGRESS" | sed 's/^/  /' | tee -a "$MONITOR_LOG"
    else
        echo "  (No progress indicators found yet)" | tee -a "$MONITOR_LOG"
    fi
    
    # Show log file stats
    if [ -f "$LOG_FILE" ]; then
        LOG_SIZE=$(du -h "$LOG_FILE" 2>/dev/null | cut -f1)
        LOG_LINES=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
        echo "" | tee -a "$MONITOR_LOG"
        echo "--- Log File Stats ---" | tee -a "$MONITOR_LOG"
        echo "  Size: $LOG_SIZE ($LOG_LINES lines)" | tee -a "$MONITOR_LOG"
        echo "  Last modified: $(stat -f "%Sm" "$LOG_FILE" 2>/dev/null || stat -c "%y" "$LOG_FILE" 2>/dev/null | cut -d'.' -f1)" | tee -a "$MONITOR_LOG"
    fi
    
    # Save status to file
    {
        echo "[$TIMESTAMP]"
        echo "Status: $(if check_process; then echo "RUNNING"; else echo "STOPPED"; fi)"
        echo "Progress: $(if [ -n "$PROGRESS" ]; then echo "$PROGRESS" | head -1; else echo "N/A"; fi)"
        echo "---"
    } >> "$STATUS_FILE"
    
    # Check for completion even if process is running
    if check_completion; then
        echo "${GREEN}Completion detected in logs!${NC}" | tee -a "$MONITOR_LOG"
        display_summary
        break
    fi
    
    echo "" | tee -a "$MONITOR_LOG"
    echo "--- Waiting 5 minutes until next check ---" | tee -a "$MONITOR_LOG"
    sleep $CHECK_INTERVAL
done

# Final status
echo "" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
echo "Monitoring Complete" | tee -a "$MONITOR_LOG"
echo "End Time: $(date)" | tee -a "$MONITOR_LOG"
ELAPSED=$(( $(date +%s) - START_TIME ))
ELAPSED_MIN=$(( ELAPSED / 60 ))
echo "Total Duration: ${ELAPSED_MIN} minutes" | tee -a "$MONITOR_LOG"
echo "=========================================" | tee -a "$MONITOR_LOG"
