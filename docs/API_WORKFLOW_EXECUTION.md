# Workflow Execution API Design

## Overview

This document describes the API for triggering, tracking, and managing workflow executions. The API provides endpoints for executing workflows, tracking their status, and accessing execution logs.

## Base URL

```
/api
```

## Authentication

All endpoints support both authenticated and unauthenticated access:
- **Authenticated**: Include `Authorization: Bearer <token>` header
- **Unauthenticated**: Requests work without authentication (for public workflows)

---

## Endpoints

### 1. Execute Workflow

Triggers a workflow execution and returns an execution ID for tracking.

**Endpoint:** `POST /workflows/{workflow_id}/execute`

**Path Parameters:**
- `workflow_id` (string, required): The ID of the workflow to execute

**Request Body:**
```json
{
  "inputs": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Request Schema:**
```typescript
{
  inputs?: Record<string, any>  // Optional workflow inputs
}
```

**Response:** `200 OK`
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "workflow_id": "workflow-123",
  "status": "running",
  "started_at": "2026-02-23T16:30:00Z"
}
```

**Response Schema:**
```typescript
{
  execution_id: string          // UUID for tracking this execution
  workflow_id: string           // ID of the executed workflow
  status: "pending" | "running" | "completed" | "failed" | "paused"
  started_at: string            // ISO 8601 timestamp
}
```

**Error Responses:**
- `404 Not Found`: Workflow not found
- `400 Bad Request`: No LLM provider configured (for workflows requiring LLM)
- `422 Unprocessable Entity`: Invalid workflow definition or inputs
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST "http://localhost:8000/api/workflows/workflow-123/execute" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "inputs": {
      "query": "What is the weather?",
      "location": "San Francisco"
    }
  }'
```

---

### 2. Get Execution Status

Retrieves the current status and details of a workflow execution.

**Endpoint:** `GET /executions/{execution_id}`

**Path Parameters:**
- `execution_id` (string, required): The execution ID returned from the execute endpoint

**Response:** `200 OK`
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "workflow_id": "workflow-123",
  "status": "completed",
  "current_node": null,
  "result": {
    "output": "The weather is sunny"
  },
  "error": null,
  "started_at": "2026-02-23T16:30:00Z",
  "completed_at": "2026-02-23T16:30:15Z",
  "logs": [
    {
      "timestamp": "2026-02-23T16:30:00Z",
      "level": "INFO",
      "node_id": null,
      "message": "Workflow execution started"
    },
    {
      "timestamp": "2026-02-23T16:30:05Z",
      "level": "INFO",
      "node_id": "node-1",
      "message": "Node execution completed"
    }
  ]
}
```

**Response Schema:**
```typescript
{
  execution_id: string
  workflow_id: string
  status: "pending" | "running" | "completed" | "failed" | "paused"
  current_node?: string | null      // Currently executing node ID (if running)
  result?: any                      // Final result (if completed)
  error?: string | null             // Error message (if failed)
  started_at: string                // ISO 8601 timestamp
  completed_at?: string | null      // ISO 8601 timestamp (if completed)
  logs: Array<{                     // Execution logs
    timestamp: string
    level: "INFO" | "WARNING" | "ERROR"
    node_id?: string | null
    message: string
  }>
}
```

**Error Responses:**
- `404 Not Found`: Execution not found

**Example:**
```bash
curl "http://localhost:8000/api/executions/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

---

### 3. List Executions

Retrieves a list of executions, optionally filtered by workflow or user.

**Endpoint:** `GET /executions`

**Query Parameters:**
- `workflow_id` (string, optional): Filter by workflow ID
- `status` (string, optional): Filter by status (`pending`, `running`, `completed`, `failed`, `paused`)
- `user_id` (string, optional): Filter by user ID (requires authentication)
- `limit` (integer, optional): Maximum number of results (default: 50, max: 100)
- `offset` (integer, optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "executions": [
    {
      "execution_id": "550e8400-e29b-41d4-a716-446655440000",
      "workflow_id": "workflow-123",
      "status": "completed",
      "started_at": "2026-02-23T16:30:00Z",
      "completed_at": "2026-02-23T16:30:15Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**Response Schema:**
```typescript
{
  executions: Array<{
    execution_id: string
    workflow_id: string
    status: string
    started_at: string
    completed_at?: string | null
  }>
  total: number
  limit: number
  offset: number
}
```

**Example:**
```bash
curl "http://localhost:8000/api/executions?workflow_id=workflow-123&status=completed&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Download Execution Logs

Downloads execution logs as a text file.

**Endpoint:** `GET /executions/{execution_id}/logs/download`

**Path Parameters:**
- `execution_id` (string, required): The execution ID

**Query Parameters:**
- `format` (string, optional): Log format (`text` or `json`, default: `text`)

**Response:** `200 OK`

**Content-Type:** 
- `text/plain` for `format=text`
- `application/json` for `format=json`

**Response Headers:**
```
Content-Disposition: attachment; filename="execution-{execution_id}-logs.txt"
```

**Text Format Example:**
```
[2026-02-23T16:30:00Z] INFO - Workflow execution started
[2026-02-23T16:30:05Z] INFO [node-1] - Node execution completed
[2026-02-23T16:30:10Z] WARNING [node-2] - Slow operation detected
[2026-02-23T16:30:15Z] INFO - Workflow execution completed
```

**JSON Format Example:**
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "workflow_id": "workflow-123",
  "started_at": "2026-02-23T16:30:00Z",
  "completed_at": "2026-02-23T16:30:15Z",
  "logs": [
    {
      "timestamp": "2026-02-23T16:30:00Z",
      "level": "INFO",
      "node_id": null,
      "message": "Workflow execution started"
    }
  ]
}
```

**Error Responses:**
- `404 Not Found`: Execution not found

**Example:**
```bash
curl "http://localhost:8000/api/executions/550e8400-e29b-41d4-a716-446655440000/logs/download?format=text" \
  -H "Authorization: Bearer <token>" \
  -o execution-logs.txt
```

---

### 5. Get Execution Logs (JSON)

Retrieves execution logs in JSON format (useful for programmatic access).

**Endpoint:** `GET /executions/{execution_id}/logs`

**Path Parameters:**
- `execution_id` (string, required): The execution ID

**Query Parameters:**
- `level` (string, optional): Filter by log level (`INFO`, `WARNING`, `ERROR`)
- `node_id` (string, optional): Filter by node ID
- `limit` (integer, optional): Maximum number of log entries (default: 1000, max: 10000)
- `offset` (integer, optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "workflow_id": "workflow-123",
  "total_logs": 150,
  "logs": [
    {
      "timestamp": "2026-02-23T16:30:00Z",
      "level": "INFO",
      "node_id": null,
      "message": "Workflow execution started"
    }
  ],
  "limit": 1000,
  "offset": 0
}
```

**Response Schema:**
```typescript
{
  execution_id: string
  workflow_id: string
  total_logs: number
  logs: Array<{
    timestamp: string
    level: "INFO" | "WARNING" | "ERROR"
    node_id?: string | null
    message: string
  }>
  limit: number
  offset: number
}
```

**Example:**
```bash
curl "http://localhost:8000/api/executions/550e8400-e29b-41d4-a716-446655440000/logs?level=ERROR&limit=50" \
  -H "Authorization: Bearer <token>"
```

---

### 6. Cancel Execution

Cancels a running execution.

**Endpoint:** `POST /executions/{execution_id}/cancel`

**Path Parameters:**
- `execution_id` (string, required): The execution ID to cancel

**Response:** `200 OK`
```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "cancelled",
  "cancelled_at": "2026-02-23T16:30:10Z"
}
```

**Error Responses:**
- `404 Not Found`: Execution not found
- `400 Bad Request`: Execution is not in a cancellable state (already completed/failed)

**Example:**
```bash
curl -X POST "http://localhost:8000/api/executions/550e8400-e29b-41d4-a716-446655440000/cancel" \
  -H "Authorization: Bearer <token>"
```

---

## Status Tracking

### Execution Statuses

1. **`pending`**: Execution is queued but not yet started
2. **`running`**: Execution is currently in progress
3. **`completed`**: Execution completed successfully
4. **`failed`**: Execution failed with an error
5. **`paused`**: Execution is paused (can be resumed)
6. **`cancelled`**: Execution was cancelled by user

### Status Transitions

```
pending → running → completed
                ↓
              failed
                ↓
            cancelled
```

### Time Tracking

- **`started_at`**: Set when execution begins (status changes to `running`)
- **`completed_at`**: Set when execution finishes (status changes to `completed`, `failed`, or `cancelled`)

**Duration Calculation:**
```typescript
const duration = execution.completed_at 
  ? new Date(execution.completed_at) - new Date(execution.started_at)
  : Date.now() - new Date(execution.started_at)  // For running executions
```

---

## Logging

### Log Levels

- **`INFO`**: General informational messages
- **`WARNING`**: Warning messages (non-fatal issues)
- **`ERROR`**: Error messages (execution may continue or fail)

### Log Structure

Each log entry contains:
- **`timestamp`**: ISO 8601 timestamp when the log was created
- **`level`**: Log level (INFO, WARNING, ERROR)
- **`node_id`**: Optional node ID if the log is associated with a specific node
- **`message`**: Human-readable log message

### Log Storage

- Logs are stored in the `ExecutionDB.state` JSON field
- Logs are appended during execution
- Maximum log size: 10MB per execution (configurable)
- Logs older than 90 days may be archived (future feature)

---

## WebSocket Streaming (Optional)

For real-time updates, connect to the WebSocket endpoint:

**Endpoint:** `WS /ws/executions/{execution_id}`

**Connection:**
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/executions/${executionId}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Update:', message);
};
```

**Message Types:**
- `status`: Status update
- `log`: New log entry
- `node_update`: Node state update
- `completion`: Execution completed
- `error`: Error occurred

---

## Rate Limiting

- **Execute Workflow**: 10 requests per minute per user/IP
- **Get Execution Status**: 60 requests per minute per user/IP
- **List Executions**: 30 requests per minute per user/IP
- **Download Logs**: 5 requests per minute per user/IP

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required (if workflow requires auth)
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong",
  "error_code": "EXECUTION_NOT_FOUND",
  "execution_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Implementation Notes

### Database Schema

```python
class ExecutionDB(Base):
    __tablename__ = "executions"
    
    id = Column(String, primary_key=True)           # execution_id (UUID)
    workflow_id = Column(String, nullable=False)
    user_id = Column(String, nullable=True)        # Optional user ID
    status = Column(String, nullable=False)         # pending, running, completed, failed, paused, cancelled
    state = Column(JSON, nullable=False)            # Full execution state including logs
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
```

### Execution State Structure

The `state` JSON field contains:
```json
{
  "current_node": "node-1",
  "node_states": {
    "node-1": {
      "status": "completed",
      "output": {...}
    }
  },
  "variables": {...},
  "result": {...},
  "error": null,
  "logs": [
    {
      "timestamp": "2026-02-23T16:30:00Z",
      "level": "INFO",
      "node_id": null,
      "message": "Workflow execution started"
    }
  ]
}
```

### Background Execution

- Executions run asynchronously in background tasks
- Execution ID is returned immediately
- Status can be polled using GET `/executions/{execution_id}`
- WebSocket provides real-time updates (optional)

---

## Example Usage Flow

### 1. Execute Workflow

```bash
POST /api/workflows/workflow-123/execute
{
  "inputs": {
    "query": "What is the weather?"
  }
}

Response:
{
  "execution_id": "exec-123",
  "workflow_id": "workflow-123",
  "status": "running",
  "started_at": "2026-02-23T16:30:00Z"
}
```

### 2. Poll for Status

```bash
GET /api/executions/exec-123

Response (while running):
{
  "execution_id": "exec-123",
  "status": "running",
  "current_node": "node-2",
  "started_at": "2026-02-23T16:30:00Z",
  "completed_at": null,
  "logs": [...]
}

Response (when completed):
{
  "execution_id": "exec-123",
  "status": "completed",
  "result": {...},
  "started_at": "2026-02-23T16:30:00Z",
  "completed_at": "2026-02-23T16:30:15Z",
  "logs": [...]
}
```

### 3. Download Logs

```bash
GET /api/executions/exec-123/logs/download?format=text

Response: Text file with execution logs
```

---

## Future Enhancements

1. **Log Archival**: Archive logs older than 90 days to cold storage
2. **Log Streaming**: Stream logs in real-time via Server-Sent Events (SSE)
3. **Execution Metrics**: Add metrics endpoint for execution statistics
4. **Bulk Operations**: Support for bulk execution cancellation
5. **Execution History**: Enhanced history with filtering and search
6. **Log Retention Policies**: Configurable log retention per user/organization
7. **Execution Replay**: Ability to replay failed executions with same inputs
