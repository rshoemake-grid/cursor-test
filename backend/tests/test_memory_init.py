"""
Tests for backend/memory/__init__.py
"""
def test_memory_imports():
    """Test that memory module imports work correctly"""
    from backend.memory import MemoryManager, ConversationMemory, VectorMemory
    
    # Verify classes are importable
    assert MemoryManager is not None
    assert ConversationMemory is not None
    assert VectorMemory is not None
