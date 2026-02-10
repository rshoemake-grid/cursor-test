#!/bin/bash
LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "=== Mutation Testing Status - $(date '+%H:%M:%S') ==="
echo ""

if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
    PID=$(cat "$PID_FILE")
    runtime=$(ps -p $PID -o etime= | tr -d ' ')
    echo "✅ Process RUNNING"
    echo "   PID: $PID"
    echo "   Runtime: $runtime"
    
    # Check for OOM errors
    if grep -q "ran out of memory" "$LOG_FILE" 2>/dev/null; then
        oom_count=$(grep -c "ran out of memory" "$LOG_FILE" 2>/dev/null | head -1)
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
        grep -E "[0-9]+ (killed|survived|timeout|no coverage|error)" "$LOG_FILE" | tail -10
        echo ""
        if [ -d "reports/mutation" ]; then
            echo "=== HTML Report ==="
            echo "file://$(pwd)/reports/mutation/mutation.html"
        fi
    else
        echo ""
        echo "📊 Current Progress:"
        if grep -q "Mutation testing [0-9]+%" "$LOG_FILE" 2>/dev/null; then
            grep -E "Mutation testing [0-9]+%" "$LOG_FILE" | tail -1
            grep -E "[0-9]+ tested|[0-9]+ survived|[0-9]+ killed" "$LOG_FILE" 2>/dev/null | tail -3
        else
            echo "   Initial test run phase (DryRunExecutor)..."
            tail -1 "$LOG_FILE" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | cut -c1-120
        fi
    fi
else
    echo "❌ Process STOPPED"
    if grep -q "Final mutation score\|Done in\|Mutation testing complete" "$LOG_FILE" 2>/dev/null; then
        echo ""
        echo "🎉 COMPLETED!"
        grep -E "Final mutation score|Done in" "$LOG_FILE" | tail -2
    else
        echo ""
        echo "⚠️  Process stopped unexpectedly"
        tail -20 "$LOG_FILE" 2>/dev/null | tail -10
    fi
fi
echo ""
