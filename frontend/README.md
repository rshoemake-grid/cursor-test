# Workflow Builder UI (frontend)

Visual workflow builder: **React 18**, **Create React App** (`react-scripts`), **React Flow** (`@xyflow/react`), **MUI**, **Redux** (+ saga), **React Router**.

## Prerequisites

- **Node.js** and **pnpm** — see `package.json` `engines` (Node ≥ 22, pnpm ≥ 10).

## Quick start

```bash
cd frontend
pnpm install

# Recommended for local dev: fixed host/port, no browser auto-launch
pnpm run start:dev
```

Open **http://127.0.0.1:3000** (or **http://localhost:3000**).

- **`pnpm run start:dev`** — runs `react-scripts start` with `BROWSER=none`, `HOST=127.0.0.1`, `PORT=3000` (see `package.json`).
- **`pnpm start`** — stock CRA dev server (ensure the API is reachable; see below).

The UI expects the **API on port 8000**. In dev, `src/setupProxy.js` proxies:

- **`/api`** → `http://localhost:8000`
- **`/ws`** → `http://localhost:8000` (WebSocket)

So start the **Python** (`python -m backend.main` from repo root) or **Java** (`./gradlew bootRun` in `backend-java/`) backend **before** logging in. If nothing listens on 8000, you may see **502 / 504** on `/api` calls.

Optional: set **`REACT_APP_API_BASE_URL`** (see `src/config/constants.js`; default is `/api`).

## Scripts

| Command | Purpose |
|--------|---------|
| `pnpm run start:dev` | Dev server with `HOST`/`PORT`/`BROWSER` set |
| `pnpm start` | CRA dev server |
| `pnpm test` | Jest (`--watchAll=false` in CI) |
| `pnpm run lint` | ESLint on `src` |
| `pnpm run build` | Production build to `build/` (`DISABLE_ESLINT_PLUGIN=true` in script) |

## Project layout (high level)

```
src/
  components/     # UI (mostly .jsx)
  pages/          # Route-level screens
  hooks/          # Domain-oriented hooks (workflow, execution, marketplace, …)
  contexts/       # Auth and other providers
  api/            # HTTP helpers / client
  config/         # e.g. API constants
  setupProxy.js   # Dev-only proxy to backend :8000
```

## Testing & quality

```bash
pnpm run lint
pnpm test
```

## Production build

```bash
pnpm run build
```

Static output is in **`build/`** (not `dist/`). Serve with any static host or the included server path documented in `package.json` (`build:server`).

## More documentation

- Repo root **[README.md](../README.md)** — full stack, Python/Java backends
- **[QUICKSTART.md](../QUICKSTART.md)** — API setup and `curl` examples
