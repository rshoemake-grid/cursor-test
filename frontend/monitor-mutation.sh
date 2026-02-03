#!/bin/bash
# Monitor mutation testing progress

TERMINAL_FILE="/Users/rshoemake/.cursor/projects/Users-rshoemake-Documents-cursor-cursor-test/terminals/497493.txt"

echo "Monitoring mutation testing progress..."
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    if [ -f "$TERMINAL_FILE" ]; then
        # Get the last 20 lines
        tail -20 "$TERMINAL_FILE" | grep -E "(INFO|WARN|ERROR|mutant|killed|survived|Mutation testing complete|All tests passed|FAILED)" || echo "Still running..."
        echo ""
        echo "---"
        echo ""
    fi
    
    # Check if process is still running
    if ! ps aux | grep -i stryker | grep -v grep > /dev/null; then
        echo "Mutation testing process completed!"
        echo ""
        echo "Final output:"
        tail -100 "$TERMINAL_FILE"
        break
    fi
    
    sleep 10
done
