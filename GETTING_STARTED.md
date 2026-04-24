# Getting started

This project runs a **Spring Boot** API (`backend-java/`) and a **React** UI (`frontend/`).

## Prerequisites

- **JDK 17+** and `java` on your `PATH`
- **Node.js 18+** and **npm**
- **OpenAI API key** (optional globally; users can also set keys in the app)

Optional: **Python 3** only if you want to run tests under `scripts/` (`pytest`).

## 1. Clone and configure

```bash
cd cursor-test
cp .env.example .env
# Edit .env — at minimum set OPENAI_API_KEY if you use cloud models from env
```

Optional dev login (see [docs/CONFIGURATION_REFERENCE.md](docs/CONFIGURATION_REFERENCE.md#development-user-bootstrap-optional)):

```bash
# In .env (example)
DEV_BOOTSTRAP_USERNAME=devuser
DEV_BOOTSTRAP_PASSWORD=your-secure-password
```

## 2. Install frontend dependencies

```bash
cd frontend && npm install && cd ..
```

## 3. Start the stack

From the repo root (requires `.env`):

```bash
./start.sh
```

Or manually:

**Terminal 1 — API**

```bash
cd backend-java && ./gradlew bootRun
```

Wait until `http://localhost:8000/health` responds.

**Terminal 2 — UI**

```bash
cd frontend && npm start
```

Open **http://localhost:3000**.

## 4. First workflow in the UI

1. Open the app in the browser.
2. Drag nodes from the palette onto the canvas and connect them.
3. Configure nodes in the side panel.
4. Save the workflow, then run it and watch execution in the console.

## 5. Optional: scripts tests

```bash
pip install -r requirements.txt   # minimal pytest deps
./run.sh verify
```

## Where to read next

- [QUICKSTART.md](QUICKSTART.md) — curl examples and troubleshooting pointers  
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — HTTP routes  
- [docs/CONFIGURATION_REFERENCE.md](docs/CONFIGURATION_REFERENCE.md) — environment variables and Spring settings  
- [frontend/README.md](frontend/README.md) — dev proxy and `REACT_APP_*` variables  
