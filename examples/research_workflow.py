"""
Example: Research and summarize workflow
This example creates a workflow with multiple agents working sequentially
"""

import asyncio
import httpx
import json


BASE_URL = "http://localhost:8000/api"


async def create_research_workflow():
    """Create a research workflow with three agents"""
    
    workflow = {
        "name": "Research Assistant",
        "description": "Researches a topic, analyzes it, and creates a summary",
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "name": "Start",
                "position": {"x": 50, "y": 100}
            },
            {
                "id": "researcher",
                "type": "agent",
                "name": "Researcher",
                "description": "Researches the given topic",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are a research assistant. Provide detailed information and key facts about the given topic. Include important concepts, history, and current applications.",
                    "temperature": 0.5,
                    "max_tokens": 800
                },
                "inputs": [
                    {
                        "name": "topic",
                        "source_field": "topic"
                    }
                ],
                "position": {"x": 200, "y": 100}
            },
            {
                "id": "analyzer",
                "type": "agent",
                "name": "Analyzer",
                "description": "Analyzes the research",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are an analyst. Review the research provided and identify the 3 most important insights. Explain why each insight is significant.",
                    "temperature": 0.4,
                    "max_tokens": 600
                },
                "inputs": [
                    {
                        "name": "research",
                        "source_node": "researcher",
                        "source_field": "output"
                    }
                ],
                "position": {"x": 400, "y": 100}
            },
            {
                "id": "summarizer",
                "type": "agent",
                "name": "Summarizer",
                "description": "Creates a concise summary",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are a technical writer. Create a clear, concise summary (2-3 paragraphs) that combines the research and analysis. Make it accessible to a general audience.",
                    "temperature": 0.3,
                    "max_tokens": 400
                },
                "inputs": [
                    {
                        "name": "analysis",
                        "source_node": "analyzer",
                        "source_field": "output"
                    }
                ],
                "position": {"x": 600, "y": 100}
            },
            {
                "id": "end",
                "type": "end",
                "name": "End",
                "position": {"x": 800, "y": 100}
            }
        ],
        "edges": [
            {"id": "e1", "source": "start", "target": "researcher"},
            {"id": "e2", "source": "researcher", "target": "analyzer"},
            {"id": "e3", "source": "analyzer", "target": "summarizer"},
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


async def execute_workflow(workflow_id: str, topic: str):
    """Execute the research workflow"""
    
    print(f"Researching topic: '{topic}'")
    print("This workflow has 3 agents and may take 60-90 seconds...\n")
    
    execution_request = {
        "workflow_id": workflow_id,
        "inputs": {
            "topic": topic
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
        
        if execution_data['result']:
            print("Final Summary:")
            print("=" * 80)
            print(execution_data['result'])
            print("=" * 80)
        
        return execution_data


async def main():
    """Main function"""
    print("=" * 80)
    print("Agentic Workflow Engine - Research Example")
    print("=" * 80)
    print()
    
    # Create workflow
    workflow_id = await create_research_workflow()
    
    # Execute workflow
    topic = "quantum computing"
    await execute_workflow(workflow_id, topic)
    
    print("\n✓ Example completed!")


if __name__ == "__main__":
    asyncio.run(main())

