#!/bin/bash
# Startup script: Spring Boot backend (backend-java) + CRA frontend (react-scripts).

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Agentic Workflow Engine"
echo "=========================================="
echo ""

if [ ! -x "backend-java/gradlew" ]; then
    echo "⚠️  backend-java/gradlew not found or not executable."
    echo "   Expected: $SCRIPT_DIR/backend-java/gradlew"
    exit 1
fi

if ! command -v java >/dev/null 2>&1; then
    echo "⚠️  Java is not on PATH. backend-java requires JDK 17 (see backend-java/README.md)."
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    (cd frontend && npm install)
    echo "✅ Frontend dependencies installed"
    echo ""
fi

if [ -f ".env" ]; then
    echo "📋 Loading environment variables from .env"
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
    echo ""
else
    echo "ℹ️  No .env at repo root. Configure LLM keys in Settings or set OPENAI_API_KEY (etc.) in your environment."
    echo ""
fi

echo "🚀 Starting servers..."
echo ""

cleanup() {
    local status=$?
    echo ""
    echo "🛑 Shutting down servers..."
    if [ -n "${BACKEND_PID:-}" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "${FRONTEND_PID:-}" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit "$status"
}

trap cleanup EXIT

echo "▶️  Starting Spring Boot backend on http://localhost:8000"
(cd backend-java && ./gradlew bootRun) > backend.log 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
for i in $(seq 1 60); do
    if curl -sS http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
    if [ "$i" -eq 60 ]; then
        echo "❌ Backend failed to start in time. Check backend.log"
        exit 1
    fi
done

echo ""
echo "▶️  Starting frontend dev server on http://localhost:3000"
(cd frontend && pnpm run start:dev) > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to start..."
for i in $(seq 1 60); do
    if curl -sS http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
    if [ "$i" -eq 60 ]; then
        echo "❌ Frontend failed to start in time. Check frontend.log"
        exit 1
    fi
done

echo ""
echo "=========================================="
echo "✅ Both servers are running!"
echo "=========================================="
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:8000"
echo "📚 API docs: http://localhost:8000/swagger-ui.html"
echo ""
echo "Logs: backend.log, frontend.log"
echo "Press Ctrl+C to stop both servers"
echo "=========================================="
echo ""

wait "$BACKEND_PID" "$FRONTEND_PID"
