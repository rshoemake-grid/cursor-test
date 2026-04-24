# Agentic Workflow Engine - Phase 3 Complete! 🎉

A complete, enterprise-ready agentic workflow platform with visual builder, real-time monitoring, intelligent agents with memory, tool-calling capabilities, and advanced execution features.

## 🔐 Sign-in and browsing

- **Without an account session**, the app still supports the **Marketplace** (templates). **Your saved workflows** (`GET /api/workflows`) are empty until you **sign in**; the builder uses a local draft tab only.
- **Workflow assistant (chat)** supports an optional **iteration limit** per message (UI default **20**); see [docs/API_REFERENCE.md](docs/API_REFERENCE.md#workflow-chat).
- **Local dev login:** Prefer `REACT_APP_API_BASE_URL` **unset** in `frontend/.env.development` so the UI talks to **`/api`** through the dev proxy. Optional **`DEV_BOOTSTRAP_USERNAME`** / **`DEV_BOOTSTRAP_PASSWORD`** in root `.env` create or reset a dev user on API startup — see [docs/CONFIGURATION_REFERENCE.md](docs/CONFIGURATION_REFERENCE.md#development-user-bootstrap-optional).

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
- JDK 17+ and Java on `PATH` (for the Spring Boot API)
- Node.js 18+ and npm
- OpenAI API key (optional for some features; can also configure in the UI)

### One-Command Startup (Recommended)

```bash
# Setup (first time only)
cd frontend && npm install && cd ..
cp .env.example .env  # Then add your OpenAI API key (and optional dev bootstrap vars)

# Start both backend and frontend (Java API + CRA)
./start.sh
```

Visit `http://localhost:3000` to use the visual workflow builder!

### Manual Startup

#### Terminal 1: Backend
```bash
cd backend-java
./gradlew bootRun
```
Backend runs at `http://localhost:8000` (OpenAPI UI: `/swagger-ui.html`). The API is **Spring Boot** in `backend-java/`.

#### Terminal 2: Frontend
```bash
cd frontend
npm start
```
Frontend runs at `http://localhost:3000` (CRA dev server; API defaults to proxied `/api`).

### Your First Visual Workflow

1. **Open** `http://localhost:3000`
2. **Drag** nodes from the left panel onto the canvas
3. **Connect** nodes by dragging between the handles (circles)
4. **Configure** nodes by clicking them (right panel)
5. **Save** your workflow (top toolbar)
6. **Execute** and watch it run!

### Automation

Drive workflows from the UI or call the **Java REST API** directly (see [docs/API_REFERENCE.md](docs/API_REFERENCE.md)).

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

## 🎯 Example workflows

Use the in-app templates and marketplace, or import JSON through the API. Historical Python `examples/` scripts are no longer in this repository.

## 🏗️ Project Structure

```
cursor-test/
├── requirements.txt           # Minimal Python deps (pytest for scripts/ only)
├── scripts/                   # Small Python utilities + their tests
├── backend-java/              # Spring Boot API (port 8000)
├── frontend/                  # Create React App UI (React 18, styled-components, Redux)
│   └── README.md              # Frontend stack, proxy, styling, build output
└── ...
```

## 🔧 Testing

```bash
# Python utilities under scripts/
python3 -m pytest scripts/ -q

# Java API unit tests
cd backend-java && ./gradlew test

# Manual API check (server running)
curl -sf http://localhost:8000/health
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

This is a multi-phase project. The architecture is designed for extensibility:

- Add node types and editors in **frontend** + corresponding execution logic in **backend-java**
- Extend LLM provider handling in the Java services and user Settings
- Keep API contracts stable where possible (see OpenAPI)

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Spring Boot](https://spring.io/projects/spring-boot) — API and WebSockets
- [OpenAI](https://openai.com/) — LLM API (and other providers in-app)
- [React](https://react.dev/) + [Create React App](https://create-react-app.dev/) — Visual builder UI
- [styled-components](https://styled-components.com/) — Component styling (see `frontend/README.md`)

---

**Ready to build?** Follow [GETTING_STARTED.md](GETTING_STARTED.md) and run `./start.sh` or `backend-java/./gradlew bootRun` plus `frontend/npm start`.

