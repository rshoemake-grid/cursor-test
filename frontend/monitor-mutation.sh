#!/bin/bash
LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes

echo "🔍 Starting mutation testing monitor..."
echo "Checking every 5 minutes until completion..."
echo ""

iteration=0
while true; do
    iteration=$((iteration + 1))
    timestamp=$(date '+%H:%M:%S')
    echo "=== Check #$iteration at $timestamp ==="
    
    # Check if process is running
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        PID=$(cat "$PID_FILE")
        runtime=$(ps -p $PID -o etime= | tr -d ' ')
        echo "✅ Process RUNNING (PID: $PID, Runtime: $runtime)"
        
        # Check for OOM errors
        oom_count=$(grep -c "ran out of memory" "$LOG_FILE" 2>/dev/null | head -1)
        if [ -z "$oom_count" ]; then
            oom_count=0
        fi
        if [ "$oom_count" -gt 0 ] 2>/dev/null; then
            echo "⚠️  WARNING: $oom_count OOM error(s) detected!"
        else
            echo "✅ No memory leaks detected"
        fi
        
        # Check if completed
        if grep -q "Final mutation score\|Done in\|Mutation testing complete" "$LOG_FILE" 2>/dev/null; then
            echo ""
            echo "🎉 MUTATION TESTING COMPLETED!"
            echo ""
            echo "=== Final Results ==="
            grep -E "Final mutation score|Done in" "$LOG_FILE" | tail -5
            echo ""
            echo "=== Mutation Score Breakdown ==="
            grep -E "killed|survived|timeout|no coverage|error" "$LOG_FILE" | tail -10
            echo ""
            echo "=== HTML Report Location ==="
            if [ -d "reports/mutation" ]; then
                echo "file://$(pwd)/reports/mutation/mutation.html"
            fi
            break
        fi
        
        # Show progress
        echo ""
        echo "📊 Current Progress:"
        if grep -q "Mutation testing" "$LOG_FILE" 2>/dev/null; then
            grep -E "Mutation testing [0-9]+%|tested|survived|killed" "$LOG_FILE" | tail -5
        else
            echo "Initial test run phase..."
            tail -3 "$LOG_FILE" | grep -v "^$"
        fi
        
        echo ""
        echo "⏳ Waiting 5 minutes until next check..."
        echo ""
        sleep $CHECK_INTERVAL
        
    else
        echo "❌ Process STOPPED"
        
        # Check if it completed successfully
        if grep -q "Final mutation score\|Done in\|Mutation testing complete" "$LOG_FILE" 2>/dev/null; then
            echo ""
            echo "🎉 MUTATION TESTING COMPLETED!"
            echo ""
            echo "=== Final Results ==="
            grep -E "Final mutation score|Done in" "$LOG_FILE" | tail -5
            echo ""
            echo "=== Mutation Score Breakdown ==="
            grep -E "killed|survived|timeout|no coverage|error" "$LOG_FILE" | tail -10
            echo ""
            echo "=== HTML Report Location ==="
            if [ -d "reports/mutation" ]; then
                echo "file://$(pwd)/reports/mutation/mutation.html"
            fi
        else
            echo ""
            echo "⚠️  Process stopped unexpectedly!"
            echo ""
            echo "=== Last 20 lines of log ==="
            tail -20 "$LOG_FILE"
            echo ""
            echo "=== Error Check ==="
            if grep -q "ERROR\|Error\|error" "$LOG_FILE" 2>/dev/null; then
                echo "Errors found:"
                grep -E "ERROR|Error|error" "$LOG_FILE" | tail -5
            fi
            if grep -q "ran out of memory" "$LOG_FILE" 2>/dev/null; then
                echo "OOM errors found:"
                grep "ran out of memory" "$LOG_FILE" | wc -l | xargs echo "Count:"
            fi
        fi
        break
    fi
done

echo ""
echo "✅ Monitoring complete"
