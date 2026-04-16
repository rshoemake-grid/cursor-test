#!/bin/bash
# Shutdown script for Agentic Workflow Engine

# Don't exit on error - gracefully handle missing services
set +e

echo "=========================================="
echo "🛑 Shutting down servers..."
echo "=========================================="
echo ""

# Find and stop backend (port 8000)
BACKEND_PIDS=$(lsof -ti :8000 2>/dev/null || true)
if [ -n "$BACKEND_PIDS" ]; then
    echo "▶️  Stopping backend server (port 8000)..."
    for pid in $BACKEND_PIDS; do
        echo "   Killing process $pid"
        kill $pid 2>/dev/null || true
    done
    sleep 1
    # Force kill if still running
    BACKEND_PIDS=$(lsof -ti :8000 2>/dev/null || true)
    if [ -n "$BACKEND_PIDS" ]; then
        echo "   Force killing backend processes..."
        kill -9 $BACKEND_PIDS 2>/dev/null || true
    fi
    echo "✅ Backend stopped"
else
    echo "ℹ️  Backend server not running (port 8000)"
fi

echo ""

# Find and stop frontend (port 3000)
FRONTEND_PIDS=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$FRONTEND_PIDS" ]; then
    echo "▶️  Stopping frontend server (port 3000)..."
    for pid in $FRONTEND_PIDS; do
        echo "   Killing process $pid"
        kill $pid 2>/dev/null || true
    done
    sleep 1
    # Force kill if still running
    FRONTEND_PIDS=$(lsof -ti :3000 2>/dev/null || true)
    if [ -n "$FRONTEND_PIDS" ]; then
        echo "   Force killing frontend processes..."
        kill -9 $FRONTEND_PIDS 2>/dev/null || true
    fi
    echo "✅ Frontend stopped"
else
    echo "ℹ️  Frontend server not running (port 3000)"
fi

echo ""

# Optional: stop legacy Python API if anything is still bound to uvicorn (port 8000 should already be cleared above)
REMAINING_PYTHON=$(ps aux 2>/dev/null | grep -E "uvicorn backend\.main:app" | grep -v grep | awk '{print $2}' || true)
REMAINING_NODE=$(ps aux 2>/dev/null | grep -E "node.*vite|npm.*dev" | grep -v grep | awk '{print $2}' || true)

if [ -n "$REMAINING_PYTHON" ] || [ -n "$REMAINING_NODE" ]; then
    echo "⚠️  Found additional related processes:"
    if [ -n "$REMAINING_PYTHON" ]; then
        echo "   Legacy Python API (uvicorn): $REMAINING_PYTHON"
        kill $REMAINING_PYTHON 2>/dev/null || true
    fi
    if [ -n "$REMAINING_NODE" ]; then
        echo "   Node processes: $REMAINING_NODE"
        kill $REMAINING_NODE 2>/dev/null || true
    fi
    sleep 1
fi

# Final check
echo ""
echo "Checking ports..."
BACKEND_CHECK=$(lsof -ti :8000 2>/dev/null || true)
FRONTEND_CHECK=$(lsof -ti :3000 2>/dev/null || true)

if [ -z "$BACKEND_CHECK" ] && [ -z "$FRONTEND_CHECK" ]; then
    echo "=========================================="
    echo "✅ All servers stopped successfully!"
    echo "=========================================="
else
    echo "=========================================="
    echo "⚠️  Some processes may still be running"
    echo "=========================================="
    if [ -n "$BACKEND_CHECK" ]; then
        echo "   Backend still running on port 8000"
    fi
    if [ -n "$FRONTEND_CHECK" ]; then
        echo "   Frontend still running on port 3000"
    fi
fi

echo ""

# Always exit successfully
exit 0

