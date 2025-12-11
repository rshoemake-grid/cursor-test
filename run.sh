#!/bin/bash
# Convenience script for common operations

set -e

case "$1" in
  verify)
    echo "Verifying setup..."
    python verify_setup.py
    ;;
  
  install)
    echo "Installing dependencies..."
    pip install -r requirements.txt
    echo "✓ Dependencies installed"
    echo ""
    echo "Next steps:"
    echo "  1. Create .env file with your OPENAI_API_KEY"
    echo "  2. Run: ./run.sh verify"
    echo "  3. Run: ./run.sh server"
    ;;
  
  server)
    echo "Starting server..."
    python main.py
    ;;
  
  test)
    echo "Running API tests..."
    python test_api.py
    ;;
  
  example-simple)
    echo "Running simple workflow example..."
    python examples/simple_workflow.py
    ;;
  
  example-research)
    echo "Running research workflow example..."
    python examples/research_workflow.py
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

