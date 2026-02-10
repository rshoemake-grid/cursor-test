#!/bin/bash
LOG_FILE="mutation-test-output.log"
PID_FILE="mutation-test.pid"

check_status() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ PID file not found"
        return 1
    fi
    
    PID=$(cat "$PID_FILE" 2>/dev/null)
    if [ -z "$PID" ]; then
        echo "❌ Could not read PID"
        return 1
    fi
    
    if ps -p "$PID" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

if check_status; then
    echo "✅ Mutation testing still running..."
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "Recent progress:"
        tail -20 "$LOG_FILE" | grep -E "mutants|killed|survived|score|%|Testing|Running" | tail -8 || echo "Waiting for detailed output..."
    fi
else
    echo "🔍 Process completed. Checking results..."
    if [ -f "$LOG_FILE" ]; then
        if grep -q "Mutation testing complete\|Final mutation score\|All tests done" "$LOG_FILE" 2>/dev/null; then
            echo "✅ Mutation testing complete!"
            return 0
        fi
    fi
    echo "⚠️ Process ended but completion not confirmed"
    return 1
fi
