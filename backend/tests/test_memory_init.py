"""
Tests for backend/memory/__init__.py
"""
import pytest


def test_memory_imports():
    """Test that memory module imports work correctly"""
    try:
        from backend.memory import MemoryManager, ConversationMemory, VectorMemory
    except AttributeError as e:
        if "np.float_" in str(e) or "float64" in str(e):
            pytest.skip("chromadb has NumPy 2.0 compatibility issues")
        raise
    
    # Verify classes are importable
    assert MemoryManager is not None
    assert ConversationMemory is not None
    assert VectorMemory is not None
