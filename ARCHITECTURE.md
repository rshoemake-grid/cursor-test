# Architecture

High-level view of the **Agentic Workflow Engine** as shipped today: a **Java** REST/WebSocket API and a **React** single-page app.

## System diagram

```
┌─────────────────────────────────────────┐
│  Browser — React (CRA) frontend         │
│  Workflow builder, execution console    │
└──────────────────┬──────────────────────┘
                   │ HTTPS / WS (dev: proxied /api, /ws)
┌──────────────────▼──────────────────────┐
│  Spring Boot API — backend-java/        │
│  REST (/api/...), OpenAPI, JWT auth     │
│  JPA + SQLite (default) or PostgreSQL   │
└──────────────────┬──────────────────────┘
                   │
     ┌─────────────┴──────────────┐
     │                            │
┌────▼─────┐              ┌──────▼───────┐
│ Database │              │ LLM / tools  │
│ workflows│              │ (OpenAI,     │
│ .db etc. │              │  Gemini, …) │
└──────────┘              └──────────────┘
```

## Main components

### Frontend (`frontend/`)

- **React 18** app (Create React App).
- **React Flow** canvas, node editors, execution UI.
- Talks to the API via **`/api`** (dev proxy) or `REACT_APP_API_BASE_URL` in production builds.

### API (`backend-java/`)

- **Spring Boot** application on port **8000** by default.
- **Controllers** under `com.workflow` expose `/api/...` routes.
- **JPA/Hibernate** entities map to the same logical schema as earlier prototypes (workflows, executions, users, etc.).
- **WebSockets** stream execution logs/events to the UI.
- **OpenAPI** is served at `/swagger-ui.html` (not legacy `/docs` from other stacks).

### Data

- Default **SQLite** file `workflows.db` in the repo root (configurable via Spring properties).
- **PostgreSQL** supported via profile/properties (see `application-postgresql.properties`).

### Scripts (`scripts/`)

- Optional **Python** helpers (e.g. SQLite diagnostics), **not** part of the runtime API.
- Covered by `pytest` with minimal dependencies in `requirements.txt`.

## Extensibility

- New **node types** and **agents**: Java services + frontend editors and canvas registration.
- **LLM providers**: configured per deployment/user settings; see `docs/LLM_PROVIDER_SETUP_GUIDE.md`.

## Related reading

- [docs/EXECUTION_SYSTEM_ARCHITECTURE.md](docs/EXECUTION_SYSTEM_ARCHITECTURE.md) — execution pipeline (conceptual; implementation is Java).  
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — HTTP surface.  
- [backend-java/README.md](backend-java/README.md) — build, run, and test the API.  
