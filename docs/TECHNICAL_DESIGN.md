# Technical Design Document: Agentic Workflow Engine

## Document Information

- **Version**: 2.0.0
- **Last Updated**: 2024
- **Status**: Phase 4 Complete
- **Document Owner**: Engineering Team

---

## 1. Introduction

### 1.1 Purpose

This document describes the technical architecture, design decisions, and implementation details of the Agentic Workflow Engine platform.

### 1.2 Scope

This document covers:
- System architecture and components
- Data models and schemas
- API design and endpoints
- Execution engine design
- Frontend architecture
- Security architecture
- Deployment architecture

### 1.3 Audience

- Software Engineers
- System Architects
- DevOps Engineers
- QA Engineers
- Technical Product Managers

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  - Visual Workflow Builder (React Flow)                      │
│  - Execution Console                                         │
│  - Settings Management                                       │
│  - Authentication UI                                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST + WebSocket
┌────────────────────▼────────────────────────────────────────┐
│              API Gateway (FastAPI)                            │
│  - REST API Endpoints                                        │
│  - WebSocket Endpoints                                       │
│  - Authentication Middleware                                 │
│  - Request Validation                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────────┐  ┌──────▼──────────────────────────────┐
│   Database Layer   │  │      Execution Engine               │
│  - SQLAlchemy ORM  │  │  - Workflow Executor V3            │
│  - SQLite/Postgres │  │  - Node Execution                   │
│  - Async Sessions  │  │  - State Management                 │
└────────────────────┘  │  - Error Handling                   │
                        └──────┬───────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼──────────┐  ┌─────▼──────────┐  ┌────▼──────────┐
│   Agent System      │  │  Memory System  │  │  Tool System  │
│  - BaseAgent        │  │  - Vector DB    │  │  - Tool Reg.  │
│  - LLM Agents       │  │  - Memory Mgr  │  │  - Built-ins  │
│  - Agent Registry   │  │  - Context     │  │  - Extensible │
└─────────────────────┘  └────────────────┘  └───────────────┘
```

### 2.2 Component Overview

#### Frontend Layer
- **Technology**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS
- **Graph Library**: React Flow
- **State Management**: React Context + Local State
- **HTTP Client**: Axios with interceptors
- **WebSocket**: Custom hook with reconnection logic

#### Backend Layer
- **Technology**: Python 3.8+, FastAPI
- **Database**: SQLite (development), PostgreSQL-ready
- **ORM**: SQLAlchemy (async)
- **Validation**: Pydantic
- **Authentication**: JWT tokens, bcrypt
- **WebSocket**: FastAPI WebSocket support

#### Execution Engine
- **Architecture**: Async execution with topological sorting
- **State Management**: In-memory with database persistence
- **Error Handling**: Try-catch with state rollback
- **Streaming**: WebSocket-based real-time updates

---

## 3. Data Models

### 3.1 Core Entities

#### Workflow
```python
class WorkflowDB:
    id: str (UUID)
    name: str
    description: Optional[str]
    definition: JSON  # Contains nodes, edges, variables
    owner_id: Optional[str]  # User ID
    is_public: bool
    created_at: datetime
    updated_at: datetime
```

#### Execution
```python
class ExecutionDB:
    id: str (UUID)
    workflow_id: str
    user_id: Optional[str]
    status: str  # pending, running, completed, failed
    state: JSON  # Execution state data
    started_at: datetime
    completed_at: Optional[datetime]
```

#### User
```python
class UserDB:
    id: str (UUID)
    username: str (unique)
    email: str (unique)
    password_hash: str
    created_at: datetime
```

#### Settings
```python
class SettingsDB:
    id: str (UUID)
    user_id: str
    settings_data: JSON  # LLM provider configurations
    created_at: datetime
    updated_at: datetime
```

### 3.2 Workflow Definition Schema

```python
class WorkflowDefinition:
    id: Optional[str]
    name: str
    description: Optional[str]
    nodes: List[Node]
    edges: List[Edge]
    variables: Dict[str, Any]

class Node:
    id: str
    type: NodeType  # agent, condition, loop, etc.
    name: str
    position: Position
    inputs: List[InputMapping]
    agent_config: Optional[AgentConfig]
    condition_config: Optional[ConditionConfig]
    loop_config: Optional[LoopConfig]
    input_config: Optional[InputConfig]

class Edge:
    id: str
    source: str  # Source node ID
    target: str  # Target node ID
    source_handle: Optional[str]
    target_handle: Optional[str]
```

### 3.3 Execution State Schema

```python
class ExecutionState:
    execution_id: str
    workflow_id: str
    status: ExecutionStatus
    current_node: Optional[str]
    node_states: Dict[str, NodeState]
    variables: Dict[str, Any]
    result: Optional[Any]
    error: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    logs: List[ExecutionLogEntry]

class NodeState:
    node_id: str
    status: ExecutionStatus
    input: Optional[Dict[str, Any]]
    output: Optional[Any]
    error: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
```

---

## 4. API Design

### 4.1 REST API Endpoints

#### Workflow Management
```
POST   /api/workflows              Create workflow
GET    /api/workflows              List workflows
GET    /api/workflows/{id}         Get workflow
PUT    /api/workflows/{id}         Update workflow
DELETE /api/workflows/{id}         Delete workflow
POST   /api/workflows/bulk-delete  Bulk delete workflows
```

#### Execution
```
POST   /api/workflows/{id}/execute    Execute workflow
GET    /api/executions/{id}           Get execution details
```

#### Authentication
```
POST   /api/auth/register          Register user
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
POST   /api/auth/forgot-password   Request password reset
POST   /api/auth/reset-password    Reset password
```

#### Settings
```
GET    /api/settings/llm           Get LLM settings
POST   /api/settings/llm           Save LLM settings
POST   /api/settings/llm/test      Test LLM connection
```

#### Templates & Marketplace
```
GET    /api/templates               List templates
GET    /api/templates/{id}         Get template
POST   /api/templates/{id}/use     Use template
GET    /api/marketplace             List marketplace templates
```

#### Sharing
```
POST   /api/sharing/share           Share workflow
GET    /api/sharing/shared          List shared workflows
```

### 4.2 WebSocket API

#### Connection
```
ws://localhost:8000/api/ws/executions/{execution_id}
```

#### Message Format
```json
{
  "type": "log" | "state" | "error" | "complete",
  "data": { ... }
}
```

#### Message Types
- **log**: Execution log entry
- **state**: Execution state update
- **error**: Error occurred
- **complete**: Execution completed

### 4.3 Request/Response Examples

#### Create Workflow
```http
POST /api/workflows
Content-Type: application/json

{
  "name": "My Workflow",
  "description": "A sample workflow",
  "nodes": [...],
  "edges": [...],
  "variables": {}
}
```

#### Execute Workflow
```http
POST /api/workflows/{id}/execute
Content-Type: application/json

{
  "inputs": {
    "topic": "AI Automation"
  }
}
```

---

## 5. Execution Engine

### 5.1 Architecture

The execution engine (`WorkflowExecutorV3`) orchestrates workflow execution:

1. **Initialization**: Load workflow definition, create execution record
2. **Topological Sort**: Determine node execution order based on dependencies
3. **Node Execution**: Execute nodes in order, handling parallel execution
4. **State Management**: Track execution state, node states, variables
5. **Streaming**: Send real-time updates via WebSocket
6. **Error Handling**: Handle errors gracefully, update state
7. **Completion**: Finalize execution, persist results

### 5.2 Execution Flow

```
1. User requests execution
   ↓
2. Create ExecutionDB record (status: running)
   ↓
3. Load workflow definition
   ↓
4. Topological sort of nodes
   ↓
5. For each node (in order):
   a. Resolve inputs from previous nodes/variables
   b. Create agent instance
   c. Execute agent
   d. Store output in execution state
   e. Stream updates via WebSocket
   ↓
6. Handle errors (if any)
   ↓
7. Update ExecutionDB (status: completed/failed)
   ↓
8. Return execution results
```

### 5.3 Node Execution

#### Agent Node
```python
1. Resolve inputs from previous nodes/variables
2. Create LLM client with user's API key
3. Load agent memory (if configured)
4. Call LLM with system prompt, user prompt, memory context
5. Handle tool calls (if any)
6. Store output in execution state
7. Update memory (if configured)
8. Stream log entry via WebSocket
```

#### Condition Node
```python
1. Resolve condition field from inputs
2. Evaluate condition (equals, contains, etc.)
3. Determine output path (true/false)
4. Update execution state with path taken
5. Stream log entry via WebSocket
```

#### Loop Node
```python
1. Resolve loop input (list to iterate)
2. For each item in list:
   a. Set loop variable
   b. Execute child nodes
   c. Collect outputs
3. Combine outputs
4. Store combined output in execution state
5. Stream log entries via WebSocket
```

### 5.4 State Management

Execution state is managed in memory during execution and persisted to database:

- **In-Memory State**: Fast access during execution
- **Database Persistence**: Survives server restarts
- **WebSocket Streaming**: Real-time updates to clients
- **State Recovery**: Can resume failed executions (future)

---

## 6. Agent System

### 6.1 Agent Architecture

```
BaseAgent (Abstract)
    ↓
LLMAgentV2
    ↓
UnifiedLLMAgent (Current)
```

#### BaseAgent
- Abstract base class defining agent interface
- Input validation
- Output formatting
- Error handling

#### UnifiedLLMAgent
- LLM provider abstraction
- Supports OpenAI, Anthropic, Google Gemini
- Tool calling integration
- Memory integration
- Streaming support

### 6.2 Agent Registry

Agent registry maps node types to agent classes:

```python
AGENT_REGISTRY = {
    NodeType.AGENT: UnifiedLLMAgent,
    NodeType.CONDITION: ConditionAgent,
    NodeType.LOOP: LoopAgent,
}
```

### 6.3 Memory System

#### Short-Term Memory
- Stored in execution state
- Available during current execution
- Cleared after execution completes

#### Long-Term Memory
- Stored in vector database
- Persisted across executions
- Queryable by agents
- Configurable per agent

### 6.4 Tool System

#### Tool Architecture
```
BaseTool (Abstract)
    ↓
BuiltinTools:
    - CalculatorTool
    - PythonExecutorTool
    - WebSearchTool
    - FileReaderTool
```

#### Tool Calling Flow
```
1. Agent receives LLM response with tool calls
2. Parse tool call requests
3. Look up tools in registry
4. Execute tools with parameters
5. Return tool results to LLM
6. LLM generates final response
```

---

## 7. Frontend Architecture

### 7.1 Component Structure

```
App.tsx
├── AuthContext (Authentication state)
├── Routes
│   ├── AuthPage (Login/Register)
│   ├── WorkflowBuilder (Main builder)
│   ├── WorkflowList (Workflow management)
│   ├── SettingsPage (LLM settings)
│   └── MarketplacePage (Template discovery)
└── Components
    ├── WorkflowBuilder
    │   ├── ReactFlow (Canvas)
    │   ├── NodePanel (Node palette)
    │   ├── PropertyPanel (Node config)
    │   └── Toolbar (Actions)
    ├── ExecutionConsole (Execution monitoring)
    └── WorkflowTabs (Tab management)
```

### 7.2 State Management

- **React Context**: Authentication state, global UI state
- **Local State**: Component-specific state (useState)
- **React Flow State**: Workflow graph state (nodes, edges)
- **API Client**: Centralized HTTP client with auth interceptors

### 7.3 Data Flow

```
User Action
    ↓
Component Handler
    ↓
API Client (with auth token)
    ↓
Backend API
    ↓
Response
    ↓
State Update
    ↓
UI Re-render
```

### 7.4 WebSocket Integration

```typescript
useWebSocket(executionId)
    ↓
Connect to WebSocket
    ↓
Listen for messages
    ↓
Update execution state
    ↓
Stream logs to console
    ↓
Update node states visually
```

---

## 8. Security Architecture

### 8.1 Authentication

#### JWT Token Flow
```
1. User logs in with credentials
2. Server validates credentials
3. Server generates JWT token
4. Token includes user ID and expiration
5. Client stores token (localStorage/sessionStorage)
6. Client includes token in API requests
7. Server validates token on each request
```

#### Token Storage
- **Remember Me**: localStorage (30 days)
- **Session Only**: sessionStorage (until browser close)
- **Token Refresh**: Not implemented (future enhancement)

### 8.2 Authorization

#### Resource Ownership
- Workflows belong to users (owner_id)
- Users can only access their own workflows
- Sharing enables access to specific workflows
- Public workflows are accessible to all

#### API Authorization
```python
@router.get("/workflows")
async def list_workflows(
    current_user: UserDB = Depends(get_current_user)
):
    # Returns only user's workflows
    return await workflow_service.list_workflows(user_id=current_user.id)
```

### 8.3 Data Protection

#### Password Storage
- Passwords hashed with bcrypt
- Salt rounds: 12
- Never stored in plain text

#### API Key Storage
- LLM API keys stored in SettingsDB
- Encrypted at rest (future enhancement)
- User-specific, never shared

#### Input Validation
- All inputs validated with Pydantic
- SQL injection prevented by ORM
- XSS prevented by React escaping

---

## 9. Database Design

### 9.1 Schema Overview

```
users
├── id (PK)
├── username (unique)
├── email (unique)
├── password_hash
└── created_at

workflows
├── id (PK)
├── name
├── description
├── definition (JSON)
├── owner_id (FK → users.id)
├── is_public
├── created_at
└── updated_at

executions
├── id (PK)
├── workflow_id (FK → workflows.id)
├── user_id (FK → users.id)
├── status
├── state (JSON)
├── started_at
└── completed_at

settings
├── id (PK)
├── user_id (FK → users.id)
├── settings_data (JSON)
├── created_at
└── updated_at

password_reset_tokens
├── id (PK)
├── user_id (FK → users.id)
├── token (unique)
├── expires_at
├── used
└── created_at
```

### 9.2 Indexes

- `users.username` (unique index)
- `users.email` (unique index)
- `workflows.owner_id` (index)
- `executions.workflow_id` (index)
- `executions.user_id` (index)
- `settings.user_id` (index)
- `password_reset_tokens.token` (index)

### 9.3 Relationships

- **User → Workflows**: One-to-many
- **User → Executions**: One-to-many
- **User → Settings**: One-to-one
- **Workflow → Executions**: One-to-many

---

## 10. Deployment Architecture

### 10.1 Development Setup

```
Frontend (Vite Dev Server)
    Port: 3000
    Hot Reload: Enabled

Backend (FastAPI/Uvicorn)
    Port: 8000
    Reload: Enabled
    Database: SQLite (local file)
```

### 10.2 Production Architecture (Recommended)

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌─────▼────┐
│Frontend│          │ Backend  │
│(Static)│          │(FastAPI) │
│        │          │          │
│  Nginx │          │ Uvicorn  │
│  Serve │          │ Workers  │
└────────┘          └────┬─────┘
                         │
                  ┌──────▼──────┐
                  │  PostgreSQL │
                  │  Database   │
                  └─────────────┘
```

### 10.3 Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key

# CORS
CORS_ORIGINS=https://yourdomain.com

# Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
```

### 10.4 Docker Deployment (Future)

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

---

## 11. Performance Considerations

### 11.1 Optimization Strategies

#### Database
- Use indexes on frequently queried fields
- Batch operations where possible
- Use connection pooling
- Consider read replicas for scale

#### API
- Implement response caching
- Use async/await throughout
- Batch database queries
- Paginate large result sets

#### Frontend
- Code splitting for routes
- Lazy load components
- Optimize React re-renders
- Cache API responses

### 11.2 Scalability

#### Horizontal Scaling
- Stateless API design enables horizontal scaling
- Load balancer distributes requests
- Database can be scaled independently
- WebSocket connections can be load-balanced (with sticky sessions)

#### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use faster storage (SSD)
- Increase connection pool size

---

## 12. Error Handling

### 12.1 Error Types

#### Validation Errors (400)
- Invalid input data
- Missing required fields
- Type mismatches

#### Authentication Errors (401)
- Invalid credentials
- Expired tokens
- Missing authentication

#### Authorization Errors (403)
- Insufficient permissions
- Resource access denied

#### Not Found Errors (404)
- Workflow not found
- Execution not found
- User not found

#### Server Errors (500)
- Unexpected exceptions
- Database errors
- External API failures

### 12.2 Error Response Format

```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 12.3 Error Handling Strategy

1. **Catch errors at API layer**
2. **Log errors with context**
3. **Return user-friendly messages**
4. **Preserve execution state on errors**
5. **Enable error recovery where possible**

---

## 13. Testing Strategy

### 13.1 Unit Tests

- **Coverage Target**: > 80%
- **Focus Areas**:
  - Business logic (services)
  - Data access (repositories)
  - Utility functions
  - Agent execution logic

### 13.2 Integration Tests

- **API Endpoints**: Test all endpoints
- **Database Operations**: Test CRUD operations
- **Authentication Flow**: Test login/logout
- **Execution Flow**: Test workflow execution

### 13.3 End-to-End Tests

- **Workflow Creation**: Create and save workflow
- **Workflow Execution**: Execute workflow end-to-end
- **User Flow**: Complete user journey

### 13.4 Test Tools

- **Backend**: pytest, pytest-asyncio
- **Frontend**: Jest, React Testing Library
- **E2E**: Playwright (future)

---

## 14. Monitoring & Observability

### 14.1 Logging

#### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General informational messages
- **WARNING**: Warning messages
- **ERROR**: Error messages
- **CRITICAL**: Critical errors

#### Log Format
```
2024-01-01 00:00:00 - workflow_engine - INFO - execute_workflow:123 - Executing workflow abc123
```

### 14.2 Metrics (Future)

- Request rate
- Response times
- Error rates
- Execution success rate
- Active users
- Workflow execution duration

### 14.3 Health Checks

```
GET /health
Response: {"status": "healthy"}
```

---

## 15. Future Enhancements

### 15.1 Planned Features

- Workflow version control
- Advanced analytics dashboard
- Mobile applications
- SSO integration
- RBAC and advanced permissions
- Workflow scheduling
- Custom agent training
- Multi-modal agent support

### 15.2 Technical Improvements

- Database migration system (Alembic)
- API versioning
- Response caching
- Rate limiting
- GraphQL API (alternative)
- gRPC support (for internal services)

---

## 16. Conclusion

The Agentic Workflow Engine is built with a modern, scalable architecture that supports both current requirements and future enhancements. The separation of concerns, use of industry-standard technologies, and focus on extensibility ensure the platform can evolve to meet changing business needs.

