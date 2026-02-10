#!/bin/bash

# Script to analyze potential memory leaks in test files
# Helps identify which tests might be causing OOM issues

echo "🔍 Memory Leak Analysis Tool"
echo "============================"
echo ""

LOG_FILE="mutation-test-output.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Error: $LOG_FILE not found"
    exit 1
fi

# Count OOM occurrences
oom_count=$(grep -c "ran out of memory\|Test runner.*ran out of memory" "$LOG_FILE" 2>/dev/null || echo "0")
echo "📊 Total OOM occurrences: $oom_count"
echo ""

if [ "$oom_count" -eq "0" ]; then
    echo "✅ No memory issues detected in logs"
    exit 0
fi

echo "🔍 Analyzing potential leak sources..."
echo ""

# 1. Check for tests with timers that might not be cleaned up
echo "1️⃣ Checking for tests with timers (setTimeout/setInterval):"
timer_tests=$(grep -r "setTimeout\|setInterval" src --include="*.test.ts" --include="*.test.tsx" 2>/dev/null | grep -v "clearTimeout\|clearInterval\|jest.useFakeTimers\|jest.runOnlyPendingTimers\|jest.advanceTimersByTime" | wc -l | tr -d ' ')
echo "   Found $timer_tests test files with timers (check cleanup)"
echo ""

# 2. Check for event listeners
echo "2️⃣ Checking for event listeners (addEventListener):"
listener_tests=$(grep -r "addEventListener" src --include="*.test.ts" --include="*.test.tsx" 2>/dev/null | grep -v "removeEventListener" | wc -l | tr -d ' ')
echo "   Found $listener_tests instances without removeEventListener"
echo ""

# 3. Check for WebSocket usage
echo "3️⃣ Checking for WebSocket tests:"
ws_tests=$(find src -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -l "WebSocket\|useWebSocket" 2>/dev/null | wc -l | tr -d ' ')
echo "   Found $ws_tests test files using WebSocket"
echo ""

# 4. Check for tests without afterEach cleanup
echo "4️⃣ Checking for tests without afterEach cleanup:"
no_cleanup=$(find src -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -L "afterEach" 2>/dev/null | wc -l | tr -d ' ')
echo "   Found $no_cleanup test files without afterEach"
echo ""

# 5. Find large test files (more likely to have leaks)
echo "5️⃣ Largest test files (potential leak sources):"
find src -name "*.test.ts" -o -name "*.test.tsx" | xargs wc -l 2>/dev/null | sort -rn | head -10 | tail -9
echo ""

# 6. Show OOM occurrences with context
echo "6️⃣ Recent OOM occurrences with context:"
echo "   (Showing last 3 occurrences)"
grep -B 15 "ran out of memory\|Test runner.*ran out of memory" "$LOG_FILE" 2>/dev/null | grep -E "ran out of memory|tested|Mutation testing|describe|it\(" | tail -9
echo ""

# 7. Recommendations
echo "💡 Recommendations:"
echo "   1. Review test files using WebSocket (especially useWebSocket.*.test.ts)"
echo "   2. Ensure all timer tests use jest.useFakeTimers() and cleanup"
echo "   3. Verify event listeners are removed in afterEach"
echo "   4. Check large test files for proper cleanup"
echo "   5. See MEMORY_LEAK_INVESTIGATION.md for detailed steps"
echo ""

# 8. Quick check for common patterns
echo "7️⃣ Quick pattern check:"
echo ""
echo "   Tests with timers but no cleanup:"
grep -r "setTimeout\|setInterval" src --include="*.test.ts" --include="*.test.tsx" 2>/dev/null | grep -v "clearTimeout\|clearInterval\|jest.useFakeTimers\|jest.runOnlyPendingTimers" | head -5 | sed 's/^/     /' || echo "     None found"
echo ""
echo "   Tests with addEventListener but no removeEventListener:"
grep -r "addEventListener" src --include="*.test.ts" --include="*.test.tsx" 2>/dev/null | grep -v "removeEventListener" | head -5 | sed 's/^/     /' || echo "     None found"
echo ""

echo "✅ Analysis complete. Review the findings above."
