# Quick Start Guide

## Prerequisites

- Python 3.8+
- OpenAI API key

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd cursor-test
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the project root:
   ```bash
   OPENAI_API_KEY=your-api-key-here
   DATABASE_URL=sqlite+aiosqlite:///./workflows.db
   ```

## Running the Application

Start the API server:
```bash
python main.py
```

The server will start at `http://localhost:8000`

- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## Running Examples

### Example 1: Simple Story Writer (2 agents)

In a separate terminal (with venv activated):
```bash
python examples/simple_workflow.py
```

This creates a workflow where:
1. **Writer Agent** writes a short story based on a topic
2. **Editor Agent** edits and improves the story

### Example 2: Research Assistant (3 agents)

```bash
python examples/research_workflow.py
```

This creates a workflow where:
1. **Researcher Agent** gathers information on a topic
2. **Analyzer Agent** identifies key insights
3. **Summarizer Agent** creates a concise summary

## Manual API Testing

### 1. Create a Workflow

```bash
curl -X POST "http://localhost:8000/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "A simple test",
    "nodes": [
      {
        "id": "agent1",
        "type": "agent",
        "name": "Test Agent",
        "agent_config": {
          "model": "gpt-4o-mini",
          "system_prompt": "You are a helpful assistant.",
          "temperature": 0.7
        },
        "inputs": [
          {
            "name": "input",
            "source_field": "user_input"
          }
        ],
        "position": {"x": 100, "y": 100}
      }
    ],
    "edges": [],
    "variables": {}
  }'
```

### 2. Execute a Workflow

Replace `{workflow_id}` with the ID from step 1:

```bash
curl -X POST "http://localhost:8000/api/workflows/{workflow_id}/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "{workflow_id}",
    "inputs": {
      "user_input": "Tell me a joke"
    }
  }'
```

### 3. List All Workflows

```bash
curl "http://localhost:8000/api/workflows"
```

### 4. Get Execution Details

```bash
curl "http://localhost:8000/api/executions/{execution_id}"
```

## Understanding Workflow Structure

### Nodes
- **id**: Unique identifier
- **type**: "agent", "start", or "end"
- **name**: Display name
- **agent_config**: Configuration for LLM
  - **model**: OpenAI model (e.g., "gpt-4o-mini", "gpt-4")
  - **system_prompt**: Instructions for the agent
  - **temperature**: Creativity (0.0-1.0)
  - **max_tokens**: Maximum response length
- **inputs**: Where to get input data from
  - **source_field**: Get from workflow variables
  - **source_node**: Get from another node's output

### Edges
Connect nodes to define execution order:
- **source**: Starting node ID
- **target**: Destination node ID

## Troubleshooting

### "OPENAI_API_KEY environment variable not set"
Make sure you've created a `.env` file with your API key.

### "Connection refused" when running examples
Make sure the API server is running (`python main.py`).

### Slow execution
LLM API calls can take 10-30 seconds each. Multi-agent workflows will take longer.

## Next Steps

- Explore the API documentation at http://localhost:8000/docs
- Modify the example workflows to experiment
- Create your own custom workflows
- Check the `backend/` directory to understand the code structure

## Phase 1 Features

✓ Sequential workflow execution
✓ LLM-powered agents
✓ Node-based workflow definition
✓ Input/output chaining between agents
✓ Execution tracking and logging
✓ REST API for workflow management
✓ Persistent storage (SQLite)

Coming in later phases:
- Visual workflow builder UI
- Conditional branching
- Loops and iterations
- Human-in-the-loop
- Custom tools and integrations
- Real-time execution streaming

