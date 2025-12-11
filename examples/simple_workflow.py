"""
Example: Simple sequential workflow with two agents
This example creates a workflow where one agent writes a story and another agent edits it.
"""

import asyncio
import httpx
import json
from datetime import datetime


BASE_URL = "http://localhost:8000/api"


async def create_simple_workflow():
    """Create a simple story writing and editing workflow"""
    
    workflow = {
        "name": "Story Writer and Editor",
        "description": "A workflow that writes a short story and then edits it",
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "name": "Start",
                "position": {"x": 100, "y": 100}
            },
            {
                "id": "writer",
                "type": "agent",
                "name": "Story Writer",
                "description": "Writes a short story based on a topic",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are a creative story writer. Write a short, engaging story (3-4 paragraphs) based on the given topic.",
                    "temperature": 0.8,
                    "max_tokens": 500
                },
                "inputs": [
                    {
                        "name": "topic",
                        "source_field": "topic"
                    }
                ],
                "position": {"x": 300, "y": 100}
            },
            {
                "id": "editor",
                "type": "agent",
                "name": "Story Editor",
                "description": "Edits and improves the story",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are a professional editor. Review the story and provide an edited version with improved grammar, style, and flow. Return only the edited story.",
                    "temperature": 0.3,
                    "max_tokens": 600
                },
                "inputs": [
                    {
                        "name": "story",
                        "source_node": "writer",
                        "source_field": "output"
                    }
                ],
                "position": {"x": 500, "y": 100}
            },
            {
                "id": "end",
                "type": "end",
                "name": "End",
                "position": {"x": 700, "y": 100}
            }
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "writer"},
            {"id": "e2", "source": "writer", "target": "editor"},
            {"id": "e3", "source": "editor", "target": "end"}
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


async def execute_workflow(workflow_id: str, topic: str):
    """Execute the workflow with a topic"""
    
    print(f"Executing workflow with topic: '{topic}'")
    print("This may take 30-60 seconds...\n")
    
    execution_request = {
        "workflow_id": workflow_id,
        "inputs": {
            "topic": topic
        }
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{BASE_URL}/workflows/{workflow_id}/execute",
            json=execution_request
        )
        response.raise_for_status()
        execution_data = response.json()
        
        print(f"✓ Execution completed!")
        print(f"  Execution ID: {execution_data['execution_id']}")
        print(f"  Status: {execution_data['status']}")
        print(f"  Duration: {(datetime.fromisoformat(execution_data['completed_at'].replace('Z', '+00:00')) - datetime.fromisoformat(execution_data['started_at'].replace('Z', '+00:00'))).total_seconds():.2f}s\n")
        
        # Print logs
        print("Execution Logs:")
        print("-" * 80)
        for log in execution_data['logs']:
            node_info = f"[{log['node_id']}]" if log['node_id'] else "[WORKFLOW]"
            print(f"{log['level']:7} {node_info:15} {log['message']}")
        print("-" * 80)
        print()
        
        # Print result
        if execution_data['result']:
            print("Final Result (Edited Story):")
            print("=" * 80)
            print(execution_data['result'])
            print("=" * 80)
        
        if execution_data['error']:
            print(f"\n⚠ Error: {execution_data['error']}")
        
        return execution_data


async def main():
    """Main function"""
    print("=" * 80)
    print("Agentic Workflow Engine - Simple Example")
    print("=" * 80)
    print()
    
    # Create workflow
    workflow_id = await create_simple_workflow()
    
    # Execute workflow
    topic = "a robot learning to paint"
    await execute_workflow(workflow_id, topic)
    
    print("\n✓ Example completed!")
    print(f"View API docs at: http://localhost:8000/docs")


if __name__ == "__main__":
    asyncio.run(main())

