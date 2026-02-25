# Architecture Documentation - Phase 1

## Overview

The Agentic Workflow Engine is built with a modular, layered architecture designed for scalability and extensibility.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Examples, External Applications, Future Web UI)           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────────┐
│                      API Layer (FastAPI)                     │
│  - Workflow CRUD endpoints                                   │
│  - Execution endpoints                                       │
│  - Request/Response validation (Pydantic)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────────┐  ┌──────▼──────────────────────────────┐
│   Database Layer   │  │      Workflow Engine                │
│  - WorkflowDB      │  │  - Execution orchestration          │
│  - ExecutionDB     │  │  - Node sequencing                  │
│  - SQLAlchemy ORM  │  │  - State management                 │
└────────────────────┘  │  - Error handling                   │
                        └──────┬──────────────────────────────┘
                               │
                        ┌──────▼──────────────────────────────┐
                        │      Agent Registry                 │
                        │  - Agent type mapping               │
                        │  - Agent instantiation              │
                        └──────┬──────────────────────────────┘
                               │
                        ┌──────▼──────────────────────────────┐
                        │      Agent Layer                    │
                        │  - BaseAgent (abstract)             │
                        │  - LLMAgent (OpenAI integration)    │
                        └──────┬──────────────────────────────┘
                               │
                        ┌──────▼──────────────────────────────┐
                        │   External Services                 │
                        │  - OpenAI API                       │
                        │  - Future: Other LLM providers      │
                        └─────────────────────────────────────┘
```

## Directory Structure

```
cursor-test/
├── main.py                      # Application entry point
├── requirements.txt             # Python dependencies
├── README.md                    # Project overview
├── QUICKSTART.md               # Getting started guide
├── ARCHITECTURE.md             # This file
│
├── backend/
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models & enums
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── db.py               # Database connection & session
│   │   └── models.py           # SQLAlchemy ORM models
│   │
│   ├── engine/
│   │   ├── __init__.py
│   │   └── executor.py         # Workflow execution logic
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py             # Abstract base agent
│   │   ├── llm_agent.py        # LLM-powered agent
│   │   └── registry.py         # Agent type registry
│   │
│   └── api/
│       ├── __init__.py
│       └── routes.py           # FastAPI route handlers
│
└── examples/
    ├── __init__.py
    ├── simple_workflow.py      # 2-agent story example
    └── research_workflow.py    # 3-agent research example
```

## Core Components

### 1. Data Models (`backend/models/schemas.py`)

#### Key Enums
- **NodeType**: `AGENT`, `TOOL`, `START`, `END`
- **ExecutionStatus**: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `PAUSED`

#### Core Models
- **Node**: Represents a workflow node (agent or other type)
- **Edge**: Connects two nodes
- **WorkflowDefinition**: Complete workflow specification
- **NodeState**: Runtime state of a node during execution
- **ExecutionState**: Complete workflow execution state

### 2. Database Layer (`backend/database/`)

#### Models
- **WorkflowDB**: Persists workflow definitions
- **ExecutionDB**: Persists execution history

#### Features
- Async SQLAlchemy for non-blocking I/O
- SQLite for simplicity (easily swappable to PostgreSQL)
- JSON columns for flexible schema storage

### 3. Workflow Engine (`backend/engine/executor_v3.py`)

#### WorkflowExecutorV3 Class

**Key Features:**
- Parallel execution of independent nodes
- Real-time WebSocket streaming
- Conditional branching
- Loop execution
- Storage node support (read/write)
- Comprehensive error handling

**Key Methods:**
- `execute(inputs)`: Main execution entry point
- `_build_graph()`: Build adjacency map and in-degree map
- `_execute_graph()`: Execute graph with parallel support
- `_execute_node(node)`: Execute a single node
- `_prepare_node_inputs(node)`: Resolve node inputs from previous outputs
- `_log(level, node_id, message)`: Add execution log entries

**Execution Flow:**
1. Initialize execution state
2. Build graph (adjacency, in-degree)
3. Execute graph with parallel support:
   - Find ready nodes (dependencies met)
   - Execute ready nodes in parallel
   - Handle conditional branching
   - Continue until all nodes complete
4. Handle errors and state transitions
5. Return final execution state

**Input Resolution:**
- Nodes can receive inputs from:
  - Previous node outputs (`source_node` + `source_field`)
  - Workflow variables (`source_field` without `source_node`)
  - Execution inputs (passed in request)
  - Auto-population from previous node

**For detailed execution architecture, see [Execution System Architecture](./docs/EXECUTION_SYSTEM_ARCHITECTURE.md)**

### 4. Agent System (`backend/agents/`)

#### BaseAgent (Abstract)
- Defines agent interface
- Input validation
- Must implement `execute(inputs)` method

#### LLMAgent
- Integrates with OpenAI API
- Configurable model, temperature, system prompt
- Async execution
- Error handling

#### AgentRegistry
- Maps NodeType to Agent classes
- Factory pattern for agent instantiation
- Extensible for custom agent types

### 5. API Layer (`backend/api/routes.py`)

#### Endpoints

**Workflow Management:**
- `POST /api/workflows` - Create workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/{id}` - Get workflow details
- `DELETE /api/workflows/{id}` - Delete workflow

**Execution:**
- `POST /api/workflows/{id}/execute` - Execute workflow
- `GET /api/executions/{id}` - Get execution details

## Data Flow

### Workflow Creation
```
Client → API (POST /workflows) → Validate → Database → Response
```

### Workflow Execution
```
1. Client → API (POST /workflows/{id}/execute)
2. ExecutionOrchestrator → Get workflow from DB
3. ExecutionOrchestrator → Get LLM config
4. ExecutionOrchestrator → Reconstruct workflow definition
5. ExecutionOrchestrator → Create WorkflowExecutorV3
6. ExecutionOrchestrator → Create execution record (status: RUNNING)
7. Background Task → Executor.execute()
8. Executor → Build graph (adjacency, in-degree)
9. Executor → Execute graph (parallel support):
   a. Find ready nodes (dependencies met)
   b. Execute ready nodes in parallel
   c. Handle conditional branching
   d. Continue until complete
10. For each node:
    a. Prepare inputs from previous nodes/variables
    b. Execute via AgentRegistry (agent/condition/loop/storage)
    c. Store output in execution state
    d. Broadcast updates via WebSocket
11. Executor → Return final execution state
12. ExecutionOrchestrator → Update execution record (status: COMPLETED/FAILED)
13. API → Return execution_id to client (immediately)

For detailed execution flow, see [Execution System Architecture](./docs/EXECUTION_SYSTEM_ARCHITECTURE.md)
```

## Key Design Decisions

### 1. Async/Await Pattern
- All I/O operations are async (DB, API calls)
- Enables future concurrency features
- Better resource utilization

### 2. Pydantic for Validation
- Type safety
- Automatic validation
- Easy serialization/deserialization
- OpenAPI schema generation

### 3. Dependency Injection
- FastAPI's `Depends` for DB sessions
- Clean separation of concerns
- Easier testing

### 4. Node-Edge Graph Model
- Flexible workflow representation
- Easy to visualize
- Extensible for complex patterns

### 5. Topological Sort for Execution
- Respects dependencies
- Efficient sequential execution
- Foundation for parallel execution (Phase 2+)

## Extensibility Points

### Adding New Agent Types
```python
from backend.agents import BaseAgent, AgentRegistry
from backend.models.schemas import NodeType

class CustomAgent(BaseAgent):
    async def execute(self, inputs):
        # Custom logic
        return result

AgentRegistry.register_agent(NodeType.CUSTOM, CustomAgent)
```

### Adding New Node Types
1. Add to `NodeType` enum
2. Create agent class extending `BaseAgent`
3. Register in `AgentRegistry`
4. Update UI (future phases)

### Switching Databases
Change `DATABASE_URL` in `.env`:
```
# PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname

# MySQL
DATABASE_URL=mysql+aiomysql://user:pass@localhost/dbname
```

## Security Considerations (Phase 1)

### Current
- Environment variable for API keys
- Input validation via Pydantic
- SQL injection protected by ORM

### Future Phases
- Authentication/Authorization
- Rate limiting
- Workflow access control
- Sandboxed code execution
- API key encryption

## Performance Characteristics

### Bottlenecks
- LLM API calls (10-30s per agent)
- Sequential execution (by design in Phase 1)

### Optimizations for Future
- Parallel execution of independent nodes
- Response streaming
- Caching of common requests
- Connection pooling

## Testing Strategy

### Current
- Manual testing via examples
- API testing via `/docs` interface

### Recommended
- Unit tests for agents, executor
- Integration tests for API endpoints
- E2E tests for complete workflows
- Mock OpenAI API for testing

## Monitoring & Observability

### Phase 1
- Execution logs in database
- Console logging
- Execution status tracking

### Future
- OpenTelemetry integration
- Metrics (execution time, success rate)
- Distributed tracing
- Real-time execution monitoring UI

## Limitations & Future Work

### Phase 1 Limitations
- Sequential execution only
- No conditional branching
- No loops
- No human-in-the-loop
- Single LLM provider (OpenAI)

### Planned for Future Phases
- **Phase 2**: Visual workflow builder, conditional logic, loops
- **Phase 3**: Advanced control flow, agent memory
- **Phase 4**: Collaboration features, marketplace
- **Phase 5**: Enterprise features (SSO, RBAC, audit logs)

