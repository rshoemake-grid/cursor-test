"""
Custom exception classes for the workflow engine.
Provides type-safe error handling with specific exception types.
"""
from typing import Optional


class WorkflowEngineException(Exception):
    """Base exception for workflow engine errors"""
    pass


class WorkflowNotFoundError(WorkflowEngineException):
    """Raised when a workflow is not found"""
    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        super().__init__(f"Workflow not found: {workflow_id}")


class WorkflowValidationError(WorkflowEngineException):
    """Raised when workflow validation fails"""
    def __init__(self, message: str, details: Optional[dict] = None):
        self.details = details or {}
        super().__init__(message)


class ExecutionError(WorkflowEngineException):
    """Base exception for execution-related errors"""
    def __init__(self, execution_id: str, message: str):
        self.execution_id = execution_id
        super().__init__(message)


class ExecutionNotFoundError(ExecutionError):
    """Raised when an execution is not found"""
    def __init__(self, execution_id: str):
        super().__init__(execution_id, f"Execution not found: {execution_id}")


class NodeExecutionError(ExecutionError):
    """Raised when a node execution fails"""
    def __init__(self, execution_id: str, node_id: str, message: str, error_type: Optional[str] = None):
        self.node_id = node_id
        self.error_type = error_type
        super().__init__(execution_id, f"Node {node_id} failed: {message}")


class ConfigurationError(WorkflowEngineException):
    """Raised when configuration is invalid or missing"""
    def __init__(self, message: str, config_key: Optional[str] = None):
        self.config_key = config_key
        super().__init__(message)


class LLMProviderError(WorkflowEngineException):
    """Raised when LLM provider configuration or API call fails"""
    def __init__(self, provider: str, message: str, api_error: Optional[str] = None):
        self.provider = provider
        self.api_error = api_error
        super().__init__(f"LLM provider '{provider}' error: {message}")


class InvalidAPIKeyError(LLMProviderError):
    """Raised when API key is invalid or missing"""
    def __init__(self, provider: str):
        super().__init__(
            provider,
            "Invalid or missing API key. Please configure a valid API key in Settings."
        )


class InputSourceError(WorkflowEngineException):
    """Raised when input source operations fail"""
    def __init__(self, source_type: str, message: str):
        self.source_type = source_type
        super().__init__(f"Input source '{source_type}' error: {message}")


class FileNotFoundError(InputSourceError):
    """Raised when a required file is not found"""
    def __init__(self, file_path: str):
        self.file_path = file_path
        super().__init__(
            "local_filesystem",
            f"File not found: {file_path}. Please check that the file exists and the path is correct."
        )

