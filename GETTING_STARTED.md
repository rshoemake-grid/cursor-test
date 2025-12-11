# Getting Started with Agentic Workflow Engine

Welcome! This guide will get you from zero to running your first agentic workflow in **5 minutes**.

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Python 3.8 or higher** installed
   ```bash
   python --version  # Should be 3.8+
   ```

2. **An OpenAI API key**
   - Get one at: https://platform.openai.com/api-keys
   - You'll need billing enabled (very cheap for testing)

3. **Basic terminal/command line knowledge**

## 🚀 5-Minute Quick Start

### Step 1: Install Dependencies (1 minute)

```bash
# Navigate to the project directory
cd cursor-test

# Install required packages
pip install -r requirements.txt
```

### Step 2: Configure Environment (1 minute)

Create a `.env` file in the project root:

```bash
echo "OPENAI_API_KEY=your-actual-api-key-here" > .env
echo "DATABASE_URL=sqlite+aiosqlite:///./workflows.db" >> .env
```

**Important:** Replace `your-actual-api-key-here` with your real OpenAI API key!

### Step 3: Verify Setup (1 minute)

```bash
python verify_setup.py
```

You should see all green checkmarks ✓. If not, fix any issues before continuing.

### Step 4: Start the Server (1 minute)

```bash
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
Database initialized
```

**Keep this terminal running!**

### Step 5: Run Your First Workflow (1 minute)

Open a **new terminal** and run:

```bash
python examples/simple_workflow.py
```

🎉 **Congratulations!** You just ran a 2-agent workflow that:
1. Wrote a creative story about "a robot learning to paint"
2. Edited and improved the story

## 📖 What Just Happened?

Let's break down what the example did:

### 1. Created a Workflow
```python
{
  "name": "Story Writer and Editor",
  "nodes": [
    {"id": "writer", "type": "agent", ...},
    {"id": "editor", "type": "agent", ...}
  ],
  "edges": [
    {"source": "writer", "target": "editor"}
  ]
}
```

This defines two agents connected in sequence.

### 2. Executed the Workflow
```python
execution_request = {
  "workflow_id": workflow_id,
  "inputs": {
    "topic": "a robot learning to paint"
  }
}
```

The engine:
1. Sent the topic to the Writer agent
2. Writer agent generated a story
3. Editor agent received the story
4. Editor agent improved it
5. Returned the final result

### 3. Tracked Everything
The execution state included:
- Status of each agent
- Input/output for each step
- Timestamps
- Complete logs
- Final result

## 🎯 Next Steps

### Try the Research Example

This one has 3 agents working together:

```bash
python examples/research_workflow.py
```

The workflow: **Researcher → Analyzer → Summarizer**

### Explore the API

Visit http://localhost:8000/docs in your browser to see:
- Interactive API documentation
- All available endpoints
- Try making API calls directly

### Create Your Own Workflow

Here's a template to get started:

```python
import asyncio
import httpx

async def create_my_workflow():
    workflow = {
        "name": "My Custom Workflow",
        "description": "What this workflow does",
        "nodes": [
            {
                "id": "my_agent",
                "type": "agent",
                "name": "My Agent",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are a helpful assistant that...",
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
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/workflows",
            json=workflow
        )
        return response.json()

async def execute_my_workflow(workflow_id):
    execution_request = {
        "workflow_id": workflow_id,
        "inputs": {
            "user_input": "Your input here"
        }
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"http://localhost:8000/api/workflows/{workflow_id}/execute",
            json=execution_request
        )
        return response.json()

async def main():
    # Create workflow
    workflow = await create_my_workflow()
    print(f"Created workflow: {workflow['id']}")
    
    # Execute it
    result = await execute_my_workflow(workflow['id'])
    print(f"Result: {result['result']}")

if __name__ == "__main__":
    asyncio.run(main())
```

Save this as `my_workflow.py` and run it!

## 🎓 Learning Path

### Beginner
1. ✅ Run the provided examples
2. Read **WORKFLOW_EXAMPLES.md** for patterns
3. Modify example workflows
4. Create a single-agent workflow

### Intermediate
1. Create multi-agent workflows
2. Experiment with different models
3. Adjust temperature and prompts
4. Chain 4-5 agents together
5. Build a content creation pipeline

### Advanced
1. Read **ARCHITECTURE.md** to understand internals
2. Extend the agent system
3. Add custom node types
4. Integrate with other APIs
5. Build complex domain-specific workflows

## 📚 Key Concepts

### Workflows
A workflow is a graph of connected agents that process data sequentially.

### Nodes
Nodes represent individual agents or processing steps. Each node:
- Has a unique ID
- Has a type (agent, start, end)
- Receives inputs
- Produces outputs
- Is configured with an LLM model and prompt

### Edges
Edges connect nodes and define the data flow direction.

### Execution
When you execute a workflow:
1. The engine determines the order (topological sort)
2. Each agent runs in sequence
3. Outputs flow to the next agent
4. The final result is returned

### Agents
Agents are LLM-powered processing units that:
- Receive structured inputs
- Process with GPT models
- Return outputs for the next agent

## 🛠️ Useful Commands

### Using run.sh

```bash
# Verify setup
./run.sh verify

# Install dependencies
./run.sh install

# Start server
./run.sh server

# Run API tests
./run.sh test

# Run examples
./run.sh example-simple
./run.sh example-research

# Clean up
./run.sh clean

# Show help
./run.sh help
```

### Manual Commands

```bash
# Start server
python main.py

# Verify setup
python verify_setup.py

# Test API
python test_api.py

# Run examples
python examples/simple_workflow.py
python examples/research_workflow.py
```

## 🐛 Troubleshooting

### "OPENAI_API_KEY environment variable not set"

**Problem:** The `.env` file doesn't exist or doesn't have your API key.

**Solution:**
```bash
echo "OPENAI_API_KEY=sk-your-actual-key" > .env
```

### "Connection refused" when running examples

**Problem:** The server isn't running.

**Solution:** 
- Make sure `python main.py` is running in another terminal
- Check that it's on port 8000

### "Module not found" errors

**Problem:** Dependencies not installed.

**Solution:**
```bash
pip install -r requirements.txt
```

### Examples are slow

**Expected behavior!** Each LLM API call takes 10-30 seconds. Multi-agent workflows multiply this time.

### OpenAI API errors

**Problem:** Invalid API key or billing not enabled.

**Solution:**
- Verify your API key at https://platform.openai.com/api-keys
- Check that billing is enabled
- Ensure you have credits/payment method

## 💡 Tips & Best Practices

### 1. Start Simple
Begin with single-agent workflows before building complex multi-agent systems.

### 2. Iterate on Prompts
The system prompt is crucial. Try different variations to get better results.

### 3. Use Appropriate Models
- `gpt-4o-mini`: Fast and cheap, good for most tasks
- `gpt-4o` or `gpt-4`: Better quality, slower, more expensive

### 4. Control Creativity with Temperature
- Low (0.1-0.3): Focused, deterministic
- Medium (0.4-0.6): Balanced
- High (0.7-1.0): Creative, varied

### 5. Monitor Execution Logs
Check the logs to understand what each agent is doing and debug issues.

### 6. Set max_tokens
Limit response length to control costs and execution time.

## 🎨 Example Use Cases

### Content Creation
- Blog post writer → editor → SEO optimizer
- Social media post generator
- Email response system

### Research & Analysis
- Research → analysis → summary
- Competitive analysis pipeline
- Literature review system

### Data Processing
- Classify → analyze sentiment → extract insights
- Document processing pipeline
- Customer feedback analyzer

### Development
- Code review assistant
- Documentation generator
- Test case creator

## 📊 Understanding Costs

OpenAI API pricing (approximate):
- **GPT-4o-mini**: ~$0.01 per 1000 tokens
- **GPT-4o**: ~$0.05 per 1000 tokens
- **GPT-4**: ~$0.10 per 1000 tokens

A typical agent call uses 200-500 tokens, so:
- Single agent: < $0.01
- 3-agent workflow: ~$0.02-0.05

Very affordable for testing and small-scale use!

## 🔗 Important Links

- **API Documentation**: http://localhost:8000/docs (when running)
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **OpenAI Pricing**: https://openai.com/api/pricing/

## 📖 Documentation Files

- **README.md** - Project overview
- **GETTING_STARTED.md** - This file
- **QUICKSTART.md** - Detailed setup guide
- **ARCHITECTURE.md** - Technical architecture
- **WORKFLOW_EXAMPLES.md** - Pattern library
- **PROJECT_SUMMARY.md** - Complete project summary

## ✅ Checklist

Before you start building:

- [ ] Python 3.8+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file created with OpenAI API key
- [ ] Setup verified (`python verify_setup.py`)
- [ ] Server running (`python main.py`)
- [ ] First example run successfully
- [ ] API documentation viewed (http://localhost:8000/docs)

## 🎉 You're Ready!

You now have everything you need to start building amazing agentic workflows!

**What to do next:**
1. Run both examples to see different patterns
2. Read WORKFLOW_EXAMPLES.md for ideas
3. Create your first custom workflow
4. Experiment and have fun!

**Need help?** Check the documentation files or review the example code.

**Happy building! 🚀**

