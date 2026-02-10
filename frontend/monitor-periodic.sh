#!/bin/bash
LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"
CHECK_INTERVAL=300  # 5 minutes

echo "🔍 Mutation Testing Monitor"
echo "Checking every 5 minutes until completion..."
echo "Press Ctrl+C to stop monitoring (won't stop mutation testing)"
echo ""

iteration=0
while true; do
    iteration=$((iteration + 1))
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "=== Check #$iteration at $timestamp ==="
    echo ""
    
    # Check if process is running
    if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
        PID=$(cat "$PID_FILE")
        runtime=$(ps -p $PID -o etime= | tr -d ' ')
        echo "✅ Process RUNNING"
        echo "   PID: $PID"
        echo "   Runtime: $runtime"
        
        # Check for OOM errors
        oom_count=$(grep -c "ran out of memory" "$LOG_FILE" 2>/dev/null | head -1)
        if [ -z "$oom_count" ]; then
            oom_count=0
        fi
        if [ "$oom_count" -gt 0 ] 2>/dev/null; then
            echo "   ⚠️  WARNING: $oom_count OOM error(s) detected!"
        else
            echo "   ✅ No memory leaks detected"
        fi
        
        # Check if completed
        if grep -q "Final mutation score\|Done in\|Mutation testing complete" "$LOG_FILE" 2>/dev/null; then
            echo ""
            echo "🎉🎉🎉 MUTATION TESTING COMPLETED! 🎉🎉🎉"
            echo ""
            echo "=== Final Results ==="
            grep -E "Final mutation score|Done in" "$LOG_FILE" | tail -5
            echo ""
            echo "=== Mutation Score Breakdown ==="
            grep -E "killed|survived|timeout|no coverage|error" "$LOG_FILE" | grep -E "[0-9]+ (killed|survived|timeout|no coverage|error)" | tail -10
            echo ""
            echo "=== HTML Report Location ==="
            if [ -d "reports/mutation" ]; then
                echo "file://$(pwd)/reports/mutation/mutation.html"
            fi
            echo ""
            break
        fi
        
        # Show progress
        echo ""
        echo "📊 Current Progress:"
        if grep -q "Mutation testing" "$LOG_FILE" 2>/dev/null; then
            progress_line=$(grep -E "Mutation testing [0-9]+%" "$LOG_FILE" 2>/dev/null | tail -1)
            if [ -n "$progress_line" ]; then
                echo "   $progress_line"
            fi
            stats=$(grep -E "[0-9]+ tested|[0-9]+ survived|[0-9]+ killed" "$LOG_FILE" 2>/dev/null | tail -3)
            if [ -n "$stats" ]; then
                echo "$stats" | sed 's/^/   /'
            fi
        else
            echo "   Initial test run phase (DryRunExecutor)..."
            last_line=$(tail -1 "$LOG_FILE" 2>/dev/null)
            if [ -n "$last_line" ]; then
                echo "   $(echo "$last_line" | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-100)"
            fi
        fi
        
        echo ""
        echo "⏳ Next check in 5 minutes..."
        echo ""
        sleep $CHECK_INTERVAL
        
    else
        echo "❌ Process STOPPED"
        
        # Check if it completed successfully
        if grep -q "Final mutation score\|Done in\|Mutation testing complete" "$LOG_FILE" 2>/dev/null; then
            echo ""
            echo "🎉🎉🎉 MUTATION TESTING COMPLETED! 🎉🎉🎉"
            echo ""
            echo "=== Final Results ==="
            grep -E "Final mutation score|Done in" "$LOG_FILE" | tail -5
            echo ""
            echo "=== Mutation Score Breakdown ==="
            grep -E "killed|survived|timeout|no coverage|error" "$LOG_FILE" | grep -E "[0-9]+ (killed|survived|timeout|no coverage|error)" | tail -10
            echo ""
            echo "=== HTML Report Location ==="
            if [ -d "reports/mutation" ]; then
                echo "file://$(pwd)/reports/mutation/mutation.html"
            fi
        else
            echo ""
            echo "⚠️  Process stopped unexpectedly!"
            echo ""
            echo "=== Last 30 lines of log ==="
            tail -30 "$LOG_FILE" | sed 's/^/   /'
            echo ""
            echo "=== Error Summary ==="
            if grep -q "ERROR\|Error" "$LOG_FILE" 2>/dev/null; then
                echo "Errors found:"
                grep -E "ERROR|Error" "$LOG_FILE" | tail -5 | sed 's/^/   /'
            fi
            if grep -q "ran out of memory" "$LOG_FILE" 2>/dev/null; then
                oom_total=$(grep "ran out of memory" "$LOG_FILE" | wc -l | tr -d ' ')
                echo "OOM errors: $oom_total"
            fi
        fi
        break
    fi
done

echo ""
echo "✅ Monitoring complete"
