"""
Tests for custom exception classes.
"""
import pytest
from backend.exceptions import (
    WorkflowEngineException,
    WorkflowNotFoundError,
    WorkflowValidationError,
    ExecutionError,
    ExecutionNotFoundError,
    NodeExecutionError,
    ConfigurationError,
    LLMProviderError,
    InvalidAPIKeyError,
    InputSourceError,
    FileNotFoundError as CustomFileNotFoundError
)


def test_workflow_not_found_error():
    """Test WorkflowNotFoundError"""
    error = WorkflowNotFoundError("workflow-123")
    assert error.workflow_id == "workflow-123"
    assert "workflow-123" in str(error)
    assert isinstance(error, WorkflowEngineException)


def test_workflow_validation_error():
    """Test WorkflowValidationError"""
    error = WorkflowValidationError("Invalid workflow", {"field": "value"})
    assert error.details == {"field": "value"}
    assert "Invalid workflow" in str(error)
    assert isinstance(error, WorkflowEngineException)


def test_execution_not_found_error():
    """Test ExecutionNotFoundError"""
    error = ExecutionNotFoundError("exec-123")
    assert error.execution_id == "exec-123"
    assert "exec-123" in str(error)
    assert isinstance(error, ExecutionError)


def test_node_execution_error():
    """Test NodeExecutionError"""
    error = NodeExecutionError("exec-123", "node-456", "Node failed", "ValueError")
    assert error.execution_id == "exec-123"
    assert error.node_id == "node-456"
    assert error.error_type == "ValueError"
    assert "node-456" in str(error)
    assert isinstance(error, ExecutionError)


def test_configuration_error():
    """Test ConfigurationError"""
    error = ConfigurationError("Missing config", "api_key")
    assert error.config_key == "api_key"
    assert "Missing config" in str(error)
    assert isinstance(error, WorkflowEngineException)


def test_llm_provider_error():
    """Test LLMProviderError"""
    error = LLMProviderError("openai", "API call failed", "401 Unauthorized")
    assert error.provider == "openai"
    assert error.api_error == "401 Unauthorized"
    assert "openai" in str(error)
    assert isinstance(error, WorkflowEngineException)


def test_invalid_api_key_error():
    """Test InvalidAPIKeyError"""
    error = InvalidAPIKeyError("openai")
    assert error.provider == "openai"
    assert "API key" in str(error)
    assert isinstance(error, LLMProviderError)


def test_input_source_error():
    """Test InputSourceError"""
    error = InputSourceError("local_filesystem", "File read failed")
    assert error.source_type == "local_filesystem"
    assert "local_filesystem" in str(error)
    assert isinstance(error, WorkflowEngineException)


def test_custom_file_not_found_error():
    """Test custom FileNotFoundError"""
    error = CustomFileNotFoundError("/path/to/file.txt")
    assert error.file_path == "/path/to/file.txt"
    assert "/path/to/file.txt" in str(error)
    assert isinstance(error, InputSourceError)

