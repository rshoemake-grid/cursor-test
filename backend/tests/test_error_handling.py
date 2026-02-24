"""
Unit tests for error handling utilities and decorators.
Tests the reusable error handling patterns.
"""
import pytest
from unittest.mock import patch
from fastapi import HTTPException
from backend.utils.error_handling import handle_execution_errors


class TestHandleExecutionErrors:
    """Tests for handle_execution_errors decorator"""
    
    @pytest.mark.asyncio
    async def test_decorator_passes_through_success(self):
        """Test that successful execution passes through"""
        @handle_execution_errors
        async def test_function():
            return {"status": "success"}
        
        result = await test_function()
        assert result == {"status": "success"}
    
    @pytest.mark.asyncio
    async def test_decorator_passes_through_http_exception(self):
        """Test that HTTPException is re-raised"""
        @handle_execution_errors
        async def test_function():
            raise HTTPException(status_code=404, detail="Not found")
        
        with pytest.raises(HTTPException) as exc_info:
            await test_function()
        
        assert exc_info.value.status_code == 404
        assert exc_info.value.detail == "Not found"
    
    @pytest.mark.asyncio
    async def test_decorator_converts_generic_exception(self):
        """Test that generic exceptions are converted to HTTPException"""
        @handle_execution_errors
        async def test_function():
            raise ValueError("Something went wrong")
        
        with pytest.raises(HTTPException) as exc_info:
            await test_function()
        
        assert exc_info.value.status_code == 500
        assert "Internal server error" in exc_info.value.detail
    
    @pytest.mark.asyncio
    async def test_decorator_preserves_function_name(self):
        """Test that decorator preserves function metadata"""
        @handle_execution_errors
        async def my_test_function():
            return "test"
        
        assert my_test_function.__name__ == "my_test_function"
    
    @pytest.mark.asyncio
    async def test_decorator_with_arguments(self):
        """Test decorator with function that takes arguments"""
        @handle_execution_errors
        async def test_function(arg1, arg2=None):
            return f"{arg1}-{arg2}"
        
        result = await test_function("test", arg2="value")
        assert result == "test-value"
    
    @pytest.mark.asyncio
    async def test_decorator_with_keyword_arguments(self):
        """Test decorator with keyword arguments"""
        @handle_execution_errors
        async def test_function(**kwargs):
            return kwargs
        
        result = await test_function(key1="value1", key2="value2")
        assert result == {"key1": "value1", "key2": "value2"}
    
    @pytest.mark.asyncio
    @patch('backend.utils.error_handling.logger')
    async def test_decorator_logs_errors(self, mock_logger):
        """Test that errors are logged"""
        @handle_execution_errors
        async def test_function():
            raise RuntimeError("Test error")
        
        with pytest.raises(HTTPException):
            await test_function()
        
        mock_logger.error.assert_called_once()
        assert "Unexpected error" in mock_logger.error.call_args[0][0]
        assert "test_function" in mock_logger.error.call_args[0][0]
    
    @pytest.mark.asyncio
    async def test_decorator_with_database_error(self):
        """Test decorator with database-like error"""
        @handle_execution_errors
        async def test_function():
            raise ConnectionError("Database connection failed")
        
        with pytest.raises(HTTPException) as exc_info:
            await test_function()
        
        assert exc_info.value.status_code == 500
        assert "Database connection failed" in exc_info.value.detail
