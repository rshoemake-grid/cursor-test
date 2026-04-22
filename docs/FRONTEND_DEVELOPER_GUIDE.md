# Frontend Developer Guide

## Overview

The frontend is a **Create React App** project: React 18, **JavaScript (JSX)**, React Flow for the workflow canvas, **Redux Toolkit** and **redux-saga** for workflow state, **styled-components** for UI styling, and **Jest** + **React Testing Library** for tests. See **[frontend/README.md](../frontend/README.md)** for install, proxy, build output, and styling details.

## Tech stack

| Area | Choice |
|------|--------|
| UI | React 18, JSX |
| Build / dev server | Create React App (`react-scripts`) |
| Routing | React Router |
| Canvas | React Flow (`@xyflow/react`) |
| Global state | Redux Toolkit, redux-saga |
| Styling | styled-components; shared colors in `src/styles/designTokens.js` |
| HTTP | Fetch-based client (`src/api/client.jsx`) |
| Tests | Jest, React Testing Library |

There is **no Tailwind** and **no Vite** in this frontend. PostCSS runs **autoprefixer** only.

## Project structure

```
frontend/src/
├── components/       # Screens and UI (see WorkflowBuilder/, nodes/, …)
├── pages/            # Route-level pages (AuthPage.jsx, MarketplacePage.jsx, …)
├── hooks/            # Domain hooks: workflow/, execution/, marketplace/, …
├── styles/           # *.styled.jsx + designTokens.js
├── redux/            # store, slices, sagas
├── store/            # workflowStore.jsx façade over Redux
├── contexts/         # AuthContext.jsx, WorkflowTabsContext.jsx, …
├── api/              # client.jsx, endpoints.jsx
├── types/            # Shared JS shapes (adapters.jsx, workflow.jsx, …)
├── utils/
├── config/
├── constants/
├── test/
├── index.js          # Entry
├── App.jsx
└── index.css         # Global baseline (no utility framework)
```

File extensions are **`.jsx`** / **`.js`** (not TypeScript).

## Styling

- Use **styled-components** in `src/styles/*.styled.jsx` (or colocated patterns used elsewhere in the repo).
- Import shared colors from **`src/styles/designTokens.js`** (typically `import { colors as c } from "./designTokens"`).
- Keep **`src/index.css`** for document-level rules and third-party tweaks (e.g. React Flow minimap).

## Core components (high level)

- **`WorkflowBuilder.jsx`** — Main canvas: React Flow, toolbars, integration with panels and Redux workflow state.
- **`components/nodes/`** — Canvas node types (Start, End, Agent, Condition, Loop, tools, integrations).
- **`PropertyPanel.jsx`** — Selected node configuration.
- **`NodePanel.jsx`** — Palette and drag sources.
- **Execution / log / analytics pages** — Under `pages/` and `components/` as applicable; many use dedicated hooks under `hooks/`.

## State management

- **Redux** (`redux/workflow/workflowSlice`, sagas) holds workflow graph state and related builder data.
- **`store/workflowStore.jsx`** exposes dispatch-bound helpers used across the builder.
- **React Context** — Auth, workflow tabs, and other cross-cutting concerns.
- **Local state** — `useState` / `useReducer` inside components where appropriate.

### Guest access vs signed-in behavior

- **Marketplace** — Available without auth; primary way to discover templates when logged out.
- **My workflows** — `GET /api/workflows` is only populated for authenticated users; guests see an empty list and a sign-in CTA in the UI.
- **Builder** — Guests can work in a local untitled tab; server-backed `workflow_id` tabs are cleared until sign-in. Deep links `?workflow=` apply only when authenticated.
- **Settings / LLM providers** — Many paths skip loading secrets from storage or the API until `isAuthenticated` (e.g. `useLLMProviders`, `PropertyPanel`).
- **Workflow Chat** — Sending messages, microphone, TTS, and applying AI-driven graph changes require sign-in in the UI; the chat request includes optional **`iteration_limit`** (default **20** in the UI, range 1–100) passed to `POST /api/workflow-chat/chat`.

See [API Reference](./API_REFERENCE.md#access-control-anonymous-vs-signed-in) and [Configuration Reference](./CONFIGURATION_REFERENCE.md#frontend-configuration).

### Workflow Chat (`components/WorkflowChat.jsx`)

Side-panel assistant for natural-language edits. Calls **`api.chat`** → `POST /api/workflow-chat/chat` with `workflow_id`, `message`, `conversation_history`, and **`iteration_limit`** to cap tool–LLM loop iterations per send. Voice (push-to-talk) and read-aloud integrate with the same input/send path.

## Custom hooks (by domain)

Hooks live under `src/hooks/<domain>/`. Examples:

- **workflow/** — load, save, update, persistence, tabs sync.
- **execution/** — run workflows, WebSocket, execution UI.
- **marketplace/** — templates, agents, selections, dialogs.
- **nodes/** — selection, forms, canvas operations.
- **forms/** — publish form, field helpers.
- **storage/** — localStorage, drafts, auto-save.
- **api/** — authenticated fetch patterns.
- **log/** — execution list, pagination, filters.

Prefer **domain imports** (e.g. `from "../hooks/execution"`) per ESLint rules in the repo.

## API integration

Central client: **`src/api/client.jsx`** (`createApiClient`, exported **`api`**).

```javascript
import { api } from "./api/client";

const workflows = await api.getWorkflows();
```

Endpoints are composed in **`src/api/endpoints.jsx`**. Adapters (storage, fetch) are under **`src/types/adapters.jsx`** and **`defaultAdapters`**.

Storage explorer calls (GCS, S3, local, Pub/Sub, **BigQuery**, **Firestore**) are exposed on **`api`** as `listGcpBucketObjects`, `listBigqueryDatasets`, `listBigqueryTables`, `listFirestoreCollections`, etc.; see **`endpoints.jsx`** `storageEndpoints` and **`components/editors/input/storageObjectPickers.jsx`** for the shared **`StorageBrowserDialog`** pickers.

## Testing

- **Framework**: Jest (via `react-scripts test`).
- **UI tests**: `@testing-library/react`; hooks with `renderHook`.
- Tests are co-located as `*.test.jsx` next to sources or under `src/test/`.

```javascript
import { render, screen } from "@testing-library/react";
import MyComponent from "./MyComponent";

test("renders", () => {
  render(<MyComponent />);
  expect(screen.getByRole("button")).toBeInTheDocument();
});
```

## Environment variables

Use **`REACT_APP_*`** prefixes for variables embedded at build time. For local API routing, prefer an **unset** `REACT_APP_API_BASE_URL` in development so the app uses the CRA proxy (`setupProxy.js`) to `/api`. See [Configuration Reference](./CONFIGURATION_REFERENCE.md#frontend-configuration).

## Running the app

From **`frontend/`**:

```bash
npm install
npm start          # http://localhost:3000
npm run build      # output in build/
npm test
npm run lint
```

## Common tasks

- **New page** — Add `pages/YourPage.jsx`, register route in **`App.jsx`**, add navigation if needed.
- **New node type** — Component under `components/nodes/`, register with React Flow node types in the builder, add palette entry and property form.
- **New API method** — Extend **`client.jsx`** / **`endpoints.jsx`**, then consume via hooks or components.

## Best practices

1. Prefer **styled-components** and **design tokens** over ad hoc hex in JSX.
2. Use **`data-testid` / roles** for stable tests instead of generated class names.
3. Keep **domain hooks** focused; compose smaller hooks for complex flows.
4. Handle **errors** on async paths; use existing notification/confirm utilities where applicable.
5. Respect **ESLint** `no-restricted-imports` for hook entry points.

## Resources

- [React](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- [React Flow](https://reactflow.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [styled-components](https://styled-components.com/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
