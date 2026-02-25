# Error Codes Reference

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This document provides a comprehensive reference for all error codes, exception types, and error handling patterns used in the workflow engine.

## Real-World Error Handling Examples

### Example 1: Workflow Not Found

**Scenario:** User tries to access a deleted workflow

```python
# Backend
try:
    workflow = await workflow_service.get_workflow("wf-deleted-123")
except WorkflowNotFoundError as e:
    raise HTTPException(
        status_code=404,
        detail={
            "error_code": "WORKFLOW_NOT_FOUND",
            "message": str(e),
            "workflow_id": "wf-deleted-123"
        }
    )
```

**Client Response:**
```json
{
  "detail": {
    "error_code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow not found: wf-deleted-123",
    "workflow_id": "wf-deleted-123"
  }
}
```

**Frontend Handling:**
```typescript
try {
  const workflow = await api.getWorkflow('wf-deleted-123');
} catch (error) {
  if (error.error_code === 'WORKFLOW_NOT_FOUND') {
    showNotification('Workflow not found. It may have been deleted.');
    navigate('/workflows');
  }
}
```

### Example 2: Invalid API Key

**Scenario:** LLM provider API key expired or invalid

```python
# During workflow execution
try:
    result = await llm_agent.execute(inputs)
except InvalidAPIKeyError as e:
    # Log error, update execution status
    await update_execution_status(
        execution_id,
        status="failed",
        error=f"LLM provider error: {str(e)}"
    )
    # Broadcast via WebSocket
    await manager.broadcast_error(execution_id, str(e))
```

**User Experience:**
1. Execution starts
2. Node fails with "Invalid API key"
3. User sees error in execution console
4. User navigates to Settings
5. User updates API key
6. User re-runs workflow

### Example 3: Rate Limit Exceeded

**Scenario:** Too many API requests in short time

```python
# Backend retry logic
max_retries = 3
retry_delay = 60  # seconds

for attempt in range(max_retries):
    try:
        result = await llm_client.complete(prompt)
        break
    except RateLimitError:
        if attempt < max_retries - 1:
            await asyncio.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff
        else:
            raise LLMProviderError(
                provider="openai",
                message="Rate limit exceeded after retries",
                api_error="429 Too Many Requests"
            )
```

**User Experience:**
- Execution pauses automatically
- Retries after 60 seconds
- If still failing, shows error with suggestion to wait or upgrade plan

**Quick Reference:**
- [Exception Classes](#exception-classes) - Python exception hierarchy
- [Error Codes](#error-codes) - Standardized error code tables
- [Error Handling Patterns](#error-handling-patterns) - Implementation examples
- [Real-World Examples](#real-world-error-handling-examples) - Practical scenarios
- [Best Practices](#best-practices) - Error handling guidelines

## Error Categories

### HTTP Status Codes

**2xx Success:**
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return

**4xx Client Errors:**
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation error

**5xx Server Errors:**
- `500 Internal Server Error`: Unexpected server error
- `502 Bad Gateway`: Upstream server error
- `503 Service Unavailable`: Service temporarily unavailable

## Exception Classes

### Base Exceptions

#### `WorkflowEngineException`
Base exception for all workflow engine errors.

```python
class WorkflowEngineException(Exception):
    """Base exception for workflow engine errors"""
    pass
```

### Workflow Exceptions

#### `WorkflowNotFoundError`
Raised when a workflow is not found.

**HTTP Status:** `404 Not Found`

**Attributes:**
- `workflow_id`: The ID of the workflow that was not found

**Example:**
```python
raise WorkflowNotFoundError(workflow_id="wf-123")
# Error: "Workflow not found: wf-123"
```

#### `WorkflowValidationError`
Raised when workflow validation fails.

**HTTP Status:** `400 Bad Request` or `422 Unprocessable Entity`

**Attributes:**
- `message`: Error message
- `details`: Optional dictionary with validation details

**Example:**
```python
raise WorkflowValidationError(
    message="Invalid workflow definition",
    details={"node_id": "node-1", "error": "Missing required field 'type'"}
)
```

### Execution Exceptions

#### `ExecutionError`
Base exception for execution-related errors.

**Attributes:**
- `execution_id`: The execution ID
- `message`: Error message

**Example:**
```python
raise ExecutionError(
    execution_id="exec-123",
    message="Execution failed"
)
```

#### `ExecutionNotFoundError`
Raised when an execution is not found.

**HTTP Status:** `404 Not Found`

**Attributes:**
- `execution_id`: The ID of the execution that was not found

**Example:**
```python
raise ExecutionNotFoundError(execution_id="exec-123")
# Error: "Execution not found: exec-123"
```

#### `NodeExecutionError`
Raised when a node execution fails.

**HTTP Status:** `500 Internal Server Error`

**Attributes:**
- `execution_id`: The execution ID
- `node_id`: The node ID that failed
- `message`: Error message
- `error_type`: Optional error type classification

**Example:**
```python
raise NodeExecutionError(
    execution_id="exec-123",
    node_id="node-1",
    message="API call failed",
    error_type="api_error"
)
# Error: "Node node-1 failed: API call failed"
```

### Configuration Exceptions

#### `ConfigurationError`
Raised when configuration is invalid or missing.

**HTTP Status:** `500 Internal Server Error`

**Attributes:**
- `message`: Error message
- `config_key`: Optional configuration key that caused the error

**Example:**
```python
raise ConfigurationError(
    message="Missing required configuration",
    config_key="database_url"
)
```

### LLM Provider Exceptions

#### `LLMProviderError`
Raised when LLM provider configuration or API call fails.

**HTTP Status:** `500 Internal Server Error` or `502 Bad Gateway`

**Attributes:**
- `provider`: Provider name (e.g., "openai", "anthropic")
- `message`: Error message
- `api_error`: Optional original API error message

**Example:**
```python
raise LLMProviderError(
    provider="openai",
    message="API request failed",
    api_error="Rate limit exceeded"
)
# Error: "LLM provider 'openai' error: API request failed"
```

#### `InvalidAPIKeyError`
Raised when API key is invalid or missing.

**HTTP Status:** `401 Unauthorized`

**Attributes:**
- `provider`: Provider name

**Example:**
```python
raise InvalidAPIKeyError(provider="openai")
# Error: "LLM provider 'openai' error: Invalid or missing API key. 
#         Please configure a valid API key in Settings."
```

### Input Source Exceptions

#### `InputSourceError`
Raised when input source operations fail.

**HTTP Status:** `500 Internal Server Error`

**Attributes:**
- `source_type`: Source type (e.g., "local_filesystem")
- `message`: Error message

**Example:**
```python
raise InputSourceError(
    source_type="local_filesystem",
    message="Failed to read file"
)
# Error: "Input source 'local_filesystem' error: Failed to read file"
```

#### `FileNotFoundError`
Raised when a required file is not found.

**HTTP Status:** `404 Not Found`

**Attributes:**
- `file_path`: Path to the file that was not found

**Example:**
```python
raise FileNotFoundError(file_path="/path/to/file.txt")
# Error: "Input source 'local_filesystem' error: File not found: /path/to/file.txt. 
#         Please check that the file exists and the path is correct."
```

## Error Response Format

### Standard Error Response

```json
{
  "detail": "Error message here",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Detailed Error Response

```json
{
  "detail": "Validation failed",
  "error_code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Codes

### Workflow Errors

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `WORKFLOW_NOT_FOUND` | Workflow does not exist | 404 |
| `WORKFLOW_VALIDATION_ERROR` | Workflow definition invalid | 400 |
| `WORKFLOW_ACCESS_DENIED` | User lacks permission to access workflow | 403 |
| `WORKFLOW_DUPLICATE_NAME` | Workflow name already exists | 409 |

### Execution Errors

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `EXECUTION_NOT_FOUND` | Execution does not exist | 404 |
| `EXECUTION_ALREADY_RUNNING` | Execution is already in progress | 409 |
| `EXECUTION_FAILED` | Execution failed | 500 |
| `NODE_EXECUTION_FAILED` | Node execution failed | 500 |
| `EXECUTION_TIMEOUT` | Execution exceeded timeout | 504 |

### Configuration Errors

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `CONFIGURATION_MISSING` | Required configuration missing | 500 |
| `CONFIGURATION_INVALID` | Configuration value invalid | 500 |
| `DATABASE_ERROR` | Database operation failed | 500 |

### LLM Provider Errors

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `LLM_PROVIDER_ERROR` | LLM provider error | 500 |
| `INVALID_API_KEY` | API key invalid or missing | 401 |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded | 429 |
| `MODEL_NOT_FOUND` | Model not available | 404 |
| `API_TIMEOUT` | API request timed out | 504 |

### Authentication Errors

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | Authentication required | 401 |
| `INVALID_CREDENTIALS` | Invalid username or password | 401 |
| `TOKEN_EXPIRED` | Authentication token expired | 401 |
| `TOKEN_INVALID` | Authentication token invalid | 401 |

### Authorization Errors

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `ACCESS_DENIED` | Insufficient permissions | 403 |
| `RESOURCE_OWNERSHIP_REQUIRED` | User must own resource | 403 |

### Validation Errors

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 422 |
| `REQUIRED_FIELD_MISSING` | Required field is missing | 422 |
| `INVALID_FIELD_TYPE` | Field has invalid type | 422 |
| `INVALID_FIELD_VALUE` | Field has invalid value | 422 |

## Error Handling Patterns

### API Route Error Handling

```python
from fastapi import HTTPException, status
from backend.exceptions import WorkflowNotFoundError

@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    try:
        workflow = await workflow_service.get_workflow(workflow_id)
        if not workflow:
            raise WorkflowNotFoundError(workflow_id)
        return workflow
    except WorkflowNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
```

### Service Layer Error Handling

```python
from backend.exceptions import WorkflowNotFoundError

async def get_workflow(self, workflow_id: str):
    workflow = await self.repository.get_by_id(workflow_id)
    if not workflow:
        raise WorkflowNotFoundError(workflow_id)
    return workflow
```

### Execution Error Handling

```python
from backend.exceptions import NodeExecutionError

try:
    result = await node.execute(inputs)
except Exception as e:
    raise NodeExecutionError(
        execution_id=execution_id,
        node_id=node.id,
        message=str(e),
        error_type=type(e).__name__
    )
```

### Global Exception Handler

```python
from fastapi import Request
from fastapi.responses import JSONResponse
from backend.exceptions import WorkflowNotFoundError, ExecutionNotFoundError

@app.exception_handler(WorkflowNotFoundError)
async def workflow_not_found_handler(request: Request, exc: WorkflowNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "detail": str(exc),
            "error_code": "WORKFLOW_NOT_FOUND",
            "workflow_id": exc.workflow_id
        }
    )
```

## Client-Side Error Handling

### JavaScript/TypeScript

```typescript
interface ApiError {
  detail: string;
  error_code?: string;
  timestamp?: string;
}

async function handleApiError(response: Response): Promise<never> {
  const error: ApiError = await response.json();
  
  switch (error.error_code) {
    case 'WORKFLOW_NOT_FOUND':
      throw new Error(`Workflow not found: ${error.detail}`);
    case 'INVALID_API_KEY':
      throw new Error('Please configure a valid API key in Settings');
    case 'RATE_LIMIT_EXCEEDED':
      throw new Error('Rate limit exceeded. Please try again later.');
    default:
      throw new Error(error.detail || 'An error occurred');
  }
}
```

### React Error Boundary

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    console.error('Error caught:', error, errorInfo);
    
    // Send to error tracking service
    // errorTrackingService.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Error Logging

### Server-Side Logging

```python
from backend.utils.logger import get_logger

logger = get_logger(__name__)

try:
    result = await operation()
except Exception as e:
    logger.error(
        "Operation failed",
        extra={
            "error": str(e),
            "error_type": type(e).__name__,
            "execution_id": execution_id
        },
        exc_info=True
    )
    raise
```

### Structured Logging

```python
logger.error(
    "Node execution failed",
    extra={
        "execution_id": execution_id,
        "node_id": node_id,
        "error": str(error),
        "error_code": "NODE_EXECUTION_FAILED",
        "timestamp": datetime.utcnow().isoformat()
    }
)
```

## Best Practices

### 1. Use Specific Exceptions

**Good:**
```python
raise WorkflowNotFoundError(workflow_id)
```

**Bad:**
```python
raise Exception("Workflow not found")
```

### 2. Provide Context

**Good:**
```python
raise NodeExecutionError(
    execution_id=execution_id,
    node_id=node_id,
    message="API call failed",
    error_type="api_error"
)
```

**Bad:**
```python
raise Exception("Failed")
```

### 3. Include Error Codes

**Good:**
```json
{
  "detail": "Workflow not found",
  "error_code": "WORKFLOW_NOT_FOUND"
}
```

**Bad:**
```json
{
  "detail": "Workflow not found"
}
```

### 4. Log Before Raising

```python
logger.error("Operation failed", exc_info=True)
raise OperationError("Operation failed")
```

### 5. Don't Expose Sensitive Information

**Good:**
```python
raise InvalidAPIKeyError(provider="openai")
# Error: "Invalid or missing API key"
```

**Bad:**
```python
raise Exception(f"Invalid API key: {api_key}")
# Exposes API key in error message
```

## Related Documentation

- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Error handling patterns
- [API Reference](./API_REFERENCE.md) - API error responses
- [Security Guide](./SECURITY_GUIDE.md) - Security-related errors
