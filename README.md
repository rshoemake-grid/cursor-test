# Agentic Workflow Engine - Phase 3 Complete! 🎉

A complete, enterprise-ready agentic workflow platform with visual builder, real-time monitoring, intelligent agents with memory, tool-calling capabilities, and advanced execution features.

## 🌟 Overview

Build complex multi-agent workflows where AI agents collaborate sequentially to accomplish tasks. Perfect for:
- Content creation pipelines (write, edit, review)
- Research and analysis workflows
- Data processing chains
- Automated decision-making systems

## ✨ Features

### Phase 3 (Current) - LATEST!
- 🚀 **WebSocket Streaming** - Real-time execution monitoring
- 🧠 **Agent Memory** - Short-term and long-term memory with vector storage
- 🛠️ **Tool Calling** - Agents can execute functions and use tools
- 📊 **Enhanced Monitoring** - Live progress updates and detailed logging
- 📈 **Analytics Dashboard** - Execution metrics with interactive charts (success rates, duration trends, status distribution)
- 📥 **Log Management** - Download execution logs (text/JSON), filter and paginate logs
- 🛑 **Execution Control** - Cancel running executions

### Phase 2 (Complete)
- ✨ **Visual Workflow Builder** - Drag-and-drop UI with React Flow
- ✨ **Conditional Branching** - If/else logic with multiple condition types
- ✨ **Loop Support** - For-each, while, and until loops
- ✨ **Parallel Execution** - Independent nodes run simultaneously
- ✨ **Real-time Execution Viewer** - Watch workflows execute live

### Phase 1 (Complete)
- ✅ **Sequential Workflow Execution** - Agents execute in dependency order
- ✅ **LLM-Powered Agents** - Integrated with OpenAI (GPT-4, GPT-4o-mini, etc.)
- ✅ **Node-Based Workflows** - Visual graph representation of agent pipelines
- ✅ **Input/Output Chaining** - Data flows seamlessly between agents
- ✅ **Execution Tracking** - Complete logs and state management
- ✅ **REST API** - Full-featured API with OpenAPI documentation
- ✅ **Persistent Storage** - SQLite database (PostgreSQL-ready)
- ✅ **Async Architecture** - Non-blocking execution for scalability

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** (FastAPI backend) *or* **JDK 17** (Spring Boot backend in `backend-java/`)
- **Node.js 22+** and **pnpm 10+** (see `frontend/package.json` `engines`)
- OpenAI API key (or configure LLMs in Settings after login)

### One-Command Startup (Recommended)

```bash
# Setup (first time only)
pip install -r requirements.txt
cd frontend && pnpm install && cd ..
cp .env.example .env  # Then add your OpenAI API key (optional for some flows)

# Starts Spring Boot (backend-java) + CRA frontend — see start.sh
./start.sh
```

Visit `http://localhost:3000` to use the visual workflow builder!

### Manual Startup

Use **one** backend on port **8000** (Python **or** Java — not both).

#### Terminal 1a: Python API (FastAPI)

From the **repository root**:

```bash
# With venv activated and dependencies installed
python -m backend.main
```

Alternatively:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

API: `http://localhost:8000` · Docs: `http://localhost:8000/docs`

> **Note:** The file `main.py` at the repo root is **not** the API entrypoint. Use `python -m backend.main` (or `uvicorn` as above).

#### Terminal 1b: Java API (Spring Boot)

```bash
cd backend-java
./gradlew bootRun
```

API: `http://localhost:8000` · See [backend-java/README.md](backend-java/README.md) for JDK 17 setup.

#### Terminal 2: Frontend (Create React App)

```bash
cd frontend
pnpm run start:dev
```

This runs `react-scripts` with `BROWSER=none`, `HOST=127.0.0.1`, and `PORT=3000` (see `package.json` script). The app proxies `/api` and `/ws` to `http://localhost:8000` via `src/setupProxy.js`, so **the backend must be running** or login/API calls will fail (e.g. 502/504).

**Plain** `pnpm start` also works; ensure you type `BROWSER=none` with a space before `pnpm` if you set it manually.

Frontend: `http://localhost:3000` (or `http://127.0.0.1:3000`)

### Your First Visual Workflow

1. **Open** `http://localhost:3000`
2. **Drag** nodes from the left panel onto the canvas
3. **Connect** nodes by dragging between the handles (circles)
4. **Configure** nodes by clicking them (right panel)
5. **Save** your workflow (top toolbar)
6. **Execute** and watch it run!

### CLI Examples (Phase 1 Style)

```bash
# Simple 2-agent workflow
python examples/simple_workflow.py

# 3-agent research pipeline
python examples/research_workflow.py

# Conditional branching (NEW!)
python examples/conditional_workflow.py

# Loop-based batch processing (NEW!)
python examples/loop_workflow.py
```

## 📚 Documentation

### Quick Links
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Step-by-step guide for beginners
- **[PHASE3.md](PHASE3.md)** - Phase 3 features: WebSockets, Memory, Tools (NEW!)
- **[PHASE2.md](PHASE2.md)** - Visual builder and advanced control flow
- **[QUICKSTART.md](QUICKSTART.md)** - Detailed setup and CLI usage
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[docs/EXECUTION_SYSTEM_ARCHITECTURE.md](docs/EXECUTION_SYSTEM_ARCHITECTURE.md)** - Detailed execution system architecture
- **[docs/CONFIGURATION_REFERENCE.md](docs/CONFIGURATION_REFERENCE.md)** - Complete configuration guide (NEW!)
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions (NEW!)
- **[docs/NODE_TYPES_REFERENCE.md](docs/NODE_TYPES_REFERENCE.md)** - Complete node types reference (NEW!)
- **[WORKFLOW_EXAMPLES.md](WORKFLOW_EXAMPLES.md)** - Pattern library and use cases
- **[frontend/README.md](frontend/README.md)** - Frontend development guide

### Interactive Docs
- **Visual Builder** - http://localhost:3000 (when frontend is running)
- **API Docs** - http://localhost:8000/docs (when backend is running)

## 🎯 Example Workflows

### Phase 3 Examples (LATEST!)

#### Complete Phase 3 Demo
```bash
python examples/phase3_demo.py
```
Demonstrates WebSocket streaming, memory, and tool calling

### Phase 2 Examples

#### Conditional Branching
```bash
python examples/conditional_workflow.py
```
Analyzes sentiment → Routes to positive/negative responder

#### Loop Processing
```bash
python examples/loop_workflow.py
```
Processes multiple topics → Combines results

### Phase 1 Examples

#### Simple Story Writer (2 agents)
```bash
python examples/simple_workflow.py
```
Writer → Editor → Polished Story

#### Research Assistant (3 agents)
```bash
python examples/research_workflow.py
```
Researcher → Analyzer → Summarizer → Final Report

## 🏗️ Project Structure

```
cursor-test/
├── main.py                    # Legacy stub (use python -m backend.main for the API)
├── requirements.txt           # Dependencies
├── verify_setup.py           # Setup verification
├── test_api.py               # API tests
│
├── backend/
│   ├── models/               # Pydantic schemas & types
│   ├── database/             # SQLAlchemy ORM & connection
│   ├── engine/               # Workflow execution engine
│   ├── agents/               # Agent implementations
│   └── api/                  # FastAPI routes
│
└── examples/
    ├── simple_workflow.py    # 2-agent example
    └── research_workflow.py  # 3-agent example
```

## 🔧 Testing

```bash
# Test API connectivity (server must be running)
python test_api.py

# Manual API testing
curl http://localhost:8000/health
```

## 📖 API Overview

### Workflows
- `POST /api/workflows` - Create a workflow
- `GET /api/workflows` - List all workflows
- `GET /api/workflows/{id}` - Get workflow details
- `DELETE /api/workflows/{id}` - Delete a workflow

### Execution
- `POST /api/workflows/{id}/execute` - Execute a workflow
- `GET /api/executions/{id}` - Get execution details

## 🎨 Workflow Concepts

A workflow consists of **Nodes** (agents) connected by **Edges**:

```
[Start] → [Agent 1] → [Agent 2] → [Agent 3] → [End]
           ↓           ↓           ↓
        Research    Analysis    Summary
```

Each agent:
- Receives input from previous agents or workflow variables
- Processes with an LLM (configurable model, temperature, prompts)
- Produces output for the next agent

## 🔮 Roadmap

- ✅ **Phase 1**: Core engine, sequential execution, REST API
- ✅ **Phase 2**: Visual builder, conditionals, loops, parallel execution
- ✅ **Phase 3**: WebSockets, agent memory, tool calling
- 📋 **Phase 4**: Templates, collaboration, advanced debugging
- 📋 **Phase 5**: Enterprise (SSO, RBAC, audit logs, governance)

## 🤝 Contributing

This is Phase 1 of a multi-phase project. The architecture is designed for extensibility:

- Add new agent types by extending `BaseAgent`
- Support new LLM providers in the agent layer
- Implement custom node types via the registry pattern

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [SQLAlchemy](https://www.sqlalchemy.org/) - SQL toolkit and ORM
- [Pydantic](https://pydantic-docs.helpmanual.io/) - Data validation
- [OpenAI](https://openai.com/) - LLM API

---

**Ready to build? Start with:** `python verify_setup.py`

