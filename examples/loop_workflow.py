"""
Example: Loop workflow with batch processing
This example creates a workflow that processes multiple items using a for-each loop
"""

import asyncio
import httpx
import json


BASE_URL = "http://localhost:8000/api"


async def create_loop_workflow():
    """Create a workflow with loop for batch processing"""
    
    workflow = {
        "name": "Multi-Topic Research Assistant",
        "description": "Researches multiple topics in sequence using a loop",
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "name": "Start",
                "inputs": [],
                "position": {"x": 250, "y": 50}
            },
            {
                "id": "topic_loop",
                "type": "loop",
                "name": "Topic Iterator",
                "description": "Iterates over topics",
                "loop_config": {
                    "loop_type": "for_each",
                    "items_source": "topics",
                    "max_iterations": 5
                },
                "inputs": [
                    {
                        "name": "topics",
                        "source_field": "topics"
                    }
                ],
                "position": {"x": 250, "y": 150}
            },
            {
                "id": "researcher",
                "type": "agent",
                "name": "Topic Researcher",
                "description": "Researches each topic",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are a research assistant. Provide 2-3 key facts about the given topic. Be concise and factual.",
                    "temperature": 0.5,
                    "max_tokens": 200
                },
                "inputs": [
                    {
                        "name": "topic",
                        "source_node": "topic_loop",
                        "source_field": "items"
                    }
                ],
                "position": {"x": 250, "y": 300}
            },
            {
                "id": "summarizer",
                "type": "agent",
                "name": "Summary Generator",
                "description": "Creates final summary",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "Create a cohesive summary combining the research on all topics. Highlight connections and key insights.",
                    "temperature": 0.6,
                    "max_tokens": 300
                },
                "inputs": [
                    {
                        "name": "all_research",
                        "source_node": "researcher",
                        "source_field": "output"
                    }
                ],
                "position": {"x": 250, "y": 450}
            },
            {
                "id": "end",
                "type": "end",
                "name": "End",
                "inputs": [],
                "position": {"x": 250, "y": 600}
            }
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "topic_loop"},
            {"id": "e2", "source": "topic_loop", "target": "researcher"},
            {"id": "e3", "source": "researcher", "target": "summarizer"},
            {"id": "e4", "source": "summarizer", "target": "end"}
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


async def execute_workflow(workflow_id: str, topics: list):
    """Execute the loop workflow"""
    
    print(f"Processing {len(topics)} topics:")
    for i, topic in enumerate(topics, 1):
        print(f"  {i}. {topic}")
    print()
    
    print("This workflow will:")
    print("  1. Initialize loop for all topics")
    print("  2. Research each topic sequentially")
    print("  3. Generate combined summary\n")
    
    execution_request = {
        "workflow_id": workflow_id,
        "inputs": {
            "topics": topics
        }
    }
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{BASE_URL}/workflows/{workflow_id}/execute",
            json=execution_request
        )
        response.raise_for_status()
        execution_data = response.json()
        
        print(f"✓ Execution completed!")
        print(f"  Status: {execution_data['status']}\n")
        
        # Show execution details
        print("Execution Details:")
        print("-" * 60)
        for node_id, node_state in execution_data.get('node_states', {}).items():
            status_icon = "✓" if node_state['status'] == 'completed' else "✗"
            print(f"{status_icon} {node_id}: {node_state['status']}")
            
            # Show loop info if available
            if 'loop_type' in str(node_state.get('output', {})):
                loop_info = node_state.get('output', {})
                if isinstance(loop_info, dict):
                    print(f"   Loop: {loop_info.get('total_iterations', 0)} iterations")
        print("-" * 60)
        print()
        
        # Print result
        if execution_data['result']:
            print("Final Summary:")
            print("=" * 60)
            print(execution_data['result'])
            print("=" * 60)
        
        return execution_data


async def main():
    """Main function"""
    print("=" * 60)
    print("Agentic Workflow Engine - Loop Workflow Example")
    print("=" * 60)
    print()
    
    # Create workflow
    workflow_id = await create_loop_workflow()
    
    # Execute with multiple topics
    topics = [
        "Artificial Intelligence",
        "Quantum Computing",
        "Renewable Energy"
    ]
    
    await execute_workflow(workflow_id, topics)
    
    print("\n✓ Example completed!")
    print("The workflow successfully processed all topics using a loop!")
    print("\nNote: In the current implementation, loop execution is simplified.")
    print("Full loop iteration with state management coming in future updates!")


if __name__ == "__main__":
    asyncio.run(main())

