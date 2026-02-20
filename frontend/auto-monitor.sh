#!/bin/bash

# Automated monitoring script for mutation testing
# Checks every 5 minutes and reports progress

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_FILE="mutation-monitor.log"
STAMP_FILE=".mutation-start-time"

# Initialize start time if not set
if [ ! -f "$STAMP_FILE" ]; then
    echo "$(date +%s)" > "$STAMP_FILE"
fi

START_TIME=$(cat "$STAMP_FILE")
CURRENT_TIME=$(date +%s)
ELAPSED=$((CURRENT_TIME - START_TIME))
ELAPSED_MIN=$((ELAPSED / 60))
ELAPSED_SEC=$((ELAPSED % 60))

echo "==========================================" | tee -a "$LOG_FILE"
echo "Mutation Testing Auto-Monitor - $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"
echo "Elapsed Time: ${ELAPSED_MIN}m ${ELAPSED_SEC}s" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"

# Check if Stryker process is running
STRYKER_PID=$(ps aux | grep -E "stryker run|npx stryker" | grep -v grep | awk '{print $2}' | head -1)

if [ -z "$STRYKER_PID" ]; then
    echo "⚠️  ALERT: Mutation testing process NOT FOUND!" | tee -a "$LOG_FILE"
    echo "Checking for completion or crash..." | tee -a "$LOG_FILE"
    
    # Check if there's a recent completion or error
    if [ -f "stryker.log" ]; then
        LAST_LINE=$(tail -1 stryker.log 2>/dev/null)
        if echo "$LAST_LINE" | grep -qE "(completed|finished|succeeded|Mutation score)"; then
            echo "✅ Mutation testing appears to have completed!" | tee -a "$LOG_FILE"
            echo "Last log entry: $LAST_LINE" | tee -a "$LOG_FILE"
            
            # Extract mutation score if available
            if grep -q "Mutation score" stryker.log 2>/dev/null; then
                echo "" | tee -a "$LOG_FILE"
                echo "=== MUTATION TESTING RESULTS ===" | tee -a "$LOG_FILE"
                grep -A 10 "Mutation score" stryker.log | tail -15 | tee -a "$LOG_FILE"
            fi
        elif echo "$LAST_LINE" | grep -qE "(ERROR|failed|There were failed tests)"; then
            echo "❌ ALERT: Mutation testing CRASHED or FAILED!" | tee -a "$LOG_FILE"
            echo "Last log entry: $LAST_LINE" | tee -a "$LOG_FILE"
            echo "" | tee -a "$LOG_FILE"
            echo "=== ERROR DETAILS ===" | tee -a "$LOG_FILE"
            tail -50 stryker.log | grep -E "(ERROR|failed|There were)" | tail -10 | tee -a "$LOG_FILE"
        else
            echo "⚠️  Process stopped but unclear status. Last log entry:" | tee -a "$LOG_FILE"
            echo "$LAST_LINE" | tee -a "$LOG_FILE"
        fi
    fi
    
    exit 1
fi

echo "✓ Process Status: RUNNING (PID: $STRYKER_PID)" | tee -a "$LOG_FILE"

# Check log file for progress
if [ -f "stryker.log" ]; then
    LOG_SIZE=$(wc -l < stryker.log 2>/dev/null | tr -d ' ')
    LOG_MODIFIED=$(stat -f "%Sm" stryker.log 2>/dev/null || stat -c "%y" stryker.log 2>/dev/null)
    
    echo "" | tee -a "$LOG_FILE"
    echo "=== PROGRESS UPDATE ===" | tee -a "$LOG_FILE"
    
    # Check for instrumentation phase
    if grep -q "Instrumented.*source file" stryker.log 2>/dev/null; then
        INSTRUMENTED=$(grep "Instrumented.*source file" stryker.log | tail -1 | grep -oE "[0-9]+ source file" | grep -oE "[0-9]+")
        MUTANTS=$(grep "Instrumented.*source file" stryker.log | tail -1 | grep -oE "[0-9]+ mutant" | grep -oE "[0-9]+")
        echo "✓ Instrumentation: $INSTRUMENTED files, $MUTANTS mutants created" | tee -a "$LOG_FILE"
    fi
    
    # Check for dry run phase
    if grep -q "Starting initial test run" stryker.log 2>/dev/null; then
        echo "→ Phase: Initial Test Run (Dry Run)" | tee -a "$LOG_FILE"
    fi
    
    # Check for mutation testing phase
    if grep -q "MutationTestExecutor\|mutants tested\|Progress" stryker.log 2>/dev/null; then
        echo "→ Phase: Mutation Testing" | tee -a "$LOG_FILE"
        
        # Try to extract progress
        PROGRESS=$(grep -E "mutants tested|Progress|%" stryker.log | tail -1)
        if [ ! -z "$PROGRESS" ]; then
            echo "  Progress: $PROGRESS" | tee -a "$LOG_FILE"
        fi
        
        # Extract killed/survived counts if available
        KILLED=$(grep -E "killed|Killed" stryker.log | tail -1 | grep -oE "[0-9]+" | head -1)
        SURVIVED=$(grep -E "survived|Survived" stryker.log | tail -1 | grep -oE "[0-9]+" | head -1)
        if [ ! -z "$KILLED" ] && [ ! -z "$SURVIVED" ]; then
            TOTAL=$((KILLED + SURVIVED))
            PERCENT=$((KILLED * 100 / TOTAL))
            echo "  Mutants: $KILLED killed, $SURVIVED survived ($PERCENT% kill rate)" | tee -a "$LOG_FILE"
        fi
    fi
    
    # Check for completion
    if grep -q "Mutation score\|completed\|finished" stryker.log 2>/dev/null; then
        echo "" | tee -a "$LOG_FILE"
        echo "✅ MUTATION TESTING COMPLETED!" | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
        echo "=== FINAL RESULTS ===" | tee -a "$LOG_FILE"
        grep -A 20 "Mutation score" stryker.log | tail -25 | tee -a "$LOG_FILE"
        exit 0
    fi
    
    # Check for errors
    if tail -100 stryker.log | grep -qE "ERROR|There were failed tests"; then
        echo "" | tee -a "$LOG_FILE"
        echo "❌ ALERT: ERRORS DETECTED!" | tee -a "$LOG_FILE"
        tail -100 stryker.log | grep -E "ERROR|There were failed tests" | tail -5 | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    echo "Log file: $LOG_SIZE lines, modified: $LOG_MODIFIED" | tee -a "$LOG_FILE"
else
    echo "⚠️  Log file not found yet" | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "Next check in 5 minutes..." | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

exit 0
