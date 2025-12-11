# Phase 3: WebSockets, Memory, and Tool Calling 🚀

## 🎉 What's New in Phase 3

Phase 3 adds advanced capabilities for real-time monitoring, intelligent agents with memory, and tool-calling functionality:

### ✨ Major Features

#### 1. **WebSocket Real-time Streaming** (NEW!)
- 🔴 Live execution updates pushed to clients
- 📊 Real-time node progress tracking
- 📝 Streaming log entries as they occur
- ⚡ Instant status notifications
- 🎯 Per-execution WebSocket channels

#### 2. **Agent Memory System** (NEW!)
- 🧠 **Short-term memory**: Recent conversation history
- 📚 **Long-term memory**: Vector-based semantic storage
- 🔍 **Context retrieval**: Relevant information recall
- 💾 **Persistent storage**: ChromaDB integration
- 🎯 **Memory-enhanced prompts**: Context-aware responses

#### 3. **Tool Calling Framework** (NEW!)
- 🛠️ **Function execution**: Agents can call tools
- 📦 **Built-in tools**: Calculator, web search, Python executor, file reader
- 🔌 **Extensible**: Easy to add custom tools
- 🤖 **OpenAI function calling**: Native integration
- 🎯 **Multi-step reasoning**: Tool calls in sequence

#### 4. **Enhanced Features**
- 📈 Better performance with streaming
- 🎭 More intelligent agents
- 🔍 Context-aware processing
- 📊 Richer execution monitoring

## 🏗️ Architecture Updates

### New Components

```
backend/
├── websocket/
│   ├── __init__.py
│   └── manager.py              # WebSocket connection management
├── memory/
│   ├── __init__.py
│   └── memory_manager.py       # Short & long-term memory
├── tools/
│   ├── __init__.py
│   ├── base.py                 # Tool base class
│   ├── registry.py             # Tool registry
│   └── builtin_tools.py        # Built-in tools
├── engine/
│   └── executor_v3.py          # WebSocket-enabled executor
└── agents/
    └── llm_agent_v2.py         # Memory & tool-enabled agent
```

## 🚀 Getting Started

### Installation

Phase 3 requires additional dependencies:

```bash
# Update dependencies
pip install -r requirements.txt

# New dependencies added:
# - websockets (WebSocket support)
# - chromadb (Vector memory)
```

### Running with Phase 3 Features

The application automatically uses Phase 3 features when you start it:

```bash
# Start backend (now with WebSocket support)
python main.py

# Start frontend
cd frontend && npm run dev
```

## 🎯 New Features Guide

### 1. WebSocket Real-time Streaming

#### Backend Implementation

The executor now broadcasts updates via WebSocket:

```python
# Automatic in WorkflowExecutorV3
executor = WorkflowExecutorV3(workflow, stream_updates=True)
execution_state = await executor.execute(inputs)

# Updates are automatically broadcast:
# - Execution started
# - Node started/completed
# - Log entries
# - Execution completed/failed
```

#### WebSocket Endpoint

```
ws://localhost:8000/api/ws/executions/{execution_id}
```

#### Message Types

```python
# Status update
{
    "type": "status",
    "execution_id": "...",
    "status": "running",
    "data": {...}
}

# Node update
{
    "type": "node_update",
    "execution_id": "...",
    "node_id": "agent1",
    "node_state": {...}
}

# Log entry
{
    "type": "log",
    "execution_id": "...",
    "log": {"level": "INFO", "message": "..."}
}

# Completion
{
    "type": "completion",
    "execution_id": "...",
    "result": {...}
}
```

### 2. Agent Memory System

#### Short-term Memory (Conversation)

```python
from backend.memory import MemoryManager

# Create memory for an agent
memory = MemoryManager(agent_id="agent1")

# Add conversation
memory.add_interaction(
    user_message="What is Python?",
    assistant_message="Python is a programming language...",
    save_to_longterm=True
)

# Get recent context
context = memory.conversation.get_context_string(limit=5)
```

#### Long-term Memory (Vector Store)

```python
# Add facts to long-term memory
memory.add_fact(
    "Python was created by Guido van Rossum",
    metadata={"topic": "python", "type": "history"}
)

# Recall relevant information
relevant = memory.recall("Who created Python?", n_results=3)
# Returns: ["Python was created by Guido van Rossum", ...]
```

#### Using Memory in Agents

```python
from backend.agents.llm_agent_v2 import LLMAgentV2

# Agent automatically uses memory
agent = LLMAgentV2(node, use_memory=True)
result = await agent.execute({"query": "..."})

# Memory context is automatically added to prompts
```

### 3. Tool Calling

#### Built-in Tools

**Calculator**
```python
tool = ToolRegistry.get_tool("calculator")
result = await tool.execute(expression="2 + 2 * 3")
# Returns: {"result": 8, "expression": "2 + 2 * 3"}
```

**Python Executor**
```python
tool = ToolRegistry.get_tool("python_executor")
result = await tool.execute(code="result = sum([1, 2, 3, 4, 5])")
# Returns: {"result": 15, "code": "...", "output": [...]}
```

**Web Search (Placeholder)**
```python
tool = ToolRegistry.get_tool("web_search")
result = await tool.execute(query="Python programming", num_results=5)
# Returns search results (placeholder in demo)
```

**File Reader**
```python
tool = ToolRegistry.get_tool("file_reader")
result = await tool.execute(file_path="example.txt", max_lines=100)
# Returns: {"content": "...", "lines_read": 50}
```

#### Using Tools in Agents

```python
# Create node with tools
node = Node(
    id="agent1",
    type="agent",
    agent_config=AgentConfig(
        model="gpt-4o",
        tools=["calculator", "python_executor"],  # Enable tools
    )
)

# Agent will automatically use tools when needed
agent = LLMAgentV2(node, use_tools=True)
result = await agent.execute({"query": "What is 15 * 23 + 17?"})

# Agent calls calculator tool and returns result
```

#### Creating Custom Tools

```python
from backend.tools import BaseTool, ToolParameter

class CustomTool(BaseTool):
    @property
    def name(self) -> str:
        return "custom_tool"
    
    @property
    def description(self) -> str:
        return "Description of what the tool does"
    
    @property
    def parameters(self):
        return [
            ToolParameter(
                name="param1",
                type="string",
                description="Parameter description",
                required=True
            )
        ]
    
    async def execute(self, param1: str):
        # Tool logic here
        return {"result": f"Processed: {param1}"}

# Register the tool
ToolRegistry.register_tool(CustomTool)
```

## 📊 Performance & Benefits

### WebSocket Streaming Benefits

| Without WebSockets | With WebSockets |
|-------------------|----------------|
| Poll for updates | Push updates instantly |
| Delayed feedback | Real-time progress |
| Higher latency | Lower latency |
| More API calls | Fewer API calls |

### Memory Benefits

| Without Memory | With Memory |
|---------------|-------------|
| No context retention | Full conversation history |
| Repetitive questions | Context-aware responses |
| No learning | Facts retention |
| Generic answers | Personalized responses |

### Tool Calling Benefits

| Without Tools | With Tools |
|--------------|-----------|
| Text-only responses | Can perform actions |
| No calculations | Math operations |
| No code execution | Run Python code |
| Limited capabilities | Extended functionality |

## 🎓 Usage Examples

### Example 1: Real-time Workflow Monitor

```python
import asyncio
import websockets
import json

async def watch_execution(execution_id):
    uri = f"ws://localhost:8000/api/ws/executions/{execution_id}"
    
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            
            if data["type"] == "node_update":
                print(f"Node {data['node_id']}: {data['node_state']['status']}")
            
            elif data["type"] == "log":
                print(f"LOG: {data['log']['message']}")
            
            elif data["type"] == "completion":
                print(f"Completed: {data['result']}")
                break

# Use it
asyncio.run(watch_execution("execution-id"))
```

### Example 2: Memory-Enhanced Agent

```python
# Agent remembers context across interactions
memory_agent = LLMAgentV2(node, use_memory=True)

# First interaction
await memory_agent.execute({"query": "My favorite color is blue"})

# Later interaction - agent remembers
result = await memory_agent.execute({"query": "What's my favorite color?"})
# Returns: "Your favorite color is blue"
```

### Example 3: Tool-Using Agent

```python
# Agent can use tools to solve problems
tool_agent = LLMAgentV2(node, use_tools=True)

result = await tool_agent.execute({
    "query": "Calculate the sum of squares of numbers from 1 to 10"
})

# Agent:
# 1. Recognizes need for calculation
# 2. Calls python_executor tool
# 3. Returns: "The sum is 385"
```

## 🔧 Configuration

### Enable/Disable Features

```python
# WebSocket streaming (enabled by default)
executor = WorkflowExecutorV3(workflow, stream_updates=True)

# Memory (opt-in per agent)
agent = LLMAgentV2(node, use_memory=True)

# Tools (opt-in per agent)
agent = LLMAgentV2(node, use_tools=True)

# Both memory and tools
agent = LLMAgentV2(node, use_memory=True, use_tools=True)
```

### Memory Configuration

```python
memory = MemoryManager(
    agent_id="agent1",
    max_conversation_messages=10,  # Short-term memory size
    use_vector_memory=True  # Enable long-term memory
)
```

### Tool Configuration

```python
# Specify which tools an agent can use
agent_config = AgentConfig(
    model="gpt-4o",
    tools=["calculator", "python_executor", "web_search"]
)
```

## 📈 What This Enables

### Advanced Workflows

**Multi-step Research with Tools**
```
Query → Researcher (uses web_search) → 
Analyzer (uses python_executor for stats) → 
Reporter → Final Report
```

**Context-Aware Conversation**
```
User asks question → Agent recalls relevant context →
Agent provides personalized answer →
Saves to memory for future reference
```

**Real-time Monitoring**
```
Start workflow → WebSocket connection →
Watch each node execute live →
See logs in real-time →
Get immediate completion notification
```

## 🐛 Troubleshooting

### WebSocket Connection Issues
```bash
# Check WebSocket endpoint
wscat -c ws://localhost:8000/api/ws/executions/test-id

# Verify backend is running
curl http://localhost:8000/health
```

### Memory/ChromaDB Issues
```bash
# ChromaDB is embedded, no separate install needed
# Data stored in local directory

# Clear memory if needed
memory.clear_all()
```

### Tool Execution Issues
```bash
# Tools run in sandboxed environment
# Check tool registry
python -c "from backend.tools import ToolRegistry; print(ToolRegistry._tools.keys())"
```

## 📚 API Reference

### WebSocket API

**Connect**
```
WS /api/ws/executions/{execution_id}
```

**Message Types**
- `status`: Execution status change
- `node_update`: Node state change
- `log`: New log entry
- `completion`: Execution finished
- `error`: Execution error

### Memory API

```python
# MemoryManager
memory = MemoryManager(agent_id, max_conversation_messages, use_vector_memory)
memory.add_interaction(user_msg, assistant_msg, metadata, save_to_longterm)
memory.add_fact(fact, metadata)
memory.recall(query, n_results)
memory.get_context_for_prompt(query)
memory.clear_conversation()
memory.clear_all()
```

### Tool API

```python
# ToolRegistry
ToolRegistry.register_tool(ToolClass)
ToolRegistry.get_tool(name)
ToolRegistry.get_all_tools()
ToolRegistry.get_tool_definitions(names)
ToolRegistry.execute_tool(name, **kwargs)
```

## 🎯 Migration from Phase 2

Phase 3 is **backward compatible**. Existing workflows continue to work:

```python
# Phase 2 executor still works
from backend.engine.executor_v2 import WorkflowExecutorV2
executor = WorkflowExecutorV2(workflow)

# Phase 3 adds features, doesn't break existing
from backend.engine.executor_v3 import WorkflowExecutorV3
executor = WorkflowExecutorV3(workflow, stream_updates=True)
```

## 🔮 Coming in Future Updates

- **Agent Collaboration**: Agents working together
- **Workflow Templates**: Pre-built workflow patterns
- **Advanced Debugging**: Breakpoints, step-through
- **Enhanced UI**: Real-time updates in visual builder
- **More Tools**: Integration with external APIs
- **Multi-agent Orchestration**: Complex agent interactions

## ✅ Phase 3 Checklist

Verify Phase 3 is working:

- [ ] WebSocket endpoint accessible
- [ ] Executor sends real-time updates
- [ ] Memory stores and retrieves context
- [ ] Tools execute successfully
- [ ] Agents can use memory
- [ ] Agents can call tools
- [ ] All Phase 1 & 2 features still work

## 📖 Documentation Files

- **PHASE3.md** - This file
- **README.md** - Project overview (updated)
- **PHASE2.md** - Phase 2 guide
- **ARCHITECTURE.md** - System architecture

---

**Phase 3 adds powerful new capabilities while maintaining backward compatibility!** 🚀

Ready to build intelligent, real-time agentic workflows!

