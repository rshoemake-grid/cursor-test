# Workflow Execution API - Quick Reference

## API Endpoints Summary

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/workflows/{workflow_id}/execute` | ✅ Implemented | Trigger workflow execution |
| `GET` | `/api/executions/{execution_id}` | ✅ Implemented | Get execution status |
| `GET` | `/api/executions` | ❌ TODO | List executions with filters |
| `GET` | `/api/executions/{execution_id}/logs` | ❌ TODO | Get execution logs (JSON) |
| `GET` | `/api/executions/{execution_id}/logs/download` | ❌ TODO | Download logs as file |
| `POST` | `/api/executions/{execution_id}/cancel` | ❌ TODO | Cancel running execution |

## Execution Status Values

- `pending` - Queued, not started
- `running` - Currently executing
- `completed` - Finished successfully
- `failed` - Failed with error
- `paused` - Paused (can resume)
- `cancelled` - Cancelled by user

## Time Tracking

- `started_at` - When execution began (ISO 8601)
- `completed_at` - When execution finished (ISO 8601, null if running)

## Log Levels

- `INFO` - Informational messages
- `WARNING` - Warning messages
- `ERROR` - Error messages

## Example Usage

### 1. Execute Workflow
```bash
POST /api/workflows/workflow-123/execute
Content-Type: application/json
Authorization: Bearer <token>

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

### 2. Check Status
```bash
GET /api/executions/exec-123
Authorization: Bearer <token>

Response:
{
  "execution_id": "exec-123",
  "workflow_id": "workflow-123",
  "status": "completed",
  "result": {...},
  "started_at": "2026-02-23T16:30:00Z",
  "completed_at": "2026-02-23T16:30:15Z",
  "logs": [...]
}
```

### 3. Download Logs (Future)
```bash
GET /api/executions/exec-123/logs/download?format=text
Authorization: Bearer <token>

Response: Text file download
```

## Implementation Priority

1. **High Priority** (Week 1)
   - List Executions endpoint
   - Get Logs endpoint
   - Download Logs endpoint

2. **Medium Priority** (Week 2)
   - Cancel Execution endpoint
   - Enhanced status support

3. **Low Priority** (Week 3)
   - Rate limiting
   - Access control improvements
