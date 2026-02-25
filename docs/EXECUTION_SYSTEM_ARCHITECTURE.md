# Execution System Architecture

## Overview

The execution system is responsible for running workflows defined as directed graphs of nodes. It supports sequential and parallel execution, conditional branching, loops, real-time WebSocket updates, and multiple node types (agents, conditions, loops, storage nodes).

**Key Capabilities:**
- ✅ Parallel execution of independent nodes
- ✅ Conditional branching
- ✅ Loop execution
- ✅ Storage node support (read/write)
- ✅ Real-time WebSocket streaming
- ✅ Comprehensive error handling
- ✅ State persistence

---

## Architecture Layers

### 1. API Layer (`backend/api/routes/execution_routes.py`)

**Entry Point:** `POST /api/workflows/{workflow_id}/execute`

**Responsibilities:**
- Accept execution requests
- Validate authentication (optional)
- Return execution ID immediately (non-blocking)
- Delegate to orchestrator service

**Key Endpoint:**
```python
@router.post("/workflows/{workflow_id}/execute")
async def execute_workflow(
    workflow_id: str,
    execution_request: Optional[ExecutionRequest],
    db: AsyncSession,
    current_user: Optional[UserDB]
) -> ExecutionResponse
```

**Flow:**
```
Client Request → ExecutionOrchestrator → Background Task → Response
```

**Response Format:**
```json
{
  "execution_id": "exec-123",
  "workflow_id": "workflow-123",
  "status": "running",
  "started_at": "2026-02-23T12:00:00Z"
}
```

---

### 2. Orchestration Layer (`backend/services/execution_orchestrator.py`)

**ExecutionOrchestrator Class** - Coordinates execution setup and lifecycle management.

**Key Methods:**

#### `prepare_execution(workflow_id, user_id, execution_request)`
Prepares workflow execution by:
1. Getting workflow from database
2. Getting LLM configuration (user-specific)
3. Reconstructing workflow definition (nodes/edges)
4. Creating WorkflowExecutor instance
5. Extracting inputs from request

**Returns:** `(execution_id, workflow_definition, inputs, executor)`

#### `create_execution_record(execution_id, workflow_id, user_id)`
Creates initial execution record in database with status `RUNNING`.

#### `run_execution_in_background(executor, execution_id, inputs)`
Runs workflow execution asynchronously in background task:
- Executes workflow via executor
- Updates database with final status
- Handles errors and updates status to `FAILED` if needed

#### `update_execution_status(execution_id, status, state, completed_at)`
Updates execution record in database with final status and state.

**Design Pattern:** Service Layer Abstraction (Single Responsibility Principle)

**Execution Flow:**
```
1. Get workflow from database
2. Get LLM configuration (user-specific)
3. Reconstruct workflow definition (nodes/edges)
4. Create WorkflowExecutor instance
5. Create execution record in database
6. Start background execution task
7. Return execution_id to client immediately
```

---

### 3. Execution Engine (`backend/engine/executor_v3.py`)

**WorkflowExecutorV3 Class** - Core execution logic with WebSocket streaming support.

#### A. Execution State Management

**ExecutionState Structure:**
```python
class ExecutionState:
    execution_id: str              # Unique identifier
    workflow_id: str               # Workflow being executed
    status: ExecutionStatus        # RUNNING | COMPLETED | FAILED
    current_node: Optional[str]    # Currently executing node
    node_states: Dict[str, NodeState]  # State of each node
    variables: Dict[str, Any]      # Workflow variables + execution inputs
    logs: List[ExecutionLogEntry]  # Execution log entries
    result: Optional[Any]          # Final output
    error: Optional[str]           # Error message (if failed)
    started_at: datetime           # Execution start time
    completed_at: Optional[datetime]  # Execution completion time
```

**NodeState Structure:**
```python
class NodeState:
    node_id: str                   # Node identifier
    status: ExecutionStatus        # RUNNING | COMPLETED | FAILED
    input: Optional[Dict[str, Any]]  # Node inputs
    output: Optional[Any]          # Node output
    error: Optional[str]           # Error message (if failed)
    started_at: datetime           # Node start time
    completed_at: Optional[datetime]  # Node completion time
```

#### B. Graph Execution Algorithm

**Step 1: Build Graph**
```python
_build_graph() → (adjacency_map, in_degree_map)
```

**Process:**
1. Filter invalid nodes (e.g., condition nodes without field config)
2. Create adjacency list from edges
3. Calculate in-degree for each node
4. Filter edges referencing invalid nodes
5. Return adjacency map and in-degree map

**Step 2: Execute Graph**
```python
_execute_graph(adjacency: Dict[str, List[str]], in_degree: Dict[str, int])
```

**Parallel Execution Algorithm:**
```
1. Find start nodes (in-degree = 0)
2. Initialize:
   - queue: Nodes ready to execute
   - in_progress: Nodes currently executing
   - completed: Nodes that have completed
3. While queue or in_progress exist:
   a. Collect nodes ready to execute (dependencies met)
   b. Execute ready nodes in parallel (asyncio.gather)
   c. Mark nodes as completed
   d. Add children to queue (if dependencies met)
   e. Handle conditional branching
4. Continue until all nodes complete
```

**Key Features:**
- ✅ Parallel execution of independent nodes
- ✅ Dependency tracking
- ✅ Conditional branch selection
- ✅ Loop state management
- ✅ Error propagation

#### C. Node Execution

**`_execute_node(node)` Method:**

**For each node:**
1. **Initialize Node State**
   - Create `NodeState` with status `RUNNING`
   - Set `current_node` in execution state
   - Broadcast node start via WebSocket

2. **Prepare Inputs**
   - Resolve from previous node outputs (`source_node`)
   - Resolve from workflow variables (`source_field`)
   - Auto-populate from previous node if no explicit inputs

3. **Execute Based on Node Type**

   **Storage Nodes** (`gcp_bucket`, `aws_s3`, `local_filesystem`, `gcp_pubsub`):
   - **Read Mode**: Read data from storage
     - Supports structured outputs (lines, batches)
     - Wraps output in `{'data': ..., 'source': node_type}`
   - **Write Mode**: Write data to storage
     - Auto-detects mode from inputs/edges
     - Extracts data from previous node output
     - Handles base64 image strings

   **Agent Nodes** (`AGENT`):
   - Get agent from `AgentRegistry`
   - Pass LLM config and user_id
   - Execute agent with inputs
   - Store output in node state

   **Condition Nodes** (`CONDITION`):
   - Evaluate condition expression
   - Select branch (`true`/`false`/`default`)
   - Output branch selection

   **Loop Nodes** (`LOOP`):
   - Iterate over input array
   - Execute child nodes for each item
   - Collect and combine outputs

4. **Update Node State**
   - Set status to `COMPLETED` or `FAILED`
   - Store output or error
   - Set completion timestamp
   - Broadcast node completion via WebSocket

**Input Resolution:**
```python
_prepare_node_inputs(node) → Dict[str, Any]
```

**Process:**
1. For each `InputMapping` in node:
   - If `source_node` specified:
     - Get output from previous node
     - Extract field if `source_field` specified
   - Else:
     - Get from workflow variables
     - Fall back to previous node output if available

**Auto-Population:**
- If node has no explicit inputs but has incoming edges:
  - Automatically use previous node's output
  - Wrap single values in dict with common keys (`data`, `output`, `items`)

**Variable Resolution:**
```python
_resolve_config_variables(config) → Dict[str, Any]
```
- Resolves `${variable_name}` references
- Substitutes workflow variable values
- Handles empty values and fallbacks

---

### 4. Agent System (`backend/agents/`)

**AgentRegistry** - Factory for creating agent instances.

**Registration:**
```python
AgentRegistry._agents = {
    NodeType.AGENT: UnifiedLLMAgent,
    NodeType.CONDITION: ConditionAgent,
    NodeType.LOOP: LoopAgent,
}
```

**Usage:**
```python
agent = AgentRegistry.get_agent(
    node,
    llm_config=llm_config,
    user_id=user_id,
    log_callback=log_callback
)
output = await agent.execute(inputs)
```

**BaseAgent Interface:**
```python
class BaseAgent:
    async def execute(inputs: Dict[str, Any]) -> Any
```

**Agent Types:**

**UnifiedLLMAgent:**
- Supports multiple LLM providers (OpenAI, Anthropic, Google Gemini)
- Tool calling integration
- Memory integration
- Streaming support
- User-specific API keys

**ConditionAgent:**
- Evaluates condition expressions
- Supports: equals, contains, greater than, less than, etc.
- Returns branch selection

**LoopAgent:**
- Iterates over arrays
- Executes child nodes for each item
- Combines outputs

---

### 5. Real-Time Updates (`backend/websocket/manager.py`)

**ConnectionManager** - Manages WebSocket connections for live execution updates.

**Connection Management:**
- Maps `execution_id` → Set of WebSocket connections
- Thread-safe connection management (asyncio.Lock)

**Broadcast Methods:**

**`broadcast_status(execution_id, status, data)`**
- Broadcasts execution status changes
- Message type: `"status"`

**`broadcast_node_update(execution_id, node_id, node_state)`**
- Broadcasts node state changes
- Message type: `"node_update"`

**`broadcast_log(execution_id, log_entry)`**
- Broadcasts log entries
- Message type: `"log"`

**`broadcast_completion(execution_id, result)`**
- Broadcasts execution completion
- Message type: `"completion"`

**`broadcast_error(execution_id, error)`**
- Broadcasts execution errors
- Message type: `"error"`

**Message Format:**
```json
{
  "type": "node_update" | "log" | "status" | "completion" | "error",
  "execution_id": "exec-123",
  "data": {...},
  "timestamp": "1234567890.123"
}
```

**Connection Lifecycle:**
1. Client connects to WebSocket endpoint
2. Server accepts connection and registers for execution_id
3. Server broadcasts updates as execution progresses
4. Client receives real-time updates
5. Server removes connection on disconnect

---

### 6. State Persistence (`backend/database/models.py`)

**ExecutionDB Model:**
```python
class ExecutionDB:
    id: str                        # Execution identifier
    workflow_id: str               # Workflow identifier
    user_id: Optional[str]         # User identifier (optional)
    status: str                    # "running" | "completed" | "failed"
    state: JSON                    # Full ExecutionState serialized
    started_at: datetime           # Execution start time
    completed_at: Optional[datetime]  # Execution completion time
```

**Persistence Flow:**
1. **Create Record** - When execution starts (status: `RUNNING`)
2. **Update Record** - When execution completes (status + full state)
3. **State Includes** - Full execution history (logs, node states, variables, result)

**State Serialization:**
- ExecutionState converted to JSON via `model_dump(mode='json')`
- Includes all node states, logs, variables, and results
- Survives server restarts

---

## Complete Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. API Request (POST /workflows/{id}/execute)              │
│    - Client sends execution request with optional inputs   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ExecutionOrchestrator.prepare_execution()               │
│    ├─ Get workflow from database                           │
│    ├─ Get LLM config (user-specific)                      │
│    ├─ Reconstruct workflow definition                      │
│    └─ Create WorkflowExecutor                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Create ExecutionDB Record                                │
│    - Status: RUNNING                                        │
│    - Store initial state                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Start Background Task                                    │
│    asyncio.create_task(executor.execute(inputs))          │
│    - Non-blocking execution                                 │
│    - Returns execution_id immediately                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. WorkflowExecutor.execute()                              │
│    ├─ Initialize ExecutionState                            │
│    ├─ Build graph (adjacency, in-degree)                    │
│    ├─ Execute graph (parallel support)                      │
│    │   ├─ Find ready nodes                                  │
│    │   ├─ Execute in parallel                               │
│    │   ├─ Handle conditionals                               │
│    │   └─ Continue until complete                           │
│    └─ Return ExecutionState                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. For Each Node: _execute_node()                          │
│    ├─ Prepare inputs                                        │
│    │   ├─ From previous nodes                               │
│    │   ├─ From workflow variables                           │
│    │   └─ Auto-populate if needed                           │
│    ├─ Execute via AgentRegistry                             │
│    │   ├─ Storage nodes (read/write)                        │
│    │   ├─ Agent nodes (LLM calls)                           │
│    │   ├─ Condition nodes (branching)                      │
│    │   └─ Loop nodes (iteration)                            │
│    ├─ Update node state                                     │
│    └─ Broadcast via WebSocket                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Update ExecutionDB                                       │
│    - Status: COMPLETED or FAILED                            │
│    - Store full execution state                             │
│    - Set completed_at timestamp                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Parallel Execution

**How It Works:**
- Independent nodes (no dependencies) execute concurrently
- Uses `asyncio.gather()` for parallel batches
- Dependency tracking ensures correct execution order

**Example:**
```
Node A → Node B
Node A → Node C
Node D → Node E
```
Nodes B, C, and D can execute in parallel after A completes.

### 2. Conditional Branching

**How It Works:**
- Condition nodes evaluate expressions
- Edges have condition labels (`true`, `false`, `default`)
- Only matching branches execute

**Example:**
```
Condition Node → [true] → Node B
               → [false] → Node C
```
If condition evaluates to `true`, only Node B executes.

### 3. Loop Execution

**How It Works:**
- Loop nodes iterate over arrays
- Execute child nodes for each iteration
- Collect and combine outputs

**Example:**
```
Loop Node (items: [1, 2, 3])
  └─ Agent Node (processes each item)
```
Agent Node executes 3 times, once for each item.

### 4. Storage Node Support

**Supported Storage Types:**
- GCP Bucket (`gcp_bucket`)
- AWS S3 (`aws_s3`)
- Local Filesystem (`local_filesystem`)
- GCP Pub/Sub (`gcp_pubsub`)

**Read Mode:**
- Reads data from storage
- Supports structured outputs:
  - `lines`: Array of lines for Loop nodes
  - `batch`: Batches for batch processing
- Wraps output: `{'data': ..., 'source': node_type}`

**Write Mode:**
- Auto-detects from inputs/edges
- Extracts data from previous node output
- Handles base64 image strings
- Writes to storage

### 5. Input Resolution

**Input Sources:**
1. **Previous Node Outputs** - Via `source_node` and `source_field`
2. **Workflow Variables** - Via `source_field` without `source_node`
3. **Execution Inputs** - Passed in execution request
4. **Auto-Population** - From previous node if no explicit inputs

**Variable Substitution:**
- Supports `${variable_name}` syntax
- Resolves from workflow variables
- Used in storage node configurations

### 6. Error Handling

**Node-Level:**
- Node failures don't stop entire execution (configurable)
- Error stored in `NodeState.error`
- Node status set to `FAILED`

**Execution-Level:**
- Execution status set to `FAILED` on critical errors
- Error message stored in `ExecutionState.error`
- Full error details in logs

**Error Propagation:**
- Node errors propagate to execution state
- Failed executions marked in database
- Error details available via API

### 7. Real-Time Updates

**WebSocket Streaming:**
- Node-by-node progress updates
- Log streaming
- Status updates
- Completion notifications

**Update Types:**
- `status` - Execution status changes
- `node_update` - Node state changes
- `log` - Log entries
- `completion` - Execution completion
- `error` - Execution errors

---

## Design Patterns

### 1. Service Layer Pattern
- **ExecutionOrchestrator** - Separates orchestration from API routes
- **ExecutionService** - Handles execution CRUD operations
- Clean separation of concerns

### 2. Factory Pattern
- **AgentRegistry** - Creates agent instances based on node type
- Extensible for new agent types

### 3. Strategy Pattern
- Different agents for different node types
- Unified interface via `BaseAgent`

### 4. Observer Pattern
- WebSocket broadcasts notify clients of execution updates
- Decoupled from execution logic

### 5. Dependency Injection
- Services injected into routes via FastAPI `Depends`
- Easier testing and maintenance

### 6. Repository Pattern
- **ExecutionRepository** - Abstracts database access
- Clean data access layer

---

## Data Structures

### ExecutionState
```python
{
    "execution_id": "exec-123",
    "workflow_id": "workflow-123",
    "status": "running" | "completed" | "failed",
    "current_node": "node-1",
    "node_states": {
        "node-1": {
            "node_id": "node-1",
            "status": "completed",
            "input": {...},
            "output": "...",
            "started_at": "2026-02-23T12:00:00Z",
            "completed_at": "2026-02-23T12:00:05Z"
        }
    },
    "variables": {
        "user_name": "John",
        "task": "Process data"
    },
    "result": "...",
    "error": null,
    "started_at": "2026-02-23T12:00:00Z",
    "completed_at": null,
    "logs": [...]
}
```

### NodeState
```python
{
    "node_id": "node-1",
    "status": "completed",
    "input": {
        "data": "...",
        "source": "previous_node"
    },
    "output": "Result text",
    "error": null,
    "started_at": "2026-02-23T12:00:00Z",
    "completed_at": "2026-02-23T12:00:05Z"
}
```

### WorkflowDefinition
```python
{
    "id": "workflow-123",
    "name": "My Workflow",
    "nodes": [
        {
            "id": "node-1",
            "type": "agent",
            "name": "Agent 1",
            "inputs": [...],
            "data": {...}
        }
    ],
    "edges": [
        {
            "id": "edge-1",
            "source": "node-1",
            "target": "node-2"
        }
    ],
    "variables": {...}
}
```

---

## File Structure

```
backend/
├── api/
│   └── routes/
│       └── execution_routes.py      # API endpoints
├── services/
│   ├── execution_orchestrator.py    # Orchestration layer
│   └── execution_service.py         # Execution CRUD service
├── engine/
│   └── executor_v3.py                # Core execution engine
├── agents/
│   ├── registry.py                   # Agent factory
│   ├── base.py                       # Base agent interface
│   ├── unified_llm_agent.py          # LLM agent implementation
│   ├── condition_agent.py            # Condition agent
│   └── loop_agent.py                # Loop agent
├── websocket/
│   └── manager.py                    # WebSocket connection manager
├── database/
│   └── models.py                     # ExecutionDB model
└── models/
    └── schemas.py                     # ExecutionState, NodeState schemas
```

---

## API Endpoints

### Execute Workflow
```
POST /api/workflows/{workflow_id}/execute
```
- Starts workflow execution
- Returns execution_id immediately
- Execution runs in background

### Get Execution
```
GET /api/executions/{execution_id}
```
- Returns execution status and state
- Includes node states, logs, result

### List Executions
```
GET /api/executions
```
- List executions with filtering
- Supports pagination

### WebSocket Connection
```
WS /api/executions/{execution_id}/stream
```
- Real-time execution updates
- Receives status, node updates, logs

---

## Performance Characteristics

### Execution Time
- **Sequential Nodes**: Sum of individual node execution times
- **Parallel Nodes**: Max of parallel node execution times
- **LLM Calls**: 10-30 seconds per agent node (provider-dependent)

### Scalability
- **Concurrent Executions**: Limited by server resources
- **Background Tasks**: Uses asyncio for non-blocking execution
- **Database**: Async SQLAlchemy for non-blocking I/O

### Optimization Opportunities
- Parallel execution reduces total time for independent nodes
- WebSocket streaming provides immediate feedback
- State persistence enables execution recovery (future)

---

## Error Scenarios

### Node Failure
- Node status set to `FAILED`
- Error stored in `NodeState.error`
- Execution continues (unless critical)

### Execution Failure
- Execution status set to `FAILED`
- Error stored in `ExecutionState.error`
- Full error details in logs

### Workflow Validation Errors
- Invalid workflow definition
- Missing required node configuration
- Circular dependencies

### LLM Configuration Errors
- Missing API keys
- Invalid provider configuration
- Rate limit exceeded

---

## Future Enhancements

### Planned Features
- **Execution Recovery**: Resume failed executions
- **Execution Pausing**: Pause and resume executions
- **Execution Cancellation**: Cancel running executions
- **Execution Scheduling**: Schedule executions
- **Execution Retry**: Automatic retry on failure
- **Execution Queuing**: Queue system for rate limiting

### Performance Improvements
- **Caching**: Cache workflow definitions
- **Connection Pooling**: Optimize database connections
- **Batch Processing**: Batch database updates
- **Streaming**: Stream LLM responses

---

## Related Documentation

- [API Workflow Execution](./API_WORKFLOW_EXECUTION.md) - API endpoint documentation
- [Technical Design](./TECHNICAL_DESIGN.md) - Overall system design
- [Backend Developer Guide](./BACKEND_DEVELOPER_GUIDE.md) - Development guide
- [Architecture](./../ARCHITECTURE.md) - High-level architecture

---

## Version History

- **v3.0** (Current) - Parallel execution, WebSocket streaming, storage nodes
- **v2.0** - Conditional branching, loops
- **v1.0** - Sequential execution, basic agents

---

## Summary

The execution system provides a robust, scalable architecture for running complex workflows with:
- **Parallel execution** for performance
- **Real-time updates** for monitoring
- **Comprehensive error handling** for reliability
- **Extensible design** for new node types
- **State persistence** for recovery

The layered architecture separates concerns and enables maintainability, while the parallel execution algorithm maximizes performance for independent nodes.
