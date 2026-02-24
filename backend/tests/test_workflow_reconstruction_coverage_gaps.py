"""
Additional tests for workflow_reconstruction coverage gaps.
"""
import pytest
from unittest.mock import patch
from fastapi import HTTPException
from backend.utils.workflow_reconstruction import reconstruct_node


def test_reconstruct_node_http_exception_re_raise_path():
    """Test reconstruct_node HTTPException re-raise path (line 174)"""
    node_data = {
        'id': 'test-node',
        'type': 'agent'
    }
    
    # Mock extract_node_configs_from_data to raise HTTPException
    with patch('backend.utils.workflow_reconstruction.extract_node_configs_from_data') as mock_extract:
        mock_extract.side_effect = HTTPException(status_code=422, detail="Test HTTP error")
        
        with pytest.raises(HTTPException) as exc_info:
            reconstruct_node(node_data, 0)
        
        assert exc_info.value.status_code == 422
        assert "Test HTTP error" in str(exc_info.value.detail)
