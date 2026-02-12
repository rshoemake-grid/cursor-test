#!/bin/bash

# Quick status check script for mutation tests

echo "=== Mutation Test Status Check ==="
echo "Time: $(date)"
echo ""

# Check if Stryker is running
STRYKER_PID=$(pgrep -f "stryker run" | head -1)
if [ -n "$STRYKER_PID" ]; then
    echo "✅ Stryker is RUNNING (PID: $STRYKER_PID)"
    
    # Check CPU and memory usage
    ps -p $STRYKER_PID -o %cpu,%mem,etime,command 2>/dev/null | tail -1
    
    # Count worker processes
    WORKER_COUNT=$(pgrep -f "child-process-proxy-worker" | wc -l | tr -d ' ')
    echo "   Worker processes: $WORKER_COUNT"
else
    echo "❌ Stryker is NOT running"
fi

echo ""

# Check monitor script
MONITOR_PID=$(pgrep -f "monitor_mutation_continuous" | head -1)
if [ -n "$MONITOR_PID" ]; then
    echo "✅ Monitor script is RUNNING (PID: $MONITOR_PID)"
else
    echo "❌ Monitor script is NOT running"
fi

echo ""

# Check log file for recent activity
if [ -f "/tmp/stryker-dryrun.log" ]; then
    LAST_LINE=$(tail -1 /tmp/stryker-dryrun.log 2>/dev/null)
    LAST_MOD=$(stat -f %Sm -t "%Y-%m-%d %H:%M:%S" /tmp/stryker-dryrun.log 2>/dev/null || stat -c %y /tmp/stryker-dryrun.log 2>/dev/null | cut -d'.' -f1)
    echo "📋 Log file last updated: $LAST_MOD"
    echo "   Last log line: ${LAST_LINE:0:100}..."
    
    # Check for errors
    ERROR_COUNT=$(grep -i "error\|fatal\|crash\|killed" /tmp/stryker-dryrun.log 2>/dev/null | wc -l | tr -d ' ')
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "   ⚠️  Found $ERROR_COUNT potential error(s) in log"
    fi
else
    echo "📋 Log file not found"
fi

echo ""

# Check concurrency setting
CONCURRENCY=$(cd /Users/rshoemake/Documents/cursor/cursor-test/frontend && cat stryker.conf.json 2>/dev/null | grep -o '"concurrency": [0-9]*' | grep -o '[0-9]*' || echo "unknown")
echo "⚙️  Concurrency setting: $CONCURRENCY"

echo ""
echo "=== End Status Check ==="
