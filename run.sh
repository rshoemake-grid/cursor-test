#!/bin/bash
# Convenience script for common operations

set -e

# Always run from repository root so commands work from any cwd (e.g. frontend/).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
PYTHON_CMD="$(command -v python3 || command -v python || echo python3)"

case "$1" in
  verify)
    echo "Verifying Python tooling (scripts tests)..."
    "$PYTHON_CMD" -m pytest scripts/ -q
    ;;

  install)
    echo "Installing minimal Python deps (scripts tests only)..."
    "$PYTHON_CMD" -m pip install -r requirements.txt
    echo "✓ Dependencies installed"
    echo ""
    echo "Next steps:"
    echo "  API server: ./run.sh server   (Spring Boot in backend-java/)"
    echo "  Optional: ./run.sh verify     (pytest scripts/)"
    ;;

  server)
    echo "Starting Java API (Spring Boot)..."
    echo "API: http://localhost:8000  (from repo root: $ROOT)"
    cd "$ROOT/backend-java" && exec ./gradlew bootRun
    ;;

  test)
    echo "Running scripts/ Python tests..."
    "$PYTHON_CMD" -m pytest scripts/ -q
    ;;

  example-simple|example-research)
    echo "Python API examples were removed with the FastAPI backend."
    echo "Use the Java API at http://localhost:8000 (./run.sh server) and the app UI instead."
    exit 1
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
    echo "  install          Install minimal Python deps (pytest for scripts/)"
    echo "  verify           Run pytest on scripts/"
    echo "  server           Start the Java API server (Spring Boot)"
    echo "  test             Same as verify (scripts tests)"
    echo "  clean            Clean up temporary files"
    echo "  help             Show this help message"
    echo ""
    ;;
esac
