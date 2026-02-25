# Troubleshooting Guide

Common issues, error messages, and solutions for the Agentic Workflow Engine.

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Common Errors](#common-errors)
3. [Execution Issues](#execution-issues)
4. [Database Issues](#database-issues)
5. [Authentication Issues](#authentication-issues)
6. [WebSocket Issues](#websocket-issues)
7. [Storage Node Issues](#storage-node-issues)
8. [LLM Provider Issues](#llm-provider-issues)
9. [Performance Issues](#performance-issues)
10. [Frontend Issues](#frontend-issues)

---

## Quick Diagnosis

### Check System Status

**1. Backend Health:**
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "healthy"}
```

**2. Database Connection:**
```bash
# Check if database file exists (SQLite)
ls -la workflows.db

# Check PostgreSQL connection
psql -h localhost -U user -d workflows -c "SELECT 1;"
```

**3. Check Logs:**
```bash
# Backend logs
tail -f app.log

# Or if running in terminal
# Check terminal output
```

**4. Verify Configuration:**
```bash
# Check environment variables
python -c "from backend.config import settings; print(settings.database_url)"
```

---

## Common Errors

### HTTP 400 Bad Request

**Error:** `400 Bad Request`

**Common Causes:**
1. Invalid request body format
2. Missing required fields
3. Invalid data types
4. No LLM provider configured

**Solutions:**

**Invalid Request Body:**
```bash
# Check request format
curl -X POST http://localhost:8000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "nodes": [], "edges": []}'
```

**Missing LLM Provider:**
```bash
# Configure LLM provider via Settings API
curl -X POST http://localhost:8000/api/settings/llm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "openai",
    "api_key": "sk-...",
    "model": "gpt-4o-mini",
    "is_active": true
  }'
```

### HTTP 401 Unauthorized

**Error:** `401 Unauthorized`

**Common Causes:**
1. Missing or invalid authentication token
2. Expired token
3. Invalid credentials

**Solutions:**

**Missing Token:**
```bash
# Include Authorization header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/workflows
```

**Expired Token:**
```bash
# Refresh token
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

**Invalid Credentials:**
```bash
# Login again
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

### HTTP 403 Forbidden

**Error:** `403 Forbidden`

**Common Causes:**
1. Insufficient permissions
2. Accessing other user's private workflow
3. Workflow not shared with user

**Solutions:**

**Check Workflow Ownership:**
```bash
# Get workflow details
curl http://localhost:8000/api/workflows/{workflow_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Share Workflow:**
```bash
# Share workflow with user
curl -X POST http://localhost:8000/api/workflows/{workflow_id}/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shared_with_username": "other_user",
    "permission": "read"
  }'
```

### HTTP 404 Not Found

**Error:** `404 Not Found`

**Common Causes:**
1. Workflow doesn't exist
2. Execution doesn't exist
3. Invalid ID format

**Solutions:**

**Verify Workflow Exists:**
```bash
# List workflows
curl http://localhost:8000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Check ID Format:**
- Workflow IDs are UUIDs: `550e8400-e29b-41d4-a716-446655440000`
- Execution IDs are UUIDs: `exec-550e8400-e29b-41d4-a716-446655440000`

### HTTP 422 Unprocessable Entity

**Error:** `422 Unprocessable Entity`

**Common Causes:**
1. Validation errors
2. Invalid workflow definition
3. Missing required node configuration

**Solutions:**

**Check Validation Errors:**
```json
{
  "detail": [
    {
      "loc": ["body", "nodes", 0, "agent_config"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Fix Workflow Definition:**
- Ensure all required fields are present
- Check node types match expected values
- Verify edge source/target nodes exist

### HTTP 500 Internal Server Error

**Error:** `500 Internal Server Error`

**Common Causes:**
1. Database connection error
2. External API failure
3. Unexpected exception

**Solutions:**

**Check Database:**
```bash
# Verify database connection
python -c "from backend.database.db import engine; print(engine.url)"
```

**Check Logs:**
```bash
# Look for detailed error in logs
tail -f app.log | grep ERROR
```

**Common Database Errors:**
- `OperationalError`: Database connection failed
- `IntegrityError`: Database constraint violation
- `ProgrammingError`: SQL syntax error

---

## Execution Issues

### Execution Fails Immediately

**Symptoms:**
- Execution status changes to `FAILED` immediately
- Error message in execution state

**Common Causes:**

**1. Invalid Workflow Definition:**
```json
{
  "error": "Workflow contains no nodes"
}
```

**Solution:** Ensure workflow has at least one node.

**2. Missing LLM Configuration:**
```json
{
  "error": "No LLM provider configured"
}
```

**Solution:** Configure LLM provider in Settings.

**3. Invalid Node Configuration:**
```json
{
  "error": "Condition node missing required field configuration"
}
```

**Solution:** Ensure condition nodes have `condition_config.field` set.

### Node Execution Fails

**Symptoms:**
- Specific node status is `FAILED`
- Error message in node state

**Common Causes:**

**1. Agent Node - LLM API Error:**
```json
{
  "node_id": "agent-1",
  "status": "failed",
  "error": "OpenAI API error: Invalid API key"
}
```

**Solutions:**
- Verify API key is valid
- Check API key has sufficient credits
- Verify API key permissions

**2. Condition Node - Missing Field:**
```json
{
  "node_id": "condition-1",
  "status": "failed",
  "error": "Field 'status' not found in inputs"
}
```

**Solution:** Ensure previous node outputs the required field.

**3. Loop Node - Invalid Input:**
```json
{
  "node_id": "loop-1",
  "status": "failed",
  "error": "Loop input must be a list"
}
```

**Solution:** Ensure loop node receives an array/list input.

**4. Storage Node - File Not Found:**
```json
{
  "node_id": "storage-1",
  "status": "failed",
  "error": "File not found: /path/to/file.txt"
}
```

**Solution:** Verify file path exists and is accessible.

### Execution Hangs/Timeout

**Symptoms:**
- Execution status stays `RUNNING` indefinitely
- No progress updates

**Common Causes:**

**1. LLM API Timeout:**
- LLM provider is slow or unresponsive
- Network connectivity issues

**Solutions:**
- Check LLM provider status
- Verify network connectivity
- Increase `EXECUTION_TIMEOUT` if needed

**2. Infinite Loop:**
- Loop node with no exit condition
- Circular dependencies

**Solutions:**
- Add `max_iterations` to loop config
- Check for circular dependencies in workflow graph

**3. Database Lock:**
- Multiple executions accessing same resource
- Database connection pool exhausted

**Solutions:**
- Check database connection pool size
- Reduce `MAX_CONCURRENT_EXECUTIONS`
- Check for database locks

### Execution State Not Updating

**Symptoms:**
- Execution completes but state not saved
- Node states missing

**Solutions:**

**1. Check Database Connection:**
```bash
# Verify database is accessible
python -c "from backend.database.db import AsyncSessionLocal; import asyncio; asyncio.run(AsyncSessionLocal().__aenter__())"
```

**2. Check Execution Service:**
- Verify execution record is created
- Check execution status update is called
- Review execution service logs

---

## Database Issues

### Connection Errors

**Error:** `OperationalError: unable to open database file`

**SQLite Solutions:**
```bash
# Check file permissions
ls -la workflows.db
chmod 644 workflows.db

# Check directory permissions
ls -la .
chmod 755 .
```

**PostgreSQL Solutions:**
```bash
# Verify connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check PostgreSQL is running
sudo systemctl status postgresql
```

### Migration Issues

**Error:** `Alembic migration failed`

**Solutions:**
```bash
# Check current migration version
alembic current

# Apply migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

### Performance Issues

**Symptoms:**
- Slow queries
- Database locks
- High CPU usage

**Solutions:**

**1. Add Indexes:**
```sql
CREATE INDEX idx_workflows_owner_id ON workflows(owner_id);
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
```

**2. Optimize Queries:**
- Use pagination for large result sets
- Add `limit` and `offset` to queries
- Use `select_related` for joins

**3. Connection Pooling:**
```python
# Increase pool size in database config
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40
)
```

---

## Authentication Issues

### Login Fails

**Error:** `401 Unauthorized: Incorrect username or password`

**Solutions:**

**1. Verify Credentials:**
```bash
# Check user exists
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**2. Check Password Hashing:**
- Ensure bcrypt is installed: `pip install bcrypt`
- Verify password hashing algorithm matches

**3. User Inactive:**
```bash
# Activate user (admin only)
curl -X PATCH http://localhost:8000/api/users/{user_id} \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

### Token Expired

**Error:** `401 Unauthorized: Token expired`

**Solutions:**

**1. Refresh Token:**
```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

**2. Login Again:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

### Token Invalid

**Error:** `401 Unauthorized: Invalid token`

**Solutions:**

**1. Check Token Format:**
- Access tokens: JWT format
- Refresh tokens: UUID format

**2. Verify Token Secret:**
- Ensure `JWT_SECRET_KEY` is set
- Check token was signed with same secret

**3. Check Token Revocation:**
- Verify refresh token not revoked
- Check token expiration time

---

## WebSocket Issues

### Connection Fails

**Error:** `WebSocket connection failed`

**Solutions:**

**1. Check WebSocket Endpoint:**
```bash
# Verify endpoint exists
curl http://localhost:8000/api/executions/{execution_id}/stream
```

**2. Check CORS Configuration:**
```bash
# Verify CORS allows WebSocket origin
echo $CORS_ORIGINS
```

**3. Check Firewall/Proxy:**
- Ensure WebSocket connections are allowed
- Check proxy configuration
- Verify port 8000 is open

### Connection Drops

**Symptoms:**
- WebSocket disconnects during execution
- No updates received

**Solutions:**

**1. Increase Timeout:**
```bash
WEBSOCKET_TIMEOUT=120  # 2 minutes
```

**2. Check Ping Interval:**
```bash
WEBSOCKET_PING_INTERVAL=20  # Ping every 20 seconds
```

**3. Implement Reconnection:**
```javascript
// Frontend reconnection logic
websocket.onclose = () => {
  setTimeout(() => {
    connectWebSocket(executionId);
  }, 1000);
};
```

### No Updates Received

**Symptoms:**
- WebSocket connected but no messages

**Solutions:**

**1. Verify Execution ID:**
```bash
# Check execution exists
curl http://localhost:8000/api/executions/{execution_id}
```

**2. Check Execution Status:**
- Execution must be `RUNNING` to receive updates
- Completed executions don't send updates

**3. Check WebSocket Manager:**
- Verify connection is registered
- Check broadcast is being called
- Review WebSocket manager logs

---

## Storage Node Issues

### GCP Bucket Errors

**Error:** `InputSourceError: GCP Bucket error: ...`

**Common Causes:**

**1. Missing Credentials:**
```json
{
  "error": "Invalid JSON credentials for GCP"
}
```

**Solution:** Provide valid GCP service account JSON credentials.

**2. Bucket Not Found:**
```json
{
  "error": "Bucket 'my-bucket' not found"
}
```

**Solution:** Verify bucket name and permissions.

**3. Object Not Found:**
```json
{
  "error": "Object 'path/to/file.txt' not found in bucket"
}
```

**Solution:** Verify object path exists in bucket.

**Configuration Example:**
```json
{
  "bucket_name": "my-bucket",
  "object_path": "data/file.txt",
  "credentials": "{\"type\": \"service_account\", ...}"
}
```

### AWS S3 Errors

**Error:** `InputSourceError: AWS S3 error: ...`

**Common Causes:**

**1. Missing Credentials:**
```json
{
  "error": "AWS credentials not configured"
}
```

**Solution:** Configure AWS credentials via environment variables or IAM role.

**2. Access Denied:**
```json
{
  "error": "Access Denied"
}
```

**Solution:** Verify IAM permissions for S3 bucket access.

**Configuration Example:**
```json
{
  "bucket_name": "my-bucket",
  "object_key": "data/file.txt",
  "region": "us-east-1"
}
```

**Environment Variables:**
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
```

### Local Filesystem Errors

**Error:** `FileNotFoundError: File not found: /path/to/file.txt`

**Solutions:**

**1. Verify File Path:**
```bash
# Check file exists
ls -la /path/to/file.txt

# Check permissions
chmod 644 /path/to/file.txt
```

**2. Check Path Format:**
- Use absolute paths: `/absolute/path/to/file.txt`
- Or relative paths: `./relative/path/to/file.txt`

**3. Verify Permissions:**
```bash
# Check read permissions
cat /path/to/file.txt

# Check write permissions (for write mode)
touch /path/to/file.txt
```

---

## LLM Provider Issues

### OpenAI API Errors

**Error:** `LLMProviderError: OpenAI API error: Invalid API key`

**Solutions:**

**1. Verify API Key:**
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-..."
```

**2. Check API Key Format:**
- OpenAI keys start with `sk-`
- Verify key is complete (no truncation)

**3. Check Credits:**
- Verify account has sufficient credits
- Check usage limits in OpenAI dashboard

**Error:** `LLMProviderError: OpenAI API error: Rate limit exceeded`

**Solutions:**

**1. Implement Rate Limiting:**
- Add delays between requests
- Use exponential backoff
- Reduce concurrent requests

**2. Upgrade Plan:**
- Consider upgrading OpenAI plan
- Use different model (gpt-4o-mini has higher limits)

### Anthropic API Errors

**Error:** `LLMProviderError: Anthropic API error: Invalid API key`

**Solutions:**

**1. Verify API Key:**
- Anthropic keys start with `sk-ant-`
- Check key is from Anthropic dashboard

**2. Check Model Availability:**
- Verify model name is correct
- Check model is available in your region

### Gemini API Errors

**Error:** `LLMProviderError: Gemini API error: Invalid API key`

**Solutions:**

**1. Get API Key:**
- Create API key in Google Cloud Console
- Enable Gemini API for your project

**2. Verify API Key:**
```bash
# Test API key
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"
```

---

## Performance Issues

### Slow Execution

**Symptoms:**
- Executions take longer than expected
- Nodes execute slowly

**Solutions:**

**1. Check LLM Response Times:**
- Some models are slower than others
- Consider using faster models (gpt-4o-mini vs gpt-4o)

**2. Enable Parallel Execution:**
- Ensure independent nodes can run in parallel
- Check workflow graph for parallel opportunities

**3. Optimize Workflow:**
- Reduce number of nodes
- Combine simple operations
- Cache frequently used data

### High Memory Usage

**Symptoms:**
- Server memory usage high
- Out of memory errors

**Solutions:**

**1. Reduce Concurrent Executions:**
```bash
MAX_CONCURRENT_EXECUTIONS=5  # Reduce from default 10
```

**2. Limit Execution State Size:**
- Avoid storing large data in execution state
- Use external storage for large files

**3. Optimize Database Queries:**
- Use pagination
- Limit result sets
- Add database indexes

### Database Performance

**Symptoms:**
- Slow database queries
- Database locks

**Solutions:**

**1. Add Indexes:**
```sql
CREATE INDEX idx_workflows_owner_id ON workflows(owner_id);
CREATE INDEX idx_executions_status ON executions(status);
```

**2. Optimize Queries:**
- Use `select()` to limit columns
- Add `limit` and `offset` for pagination
- Use `join()` efficiently

**3. Connection Pooling:**
```python
# Increase pool size
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40
)
```

---

## Frontend Issues

### API Connection Errors

**Error:** `Network Error` or `Failed to fetch`

**Solutions:**

**1. Check API URL:**
```bash
# Verify API base URL
echo $VITE_API_BASE_URL

# Default: http://localhost:8000/api
```

**2. Check CORS:**
- Verify backend CORS allows frontend origin
- Check browser console for CORS errors

**3. Check Backend Running:**
```bash
curl http://localhost:8000/health
```

### WebSocket Connection Errors

**Error:** `WebSocket connection failed`

**Solutions:**

**1. Check WebSocket URL:**
```bash
# Verify WebSocket URL
echo $VITE_WS_URL

# Default: ws://localhost:8000
```

**2. Check Protocol:**
- Use `ws://` for HTTP
- Use `wss://` for HTTPS

**3. Verify Endpoint:**
```bash
# Check WebSocket endpoint exists
curl http://localhost:8000/api/executions/{execution_id}/stream
```

### Workflow Not Saving

**Symptoms:**
- Workflow changes not persisted
- Save button doesn't work

**Solutions:**

**1. Check Authentication:**
- Verify user is logged in
- Check token is valid

**2. Check Network:**
- Verify API request succeeds
- Check browser network tab for errors

**3. Check Validation:**
- Ensure workflow is valid
- Check for validation errors in console

---

## Getting Help

### Check Logs

**Backend Logs:**
```bash
# Application log
tail -f app.log

# Or terminal output if running directly
```

**Frontend Logs:**
- Open browser developer console (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Debug Mode

**Enable Debug Logging:**
```bash
LOG_LEVEL=DEBUG python main.py
```

**Check Execution State:**
```bash
curl http://localhost:8000/api/executions/{execution_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Common Debug Commands

```bash
# Check backend health
curl http://localhost:8000/health

# Check database connection
python -c "from backend.database.db import engine; print(engine.url)"

# Check configuration
python -c "from backend.config import settings; print(settings.dict())"

# List workflows
curl http://localhost:8000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get execution details
curl http://localhost:8000/api/executions/{execution_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Related Documentation

- [Configuration Reference](./CONFIGURATION_REFERENCE.md) - Complete configuration guide
- [Execution System Architecture](./EXECUTION_SYSTEM_ARCHITECTURE.md) - Execution system details
- [Node Types Reference](./NODE_TYPES_REFERENCE.md) - Node configuration guide
- [API Workflow Execution](./API_WORKFLOW_EXECUTION.md) - API documentation

---

## Summary

**Quick Fixes:**
1. **400/422 Errors**: Check request format and validation
2. **401 Errors**: Verify authentication token
3. **403 Errors**: Check permissions and workflow ownership
4. **404 Errors**: Verify resource exists
5. **500 Errors**: Check logs for detailed error
6. **Execution Fails**: Check LLM configuration and node setup
7. **WebSocket Issues**: Verify connection and check CORS
8. **Storage Errors**: Check credentials and file paths
9. **Performance**: Reduce concurrency, optimize queries, add indexes

**Always Check:**
- Logs for detailed error messages
- Configuration for correct settings
- Network connectivity
- Database connection
- Authentication status
