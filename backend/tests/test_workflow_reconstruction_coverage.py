"""
Tests for workflow_reconstruction coverage gaps.
"""
import pytest
from unittest.mock import patch
from fastapi import HTTPException
from pydantic import ValidationError
from backend.utils.workflow_reconstruction import (
    reconstruct_node,
    _extract_error_detail
)


def test_extract_error_detail_non_validation_error():
    """Test _extract_error_detail with non-ValidationError exception (line 138)"""
    exception = ValueError("Some error")
    result = _extract_error_detail(exception)
    assert result == "Some error"


def test_reconstruct_node_http_exception_re_raise():
    """Test reconstruct_node re-raising HTTPException (line 174)"""
    # Create node data that will cause HTTPException
    node_data = {
        'id': 'test-node',
        'type': 'invalid_type'  # This might cause validation error
    }
    
    # Mock extract_node_configs_from_data to raise HTTPException
    with patch('backend.utils.workflow_reconstruction.extract_node_configs_from_data') as mock_extract:
        mock_extract.side_effect = HTTPException(status_code=422, detail="Test error")
        
        with pytest.raises(HTTPException) as exc_info:
            reconstruct_node(node_data, 0)
        
        assert exc_info.value.status_code == 422
