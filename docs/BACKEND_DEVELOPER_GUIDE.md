# Backend Developer Guide

## Overview

The backend is a FastAPI-based Python application implementing a workflow execution engine with LLM integration. This guide provides developers with a comprehensive understanding of the codebase architecture, components, and development patterns following SOLID and DRY principles.

## Tech Stack

- **Python 3.12+** - Programming language
- **FastAPI** - Modern async web framework
- **SQLAlchemy** - ORM with async support
- **Pydantic** - Data validation and settings management
- **WebSockets** - Real-time communication
- **Pytest** - Testing framework
- **Alembic** - Database migrations (if used)

## Project Structure

```
backend/
├── api/                    # API routes and endpoints
│   ├── routes/                # Organized route modules
│   │   ├── workflow_routes.py    # Workflow CRUD endpoints
│   │   └── execution_routes.py   # Execution endpoints
│   ├── auth_routes.py          # Authentication endpoints
│   ├── websocket_routes.py     # WebSocket endpoints
│   ├── settings_routes.py      # Settings/LLM configuration
│   └── marketplace_routes.py   # Marketplace endpoints
├── services/               # Business logic layer
│   ├── workflow_service.py     # Workflow business logic
│   ├── execution_service.py    # Execution business logic
│   ├── settings_service.py    # Settings management
│   └── llm_client_factory.py  # LLM client creation
├── repositories/           # Data access layer
│   ├── base.py                # Base repository class
│   ├── workflow_repository.py  # Workflow data access
│   └── execution_repository.py # Execution data access
├── models/                 # Data models and schemas
│   └── schemas.py             # Pydantic models
├── database/              # Database configuration
│   ├── db.py                  # Database engine and session
│   └── models.py              # SQLAlchemy ORM models
├── engine/                # Workflow execution engine
│   ├── executor_v3.py         # Main execution engine
│   └── legacy/                # Legacy executors
├── agents/                 # Node execution agents
│   ├── base.py                # Base agent class
│   ├── unified_llm_agent.py   # LLM-powered agent
│   ├── condition_agent.py     # Conditional logic agent
│   ├── loop_agent.py           # Loop iteration agent
│   └── registry.py            # Agent registry
├── tools/                 # Built-in tools for agents
│   ├── base.py                # Base tool interface
│   ├── registry.py            # Tool registry
│   └── builtin_tools.py        # Built-in tool implementations
├── inputs/                # Input source handlers
│   └── input_sources.py        # File/local input sources
├── auth/                  # Authentication and authorization
│   └── auth.py                # Auth utilities and dependencies
├── websocket/             # WebSocket management
│   └── manager.py            # Connection manager
├── memory/                # Memory management
│   └── memory_manager.py      # Agent memory handling
├── utils/                 # Utility functions
│   ├── logger.py              # Logging utilities
│   └── provider_utils.py      # LLM provider utilities
├── config.py              # Application configuration
├── dependencies.py         # Dependency injection setup
├── exceptions.py           # Custom exception classes
├── main.py                # Application entry point
└── tests/                 # Unit and integration tests
    ├── services/              # Service layer tests
    ├── repositories/          # Repository tests
    └── api/                   # API route tests
```

## Architecture Patterns

### Layered Architecture

The backend follows a **layered architecture** with clear separation of concerns:

1. **API Layer** (`api/`): HTTP endpoints, request/response handling
2. **Service Layer** (`services/`): Business logic, orchestration
3. **Repository Layer** (`repositories/`): Data access, database operations
4. **Domain Layer** (`models/`, `database/models.py`): Domain models and entities

### Dependency Injection

FastAPI's dependency injection system is used throughout:

```python
# dependencies.py
def get_workflow_service(db: DatabaseSession) -> WorkflowService:
    return WorkflowService(db)

WorkflowServiceDep = Annotated[WorkflowService, Depends(get_workflow_service)]

# In routes
@router.get("/workflows/{id}")
async def get_workflow(
    id: str,
    service: WorkflowServiceDep = ...
):
    return await service.get_workflow(id)
```

## Core Components

### 1. API Routes (`api/routes/`)

**Workflow Routes** (`workflow_routes.py`):
- `GET /workflows` - List workflows
- `GET /workflows/{id}` - Get workflow by ID
- `POST /workflows` - Create workflow
- `PUT /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow

**Execution Routes** (`execution_routes.py`):
- `POST /workflows/{id}/execute` - Execute workflow
- `GET /executions/{id}` - Get execution by ID
- `GET /executions` - List executions with filtering
- `GET /workflows/{id}/executions` - List workflow executions
- `GET /users/{id}/executions` - List user executions
- `GET /executions/running` - List running executions

**Pattern:**
- Routes are thin controllers
- Delegate to service layer
- Handle HTTP concerns (status codes, exceptions)
- Use dependency injection for services

### 2. Service Layer (`services/`)

**WorkflowService** (`workflow_service.py`):
- Business logic for workflow operations
- Validates workflow data
- Orchestrates repository calls
- Handles business rules

**ExecutionService** (`execution_service.py`):
- Manages execution lifecycle
- Converts between DB models and response models
- Provides filtering and pagination logic

**SettingsService** (`settings_service.py`):
- Manages LLM provider settings
- Caches configuration
- Provides interface abstraction (ISettingsService)

**Pattern:**
- Single Responsibility: Each service handles one domain
- Dependency Injection: Services receive repositories via constructor
- Business Logic: Contains all business rules
- Error Handling: Raises domain exceptions

### 3. Repository Layer (`repositories/`)

**BaseRepository** (`base.py`):
- Generic CRUD operations
- Common patterns (get_by_id, create, update, delete)
- Inherited by specific repositories

**WorkflowRepository** (`workflow_repository.py`):
- Workflow-specific queries
- Filtering by owner, public status
- Complex queries (anonymous + public workflows)

**ExecutionRepository** (`execution_repository.py`):
- Execution queries with filtering
- Pagination support
- Status-based filtering

**Pattern:**
- Data Access Only: No business logic
- DRY: Base repository provides common operations
- Query Building: Uses SQLAlchemy query builder
- Async: All operations are async

### 4. Execution Engine (`engine/`)

**WorkflowExecutor** (`executor_v3.py`):
- Main workflow execution engine
- Node-by-node execution
- State management
- Error handling and recovery
- WebSocket updates

**Execution Flow:**
1. Initialize execution state
2. Determine execution order (topological sort)
3. Execute nodes sequentially
4. Handle node results and errors
5. Update state and send WebSocket updates
6. Complete or fail execution

### 5. Agents (`agents/`)

**BaseAgent** (`base.py`):
- Abstract base class for all agents
- Common interface: `execute()` method
- Input validation
- Logging support

**UnifiedLLMAgent** (`unified_llm_agent.py`):
- LLM-powered agent execution
- Tool calling support
- Memory management
- Streaming responses

**ConditionAgent** (`condition_agent.py`):
- Conditional logic evaluation
- Comparison operations (equals, contains, etc.)
- Field access and navigation

**LoopAgent** (`loop_agent.py`):
- Loop iteration (for-each, while, until)
- Iteration limits
- Item processing

**Agent Registry** (`registry.py`):
- Factory pattern for agent creation
- Node type to agent mapping
- Configuration passing

### 6. Tools (`tools/`)

**BaseTool** (`base.py`):
- Tool interface definition
- Input/output schemas
- Execution method

**Built-in Tools** (`builtin_tools.py`):
- File operations
- Data manipulation
- HTTP requests
- Custom tool implementations

**Tool Registry** (`registry.py`):
- Tool registration and lookup
- Schema validation

## Database Models

### SQLAlchemy Models (`database/models.py`)

**WorkflowDB**:
- Workflow metadata (id, name, description)
- Definition (JSON: nodes, edges, variables)
- Ownership and visibility (owner_id, is_public)
- Timestamps (created_at, updated_at)

**ExecutionDB**:
- Execution metadata (id, workflow_id, user_id)
- Status and state (status, state JSON)
- Timestamps (started_at, completed_at)

**UserDB**:
- User information (id, username, email)
- Authentication (hashed_password)
- Timestamps

### Pydantic Schemas (`models/schemas.py`)

Request/Response models:
- **WorkflowCreate**: Workflow creation request
- **WorkflowResponse**: Workflow response model
- **ExecutionRequest**: Execution request
- **ExecutionResponse**: Execution response model

## Development Patterns

### 1. SOLID Principles

**Single Responsibility Principle (SRP)**:
- Each class has one reason to change
- Services handle business logic only
- Repositories handle data access only

**Open/Closed Principle (OCP)**:
- Open for extension (new agents, tools)
- Closed for modification (base classes)

**Liskov Substitution Principle (LSP)**:
- Derived classes can replace base classes
- Agents implement BaseAgent interface

**Interface Segregation Principle (ISP)**:
- Interfaces are specific (ISettingsService)
- Clients depend only on needed methods

**Dependency Inversion Principle (DIP)**:
- Depend on abstractions (interfaces)
- Services depend on repository interfaces
- Routes depend on service interfaces

### 2. DRY Principles

- **Base Repository**: Common CRUD operations
- **Service Helpers**: Shared conversion methods
- **Utility Functions**: Reusable logic in utils
- **Unified Queries**: Single method for filtering (list_executions)

### 3. Error Handling

**Custom Exceptions** (`exceptions.py`):
- `WorkflowNotFoundError`: Workflow not found
- `ExecutionNotFoundError`: Execution not found
- `WorkflowValidationError`: Invalid workflow data
- `LLMProviderError`: LLM configuration/API errors

**Exception Handling Pattern**:
```python
try:
    workflow = await service.get_workflow(id)
except WorkflowNotFoundError as e:
    raise HTTPException(status_code=404, detail=str(e))
```

### 4. Async/Await

All I/O operations are async:
- Database queries
- HTTP requests
- WebSocket operations
- File I/O

## Testing

### Test Structure

Tests mirror source structure:
```
tests/
├── services/
│   └── test_execution_service.py
├── repositories/
│   └── test_execution_repository.py
└── api/
    └── routes/
        └── test_execution_routes.py
```

### Testing Patterns

**Service Tests**:
- Mock repository dependencies
- Test business logic
- Verify error handling

**Repository Tests**:
- Mock database session
- Test query building
- Verify data transformations

**API Route Tests**:
- Mock service dependencies
- Test HTTP status codes
- Verify request/response handling

**Example:**
```python
@pytest.mark.asyncio
async def test_get_execution_success(execution_service, sample_execution):
    execution_service.repository.get_by_id = AsyncMock(return_value=sample_execution)
    result = await execution_service.get_execution("exec-123")
    assert result.execution_id == "exec-123"
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Add Route** (`api/routes/`):
```python
@router.get("/new-endpoint")
async def new_endpoint(service: ServiceDep = ...):
    return await service.new_method()
```

2. **Add Service Method** (`services/`):
```python
async def new_method(self) -> ResponseModel:
    # Business logic
    return result
```

3. **Add Repository Method** (`repositories/`) if needed:
```python
async def new_query(self) -> List[Model]:
    # Database query
    return results
```

4. **Add Tests** (`tests/`):
```python
async def test_new_endpoint(mock_service):
    # Test implementation
```

### Adding a New Agent Type

1. **Create Agent Class** (`agents/`):
```python
class NewAgent(BaseAgent):
    async def execute(self, inputs: Dict[str, Any]) -> NodeState:
        # Implementation
        return NodeState(...)
```

2. **Register Agent** (`agents/registry.py`):
```python
registry.register("new_type", NewAgent)
```

3. **Add Node Type** (`models/schemas.py`):
```python
class NodeType(str, Enum):
    NEW_TYPE = "new_type"
```

### Adding a New Tool

1. **Create Tool Class** (`tools/`):
```python
class NewTool(BaseTool):
    name = "new_tool"
    description = "Tool description"
    
    async def execute(self, **kwargs) -> Any:
        # Implementation
        return result
```

2. **Register Tool** (`tools/registry.py`):
```python
registry.register(NewTool())
```

## Configuration

### Environment Variables

Create `.env` file:
```env
DATABASE_URL=sqlite+aiosqlite:///./workflows.db
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:5173"]
```

### Settings (`config.py`)

Pydantic Settings for type-safe configuration:
- Database URL
- API Keys
- Logging configuration
- CORS settings
- Server configuration

## Running the Application

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn backend.main:app --reload

# Run tests
pytest backend/tests/ -v

# Run with coverage
pytest backend/tests/ --cov=backend --cov-report=html
```

## Database Operations

### Initialize Database

```python
from backend.database.db import init_db
await init_db()
```

### Database Session

```python
from backend.database import get_db

async def my_function(db: AsyncSession = Depends(get_db)):
    # Use db session
    result = await db.execute(select(Model))
```

## Logging

### Logger Usage

```python
from backend.utils.logger import get_logger

logger = get_logger(__name__)

logger.info("Information message")
logger.error("Error message", exc_info=True)
logger.debug("Debug message")
```

## Best Practices

1. **Type Hints**: Always use type hints
2. **Async/Await**: Use async for I/O operations
3. **Error Handling**: Use custom exceptions
4. **Testing**: Write tests for new features
5. **Documentation**: Document complex logic
6. **Code Organization**: Follow existing structure
7. **SOLID Principles**: Apply SOLID principles
8. **DRY**: Avoid code duplication

## API Documentation

FastAPI automatically generates OpenAPI documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## WebSocket Integration

WebSocket endpoints for real-time updates:
- Execution progress
- Node state changes
- Error notifications

**Connection:**
```python
ws = await websocket.connect("ws://localhost:8000/ws/execution/{execution_id}")
```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Python Async/Await Guide](https://docs.python.org/3/library/asyncio.html)
