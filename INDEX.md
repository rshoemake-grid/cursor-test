# Project Index - Agentic Workflow Engine

Quick reference guide to all files in the project.

## 📖 Documentation Files (Read First!)

| File | Purpose | Read When |
|------|---------|-----------|
| **README.md** | Project overview, features, quick links | Start here |
| **GETTING_STARTED.md** | Step-by-step guide from installation to first workflow | Setting up for the first time |
| **QUICKSTART.md** | Detailed setup, API usage, troubleshooting | Need detailed instructions |
| **ARCHITECTURE.md** | System design, technical decisions, extensibility | Understanding how it works |
| **WORKFLOW_EXAMPLES.md** | Pattern library, use cases, templates | Building your own workflows |
| **INDEX.md** | This file - navigation guide | Finding specific files |

## 🔧 Application Code

### Entry Point
| File | Purpose |
|------|---------|
| `main.py` | FastAPI application, startup, routes |

### Backend Modules

#### Models (`backend/models/`)
| File | Purpose |
|------|---------|
| `schemas.py` | Pydantic models, enums, request/response schemas |

#### Database (`backend/database/`)
| File | Purpose |
|------|---------|
| `db.py` | Database connection, session management |
| `models.py` | SQLAlchemy ORM models |

#### Engine (`backend/engine/`)
| File | Purpose |
|------|---------|
| `executor_v3.py` | Workflow execution engine with parallel execution, WebSocket streaming |
| `legacy/executor.py` | Legacy executor (sequential only) |

#### Agents (`backend/agents/`)
| File | Purpose |
|------|---------|
| `base.py` | Abstract base agent class |
| `llm_agent.py` | OpenAI integration, LLM execution |
| `registry.py` | Agent factory, type registration |

#### API (`backend/api/`)
| File | Purpose |
|------|---------|
| `routes.py` | REST API endpoints, workflow CRUD, execution |

## 🎯 Examples & Tests

### Examples (`examples/`)
| File | Purpose | Agents | Duration |
|------|---------|--------|----------|
| `simple_workflow.py` | Story writer/editor | 2 | ~30-60s |
| `research_workflow.py` | Research pipeline | 3 | ~60-90s |

### Testing & Verification
| File | Purpose |
|------|---------|
| `verify_setup.py` | Check Python, dependencies, environment, files |
| `test_api.py` | Test API endpoints without executing workflows |

## 🛠️ Configuration & Scripts

| File | Purpose |
|------|---------|
| `requirements.txt` | Python dependencies |
| `.env` | Environment variables (create this!) |
| `.gitignore` | Git ignore patterns |
| `run.sh` | Convenience script for common commands |

## 📊 File Statistics

```
Application Code:
├── Backend modules:     11 files
├── Main application:    1 file
└── Total Python code:   ~850 lines

Examples & Tests:
├── Examples:            2 files (~300 lines)
├── Test scripts:        2 files (~430 lines)
└── Shell script:        1 file

Documentation:
├── User docs:           7 files
└── Total docs:          ~2,300 lines

Configuration:
└── Config files:        3 files

TOTAL: 27 files
```

## 🚀 Common Tasks → Files to Use

### I Want To...

#### Get Started
1. Read **README.md** (overview)
2. Follow **GETTING_STARTED.md** (setup)
3. Run `examples/simple_workflow.py` (see it work)

#### Understand the System
1. Read **ARCHITECTURE.md** (high-level design)
2. Read **docs/EXECUTION_SYSTEM_ARCHITECTURE.md** (detailed execution system)
3. Review `backend/engine/executor_v3.py` (execution logic)
4. Check `backend/agents/unified_llm_agent.py` (LLM integration)

#### Build a Workflow
1. Read **WORKFLOW_EXAMPLES.md** (patterns)
2. Copy from `examples/simple_workflow.py` (template)
3. Reference `backend/models/schemas.py` (data structures)

#### Extend the System
1. Read **ARCHITECTURE.md** > Extensibility Points
2. Check `backend/agents/base.py` (agent interface)
3. Review `backend/agents/registry.py` (registration)

#### Debug Issues
1. Run `verify_setup.py` (check environment)
2. Run `test_api.py` (test connectivity)
3. Check execution logs in API response
4. Review **QUICKSTART.md** > Troubleshooting

#### Learn the API
1. Start server: `python main.py`
2. Visit http://localhost:8000/docs
3. Reference `backend/api/routes.py` (implementation)

## 📁 Directory Structure

```
cursor-test/
│
├── 📖 Documentation (7 files)
│   ├── README.md                    ← Start here
│   ├── GETTING_STARTED.md          ← Setup guide
│   ├── QUICKSTART.md               ← Detailed instructions
│   ├── ARCHITECTURE.md             ← Technical design
│   ├── WORKFLOW_EXAMPLES.md        ← Pattern library
│   ├── PROJECT_SUMMARY.md          ← Complete overview
│   └── INDEX.md                    ← This file
│
├── 🔧 Application (12 files)
│   ├── main.py                     ← Entry point
│   └── backend/
│       ├── models/schemas.py       ← Data structures
│       ├── database/
│       │   ├── db.py              ← Connection
│       │   └── models.py          ← ORM models
│       ├── engine/executor_v3.py   ← Execution engine (parallel, WebSocket)
│       ├── services/execution_orchestrator.py ← Execution orchestration
│       ├── agents/
│       │   ├── base.py            ← Agent interface
│       │   ├── llm_agent.py       ← OpenAI integration
│       │   └── registry.py        ← Agent factory
│       └── api/routes.py           ← REST endpoints
│
├── 🎯 Examples & Tests (5 files)
│   ├── examples/
│   │   ├── simple_workflow.py     ← 2-agent example
│   │   └── research_workflow.py   ← 3-agent example
│   ├── verify_setup.py            ← Setup checker
│   ├── test_api.py                ← API tests
│   └── run.sh                     ← Helper script
│
└── ⚙️ Configuration (3 files)
    ├── requirements.txt           ← Dependencies
    ├── .gitignore                 ← Git ignore
    └── .env                       ← Create this!
```

## 🎯 Quick Command Reference

```bash
# Setup
pip install -r requirements.txt
python verify_setup.py

# Run
python main.py                      # Start server
python examples/simple_workflow.py  # Run example
python test_api.py                 # Test API

# Or use the helper script
./run.sh verify                    # Verify setup
./run.sh server                    # Start server
./run.sh example-simple           # Run simple example
./run.sh test                      # Run tests
```

## 📚 Reading Order

### For Users (Want to Build Workflows)
1. README.md
2. GETTING_STARTED.md
3. Run examples
4. WORKFLOW_EXAMPLES.md
5. Build your workflow

### For Developers (Want to Extend)
1. README.md
2. ARCHITECTURE.md
3. Review backend/ code
4. PROJECT_SUMMARY.md
5. Implement extensions

### For Evaluators (Want to Understand)
1. PROJECT_SUMMARY.md (big picture)
2. ARCHITECTURE.md (design)
3. Review code files
4. Run examples
5. Check documentation quality

## 🔍 Find By Topic

### Authentication & Security
- Architecture considerations: **ARCHITECTURE.md** > Security
- Current implementation: `backend/api/routes.py`

### Database & Persistence
- Design: **ARCHITECTURE.md** > Database Layer
- Connection: `backend/database/db.py`
- Models: `backend/database/models.py`

### Workflow Execution
- **Comprehensive Architecture**: **docs/EXECUTION_SYSTEM_ARCHITECTURE.md** (detailed execution system docs)
- High-level overview: **ARCHITECTURE.md** > Workflow Engine
- Technical details: **docs/TECHNICAL_DESIGN.md** > Execution Engine
- Implementation: `backend/engine/executor_v3.py`
- Orchestration: `backend/services/execution_orchestrator.py`
- Examples: `examples/*.py`

### Configuration & Troubleshooting
- **Configuration Reference**: **docs/CONFIGURATION_REFERENCE.md** - All environment variables and settings
- **Troubleshooting Guide**: **docs/TROUBLESHOOTING.md** - Common issues and solutions
- **Node Types Reference**: **docs/NODE_TYPES_REFERENCE.md** - Complete node configuration guide

### LLM Integration
- Design: **ARCHITECTURE.md** > Agent System
- Implementation: `backend/agents/llm_agent.py`
- Configuration: **QUICKSTART.md** > Agent Config

### API Endpoints
- Documentation: http://localhost:8000/docs (when running)
- Implementation: `backend/api/routes.py`
- Testing: `test_api.py`

### Data Models
- Schemas: `backend/models/schemas.py`
- Database: `backend/database/models.py`
- Documentation: **ARCHITECTURE.md** > Core Components

### Extension Points
- Overview: **ARCHITECTURE.md** > Extensibility Points
- Agent interface: `backend/agents/base.py`
- Registry pattern: `backend/agents/registry.py`

## 💡 Tips

1. **Use Ctrl+F / Cmd+F** to search within documents
2. **Follow links** in markdown files to navigate
3. **Check file headers** for quick summaries
4. **Run examples** to see code in action
5. **Reference API docs** at http://localhost:8000/docs

## 🎓 Learning Path

### Week 1: Getting Started
- [ ] Read README.md
- [ ] Complete GETTING_STARTED.md
- [ ] Run both examples
- [ ] Create a single-agent workflow

### Week 2: Building Workflows
- [ ] Read WORKFLOW_EXAMPLES.md
- [ ] Build 3 custom workflows
- [ ] Experiment with different models
- [ ] Optimize prompts and parameters

### Week 3: Understanding Internals
- [ ] Read ARCHITECTURE.md
- [ ] Review all backend code
- [ ] Understand execution flow
- [ ] Read PROJECT_SUMMARY.md

### Week 4: Extending the System
- [ ] Create a custom agent type
- [ ] Add a new node type
- [ ] Implement error handling
- [ ] Build a complex workflow

## ✅ File Checklist

Before deploying or sharing:

- [ ] All documentation files present
- [ ] All code files present
- [ ] `.env.example` created (if not blocked)
- [ ] `.gitignore` configured
- [ ] `requirements.txt` complete
- [ ] Examples working
- [ ] Tests passing
- [ ] README.md accurate

## 🎉 Navigation Summary

**New users:** Start with README.md → GETTING_STARTED.md → Examples

**Building workflows:** WORKFLOW_EXAMPLES.md → Examples → Your code

**Understanding system:** ARCHITECTURE.md → Backend code

**Complete picture:** PROJECT_SUMMARY.md

---

**Happy exploring! 🚀**

*Last updated: Phase 1 completion*

