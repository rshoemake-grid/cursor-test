#!/bin/bash

# Mutation Test Monitor - Checks every 5 minutes
# Reports progress, detects crashes, shows final results

LOG_FILE="frontend/mutation_test.log"
PID_FILE="frontend/mutation_test.pid"
CHECK_INTERVAL=300  # 5 minutes
START_TIME=$(date +%s)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

iteration=0
last_progress=""
last_line_count=0
stuck_count=0

echo ""
echo "========================================="
echo "${CYAN}Mutation Test Monitor${NC}"
echo "Checking every 5 minutes until completion"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# Function to check if process is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$PID" ] && ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    
    # Fallback: check for stryker process
    if pgrep -f "stryker run" > /dev/null; then
        return 0
    fi
    
    return 1
}

# Function to extract progress
get_progress() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "Log file not found"
        return
    fi
    
    # Try to find progress indicators
    tail -500 "$LOG_FILE" | grep -oE "[0-9]+/[0-9]+.*tested|Mutation testing.*[0-9]+%|progress.*[0-9]+%|tested.*[0-9]+" | tail -1
}

# Function to get key metrics
get_metrics() {
    if [ ! -f "$LOG_FILE" ]; then
        return
    fi
    
    tail -1000 "$LOG_FILE" | grep -E "Killed|Survived|Timeout|No coverage|Error|Mutation score" | tail -15
}

# Function to check for crashes
check_crashes() {
    if [ ! -f "$LOG_FILE" ]; then
        return 0
    fi
    
    # Check for crash patterns
    if tail -500 "$LOG_FILE" | grep -qiE "(ChildProcessCrashedError|exited unexpectedly|FATAL|CRASH|segmentation fault|out of memory|killed.*signal)"; then
        return 1
    fi
    
    return 0
}

# Function to check completion
is_completed() {
    if [ ! -f "$LOG_FILE" ]; then
        return 1
    fi
    
    if tail -1000 "$LOG_FILE" | grep -qiE "(Mutation test report|Mutation score.*%|All mutants|Final.*report|completed successfully)"; then
        return 0
    fi
    
    return 1
}

# Main monitoring loop
while true; do
    iteration=$((iteration + 1))
    elapsed=$(( $(date +%s) - START_TIME ))
    elapsed_min=$((elapsed / 60))
    elapsed_hr=$((elapsed_min / 60))
    elapsed_min_remain=$((elapsed_min % 60))
    
    clear
    echo "========================================="
    echo "${CYAN}Mutation Test Monitor - Check #$iteration${NC}"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Elapsed: ${elapsed_hr}h ${elapsed_min_remain}m"
    echo "========================================="
    echo ""
    
    # Check if process is running
    if ! is_running; then
        echo "${RED}❌ CRASH DETECTED: Mutation test process is not running!${NC}"
        echo ""
        
        if is_completed; then
            echo "${GREEN}✅ Tests appear to have completed normally${NC}"
        else
            echo "${RED}Tests did not complete normally${NC}"
            if [ -f "$LOG_FILE" ]; then
                echo ""
                echo "Last 20 lines of log:"
                tail -20 "$LOG_FILE"
            fi
        fi
        break
    else
        echo "${GREEN}✅ Mutation tests running${NC}"
    fi
    
    # Check for crashes in log
    if ! check_crashes; then
        echo ""
        echo "${RED}⚠️  CRASH INDICATORS DETECTED:${NC}"
        tail -100 "$LOG_FILE" | grep -iE "(crash|error|fatal|killed|out of memory)" | tail -5
        echo ""
    fi
    
    # Show progress
    if [ -f "$LOG_FILE" ]; then
        current_line_count=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
        current_progress=$(get_progress)
        
        if [ -n "$current_progress" ]; then
            echo "${BLUE}📊 Progress: $current_progress${NC}"
            if [ "$current_progress" != "$last_progress" ]; then
                last_progress="$current_progress"
                stuck_count=0
            else
                stuck_count=$((stuck_count + 1))
            fi
        elif [ "$current_line_count" -gt "$last_line_count" ]; then
            echo "${YELLOW}⏳ Processing... (log growing)${NC}"
            last_line_count=$current_line_count
            stuck_count=0
        else
            stuck_count=$((stuck_count + 1))
            echo "${YELLOW}⏳ Waiting for progress update...${NC}"
        fi
        
        if [ "$stuck_count" -ge 6 ]; then
            echo "${RED}⚠️  No progress detected for $((stuck_count * 5)) minutes${NC}"
        fi
        
        # Show metrics if available
        metrics=$(get_metrics)
        if [ -n "$metrics" ]; then
            echo ""
            echo "${CYAN}--- Current Metrics ---${NC}"
            echo "$metrics"
        fi
        
        # Show recent activity
        echo ""
        echo "${CYAN}--- Recent Activity (last 8 lines) ---${NC}"
        tail -8 "$LOG_FILE" | sed 's/^/  /'
        
        echo ""
        echo "Log: $(du -h "$LOG_FILE" 2>/dev/null | cut -f1) ($current_line_count lines)"
    else
        echo "${YELLOW}Log file not found yet...${NC}"
    fi
    
    # Check if completed
    if is_completed; then
        echo ""
        echo "${GREEN}✅ Mutation tests completed!${NC}"
        break
    fi
    
    echo ""
    echo "${BLUE}--- Next check in 5 minutes (Ctrl+C to stop monitoring) ---${NC}"
    
    # Wait 5 minutes
    sleep $CHECK_INTERVAL
done

# Final results
echo ""
echo "========================================="
echo "${GREEN}FINAL MUTATION TEST RESULTS${NC}"
echo "========================================="
echo ""

if [ -f "$LOG_FILE" ]; then
    echo "${CYAN}--- Final Summary ---${NC}"
    tail -1000 "$LOG_FILE" | grep -E "(Mutation score|Killed|Survived|Timeout|No coverage|Error|Total|mutant)" | tail -30
    
    echo ""
    echo "${CYAN}--- No Coverage Mutations (Key Metric for Task 6) ---${NC}"
    tail -1000 "$LOG_FILE" | grep -iE "no coverage|No coverage" | tail -10
    
    echo ""
    echo "${CYAN}--- Mutation Score ---${NC}"
    tail -1000 "$LOG_FILE" | grep -iE "Mutation score" | tail -5
    
    echo ""
    echo "Full log: $LOG_FILE"
fi

if [ -d "frontend/reports/mutation/html" ]; then
    echo ""
    echo "${GREEN}HTML Report: frontend/reports/mutation/html/index.html${NC}"
fi

echo ""
echo "========================================="
echo "Monitoring completed at $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
