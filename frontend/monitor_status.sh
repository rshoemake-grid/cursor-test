#!/bin/bash

# Quick status check for mutation testing

LOG_FILE="mutation_test.log"
PID_FILE="mutation_test.pid"

echo "========================================="
echo "Mutation Testing - Quick Status"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="
echo ""

# Check if running
if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
    echo "✅ Status: RUNNING"
    echo "   PID: $(cat $PID_FILE)"
else
    echo "❌ Status: NOT RUNNING"
fi

echo ""

# Show latest progress
if [ -f "$LOG_FILE" ]; then
    LATEST=$(tail -20 "$LOG_FILE" | grep -E "Mutation testing.*%" | tail -1)
    if [ -n "$LATEST" ]; then
        echo "📊 Latest Progress:"
        echo "   $LATEST"
    else
        echo "📊 Status: Initializing..."
    fi
    
    # Check for completion
    if tail -200 "$LOG_FILE" | grep -qE "Mutation test report|Mutation score"; then
        echo ""
        echo "🎉 COMPLETED!"
        echo ""
        tail -200 "$LOG_FILE" | grep -A 10 "Mutation score" | head -15
    fi
else
    echo "⚠️  Log file not found"
fi

echo ""
echo "========================================="
