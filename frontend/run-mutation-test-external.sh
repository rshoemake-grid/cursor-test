#!/bin/bash

# Mutation Testing - External Runner Script
# Run this script in Terminal.app or iTerm (outside Cursor) to avoid crashes

set -e

echo "=========================================="
echo "Mutation Testing - External Runner"
echo "=========================================="
echo ""
echo "This script runs mutation testing outside Cursor to prevent crashes."
echo ""

# Change to frontend directory
cd "$(dirname "$0")"
#cd frontend

# Check if already running
if pgrep -f "stryker run" > /dev/null; then
    echo "⚠️  Mutation testing is already running!"
    echo "   PID: $(pgrep -f 'stryker run')"
    echo ""
    read -p "Kill existing process and restart? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "stryker run"
        sleep 2
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Create output log file
LOG_FILE="mutation-test-output.log"
echo "📝 Logging output to: $LOG_FILE"
echo ""

# Run mutation testing
echo "🚀 Starting mutation testing..."
echo "   Configuration:"
echo "   - ignoreStatic: true (skips 95% of static mutants)"
echo "   - coverageAnalysis: perTest"
echo "   - concurrency: 1 (single worker)"
echo "   - 14 files excluded"
echo ""
echo "⏱️  Expected runtime: ~20-30 minutes"
echo ""
echo "Press Ctrl+C to stop (output will be saved to $LOG_FILE)"
echo ""

# Run mutation testing and log output
npm run test:mutation 2>&1 | tee "$LOG_FILE"

# Check exit code
EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Mutation testing completed successfully!"
    echo ""
    echo "📊 Reports available at: reports/mutation/"
    echo "📄 HTML report: reports/mutation/mutation.html"
else
    echo "❌ Mutation testing failed (exit code: $EXIT_CODE)"
    echo ""
    echo "📝 Check logs: $LOG_FILE"
fi
echo "=========================================="

exit $EXIT_CODE
