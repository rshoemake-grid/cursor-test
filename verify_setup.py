"""
Setup Verification Script
Run this to verify your environment is configured correctly
"""

import sys
import os


def check_python_version():
    """Check Python version"""
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✓ Python version: {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"✗ Python version: {version.major}.{version.minor}.{version.micro} (3.8+ required)")
        return False


def check_dependencies():
    """Check if required packages are installed"""
    required = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "sqlalchemy",
        "aiosqlite",
        "openai",
        "dotenv",
        "httpx"
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} (missing)")
            missing.append(package)
    
    return len(missing) == 0


def check_env_file():
    """Check if .env file exists and has required variables"""
    if not os.path.exists(".env"):
        print("✗ .env file not found")
        print("  Create a .env file with:")
        print("    OPENAI_API_KEY=your-key-here")
        print("    DATABASE_URL=sqlite+aiosqlite:///./workflows.db")
        return False
    
    print("✓ .env file exists")
    
    # Check for required variables
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your-api-key-here":
        print("  ⚠ OPENAI_API_KEY not set or using placeholder")
        return False
    else:
        print(f"  ✓ OPENAI_API_KEY is set ({api_key[:8]}...)")
    
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        print(f"  ✓ DATABASE_URL is set")
    
    return True


def check_file_structure():
    """Check if required directories and files exist"""
    required_dirs = [
        "backend",
        "backend/models",
        "backend/database",
        "backend/engine",
        "backend/agents",
        "backend/api",
        "examples"
    ]
    
    required_files = [
        "main.py",
        "requirements.txt",
        "backend/models/schemas.py",
        "backend/database/db.py",
        "backend/engine/executor.py",
        "backend/agents/llm_agent.py",
        "backend/api/routes.py"
    ]
    
    all_exist = True
    
    for directory in required_dirs:
        if os.path.isdir(directory):
            print(f"✓ {directory}/")
        else:
            print(f"✗ {directory}/ (missing)")
            all_exist = False
    
    for file in required_files:
        if os.path.isfile(file):
            print(f"✓ {file}")
        else:
            print(f"✗ {file} (missing)")
            all_exist = False
    
    return all_exist


def main():
    """Main verification function"""
    print("=" * 60)
    print("Agentic Workflow Engine - Setup Verification")
    print("=" * 60)
    print()
    
    print("Checking Python Version:")
    print("-" * 60)
    python_ok = check_python_version()
    print()
    
    print("Checking Dependencies:")
    print("-" * 60)
    deps_ok = check_dependencies()
    print()
    
    print("Checking Environment Configuration:")
    print("-" * 60)
    env_ok = check_env_file()
    print()
    
    print("Checking File Structure:")
    print("-" * 60)
    files_ok = check_file_structure()
    print()
    
    print("=" * 60)
    if python_ok and deps_ok and env_ok and files_ok:
        print("✓ All checks passed! You're ready to run the application.")
        print()
        print("Next steps:")
        print("  1. Start the server: python main.py")
        print("  2. Run an example: python examples/simple_workflow.py")
        print("  3. View API docs: http://localhost:8000/docs")
    else:
        print("✗ Some checks failed. Please fix the issues above.")
        print()
        if not deps_ok:
            print("To install dependencies: pip install -r requirements.txt")
        if not env_ok:
            print("To create .env file: cp .env.example .env")
            print("Then edit .env and add your OpenAI API key")
    print("=" * 60)


if __name__ == "__main__":
    main()

