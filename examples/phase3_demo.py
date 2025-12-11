"""
Phase 3 Demo: WebSocket Streaming, Memory, and Tool Calling
This example demonstrates the new Phase 3 capabilities
"""

import asyncio
import httpx
import websockets
import json
from datetime import datetime


BASE_URL = "http://localhost:8000/api"
WS_URL = "ws://localhost:8000/api"


async def create_tool_workflow():
    """Create a workflow that uses tool calling"""
    
    workflow = {
        "name": "Math Problem Solver with Tools",
        "description": "Solves math problems using calculator and Python executor tools",
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "name": "Start",
                "inputs": [],
                "position": {"x": 250, "y": 50}
            },
            {
                "id": "problem_solver",
                "type": "agent",
                "name": "Problem Solver",
                "description": "Solves math problems using available tools",
                "agent_config": {
                    "model": "gpt-4o",
                    "system_prompt": "You are a math problem solver. Use the calculator or python_executor tools to solve problems. Show your work step by step.",
                    "temperature": 0.3,
                    "max_tokens": 500,
                    "tools": ["calculator", "python_executor"]
                },
                "inputs": [
                    {
                        "name": "problem",
                        "source_field": "problem"
                    }
                ],
                "position": {"x": 250, "y": 150}
            },
            {
                "id": "explainer",
                "type": "agent",
                "name": "Solution Explainer",
                "description": "Explains the solution in simple terms",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "Explain the mathematical solution in simple, easy-to-understand terms. Focus on the reasoning and steps taken.",
                    "temperature": 0.7,
                    "max_tokens": 300
                },
                "inputs": [
                    {
                        "name": "solution",
                        "source_node": "problem_solver",
                        "source_field": "output"
                    }
                ],
                "position": {"x": 250, "y": 300}
            },
            {
                "id": "end",
                "type": "end",
                "name": "End",
                "inputs": [],
                "position": {"x": 250, "y": 450}
            }
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "problem_solver"},
            {"id": "e2", "source": "problem_solver", "target": "explainer"},
            {"id": "e3", "source": "explainer", "target": "end"}
        ],
        "variables": {}
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/workflows", json=workflow)
        response.raise_for_status()
        workflow_data = response.json()
        print(f"✓ Created workflow: {workflow_data['name']}")
        print(f"  Workflow ID: {workflow_data['id']}\n")
        return workflow_data['id']


async def watch_execution(execution_id: str):
    """Watch execution via WebSocket"""
    uri = f"{WS_URL}/ws/executions/{execution_id}"
    
    print(f"🔴 Connecting to WebSocket: {uri}")
    print("📡 Listening for real-time updates...\n")
    
    try:
        async with websockets.connect(uri, ping_timeout=None) as websocket:
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                
                msg_type = data.get("type")
                timestamp = datetime.now().strftime("%H:%M:%S")
                
                if msg_type == "status":
                    status = data.get("status")
                    print(f"[{timestamp}] ⚡ STATUS: {status.upper()}")
                
                elif msg_type == "node_update":
                    node_id = data.get("node_id")
                    node_state = data.get("node_state", {})
                    status = node_state.get("status")
                    
                    if status == "running":
                        print(f"[{timestamp}] 🔄 NODE {node_id}: Started")
                    elif status == "completed":
                        output = node_state.get("output")
                        output_preview = str(output)[:100] + "..." if len(str(output)) > 100 else str(output)
                        print(f"[{timestamp}] ✅ NODE {node_id}: Completed")
                        print(f"           Output: {output_preview}")
                    elif status == "failed":
                        error = node_state.get("error")
                        print(f"[{timestamp}] ❌ NODE {node_id}: Failed - {error}")
                
                elif msg_type == "log":
                    log = data.get("log", {})
                    level = log.get("level")
                    message = log.get("message")
                    node_id = log.get("node_id", "WORKFLOW")
                    
                    icon = "📝" if level == "INFO" else "⚠️" if level == "WARNING" else "❌"
                    print(f"[{timestamp}] {icon} LOG [{node_id}]: {message}")
                
                elif msg_type == "completion":
                    result = data.get("result", {})
                    print(f"\n[{timestamp}] 🎉 EXECUTION COMPLETED!")
                    print(f"{'='*60}")
                    print("Final Result:")
                    print(result)
                    print(f"{'='*60}")
                    break
                
                elif msg_type == "error":
                    error = data.get("error")
                    print(f"\n[{timestamp}] ❌ EXECUTION FAILED: {error}")
                    break
    
    except websockets.exceptions.ConnectionClosed:
        print("\n🔌 WebSocket connection closed")
    except Exception as e:
        print(f"\n❌ WebSocket error: {e}")


async def execute_workflow(workflow_id: str, problem: str):
    """Execute the workflow"""
    
    print(f"Problem: {problem}\n")
    print("Starting execution with WebSocket monitoring...\n")
    
    execution_request = {
        "workflow_id": workflow_id,
        "inputs": {
            "problem": problem
        }
    }
    
    # Start execution
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{BASE_URL}/workflows/{workflow_id}/execute",
            json=execution_request
        )
        response.raise_for_status()
        execution_data = response.json()
        execution_id = execution_data['execution_id']
    
    # Watch via WebSocket
    await watch_execution(execution_id)


async def demo_memory():
    """Demonstrate memory features"""
    print("\n" + "="*60)
    print("MEMORY DEMO")
    print("="*60 + "\n")
    
    from backend.memory import MemoryManager
    
    # Create memory manager
    memory = MemoryManager(
        agent_id="demo_agent",
        max_conversation_messages=5,
        use_vector_memory=True
    )
    
    print("1. Adding conversation to short-term memory...")
    memory.add_interaction(
        user_message="What is Python?",
        assistant_message="Python is a high-level programming language known for its simplicity and readability.",
        save_to_longterm=True
    )
    print("   ✓ Saved to both short-term and long-term memory\n")
    
    print("2. Adding facts to long-term memory...")
    memory.add_fact(
        "Python was created by Guido van Rossum in 1991",
        metadata={"topic": "python", "type": "history"}
    )
    memory.add_fact(
        "Python emphasizes code readability with significant whitespace",
        metadata={"topic": "python", "type": "design"}
    )
    print("   ✓ Facts stored in vector database\n")
    
    print("3. Recalling relevant information...")
    query = "Who created Python and when?"
    relevant = memory.recall(query, n_results=2)
    print(f"   Query: '{query}'")
    print(f"   Retrieved {len(relevant)} relevant memories:")
    for i, mem in enumerate(relevant, 1):
        print(f"   {i}. {mem}\n")
    
    print("4. Getting conversation context...")
    context = memory.conversation.get_context_string()
    print(f"   Recent conversation:\n{context}\n")
    
    print("5. Building context for LLM prompt...")
    full_context = memory.get_context_for_prompt(
        "Tell me about Python",
        include_conversation=True,
        include_longterm=True
    )
    print(f"   Context length: {len(full_context)} characters")
    print(f"   Includes conversation history + relevant long-term memories\n")
    
    # Cleanup
    memory.clear_all()
    print("   ✓ Memory cleaned up")


async def demo_tools():
    """Demonstrate tool calling"""
    print("\n" + "="*60)
    print("TOOL CALLING DEMO")
    print("="*60 + "\n")
    
    from backend.tools import ToolRegistry
    
    print("Available tools:")
    for tool_name in ["calculator", "python_executor", "web_search"]:
        tool = ToolRegistry.get_tool(tool_name)
        print(f"  - {tool.name}: {tool.description}")
    print()
    
    print("1. Calculator Tool")
    print("   Expression: 15 * 23 + 17")
    calc_result = await ToolRegistry.execute_tool(
        "calculator",
        expression="15 * 23 + 17"
    )
    print(f"   Result: {calc_result}\n")
    
    print("2. Python Executor Tool")
    code = "result = sum([i**2 for i in range(1, 11)])"
    print(f"   Code: {code}")
    py_result = await ToolRegistry.execute_tool(
        "python_executor",
        code=code
    )
    print(f"   Result: {py_result}\n")
    
    print("3. Web Search Tool (placeholder)")
    search_result = await ToolRegistry.execute_tool(
        "web_search",
        query="Python programming",
        num_results=3
    )
    print(f"   Query: Python programming")
    print(f"   Results: {len(search_result.get('results', []))} found\n")


async def main():
    """Main demo function"""
    print("=" * 60)
    print("PHASE 3 DEMO: WebSockets, Memory, and Tool Calling")
    print("=" * 60)
    print()
    
    # Demo 1: Tool Calling via Workflow
    print("DEMO 1: Workflow with Tool Calling")
    print("-" * 60)
    workflow_id = await create_tool_workflow()
    
    problem = "What is the sum of the first 15 prime numbers?"
    await execute_workflow(workflow_id, problem)
    
    # Demo 2: Memory System
    await demo_memory()
    
    # Demo 3: Tool Calling
    await demo_tools()
    
    print("\n" + "=" * 60)
    print("✓ Phase 3 Demo Completed!")
    print("=" * 60)
    print()
    print("Phase 3 Features Demonstrated:")
    print("  ✓ WebSocket real-time streaming")
    print("  ✓ Agent memory (short-term & long-term)")
    print("  ✓ Tool calling framework")
    print("  ✓ Enhanced LLM agents")
    print()
    print("Next: Try building your own workflows with these features!")


if __name__ == "__main__":
    asyncio.run(main())

