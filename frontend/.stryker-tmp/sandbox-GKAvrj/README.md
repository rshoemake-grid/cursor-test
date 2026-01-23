# Agentic Workflow Builder - Frontend

Visual workflow builder built with React, TypeScript, and React Flow.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Flow** - Visual workflow editor
- **Zustand** - State management
- **TailwindCSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client

## 🏗️ Project Structure

```
src/
├── components/
│   ├── WorkflowBuilder.tsx    # Main workflow editor
│   ├── NodePanel.tsx           # Node palette (left sidebar)
│   ├── PropertyPanel.tsx       # Node properties (right sidebar)
│   ├── Toolbar.tsx             # Top toolbar (save, execute, etc.)
│   ├── WorkflowList.tsx        # Workflow grid view
│   ├── ExecutionViewer.tsx    # Execution results view
│   └── nodes/                  # Custom node components
│       ├── AgentNode.tsx
│       ├── ConditionNode.tsx
│       ├── LoopNode.tsx
│       ├── StartNode.tsx
│       └── EndNode.tsx
├── store/
│   └── workflowStore.ts        # Zustand state management
├── api/
│   └── client.ts               # API client wrapper
├── types/
│   └── workflow.ts             # TypeScript types
├── App.tsx                     # Main app component
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

## 🎨 Components

### WorkflowBuilder
Main canvas for visual workflow design. Handles:
- Drag and drop of nodes
- Connecting nodes with edges
- Canvas controls (zoom, pan, minimap)
- Integration with panels

### NodePanel
Left sidebar with draggable node templates:
- Start/End nodes
- Agent nodes
- Condition nodes
- Loop nodes

### PropertyPanel
Right sidebar for configuring selected node:
- Node name and description
- Type-specific configuration
- Agent settings (model, prompts, temperature)
- Condition settings
- Loop settings

### Toolbar
Top action bar with:
- Workflow name/description
- Save/Update button
- Execute button
- New workflow button
- Export button

### WorkflowList
Grid view of all saved workflows with:
- Workflow cards
- Metadata display
- Delete functionality
- Click to open

### ExecutionViewer
Real-time execution monitoring:
- Status display
- Node-by-node progress
- Input/output for each step
- Execution logs
- Final result

## 🔧 Configuration

### API Proxy
Vite is configured to proxy API requests to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:8000',
  }
}
```

### Environment
No environment variables needed for development.
Backend URL is proxied automatically.

## 🎯 Usage

### Creating a Workflow
1. Drag nodes from left panel onto canvas
2. Connect nodes by dragging between handles
3. Click nodes to configure in right panel
4. Enter workflow name in toolbar
5. Click "Save"

### Editing a Workflow
1. Go to "Workflows" view
2. Click workflow card
3. Modify in builder
4. Click "Update" to save changes

### Executing a Workflow
1. Open workflow in builder (must be saved)
2. Click "Execute" button
3. Enter input JSON
4. View progress in "Execution" view

## 🎨 Styling

Uses TailwindCSS with custom configuration:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        // Custom primary color scale
      }
    }
  }
}
```

## 📱 Responsive Design

- Desktop-first design
- Minimum width: 1024px recommended
- Panels collapse on smaller screens

## 🐛 Development

### Type Checking
```bash
npm run tsc
```

### Linting
```bash
npm run lint
```

### Hot Reload
Development server has hot module replacement (HMR) enabled.
Changes reflect immediately.

## 🔗 API Integration

All API calls go through the client wrapper:

```typescript
import { api } from './api/client'

// Get workflows
const workflows = await api.getWorkflows()

// Create workflow
const created = await api.createWorkflow(workflow)

// Execute workflow
const execution = await api.executeWorkflow(workflowId, inputs)
```

## 📦 Build

```bash
# Production build
npm run build

# Output in dist/
# Serve with any static server
```

## 🎓 Learning Resources

- [React Flow Docs](https://reactflow.dev/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [TailwindCSS Docs](https://tailwindcss.com/)
- [Vite Docs](https://vitejs.dev/)

## 🚀 Deployment

### Static Hosting
Build output is a static site. Deploy to:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static host

### Backend Connection
Update Vite proxy for production or use environment variable:

```typescript
const API_URL = import.meta.env.VITE_API_URL || '/api'
```

## ✅ Checklist

Before committing:
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] Components are properly typed
- [ ] API calls have error handling
- [ ] UI is responsive
- [ ] Tested in browser

## 🎉 Happy Building!

Create amazing visual workflows! 🚀

