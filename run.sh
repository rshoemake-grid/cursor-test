#!/bin/bash
# Convenience script for common operations

set -e

# Always run from repository root so commands work from any cwd (e.g. frontend/).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
PYTHON_CMD="$(command -v python3 || command -v python || echo python3)"

case "$1" in
  verify)
    echo "Verifying setup..."
    "$PYTHON_CMD" verify_setup.py
    ;;
  
  install)
    echo "Installing dependencies..."
    "$PYTHON_CMD" -m pip install -r requirements.txt
    echo "✓ Dependencies installed"
    echo ""
    echo "Next steps:"
    echo "  1. Create .env file with your OPENAI_API_KEY"
    echo "  2. Run: ./run.sh verify"
    echo "  3. Run: ./run.sh server"
    ;;
  
  server)
    echo "Starting Java API (Spring Boot)..."
    echo "API: http://localhost:8000  (from repo root: $ROOT)"
    cd "$ROOT/backend-java" && exec ./gradlew bootRun
    ;;
  
  test)
    echo "Running API tests..."
    "$PYTHON_CMD" test_api.py
    ;;
  
  example-simple)
    echo "Running simple workflow example..."
    "$PYTHON_CMD" examples/simple_workflow.py
    ;;
  
  example-research)
    echo "Running research workflow example..."
    "$PYTHON_CMD" examples/research_workflow.py
    ;;
  
  clean)
    echo "Cleaning up..."
    rm -f workflows.db
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    echo "✓ Cleaned"
    ;;
  
  help|*)
    echo "Agentic Workflow Engine - Commands"
    echo ""
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install          Install dependencies"
    echo "  verify           Verify setup is correct"
    echo "  server           Start the API server"
    echo "  test             Run API tests"
    echo "  example-simple   Run simple workflow example"
    echo "  example-research Run research workflow example"
    echo "  clean            Clean up temporary files"
    echo "  help             Show this help message"
    echo ""
    ;;
esac

