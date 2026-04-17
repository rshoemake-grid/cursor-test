# Agentic Workflow Builder - Frontend

Visual workflow builder (Create React App, React, React Flow).

## Quick start

```bash
npm install
npm start
npm run build
npm test
```

Development server defaults to **http://localhost:3000**.

## API URL in development

- **Default:** leave **`REACT_APP_API_BASE_URL` empty** in `.env.development` so the browser uses same-origin **`/api`**. `src/setupProxy.js` forwards to the API at **`PROXY_TARGET`** (default `http://127.0.0.1:8000`), which matches **Python FastAPI** when run with uvicorn on port 8000.
- **504 / proxy errors in the browser:** the CRA dev server could not reach the API on `PROXY_TARGET`. Start FastAPI from the **repository root**: `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload`. For the Java API instead, use `backend-java` `./gradlew bootRun` (also port 8000), or change `PROXY_TARGET`.
- **Direct API:** set `REACT_APP_API_BASE_URL=http://127.0.0.1:8000` in `.env.development.local` if you must bypass the proxy (mind CORS).

See **[docs/CONFIGURATION_REFERENCE.md](../docs/CONFIGURATION_REFERENCE.md#frontend-configuration)**.

## Tech stack

- **React 18** — UI
- **Create React App (`react-scripts`)** — dev server and production build
- **React Router** — client routing
- **Redux (RTK) + redux-saga** — app state where used
- **styled-components** — component styling
- **Shared colors** — `src/styles/designTokens.js` (used by styled files)
- **React Flow (`@xyflow/react`)** — workflow canvas
- **API client** — `src/api/client.jsx`

## Project structure

Primary entry: `src/index.js`, `src/App.jsx`. Illustrative layout:

```
src/
├── components/          # UI (many use *.styled.jsx under styles/)
├── pages/               # Route-level screens
├── hooks/               # Domain-oriented hooks (execution, workflow, …)
├── styles/              # styled-components + designTokens.js
├── store/               # Redux store
├── api/                 # HTTP client and endpoints
├── utils/
├── contexts/
├── index.css            # Global baseline (no Tailwind)
└── setupProxy.js        # Dev API proxy
```

## Styling

The app uses **styled-components**, not utility CSS frameworks. Shared hex values live in **`src/styles/designTokens.js`** and are imported as `colors` (often aliased `c`) in `*.styled.jsx` files under `src/styles/`.

PostCSS runs **autoprefixer** only (`postcss.config.js`). Global rules (body, `#root`, React Flow minimap tweaks) are in **`src/index.css`**.

## Configuration

### API proxy (development)

CRA uses **`src/setupProxy.js`** with `http-proxy-middleware`. Adjust `PROXY_TARGET` or paths there; do not rely on Vite-style `vite.config` proxy blocks.

### Environment

See **API URL in development** above. Production builds use `REACT_APP_*` variables where referenced in code.

## Usage (high level)

- **Workflows:** open the builder, drag nodes from the palette, connect handles, configure the selected node in the property panel, save.
- **Execution:** run from the builder when the workflow is saved; follow status in the execution UI.
- **Marketplace / settings / logs:** use the corresponding pages from the app shell.

## Development

### Lint

```bash
npm run lint
```

### Tests

```bash
npm test
```

Hot reload is provided by the CRA dev server.

## API integration

Calls go through the shared client, for example:

```javascript
import { api } from "./api/client";

const workflows = await api.getWorkflows();
```

See `src/api/endpoints.jsx` and tests under `src/api/` for patterns.

## Build

```bash
npm run build
```

Output is written to **`build/`** (CRA default). Serve that folder with any static host.

## Deployment

- Point the SPA at your API using **`REACT_APP_API_BASE_URL`** (or your chosen env contract) when the app cannot use same-origin `/api`.
- Configure the hosting provider to route unknown paths to `index.html` for client-side routing.

## Learning resources

- [React documentation](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- [React Flow](https://reactflow.dev/)
- [styled-components](https://styled-components.com/)

## Checklist (before committing)

- [ ] `npm test` passes
- [ ] `npm run lint` within project limits
- [ ] `npm run build` succeeds
- [ ] Critical flows smoke-tested in the browser
