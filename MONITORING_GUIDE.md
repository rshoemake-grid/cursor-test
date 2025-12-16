# 🔍 Workflow Monitoring Guide

## How to Monitor Workflow Execution

### **1. Execute a Workflow**

**Option A: From Builder**
1. Create or load a workflow in the Builder
2. Click the green **"Execute"** button
3. Enter input variables (e.g., `{"topic": "AI agents"}`)
4. Click "Execute"

**Option B: From Workflows List**
1. Click "Workflows" tab
2. Click "Execute" on any workflow
3. Enter inputs and execute

---

## **2. Real-Time Monitoring Features** 🎯

### **Automatic Execution Viewer**
When you click Execute, the app automatically:
- ✅ Switches to the **"Execution"** tab
- ✅ Shows real-time status updates
- ✅ Polls every 2 seconds while running
- ✅ Displays each node's progress

### **Live Status Banner**
When a workflow is running, you'll see a **blue animated banner** at the top:

```
🕐 Workflow Running...
   Monitoring in real-time • Updates every 2 seconds    • LIVE
```

This banner:
- ✨ Animates with a pulse effect
- 🔵 Shows "LIVE" indicator
- ⏱️ Updates every 2 seconds
- ✅ Disappears when complete

---

## **3. What You Can See** 👀

### **Execution Overview**
- **Status**: PENDING → RUNNING → COMPLETED/FAILED
- **Execution ID**: Unique identifier
- **Started At**: Timestamp
- **Completed At**: Timestamp (when done)
- **Duration**: Total execution time

### **Progress Bar**
Visual progress indicator showing:
- Number of completed nodes / total nodes
- Blue progress bar filling up as nodes complete
- Example: "3 / 5 nodes completed"

### **Node-by-Node Details**
For each node in your workflow:

#### **📌 Node Name & Status**
- ✅ **Completed** (green)
- ⚙️ **Running** (blue, spinning icon)
- ❌ **Failed** (red)
- ⏸️ **Pending** (gray)

#### **📥 Input Data**
What data the node received:
```json
{
  "topic": "AI agents",
  "previous_output": "..."
}
```

#### **💬 Agent Response (The Conversation!)**
This is where you see what the AI agent said!

**Beautiful formatted output box:**
- 🎨 Blue gradient background
- 📝 Easy-to-read text
- ✅ Checkmark when complete
- 📜 Scrollable for long responses

**Example:**
```
Agent Response: ✓

╭────────────────────────────────────────╮
│ AI agents are software programs that   │
│ can perceive their environment and     │
│ take actions to achieve specific       │
│ goals. They use machine learning...    │
╰────────────────────────────────────────╯
```

#### **❗ Error Messages**
If a node fails, you'll see:
- Red error box
- Detailed error message
- Stack trace (if available)

---

## **4. Execution Logs** 📋

At the bottom, you'll see a complete execution log:

```
[2024-12-16 14:30:01] INFO - Starting workflow execution
[2024-12-16 14:30:02] INFO - Executing node: writer
[2024-12-16 14:30:15] INFO - Node writer completed
[2024-12-16 14:30:15] INFO - Executing node: editor
[2024-12-16 14:30:28] INFO - Node editor completed
[2024-12-16 14:30:28] INFO - Workflow completed successfully
```

Log levels:
- 📘 **INFO** - Normal operation (blue)
- ⚠️ **WARN** - Warnings (yellow)
- ❌ **ERROR** - Errors (red)

---

## **5. Monitoring Multi-Agent Conversations** 💬

### **Example: 2-Agent Story Pipeline**

**Workflow Setup:**
```
Start → Writer Agent → Editor Agent → End
```

**What You'll See:**

#### **Step 1: Writer Agent Running**
```
🕐 Workflow Running... • LIVE

Progress: 1 / 3 nodes completed
[▓▓▓▓▓▓░░░░░░░░░░░░] 33%

Writer Agent                          ⚙️ RUNNING
  Input: {"topic": "robots"}
  Agent Response: [Loading...]
```

#### **Step 2: Writer Agent Complete**
```
Writer Agent                          ✅ COMPLETED
  Input: {"topic": "robots"}
  
  Agent Response: ✓
  ╭────────────────────────────────────────╮
  │ Once upon a time, in a distant future, │
  │ there was a robot named ZX-7...        │
  ╰────────────────────────────────────────╯
```

#### **Step 3: Editor Agent Running**
```
Progress: 2 / 3 nodes completed
[▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░] 67%

Editor Agent                          ⚙️ RUNNING
  Input: {
    "story": "Once upon a time..."
  }
  Agent Response: [Loading...]
```

#### **Step 4: Complete!**
```
✅ COMPLETED

Progress: 3 / 3 nodes completed
[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

Editor Agent                          ✅ COMPLETED
  Input: {"story": "Once upon a time..."}
  
  Agent Response: ✓
  ╭────────────────────────────────────────╮
  │ In a distant future, a robot named     │
  │ ZX-7 discovered the meaning of...     │
  │ [Edited and improved version]          │
  ╰────────────────────────────────────────╯
```

---

## **6. Advanced Monitoring** 🔬

### **Phase 4 Debug Tools**

Access advanced debugging via API:

#### **Execution Timeline**
```bash
curl http://localhost:8000/api/debug/execution/{execution_id}/timeline
```

Shows:
- Exact timestamps for each operation
- Time spent in each node
- Performance metrics

#### **Node-Specific Details**
```bash
curl http://localhost:8000/api/debug/execution/{execution_id}/node/{node_id}
```

Deep dive into:
- Detailed input/output
- Internal state
- Error traces

#### **Workflow Statistics**
```bash
curl http://localhost:8000/api/debug/workflow/{workflow_id}/stats
```

View:
- Success rate
- Average execution time
- Failure patterns

---

## **7. Tips for Effective Monitoring** 💡

### **✅ DO:**
- Watch the **LIVE banner** to know when it's running
- Read **Agent Responses** to see the conversation
- Check **Progress Bar** to estimate time remaining
- Review **Execution Logs** for detailed timeline
- Use **Node States** to debug failures

### **❌ DON'T:**
- Close browser while executing (it will continue server-side)
- Refresh page during execution (you can, but need to navigate back)
- Worry if it takes 10-30 seconds per agent (LLM API calls are slow)

### **🎯 Best Practices:**
1. **Test with Simple Workflows First**
   - Start with 1-2 agents
   - Use short prompts
   - Verify outputs look good

2. **Monitor Token Usage**
   - Long conversations = more tokens
   - Set `max_tokens` in agent config
   - Use cheaper models for testing (gpt-4o-mini)

3. **Save Successful Executions**
   - Export execution results via API
   - Use debug endpoints for analysis
   - Build workflow templates from successful runs

---

## **8. Real-Time WebSocket Streaming** 🔄

### **Backend Support (Already Built!)**
The backend has WebSocket support for streaming:

**Endpoint:** `ws://localhost:8000/ws/executions/{execution_id}`

**What It Streams:**
- Node start events
- Node completion events
- Partial outputs (as they're generated)
- Status updates
- Error events

### **Frontend Integration (Future Enhancement)**
Currently using **polling** (every 2 seconds). Could upgrade to WebSocket for:
- Instant updates (< 100ms latency)
- Lower server load
- Streaming text as AI generates it
- Real-time token-by-token output

---

## **9. Example Monitoring Session** 📖

### **Scenario: Research Workflow**

```
Workflow: Research Assistant
Nodes: Start → Researcher → Analyzer → Summarizer → End
Input: {"topic": "quantum computing"}
```

### **Timeline:**

**T+0s**: Execute clicked
```
Status: PENDING
Progress: 0%
```

**T+2s**: Researcher starts
```
🕐 Workflow Running... • LIVE
Status: RUNNING
Progress: [▓▓▓▓░░░░░░░░] 20%

Researcher                            ⚙️ RUNNING
  Calling OpenAI API (gpt-4o)...
```

**T+18s**: Researcher completes
```
Progress: [▓▓▓▓▓▓▓▓░░░░] 40%

Researcher                            ✅ COMPLETED
  Agent Response: ✓
  "Quantum computing leverages quantum
   mechanics principles like superposition..."
   [500 words of research]
```

**T+20s**: Analyzer starts
```
Analyzer                              ⚙️ RUNNING
  Analyzing research data...
```

**T+35s**: Analyzer completes
```
Progress: [▓▓▓▓▓▓▓▓▓▓▓▓] 60%

Analyzer                              ✅ COMPLETED
  Agent Response: ✓
  "Key insights: 1) Quantum supremacy
   achieved in 2019, 2) Main challenges..."
```

**T+37s**: Summarizer starts & completes
```
Progress: [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

Summarizer                            ✅ COMPLETED
  Agent Response: ✓
  "Quantum computing represents a paradigm
   shift in computation, with significant
   progress made but challenges remaining..."
```

**T+38s**: Workflow complete!
```
Status: ✅ COMPLETED
Duration: 38 seconds
All nodes executed successfully
```

---

## **10. Troubleshooting** 🔧

### **Problem: "Workflow seems stuck"**
**Solution:**
- Check the blue LIVE banner - if it's there, it's running
- LLM API calls can take 10-30 seconds
- Look at which node is "RUNNING"
- Check backend logs for API errors

### **Problem: "Can't see execution"**
**Solution:**
- Click the "Execution" tab
- Check if you have the execution ID
- Try clicking "Execute" again
- Check browser console for errors

### **Problem: "Agent response is empty"**
**Solution:**
- Check if OpenAI API key is set (`.env` file)
- Verify agent has valid system prompt
- Check execution logs for API errors
- Try with a simpler prompt first

### **Problem: "Polling stopped"**
**Solution:**
- Refresh the page
- Navigate back to Execution tab
- Check if workflow already completed
- Verify backend is still running

---

## **11. Performance Tips** ⚡

### **For Faster Monitoring:**
- ✅ Use `gpt-4o-mini` for testing (faster, cheaper)
- ✅ Set `max_tokens` to limit response length
- ✅ Use shorter system prompts
- ✅ Test with 1-2 agents before scaling up

### **For Better Insights:**
- ✅ Add descriptive names to nodes
- ✅ Use the debug API endpoints
- ✅ Export executions for analysis
- ✅ Track success rates over time

---

## **🎉 Summary**

**You can monitor workflows by:**

1. ✅ **Clicking "Execute"** - Auto-switches to monitoring
2. 👀 **Watching the LIVE banner** - Know it's running
3. 📊 **Checking progress bar** - See completion percentage  
4. 💬 **Reading agent responses** - See the conversation!
5. 📋 **Reviewing execution logs** - Detailed timeline
6. 🔍 **Using debug tools** - Advanced analysis

**The system automatically:**
- Polls every 2 seconds
- Updates all displays in real-time
- Shows exactly what each agent said
- Tracks progress through the workflow
- Logs everything for debugging

**Happy monitoring!** 🚀

