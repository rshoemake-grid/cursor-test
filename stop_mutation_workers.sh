#!/bin/bash
# Script to stop Cosmic Ray HTTP workers

echo "Stopping Cosmic Ray HTTP workers..."

# Stop workers by PID files
for pid_file in worker_*.pid; do
    if [ -f "$pid_file" ]; then
        PORT=$(echo "$pid_file" | sed 's/worker_\(.*\)\.pid/\1/')
        PID=$(cat "$pid_file")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Stopping worker on port $PORT (PID: $PID)..."
            kill "$PID" 2>/dev/null || true
        fi
        rm "$pid_file"
    fi
done

# Also try to kill any remaining cosmic-ray http-worker processes
pkill -f "cosmic-ray.*http-worker" 2>/dev/null && echo "Stopped remaining workers" || echo "No remaining workers found"

# Clean up worker directories (optional - comment out if you want to keep them)
# echo "Cleaning up worker directories..."
# rm -rf worker_*

echo "All workers stopped."

