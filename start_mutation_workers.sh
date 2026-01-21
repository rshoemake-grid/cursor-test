#!/bin/bash
# Script to start Cosmic Ray HTTP workers for parallel mutation testing
# This script starts 8 worker processes, each with its own copy of the code

set -e

WORKER_COUNT=8
BASE_PORT=9876
PROJECT_DIR=$(pwd)

echo "Starting $WORKER_COUNT Cosmic Ray HTTP workers for parallel mutation testing..."
echo "Project directory: $PROJECT_DIR"
echo ""

# Check if git repo exists
if [ ! -d ".git" ]; then
    echo "Initializing git repository for cr-http-workers..."
    git init
    git add .
    git commit -m "Initial commit for mutation testing" || echo "Note: Some files may be ignored"
fi

# Start workers using cr-http-workers if available
if command -v cr-http-workers &> /dev/null; then
    echo "Using cr-http-workers to start workers..."
    cr-http-workers cosmic-ray.toml .
else
    echo "cr-http-workers not found. Starting workers manually..."
    
    # Create worker directories and start workers
    for i in $(seq 0 $((WORKER_COUNT - 1))); do
        PORT=$((BASE_PORT + i))
        WORKER_DIR="worker_$PORT"
        
        echo "Setting up worker $i on port $PORT..."
        
        # Create worker directory if it doesn't exist
        if [ ! -d "$WORKER_DIR" ]; then
            mkdir -p "$WORKER_DIR"
            # Copy necessary files (simplified - in production, use git clone)
            cp -r backend "$WORKER_DIR/" 2>/dev/null || true
            cp pytest.ini "$WORKER_DIR/" 2>/dev/null || true
            cp requirements.txt "$WORKER_DIR/" 2>/dev/null || true
        fi
        
        # Start worker in background
        (
            cd "$WORKER_DIR"
            cosmic-ray --verbosity INFO http-worker --port $PORT > "../worker_${PORT}.log" 2>&1 &
            echo $! > "../worker_${PORT}.pid"
        )
        
        echo "Worker $i started on port $PORT (PID: $(cat worker_${PORT}.pid))"
    done
    
    echo ""
    echo "All workers started!"
    echo "Worker logs are in worker_*.log files"
    echo "Worker PIDs are in worker_*.pid files"
    echo ""
    echo "To stop workers, run: ./stop_mutation_workers.sh"
fi

echo ""
echo "Workers are running. You can now run:"
echo "  cosmic-ray exec cosmic-ray.toml session.sqlite"
echo ""
echo "Press Ctrl+C to stop workers when done."

