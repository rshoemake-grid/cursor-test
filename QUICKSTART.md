# Quick start

## Prerequisites

- JDK 17+, Node.js 18+, npm  
- `.env` in the repo root (copy from `.env.example`)

## Run the API (Spring Boot)

```bash
cd backend-java
./gradlew bootRun
```

- Base URL: `http://localhost:8000`  
- OpenAPI UI: `http://localhost:8000/swagger-ui.html`  
- Health: `curl -sf http://localhost:8000/health`

## Run the frontend

In another terminal:

```bash
cd frontend
npm install   # first time only
npm start
```

App: `http://localhost:3000`. With default CRA proxy, the browser calls **`/api`** on the same origin; the dev server forwards to the Java API (see `frontend/README.md`).

## One command (both processes)

```bash
./start.sh
```

## Smoke test: create a workflow (curl)

```bash
curl -sS -X POST "http://localhost:8000/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{"name":"Quick test","description":"","nodes":[],"edges":[],"variables":{}}'
```

Use the Swagger UI for authenticated flows (login, execute, etc.).

## Optional Python tooling

`scripts/` contains small utilities (stdlib + tests). Install test deps and run:

```bash
pip install -r requirements.txt
python3 -m pytest scripts/ -q
```

## More documentation

- [GETTING_STARTED.md](GETTING_STARTED.md)  
- [docs/README.md](docs/README.md)  
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)  
