#!/bin/bash

# Mutation Testing Monitor Script
# Checks status every 5 minutes, shows progress, detects crashes, reports results

LOG_FILE="stryker.log"
STATUS_FILE="mutation-test-status.json"
PROGRESS_FILE="mutation-test-progress.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Stryker process is running
check_process() {
    local pid=$(ps aux | grep -E "stryker.*run|npm.*stryker" | grep -v grep | awk '{print $2}' | head -1)
    if [ -z "$pid" ]; then
        echo "STOPPED"
    else
        echo "RUNNING:$pid"
    fi
}

# Function to check for errors in log
check_errors() {
    if [ -f "$LOG_FILE" ]; then
        local errors=$(tail -100 "$LOG_FILE" | grep -iE "ERROR|failed|crash|exception" | tail -5)
        if [ ! -z "$errors" ]; then
            echo "$errors"
        else
            echo "NONE"
        fi
    else
        echo "NO_LOG"
    fi
}

# Function to extract progress info
get_progress() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "Log file not found"
        return
    fi
    
    # Check for completion
    local completed=$(tail -50 "$LOG_FILE" | grep -iE "Done in|completed|finished|mutation score" | tail -1)
    if [ ! -z "$completed" ]; then
        echo "COMPLETED:$completed"
        return
    fi
    
    # Check for mutation testing phase
    local mutation_phase=$(tail -100 "$LOG_FILE" | grep -iE "MutationTestExecutor|mutants tested|Progress|killed|survived" | tail -3)
    if [ ! -z "$mutation_phase" ]; then
        echo "MUTATION_TESTING:$mutation_phase"
        return
    fi
    
    # Check for initial test run
    local dry_run=$(tail -50 "$LOG_FILE" | grep -iE "DryRunExecutor|initial test run" | tail -1)
    if [ ! -z "$dry_run" ]; then
        echo "INITIAL_TEST_RUN:$dry_run"
        return
    fi
    
    echo "SETUP:Configuration phase"
}

# Function to get log file stats
get_log_stats() {
    if [ -f "$LOG_FILE" ]; then
        local lines=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "0")
        local size=$(ls -lh "$LOG_FILE" 2>/dev/null | awk '{print $5}' || echo "0")
        local modified=$(stat -f "%Sm" "$LOG_FILE" 2>/dev/null || echo "unknown")
        echo "Lines: $lines | Size: $size | Modified: $modified"
    else
        echo "Log file not found"
    fi
}

# Main monitoring function
monitor() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local process_status=$(check_process)
    local errors=$(check_errors)
    local progress=$(get_progress)
    local log_stats=$(get_log_stats)
    
    echo "=========================================="
    echo "Mutation Testing Monitor - $timestamp"
    echo "=========================================="
    echo ""
    
    # Process status
    if [[ "$process_status" == "STOPPED" ]]; then
        echo -e "${RED}✗ Process Status: STOPPED${NC}"
        echo ""
        
        # Check if it completed successfully
        if [ -f "$LOG_FILE" ]; then
            local completion=$(tail -50 "$LOG_FILE" | grep -iE "Done in|mutation score|completed successfully" | tail -1)
            if [ ! -z "$completion" ]; then
                echo -e "${GREEN}✓ Process completed successfully${NC}"
                echo "Completion info: $completion"
                echo ""
                # Extract final results
                echo "=== FINAL RESULTS ==="
                tail -100 "$LOG_FILE" | grep -iE "mutation score|killed|survived|timeout|no coverage|error" | tail -20
            else
                echo -e "${RED}⚠ Process stopped unexpectedly (CRASH DETECTED)${NC}"
                echo ""
                echo "=== ERROR DETAILS ==="
                echo "$errors"
                echo ""
                echo "=== LAST LOG ENTRIES ==="
                tail -30 "$LOG_FILE"
            fi
        else
            echo -e "${RED}⚠ Process stopped and no log file found${NC}"
        fi
    else
        local pid=$(echo "$process_status" | cut -d: -f2)
        echo -e "${GREEN}✓ Process Status: RUNNING (PID: $pid)${NC}"
        echo ""
        
        # Progress
        echo "=== PROGRESS ==="
        if [[ "$progress" == COMPLETED* ]]; then
            echo -e "${GREEN}$progress${NC}"
        elif [[ "$progress" == MUTATION_TESTING* ]]; then
            echo -e "${BLUE}$progress${NC}"
        elif [[ "$progress" == INITIAL_TEST_RUN* ]]; then
            echo -e "${YELLOW}$progress${NC}"
        else
            echo "$progress"
        fi
        echo ""
        
        # Errors
        if [[ "$errors" != "NONE" && "$errors" != "NO_LOG" ]]; then
            echo -e "${YELLOW}⚠ Recent Errors/Warnings:${NC}"
            echo "$errors"
            echo ""
        else
            echo -e "${GREEN}✓ No recent errors${NC}"
            echo ""
        fi
        
        # Log stats
        echo "=== LOG FILE STATS ==="
        echo "$log_stats"
        echo ""
    fi
    
    echo "=========================================="
    echo ""
    
    # Save status to file
    cat > "$STATUS_FILE" << EOF
{
  "timestamp": "$timestamp",
  "process_status": "$process_status",
  "progress": "$progress",
  "has_errors": "$(if [[ "$errors" != "NONE" && "$errors" != "NO_LOG" ]]; then echo "true"; else echo "false"; fi)",
  "log_stats": "$log_stats"
}
EOF
    
    # Append to progress file
    echo "[$timestamp] Status: $process_status | Progress: $progress" >> "$PROGRESS_FILE"
}

# Run monitoring
monitor
