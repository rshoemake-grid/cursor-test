#!/bin/bash
# Monitor mutation testing every 5 minutes and show results when complete

while true; do
    ./check-status.sh
    
    # Check if completed or stopped
    if ! [ -f mutation-test.pid ] || ! ps -p $(cat mutation-test.pid) > /dev/null 2>&1; then
        if grep -q "Final mutation score\|Done in\|Mutation testing complete" mutation-test-output.log 2>/dev/null; then
            echo "✅ Monitoring complete - mutation testing finished!"
            break
        fi
    fi
    
    if grep -q "Final mutation score\|Done in\|Mutation testing complete" mutation-test-output.log 2>/dev/null; then
        echo "✅ Monitoring complete - mutation testing finished!"
        break
    fi
    
    echo "⏳ Waiting 5 minutes until next check..."
    echo ""
    sleep 300
done
