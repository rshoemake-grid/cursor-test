# QA Testing Guide - API Test Cases

## Overview

This document provides comprehensive test cases for QA teams to validate all API endpoints. Each test case includes:
- Use case description
- curl command examples
- Sample request JSON payloads
- Expected response JSON payloads
- Test scenarios (positive and negative)

## Base URL

```
Development: http://localhost:8000
Production: https://api.yourdomain.com
```

## Test Data Files

Sample JSON files for testing are located in the `test-data/` directory:

- `test-data/sample_workflow.json` - Complete workflow definition with all node types
- `test-data/sample_llm_settings.json` - LLM provider configurations
- `test-data/sample_execution_inputs.json` - Execution input examples
- `test-data/sample_user_registration.json` - User registration data

**Usage Example**:
```bash
# Use test data files in curl commands
curl -X POST "${BASE_URL}/api/workflows" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_workflow.json
```

See `test-data/README.md` for more details on using these files.

## Authentication

Most endpoints require authentication. Use the token from login:

```bash
export TOKEN="your-access-token-here"
export BASE_URL="http://localhost:8000"
```

---

## 1. Authentication APIs

### 1.1 Register User

**Use Case**: Create a new user account

**Endpoint**: `POST /api/auth/register`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'
```

**Request JSON**:
```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "SecurePassword123!",
  "full_name": "Test User"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "testuser",
  "email": "testuser@example.com",
  "full_name": "Test User",
  "is_active": true,
  "is_admin": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Valid registration
- ❌ Duplicate username (400)
- ❌ Duplicate email (400)
- ❌ Invalid email format (422)
- ❌ Weak password (422)
- ❌ Missing required fields (422)

---

### 1.2 Login (Get Token)

**Use Case**: Authenticate and receive access token

**Endpoint**: `POST /api/auth/token`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=SecurePassword123!"
```

**Expected Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Test Scenarios**:
- ✅ Valid credentials
- ❌ Invalid username (401)
- ❌ Invalid password (401)
- ❌ Inactive user (400)
- ❌ Missing credentials (422)

---

### 1.3 Get Current User Info

**Use Case**: Retrieve authenticated user information

**Endpoint**: `GET /api/auth/me`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "testuser",
  "email": "testuser@example.com",
  "full_name": "Test User",
  "is_active": true,
  "is_admin": false,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Valid token
- ❌ Missing token (401)
- ❌ Invalid token (401)
- ❌ Expired token (401)

---

### 1.4 Request Password Reset

**Use Case**: Request password reset email

**Endpoint**: `POST /api/auth/forgot-password`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

**Request JSON**:
```json
{
  "email": "testuser@example.com"
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Password reset email sent if account exists"
}
```

**Test Scenarios**:
- ✅ Valid email
- ❌ Invalid email format (422)
- ❌ Non-existent email (still returns 200 for security)

---

### 1.5 Reset Password

**Use Case**: Reset password using reset token

**Endpoint**: `POST /api/auth/reset-password`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "new_password": "NewSecurePassword123!"
  }'
```

**Request JSON**:
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecurePassword123!"
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Test Scenarios**:
- ✅ Valid token and password
- ❌ Invalid token (400)
- ❌ Expired token (400)
- ❌ Weak password (422)

---

## 2. Workflow APIs

### 2.1 Create Workflow

**Use Case**: Create a new workflow

**Endpoint**: `POST /api/workflows`

**curl Example**:
```bash
# Using test data file from test-data/ directory
curl -X POST "${BASE_URL}/api/workflows" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_workflow.json
```

**Request JSON** (from `test-data/sample_workflow.json`):
```json
{
  "name": "Simple Data Processing",
  "description": "Process data through multiple steps",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "name": "Start",
      "position": {"x": 100, "y": 100}
    },
    {
      "id": "agent-1",
      "type": "agent",
      "name": "Process Data",
      "position": {"x": 300, "y": 100},
      "agent_config": {
        "prompt": "Process the input data and return structured output",
        "model": "gpt-4",
        "temperature": 0.7
      }
    },
    {
      "id": "end-1",
      "type": "end",
      "name": "End",
      "position": {"x": 500, "y": 100}
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "start-1",
      "target": "agent-1"
    },
    {
      "id": "e2",
      "source": "agent-1",
      "target": "end-1"
    }
  ],
  "variables": {}
}
```

**Expected Response** (200 OK):
```json
{
  "id": "workflow-123",
  "name": "Simple Data Processing",
  "description": "Process data through multiple steps",
  "version": "1.0.0",
  "nodes": [...],
  "edges": [...],
  "variables": {},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Valid workflow (authenticated)
- ✅ Valid workflow (anonymous)
- ❌ Missing required fields (422)
- ❌ Invalid node structure (422)
- ❌ Invalid edge references (422)
- ❌ Circular dependencies (422)

---

### 2.2 List Workflows

**Use Case**: Get list of workflows

**Endpoint**: `GET /api/workflows`

**curl Example**:
```bash
# Authenticated user
curl -X GET "${BASE_URL}/api/workflows" \
  -H "Authorization: Bearer ${TOKEN}"

# Anonymous user
curl -X GET "${BASE_URL}/api/workflows"
```

**Expected Response** (200 OK):
```json
[
  {
    "id": "workflow-123",
    "name": "Simple Data Processing",
    "description": "Process data through multiple steps",
    "version": "1.0.0",
    "nodes": [...],
    "edges": [...],
    "variables": {},
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Test Scenarios**:
- ✅ List workflows (authenticated - sees own + public)
- ✅ List workflows (anonymous - sees public only)
- ✅ Empty list (no workflows)

---

### 2.3 Get Workflow by ID

**Use Case**: Retrieve specific workflow

**Endpoint**: `GET /api/workflows/{workflow_id}`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/workflows/workflow-123" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
{
  "id": "workflow-123",
  "name": "Simple Data Processing",
  "description": "Process data through multiple steps",
  "version": "1.0.0",
  "nodes": [...],
  "edges": [...],
  "variables": {},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Get own workflow
- ✅ Get public workflow
- ❌ Get non-existent workflow (404)
- ❌ Get private workflow (unauthorized) (403)

---

### 2.4 Update Workflow

**Use Case**: Update existing workflow

**Endpoint**: `PUT /api/workflows/{workflow_id}`

**curl Example**:
```bash
# Using test data file from test-data/ directory (modify as needed)
curl -X PUT "${BASE_URL}/api/workflows/workflow-123" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_workflow.json
```

**Request JSON** (modify `test-data/sample_workflow.json` as needed):
```json
{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "nodes": [...],
  "edges": [...],
  "variables": {"new_var": "value"}
}
```

**Expected Response** (200 OK):
```json
{
  "id": "workflow-123",
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "version": "1.0.1",
  "nodes": [...],
  "edges": [...],
  "variables": {"new_var": "value"},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

**Test Scenarios**:
- ✅ Update own workflow
- ❌ Update non-existent workflow (404)
- ❌ Update other user's workflow (403)
- ❌ Invalid workflow data (422)

---

### 2.5 Delete Workflow

**Use Case**: Delete a workflow

**Endpoint**: `DELETE /api/workflows/{workflow_id}`

**curl Example**:
```bash
curl -X DELETE "${BASE_URL}/api/workflows/workflow-123" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (204 No Content)

**Test Scenarios**:
- ✅ Delete own workflow
- ❌ Delete non-existent workflow (404)
- ❌ Delete other user's workflow (403)

---

### 2.6 Bulk Delete Workflows

**Use Case**: Delete multiple workflows

**Endpoint**: `POST /api/workflows/bulk-delete`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/workflows/bulk-delete" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_ids": ["workflow-123", "workflow-456"]
  }'
```

**Request JSON**:
```json
{
  "workflow_ids": ["workflow-123", "workflow-456"]
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Successfully deleted 2 workflow(s)",
  "deleted_count": 2
}
```

**Test Scenarios**:
- ✅ Delete multiple workflows
- ✅ Partial success (some deleted, some failed)
- ❌ Empty workflow_ids array (400)
- ❌ Invalid workflow IDs

---

### 2.7 Publish Workflow as Template

**Use Case**: Publish workflow to marketplace

**Endpoint**: `POST /api/workflows/{workflow_id}/publish`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/workflows/workflow-123/publish" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "data-processing",
    "tags": ["data", "processing", "automation"],
    "difficulty": "intermediate",
    "estimated_time": 30
  }'
```

**Request JSON**:
```json
{
  "category": "data-processing",
  "tags": ["data", "processing", "automation"],
  "difficulty": "intermediate",
  "estimated_time": 30
}
```

**Expected Response** (201 Created):
```json
{
  "id": "template-123",
  "name": "Simple Data Processing",
  "description": "Process data through multiple steps",
  "category": "data-processing",
  "tags": ["data", "processing", "automation"],
  "difficulty": "intermediate",
  "estimated_time": 30,
  "is_official": false,
  "uses_count": 0,
  "likes_count": 0,
  "rating": 0.0,
  "author_id": "user-123",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Publish workflow (authenticated)
- ❌ Publish non-existent workflow (404)
- ❌ Publish other user's workflow (403)
- ❌ Invalid category (422)

---

## 3. Execution APIs

### 3.1 Execute Workflow

**Use Case**: Execute a workflow

**Endpoint**: `POST /api/workflows/{workflow_id}/execute`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/workflows/workflow-123/execute" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "data": "Sample input data",
      "param1": "value1"
    }
  }'
```

**Request JSON**:
```json
{
  "inputs": {
    "data": "Sample input data",
    "param1": "value1"
  }
}
```

**Expected Response** (200 OK):
```json
{
  "execution_id": "exec-123",
  "workflow_id": "workflow-123",
  "status": "running",
  "started_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Execute workflow with inputs
- ✅ Execute workflow without inputs
- ❌ Execute non-existent workflow (404)
- ❌ Execute workflow without LLM config (400)
- ❌ Invalid inputs format (422)

---

### 3.2 Get Execution by ID

**Use Case**: Get execution status and results

**Endpoint**: `GET /api/executions/{execution_id}`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/executions/exec-123" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
{
  "execution_id": "exec-123",
  "workflow_id": "workflow-123",
  "status": "completed",
  "current_node": null,
  "result": {
    "output": "Processed data",
    "status": "success"
  },
  "error": null,
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:05Z",
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "level": "INFO",
      "node_id": "agent-1",
      "message": "Processing started"
    }
  ]
}
```

**Test Scenarios**:
- ✅ Get running execution
- ✅ Get completed execution
- ✅ Get failed execution
- ❌ Get non-existent execution (404)

---

### 3.3 List Executions

**Use Case**: List executions with filtering

**Endpoint**: `GET /api/executions`

**curl Example**:
```bash
# List all executions
curl -X GET "${BASE_URL}/api/executions" \
  -H "Authorization: Bearer ${TOKEN}"

# Filter by workflow
curl -X GET "${BASE_URL}/api/executions?workflow_id=workflow-123" \
  -H "Authorization: Bearer ${TOKEN}"

# Filter by status
curl -X GET "${BASE_URL}/api/executions?status=completed" \
  -H "Authorization: Bearer ${TOKEN}"

# With pagination
curl -X GET "${BASE_URL}/api/executions?limit=10&offset=0" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
[
  {
    "execution_id": "exec-123",
    "workflow_id": "workflow-123",
    "status": "completed",
    "started_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:30:05Z"
  }
]
```

**Test Scenarios**:
- ✅ List all executions
- ✅ Filter by workflow_id
- ✅ Filter by status
- ✅ Filter by user_id (authenticated)
- ✅ Pagination (limit/offset)
- ✅ Empty results

---

### 3.4 List Workflow Executions

**Use Case**: Get executions for specific workflow

**Endpoint**: `GET /api/workflows/{workflow_id}/executions`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/workflows/workflow-123/executions?status=completed&limit=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
[
  {
    "execution_id": "exec-123",
    "workflow_id": "workflow-123",
    "status": "completed",
    "started_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:30:05Z"
  }
]
```

**Test Scenarios**:
- ✅ List workflow executions
- ✅ Filter by status
- ✅ Pagination
- ❌ Non-existent workflow (empty list)

---

### 3.5 List User Executions

**Use Case**: Get executions for specific user

**Endpoint**: `GET /api/users/{user_id}/executions`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/users/user-123/executions?limit=20&offset=0" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
[
  {
    "execution_id": "exec-123",
    "workflow_id": "workflow-123",
    "status": "completed",
    "started_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:30:05Z"
  }
]
```

**Test Scenarios**:
- ✅ List user executions
- ✅ Filter by workflow_id
- ✅ Filter by status
- ✅ Pagination

---

### 3.6 List Running Executions

**Use Case**: Get all currently running executions

**Endpoint**: `GET /api/executions/running`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/executions/running" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
[
  {
    "execution_id": "exec-123",
    "workflow_id": "workflow-123",
    "status": "running",
    "current_node": "agent-1",
    "started_at": "2024-01-15T10:30:00Z"
  }
]
```

**Test Scenarios**:
- ✅ List running executions
- ✅ Empty list (no running executions)

---

## 4. Settings/LLM Configuration APIs

### 4.1 Save LLM Settings

**Use Case**: Configure LLM providers

**Endpoint**: `POST /api/settings/llm`

**curl Example**:
```bash
# Using test data file from test-data/ directory
curl -X POST "${BASE_URL}/api/settings/llm" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_llm_settings.json
```

**Request JSON** (from `test-data/sample_llm_settings.json`):
```json
{
  "providers": [
    {
      "id": "openai-1",
      "name": "OpenAI",
      "type": "openai",
      "apiKey": "sk-...",
      "baseUrl": "https://api.openai.com/v1",
      "defaultModel": "gpt-4",
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "enabled": true
    },
    {
      "id": "anthropic-1",
      "name": "Anthropic",
      "type": "anthropic",
      "apiKey": "sk-ant-...",
      "baseUrl": "https://api.anthropic.com",
      "defaultModel": "claude-3-opus-20240229",
      "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229"],
      "enabled": false
    }
  ],
  "iteration_limit": 10,
  "default_model": "gpt-4"
}
```

**Expected Response** (200 OK):
```json
{
  "message": "Settings saved successfully"
}
```

**Test Scenarios**:
- ✅ Save valid settings
- ✅ Update existing settings
- ❌ Save without authentication (401)
- ❌ Invalid provider configuration (422)
- ❌ Missing required fields (422)

---

### 4.2 Get LLM Settings

**Use Case**: Retrieve LLM provider settings

**Endpoint**: `GET /api/settings/llm`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/settings/llm" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
{
  "providers": [...],
  "iteration_limit": 10,
  "default_model": "gpt-4"
}
```

**Test Scenarios**:
- ✅ Get settings (authenticated)
- ✅ Get empty settings (no configuration)
- ❌ Get settings without auth (401)

---

### 4.3 Test LLM Provider

**Use Case**: Test LLM provider connection

**Endpoint**: `POST /api/settings/test-llm`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/settings/test-llm" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "openai",
    "api_key": "sk-...",
    "base_url": "https://api.openai.com/v1",
    "model": "gpt-4"
  }'
```

**Request JSON**:
```json
{
  "type": "openai",
  "api_key": "sk-...",
  "base_url": "https://api.openai.com/v1",
  "model": "gpt-4"
}
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "message": "Connection successful",
  "response": "Test response from LLM"
}
```

**Test Scenarios**:
- ✅ Valid provider configuration
- ❌ Invalid API key (400)
- ❌ Invalid model (400)
- ❌ Network error (500)

---

## 5. Marketplace APIs

### 5.1 Discover Workflows

**Use Case**: Browse public workflows and templates

**Endpoint**: `GET /api/marketplace/discover`

**curl Example**:
```bash
# Basic discovery
curl -X GET "${BASE_URL}/api/marketplace/discover"

# With filters
curl -X GET "${BASE_URL}/api/marketplace/discover?category=data-processing&search=automation&sort_by=popular&limit=20&offset=0"
```

**Expected Response** (200 OK):
```json
[
  {
    "id": "workflow-123",
    "name": "Data Processing Workflow",
    "description": "Process and transform data",
    "version": "1.0.0",
    "nodes": [...],
    "edges": [...],
    "variables": {},
    "owner_id": "user-123",
    "is_public": true,
    "is_template": true,
    "category": "data-processing",
    "tags": ["data", "processing"],
    "likes_count": 10,
    "views_count": 100,
    "uses_count": 50,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Test Scenarios**:
- ✅ Discover workflows (no filters)
- ✅ Filter by category
- ✅ Filter by tags
- ✅ Search by name/description
- ✅ Sort by popular/recent/likes
- ✅ Pagination

---

### 5.2 Like Workflow

**Use Case**: Like a workflow

**Endpoint**: `POST /api/marketplace/like`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/marketplace/like" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "workflow-123"
  }'
```

**Request JSON**:
```json
{
  "workflow_id": "workflow-123"
}
```

**Expected Response** (201 Created):
```json
{
  "message": "Liked successfully"
}
```

**Test Scenarios**:
- ✅ Like workflow
- ✅ Already liked (returns message)
- ❌ Like non-existent workflow (404)
- ❌ Like without authentication (401)

---

### 5.3 Unlike Workflow

**Use Case**: Remove like from workflow

**Endpoint**: `DELETE /api/marketplace/like/{workflow_id}`

**curl Example**:
```bash
curl -X DELETE "${BASE_URL}/api/marketplace/like/workflow-123" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (204 No Content)

**Test Scenarios**:
- ✅ Unlike workflow
- ❌ Unlike non-existent workflow (404)
- ❌ Unlike without authentication (401)

---

## 6. Template APIs

### 6.1 List Templates

**Use Case**: Browse workflow templates

**Endpoint**: `GET /api/templates`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/templates?category=data-processing&difficulty=intermediate&sort_by=popular&limit=20&offset=0"
```

**Expected Response** (200 OK):
```json
[
  {
    "id": "template-123",
    "name": "Data Processing Template",
    "description": "Template for data processing",
    "category": "data-processing",
    "tags": ["data", "processing"],
    "difficulty": "intermediate",
    "estimated_time": 30,
    "is_official": false,
    "uses_count": 100,
    "likes_count": 50,
    "rating": 4.5,
    "author_id": "user-123",
    "author_name": "testuser",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Test Scenarios**:
- ✅ List templates
- ✅ Filter by category
- ✅ Filter by difficulty
- ✅ Search templates
- ✅ Sort by popular/recent/rating
- ✅ Pagination

---

### 6.2 Get Template by ID

**Use Case**: Get template details

**Endpoint**: `GET /api/templates/{template_id}`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/templates/template-123"
```

**Expected Response** (200 OK):
```json
{
  "id": "template-123",
  "name": "Data Processing Template",
  "description": "Template for data processing",
  "category": "data-processing",
  "tags": ["data", "processing"],
  "difficulty": "intermediate",
  "estimated_time": 30,
  "is_official": false,
  "uses_count": 100,
  "likes_count": 50,
  "rating": 4.5,
  "author_id": "user-123",
  "author_name": "testuser",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Get template
- ❌ Get non-existent template (404)

---

### 6.3 Use Template

**Use Case**: Create workflow from template

**Endpoint**: `POST /api/templates/{template_id}/use`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/templates/template-123/use" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (201 Created):
```json
{
  "id": "workflow-456",
  "name": "Data Processing Template",
  "description": "Template for data processing",
  "version": "1.0.0",
  "nodes": [...],
  "edges": [...],
  "variables": {},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Use template (creates workflow)
- ❌ Use non-existent template (404)
- ❌ Use template without auth (401)

---

## 7. Sharing APIs

### 7.1 Share Workflow

**Use Case**: Share workflow with another user

**Endpoint**: `POST /api/sharing/share`

**curl Example**:
```bash
curl -X POST "${BASE_URL}/api/sharing/share" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "workflow-123",
    "shared_with_username": "otheruser",
    "permission": "read"
  }'
```

**Request JSON**:
```json
{
  "workflow_id": "workflow-123",
  "shared_with_username": "otheruser",
  "permission": "read"
}
```

**Expected Response** (201 Created):
```json
{
  "id": "share-123",
  "workflow_id": "workflow-123",
  "shared_with_user_id": "user-456",
  "permission": "read",
  "shared_by": "user-123",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Share workflow
- ✅ Update existing share permission
- ❌ Share non-existent workflow (404)
- ❌ Share with non-existent user (404)
- ❌ Share other user's workflow (403)

---

### 7.2 Get Shared Workflows

**Use Case**: Get workflows shared with current user

**Endpoint**: `GET /api/sharing/shared-with-me`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/sharing/shared-with-me" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response** (200 OK):
```json
[
  {
    "id": "share-123",
    "workflow_id": "workflow-123",
    "shared_with_user_id": "user-456",
    "permission": "read",
    "shared_by": "user-123",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

**Test Scenarios**:
- ✅ Get shared workflows
- ✅ Empty list (no shares)

---

## 8. Import/Export APIs

### 8.1 Export Workflow

**Use Case**: Export workflow as JSON

**Endpoint**: `GET /api/import-export/export/{workflow_id}`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/api/import-export/export/workflow-123" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o workflow_export.json
```

**Expected Response** (200 OK - JSON file):
```json
{
  "workflow": {
    "id": "workflow-123",
    "name": "Data Processing",
    "description": "Process data",
    "version": "1.0.0",
    "nodes": [...],
    "edges": [...],
    "variables": {}
  },
  "version": "1.0",
  "exported_at": "2024-01-15T10:30:00Z",
  "exported_by": "testuser"
}
```

**Test Scenarios**:
- ✅ Export own workflow
- ✅ Export public workflow
- ❌ Export non-existent workflow (404)
- ❌ Export private workflow (403)

---

### 8.2 Import Workflow

**Use Case**: Import workflow from JSON

**Endpoint**: `POST /api/import-export/import`

**curl Example**:
```bash
# Using test data file from test-data/ directory
curl -X POST "${BASE_URL}/api/import-export/import" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_workflow.json
```

**Request JSON** (from `test-data/sample_workflow.json` - format as import structure):
```json
{
  "name": "Imported Workflow",
  "description": "Imported from export",
  "definition": {
    "nodes": [...],
    "edges": [...],
    "variables": {}
  }
}
```

**Expected Response** (201 Created):
```json
{
  "id": "workflow-456",
  "name": "Imported Workflow",
  "description": "Imported from export",
  "version": "1.0.0",
  "nodes": [...],
  "edges": [...],
  "variables": {},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Test Scenarios**:
- ✅ Import valid workflow
- ❌ Import invalid workflow (missing nodes/edges) (400)
- ❌ Import malformed JSON (422)

---

## 9. WebSocket API

### 9.1 Execution Updates

**Use Case**: Receive real-time execution updates

**Endpoint**: `WS /ws/executions/{execution_id}`

**curl Example** (using wscat):
```bash
wscat -c "ws://localhost:8000/ws/executions/exec-123" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Messages**:
```json
{
  "type": "status_update",
  "execution_id": "exec-123",
  "status": "running",
  "current_node": "agent-1"
}

{
  "type": "node_complete",
  "execution_id": "exec-123",
  "node_id": "agent-1",
  "output": "Processed data"
}

{
  "type": "execution_complete",
  "execution_id": "exec-123",
  "status": "completed",
  "result": {...}
}
```

**Test Scenarios**:
- ✅ Connect to WebSocket
- ✅ Receive status updates
- ✅ Receive node completion updates
- ✅ Receive execution completion
- ✅ Handle disconnection
- ❌ Connect with invalid execution_id
- ❌ Connect without authentication

---

## 10. Health Check

### 10.1 Health Check

**Use Case**: Check API health status

**Endpoint**: `GET /health`

**curl Example**:
```bash
curl -X GET "${BASE_URL}/health"
```

**Expected Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "workflow-builder-backend",
  "version": "1.0.0"
}
```

**Test Scenarios**:
- ✅ Health check returns healthy
- ✅ Health check accessible without auth

---

## Test Data Files Reference

**Location**: All test data files are located in the `test-data/` directory at the root of the repository.

### Available Test Data Files

- **`test-data/sample_workflow.json`** - Complete workflow with all node types (start, agent, condition, loop, end)
- **`test-data/sample_llm_settings.json`** - LLM provider configurations for OpenAI, Anthropic, and Gemini
- **`test-data/sample_execution_inputs.json`** - Sample execution inputs with various data types
- **`test-data/sample_user_registration.json`** - Sample user registration data

### Using Test Data Files

Reference these files in curl commands using the `@` prefix:

```bash
# From repository root directory
curl -X POST "${BASE_URL}/api/workflows" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_workflow.json

curl -X POST "${BASE_URL}/api/settings/llm" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_llm_settings.json

curl -X POST "${BASE_URL}/api/workflows/{workflow_id}/execute" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @test-data/sample_execution_inputs.json
```

### Sample Workflow JSON (`workflow_create.json`)

**Note**: This is an example. Use `test-data/sample_workflow.json` for actual testing.

```json
{
  "name": "Sample Workflow",
  "description": "A sample workflow for testing",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "name": "Start",
      "position": {"x": 100, "y": 100}
    },
    {
      "id": "agent-1",
      "type": "agent",
      "name": "Process Data",
      "position": {"x": 300, "y": 100},
      "agent_config": {
        "prompt": "Process the input: {{input}}",
        "model": "gpt-4",
        "temperature": 0.7
      }
    },
    {
      "id": "condition-1",
      "type": "condition",
      "name": "Check Result",
      "position": {"x": 500, "y": 100},
      "condition_config": {
        "field": "result.status",
        "operator": "equals",
        "value": "success"
      }
    },
    {
      "id": "end-1",
      "type": "end",
      "name": "End",
      "position": {"x": 700, "y": 100}
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "start-1",
      "target": "agent-1"
    },
    {
      "id": "e2",
      "source": "agent-1",
      "target": "condition-1"
    },
    {
      "id": "e3",
      "source": "condition-1",
      "target": "end-1"
    }
  ],
  "variables": {
    "input": "default value"
  }
}
```

### Sample LLM Settings (`llm_settings.json`)

**Note**: This is an example. Use `test-data/sample_llm_settings.json` for actual testing.

```json
{
  "providers": [
    {
      "id": "openai-1",
      "name": "OpenAI",
      "type": "openai",
      "apiKey": "sk-test-key",
      "baseUrl": "https://api.openai.com/v1",
      "defaultModel": "gpt-4",
      "models": ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo"],
      "enabled": true
    }
  ],
  "iteration_limit": 10,
  "default_model": "gpt-4"
}
```

---

## Test Execution Checklist

### Authentication Tests
- [ ] Register new user
- [ ] Register duplicate user (should fail)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should fail)
- [ ] Get current user info
- [ ] Request password reset
- [ ] Reset password with token

### Workflow CRUD Tests
- [ ] Create workflow (authenticated)
- [ ] Create workflow (anonymous)
- [ ] List workflows
- [ ] Get workflow by ID
- [ ] Update workflow
- [ ] Delete workflow
- [ ] Bulk delete workflows
- [ ] Publish workflow as template

### Execution Tests
- [ ] Execute workflow
- [ ] Get execution status
- [ ] List executions
- [ ] Filter executions by workflow
- [ ] Filter executions by status
- [ ] List running executions
- [ ] WebSocket connection for real-time updates

### Settings Tests
- [ ] Save LLM settings
- [ ] Get LLM settings
- [ ] Test LLM provider connection
- [ ] Update LLM settings

### Marketplace Tests
- [ ] Discover workflows
- [ ] Filter by category
- [ ] Search workflows
- [ ] Like workflow
- [ ] Unlike workflow

### Template Tests
- [ ] List templates
- [ ] Get template by ID
- [ ] Use template (create workflow)

### Sharing Tests
- [ ] Share workflow
- [ ] Get shared workflows
- [ ] Update share permission

### Import/Export Tests
- [ ] Export workflow
- [ ] Import workflow
- [ ] Import invalid workflow (should fail)

### Integration Tests
- [ ] Full workflow: Create → Execute → Check Status
- [ ] Full workflow: Create → Share → Access Shared
- [ ] Full workflow: Create → Publish → Discover → Use Template

---

## Performance Testing

### Load Testing Scenarios

1. **Concurrent Executions**
   ```bash
   # Execute 10 workflows concurrently
   for i in {1..10}; do
     curl -X POST "${BASE_URL}/api/workflows/workflow-123/execute" \
       -H "Authorization: Bearer ${TOKEN}" &
   done
   ```

2. **List Operations**
   ```bash
   # Test pagination performance
   time curl -X GET "${BASE_URL}/api/workflows?limit=100"
   ```

3. **WebSocket Connections**
   - Test multiple concurrent WebSocket connections
   - Test message throughput

---

## Security Testing

### Authentication Security
- [ ] Token expiration
- [ ] Token validation
- [ ] Unauthorized access attempts
- [ ] SQL injection attempts
- [ ] XSS attempts

### Authorization Security
- [ ] Access to other user's workflows
- [ ] Access to private workflows
- [ ] Unauthorized workflow modification
- [ ] Unauthorized workflow deletion

---

## Error Handling Tests

### HTTP Status Codes
- [ ] 200 OK - Successful requests
- [ ] 201 Created - Resource creation
- [ ] 204 No Content - Successful deletion
- [ ] 400 Bad Request - Invalid request
- [ ] 401 Unauthorized - Missing/invalid auth
- [ ] 403 Forbidden - Insufficient permissions
- [ ] 404 Not Found - Resource doesn't exist
- [ ] 422 Unprocessable Entity - Validation errors
- [ ] 500 Internal Server Error - Server errors

---

## Notes for QA Team

1. **Environment Setup**: Ensure backend is running and database is initialized
2. **Test Data**: Create test users and workflows before running tests
3. **Token Management**: Save tokens from login for subsequent requests
4. **Cleanup**: Clean up test data after test runs
5. **Logging**: Check backend logs for detailed error information
6. **WebSocket Testing**: Use tools like `wscat` or Postman for WebSocket testing

---

## Quick Reference

### Common Headers
```bash
-H "Content-Type: application/json"
-H "Authorization: Bearer ${TOKEN}"
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (Delete)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Server Error

---

## Support

For issues or questions:
- Check API documentation: `/docs` (Swagger UI)
- Check backend logs for detailed errors
- Review error responses for specific error messages
