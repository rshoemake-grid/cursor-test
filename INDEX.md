# Project index

Quick reference for the **Agentic Workflow Engine** repository (Java API + React UI).

## Start here

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Overview, features, quick start |
| [GETTING_STARTED.md](GETTING_STARTED.md) | First-time setup |
| [QUICKSTART.md](QUICKSTART.md) | Commands and API smoke tests |
| [ARCHITECTURE.md](ARCHITECTURE.md) | High-level system design |
| [docs/README.md](docs/README.md) | Full documentation index |

## Code layout

| Path | Purpose |
|------|---------|
| `backend-java/` | **Spring Boot** REST API, WebSocket execution stream, JPA persistence (`./gradlew bootRun`, port **8000**) |
| `frontend/` | **Create React App** workflow builder (`npm start`, port **3000**) |
| `scripts/` | Small **Python** utilities (e.g. DB inspection) and `pytest` tests only |
| `docs/` | Guides and API reference |

## Common commands

| Task | Command |
|------|---------|
| Run API | `cd backend-java && ./gradlew bootRun` |
| Run UI | `cd frontend && npm start` |
| Run both | `./start.sh` (from repo root, needs `.env`) |
| Java tests | `cd backend-java && ./gradlew test` |
| Scripts tests | `python3 -m pytest scripts/ -q` or `./run.sh verify` |

## Configuration

- Root **`.env`**: API keys, optional `DEV_BOOTSTRAP_*` for local dev (see [docs/CONFIGURATION_REFERENCE.md](docs/CONFIGURATION_REFERENCE.md)).
- **`backend-java/src/main/resources/application.properties`**: JDBC URL (default SQLite `workflows.db`), JPA, server port.

## API and docs

- OpenAPI (when server is up): `http://localhost:8000/swagger-ui.html`
- REST reference: [docs/API_REFERENCE.md](docs/API_REFERENCE.md)
