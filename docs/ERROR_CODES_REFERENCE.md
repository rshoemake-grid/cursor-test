# Error Codes Reference

**Version:** 1.0.0  
**Last Updated:** 2024-01-01

## Overview

This document provides a reference for HTTP error codes and JSON error bodies returned by the **Spring Boot** API (`backend-java/`). Implementation details live in Java exception types and **`@RestControllerAdvice`** handlers—inspect that module for exact class names.

## End-to-end examples

### Workflow not found

**Illustrative JSON body:**
```json
{
  "detail": {
    "error_code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow not found: wf-deleted-123",
    "workflow_id": "wf-deleted-123"
  }
}
```

**Frontend handling:**
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

### Invalid API key (LLM)

Executions fail the current node, the UI surfaces the provider error, and the user corrects keys under **Settings**—then re-runs the workflow.

### Upstream rate limits

Outbound LLM calls should use bounded retries/backoff in the Java client layer; surface **`RATE_LIMIT_EXCEEDED`** (or provider-specific messaging) when retries are exhausted.

**Quick reference**

- [Error codes](#error-codes) — stable `error_code` values
- [Error handling patterns](#error-handling-patterns) — Spring-oriented patterns
- [Best practices](#best-practices)

## Error categories

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

## Domain errors (Java)

Runtime failures are represented by **typed exceptions** under `com.workflow` (workflows, executions, LLM providers, configuration, storage). Global handlers translate them to the JSON shapes below and the HTTP statuses listed in [Error codes](#error-codes). Browse `backend-java/src/main/java/com/workflow` for authoritative names and fields.

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

### API error handling (Spring Boot)

Map domain exceptions to HTTP status and a stable JSON body with **`error_code`**, **`detail`**, and optional identifiers (for example `workflow_id`). Typical patterns:

- **`@ControllerAdvice`** / **`@RestControllerAdvice`** with **`@ExceptionHandler`** methods returning **`ResponseEntity<ProblemDetail>`** or your shared error DTO.
- **`ResponseStatusException`** for simple 4xx cases inside controllers.
- Keep **validation errors** (`422`) aligned with whatever the frontend expects (field errors vs. single `detail` string).

Service layers should throw **typed exceptions** (for example “workflow not found”) rather than leaking raw persistence errors to the client.

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

## Error logging (Java)

Use **SLF4J** (`LoggerFactory.getLogger(...)`) with structured **MDC** fields (for example `executionId`, `workflowId`) where helpful. Log **once** at the boundary where you translate to an HTTP response; include the stack trace on unexpected failures (`log.error("...", e)`).

## Best practices

1. Throw **specific** runtime exceptions from services; avoid raw `Exception` for control flow.
2. Attach **`error_code`** and stable identifiers to API JSON—clients depend on them.
3. Never echo secrets, tokens, or full upstream provider payloads into **`detail`**.
4. Prefer **`@RestControllerAdvice`** for consistent response shaping across controllers.

## Related Documentation

- [Java backend README](../backend-java/README.md) - Error handling patterns
- [API Reference](./API_REFERENCE.md) - API error responses
- [Security Guide](./SECURITY_GUIDE.md) - Security-related errors
