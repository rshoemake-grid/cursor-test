# Phase 2: Visual Workflow Builder + Advanced Control Flow

## 🎉 What's New in Phase 2

Phase 2 adds a complete visual workflow builder and significantly enhanced execution capabilities:

### ✨ New Features

#### 1. **Visual Workflow Builder** (Frontend)
- 🎨 Drag-and-drop workflow designer built with React Flow
- 📊 Real-time visual feedback
- 🎯 Node palette with 5 node types
- ⚙️ Property panel for node configuration
- 💾 Save/load workflows through UI
- 📤 Export workflows as JSON

#### 2. **Conditional Branching**
- 🔀 If/else logic in workflows
- 🎲 Multiple condition types:
  - Equals
  - Contains
  - Greater than / Less than
  - Custom expressions
- ↔️ Dynamic path selection based on runtime values

#### 3. **Loop Support**
- 🔄 Three loop types:
  - **For-each**: Iterate over lists
  - **While**: Loop while condition is true
  - **Until**: Loop until condition is met
- 🛡️ Max iteration limits for safety
- 📊 Loop state tracking

#### 4. **Parallel Execution**
- ⚡ Independent nodes execute simultaneously
- 🚀 Significantly faster for complex workflows
- 🔒 Automatic dependency resolution
- 🎯 Smart batching of parallel tasks

#### 5. **Enhanced Execution**
- 📈 Better performance with async execution
- 🎭 Support for complex workflow patterns
- 🔍 Improved error handling
- 📝 Detailed execution logs

## 🚀 Getting Started

### Prerequisites
- Phase 1 completed and working
- Node.js 18+ and npm (for frontend)
- Python environment from Phase 1

### Installation

#### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 2. Update Backend (Already Done)
The backend has been updated to support new node types and features.

### Running the Application

#### Terminal 1: Start Backend

```bash
# From project root
python main.py
```

Backend runs at `http://localhost:8000`

#### Terminal 2: Start Frontend

```bash
# From project root
cd frontend
npm run dev
```

Frontend runs at `http://localhost:3000`

### First Time Using the UI

1. **Open your browser** → `http://localhost:3000`
2. **You'll see** the Visual Workflow Builder
3. **Try this**:
   - Drag a "Start" node onto the canvas
   - Drag an "Agent" node onto the canvas
   - Connect them by dragging from the circle on Start to the Agent
   - Click the Agent node to see its properties
   - Configure the agent (name, model, prompt)
   - Click "Save" in the toolbar
   - Click "Execute" to run your workflow!

## 🎯 New Node Types

### 1. Agent Node (Enhanced)
**What it does**: LLM-powered processing

**Configuration**:
- Model: gpt-4o-mini, gpt-4o, gpt-4, etc.
- System Prompt: Instructions for the agent
- Temperature: 0.0 (focused) to 1.0 (creative)
- Max Tokens: Response length limit

**Use for**: Content generation, analysis, transformation

### 2. Condition Node (NEW!)
**What it does**: Branches workflow based on conditions

**Configuration**:
- Condition Type: equals, contains, greater_than, less_than, custom
- Field: Which field to check
- Value: What to compare against

**Outputs**: Two branches (true/false)

**Use for**: Decision making, quality checks, routing

**Example**:
```
Check if sentiment is "positive"
→ True: Send to celebration agent
→ False: Send to improvement agent
```

### 3. Loop Node (NEW!)
**What it does**: Repeats part of workflow

**Configuration**:
- Loop Type: for_each, while, until
- Items Source: What to iterate over (for for_each)
- Max Iterations: Safety limit
- Condition: When to stop (for while/until)

**Use for**: Batch processing, iteration, retries

**Example**:
```
For each item in [topic1, topic2, topic3]:
  → Generate article
  → Review article
  → Save result
```

### 4. Start Node
Entry point of workflow

### 5. End Node
Exit point of workflow

## 📖 Building Your First Visual Workflow

### Example: Content Review Pipeline

**Goal**: Write content, check quality, improve if needed

**Nodes**:
1. Start
2. Writer Agent → "Write a blog post about AI"
3. Quality Checker (Condition) → Check if word count > 500
4. If FALSE → Improvement Agent → "Expand the content"
5. If TRUE → Editor Agent → "Polish the content"
6. End

**Steps**:
1. Drag nodes onto canvas in order
2. Connect them: Start → Writer → Checker
3. From Checker, connect TRUE path to Editor
4. From Checker, connect FALSE path to Improvement
5. Connect Improvement → Checker (loop back)
6. Connect Editor → End
7. Configure each agent's prompts
8. Save and Execute!

## 🎨 UI Components

### Main Views

#### 1. Builder View
- **Left Panel**: Node Palette (drag nodes)
- **Center**: Visual Canvas (design workflows)
- **Right Panel**: Properties (configure selected node)
- **Top Toolbar**: Save, Execute, New, Export

#### 2. Workflows View
- Grid of all saved workflows
- Click to open in builder
- Delete workflows
- See metadata (nodes, date)

#### 3. Execution View
- Real-time execution status
- Node-by-node progress
- Detailed logs
- Input/output for each step
- Final result display

### Node Palette
Drag these onto the canvas:

- 🎯 **Start**: Workflow entry
- 🤖 **Agent**: LLM processing
- 🔀 **Condition**: If/else branching
- 🔄 **Loop**: Iteration
- 🏁 **End**: Workflow completion

### Property Panel
Click any node to edit:

- Name and description
- Type-specific config
- Input mappings
- Delete button

## 💡 Example Workflows

### 1. Simple Sequential
```
Start → Agent 1 → Agent 2 → End
```
Classic pipeline, no branching

### 2. Conditional Branch
```
Start → Analyzer → Condition
                    ├─ True → Path A → End
                    └─ False → Path B → End
```
Different paths based on condition

### 3. Loop with Agents
```
Start → Loop (for each item)
         └─→ Agent (process item) ─┐
              ↓                     │
           Collector ←──────────────┘
         → End
```
Process multiple items

### 4. Parallel Execution
```
Start ─┬→ Agent A ─┐
       ├→ Agent B ─┤→ Combiner → End
       └→ Agent C ─┘
```
Independent agents run simultaneously

### 5. Quality Loop
```
Start → Creator → Checker (condition)
                    ├─ Good → End
                    └─ Bad → Improver → back to Checker
```
Iterate until quality threshold met

## 🔧 Technical Details

### Frontend Stack
- **React 18** with TypeScript
- **React Flow** for visual workflow builder
- **Zustand** for state management
- **TailwindCSS** for styling
- **Axios** for API calls
- **Vite** for build tooling

### Backend Enhancements
- **executor_v2.py**: New executor with parallel execution
- **condition_agent.py**: Condition evaluation logic
- **loop_agent.py**: Loop management
- **Enhanced schemas**: New node types and configs

### How Parallel Execution Works
1. Build dependency graph from nodes and edges
2. Identify nodes with no remaining dependencies
3. Execute them simultaneously with asyncio.gather()
4. As nodes complete, check for newly available nodes
5. Repeat until all nodes complete

### How Conditions Work
1. Condition node evaluates expression
2. Returns branch info ("true" or "false")
3. Executor follows appropriate edge
4. Other branch is skipped

### How Loops Work
1. Loop node initializes iteration state
2. Returns items to iterate or condition to check
3. Executor repeats loop body
4. Tracks iteration count
5. Exits when complete or max iterations reached

## 🎮 Usage Guide

### Creating a Workflow

```bash
1. Click "Builder" in top nav
2. Drag nodes from left panel
3. Connect nodes by dragging between handles
4. Click node to configure in right panel
5. Enter workflow name at top
6. Click "Save"
```

### Executing a Workflow

```bash
1. Make sure workflow is saved
2. Click "Execute" button
3. Enter input JSON (e.g., {"topic": "AI"})
4. Click "Execute" in modal
5. Switch to "Execution" view to watch progress
```

### Viewing Results

```bash
1. Execution view shows real-time progress
2. See each node's status, input, output
3. View complete execution logs
4. Final result at bottom
```

## 📊 Architecture Updates

### New Components

```
frontend/
├── src/
│   ├── components/
│   │   ├── WorkflowBuilder.tsx (main editor)
│   │   ├── NodePanel.tsx (node palette)
│   │   ├── PropertyPanel.tsx (config panel)
│   │   ├── Toolbar.tsx (actions)
│   │   ├── WorkflowList.tsx (workflow grid)
│   │   ├── ExecutionViewer.tsx (results)
│   │   └── nodes/ (custom node components)
│   ├── store/
│   │   └── workflowStore.ts (state management)
│   ├── api/
│   │   └── client.ts (API wrapper)
│   └── types/
│       └── workflow.ts (TypeScript types)

backend/engine/
└── executor_v2.py (enhanced executor)

backend/agents/
├── condition_agent.py (NEW)
└── loop_agent.py (NEW)
```

### Data Flow

```
User Action (Frontend)
   ↓
Zustand Store (State Management)
   ↓
API Client (HTTP Request)
   ↓
FastAPI Backend (Routes)
   ↓
Executor V2 (Orchestration)
   ↓
Agent Registry (Agent Selection)
   ↓
Specific Agent (Execution)
   ↓
LLM API / Condition Logic / Loop Logic
   ↓
Response → Store → UI Update
```

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Make sure you're in frontend directory
cd frontend

# Install dependencies
npm install

# Try again
npm run dev
```

### Can't connect to backend
- Make sure backend is running on port 8000
- Check `vite.config.ts` proxy settings
- Try `http://localhost:3000` not `3000` alone

### Nodes won't connect
- Make sure you're dragging from/to the circles (handles)
- Source handle is at bottom of node
- Target handle is at top of node

### Workflow won't execute
- Save the workflow first (must have ID)
- Check that all required inputs are provided
- Make sure API key is set in backend .env

### Condition node not branching
- Check edge configuration (need true/false edges)
- Verify condition field exists in input
- Check condition type matches data type

## 🎓 Learning Examples

### Example 1: Sentiment Router

```json
{
  "name": "Sentiment Router",
  "nodes": [
    {"id": "start", "type": "start"},
    {"id": "analyzer", "type": "agent", 
     "agent_config": {
       "system_prompt": "Analyze sentiment. Reply only: positive, negative, or neutral"
     }},
    {"id": "router", "type": "condition",
     "condition_config": {
       "condition_type": "equals",
       "field": "output",
       "value": "positive"
     }},
    {"id": "positive_path", "type": "agent"},
    {"id": "negative_path", "type": "agent"},
    {"id": "end", "type": "end"}
  ],
  "edges": [
    {"source": "start", "target": "analyzer"},
    {"source": "analyzer", "target": "router"},
    {"source": "router", "target": "positive_path", "condition": "true"},
    {"source": "router", "target": "negative_path", "condition": "false"},
    {"source": "positive_path", "target": "end"},
    {"source": "negative_path", "target": "end"}
  ]
}
```

### Example 2: Batch Processor

Create workflow that processes multiple topics:

1. Loop node (for_each) with items: ["AI", "Blockchain", "Quantum"]
2. Inside loop: Agent that researches the topic
3. After loop: Agent that summarizes all research
4. Result: Combined analysis of all topics

## 📈 Performance Improvements

### Phase 1 vs Phase 2

| Feature | Phase 1 | Phase 2 |
|---------|---------|---------|
| Execution | Sequential only | Parallel support |
| Branching | None | Conditional logic |
| Loops | None | 3 loop types |
| UI | Programmatic only | Visual builder |
| Speed (3 agents) | ~90 seconds | ~30-45 seconds |
| Workflow Complexity | Simple | Advanced |

## 🔮 Coming in Phase 3

- WebSocket real-time streaming
- Agent memory and context
- Tool calling and function execution
- Custom tool integration
- Workflow templates and marketplace
- Advanced debugging tools

## ✅ Validation

Test Phase 2 is working:

```bash
# 1. Backend responding
curl http://localhost:8000/health

# 2. Frontend accessible
open http://localhost:3000

# 3. Create simple workflow in UI
- Drag Start node
- Drag Agent node  
- Connect them
- Configure agent
- Save
- Execute

# 4. Check execution view
- Should see real-time progress
- Logs should appear
- Result should display
```

## 🎉 Success!

You now have:
- ✅ Visual workflow builder
- ✅ Conditional branching
- ✅ Loop support
- ✅ Parallel execution
- ✅ Enhanced UI/UX
- ✅ Real-time execution viewing

**Ready to build complex agentic workflows visually!** 🚀

---

**Questions?** Check the main README or ARCHITECTURE.md

**Found a bug?** The code is ready for you to fix or extend!

