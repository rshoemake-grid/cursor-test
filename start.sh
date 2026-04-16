#!/bin/bash
# Startup script for Agentic Workflow Engine (Phase 2)

set -e

echo "=========================================="
echo "Agentic Workflow Engine - Phase 2"
echo "=========================================="
echo ""

if [ ! -x "backend-java/gradlew" ]; then
    echo "⚠️  backend-java/gradlew not found."
    exit 1
fi

if ! command -v java >/dev/null 2>&1; then
    echo "⚠️  Java is not on PATH. Install JDK 17+ (Temurin recommended)."
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
    echo ""
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Please create .env file with:"
    echo "   OPENAI_API_KEY=your-key-here"
    echo ""
    echo "Copy from .env.example:"
    echo "   cp .env.example .env"
    exit 1
fi

echo "🚀 Starting servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend in background (Spring Boot)
echo "▶️  Starting Java API on http://localhost:8000"
( cd backend-java && ./gradlew bootRun ) > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..90}; do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 90 ]; then
        echo "❌ Backend failed to start. Check backend.log"
        exit 1
    fi
done

echo ""

# Start frontend in background
echo "▶️  Starting frontend on http://localhost:3000"
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
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
echo "Press Ctrl+C to stop both servers"
echo "=========================================="
echo ""

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID
