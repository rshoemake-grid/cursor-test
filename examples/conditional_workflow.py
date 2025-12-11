"""
Example: Conditional workflow with branching
This example creates a workflow that analyzes sentiment and routes to different agents
"""

import asyncio
import httpx
import json


BASE_URL = "http://localhost:8000/api"


async def create_conditional_workflow():
    """Create a workflow with conditional branching"""
    
    workflow = {
        "name": "Sentiment Analysis Router",
        "description": "Analyzes text sentiment and routes to appropriate response agent",
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "name": "Start",
                "inputs": [],
                "position": {"x": 250, "y": 50}
            },
            {
                "id": "sentiment_analyzer",
                "type": "agent",
                "name": "Sentiment Analyzer",
                "description": "Analyzes the sentiment of input text",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "Analyze the sentiment of the text. Respond with ONLY one word: 'positive', 'negative', or 'neutral'. No explanation.",
                    "temperature": 0.1,
                    "max_tokens": 10
                },
                "inputs": [
                    {
                        "name": "text",
                        "source_field": "text"
                    }
                ],
                "position": {"x": 250, "y": 150}
            },
            {
                "id": "sentiment_router",
                "type": "condition",
                "name": "Sentiment Router",
                "description": "Routes based on sentiment",
                "condition_config": {
                    "condition_type": "equals",
                    "field": "output",
                    "value": "positive"
                },
                "inputs": [
                    {
                        "name": "output",
                        "source_node": "sentiment_analyzer",
                        "source_field": "output"
                    }
                ],
                "position": {"x": 250, "y": 300}
            },
            {
                "id": "positive_responder",
                "type": "agent",
                "name": "Positive Response Generator",
                "description": "Generates enthusiastic response",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "The text was positive! Generate an enthusiastic, supportive response (2-3 sentences). Reference specific positive aspects.",
                    "temperature": 0.8,
                    "max_tokens": 150
                },
                "inputs": [
                    {
                        "name": "original_text",
                        "source_field": "text"
                    }
                ],
                "position": {"x": 100, "y": 450}
            },
            {
                "id": "negative_responder",
                "type": "agent",
                "name": "Supportive Response Generator",
                "description": "Generates empathetic response",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "The text was negative. Generate an empathetic, supportive response (2-3 sentences) that acknowledges concerns and offers encouragement.",
                    "temperature": 0.7,
                    "max_tokens": 150
                },
                "inputs": [
                    {
                        "name": "original_text",
                        "source_field": "text"
                    }
                ],
                "position": {"x": 400, "y": 450}
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
            {"id": "e1", "source": "start", "target": "sentiment_analyzer"},
            {"id": "e2", "source": "sentiment_analyzer", "target": "sentiment_router"},
            {"id": "e3", "source": "sentiment_router", "target": "positive_responder", "condition": "true"},
            {"id": "e4", "source": "sentiment_router", "target": "negative_responder", "condition": "false"},
            {"id": "e5", "source": "positive_responder", "target": "end"},
            {"id": "e6", "source": "negative_responder", "target": "end"}
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


async def execute_workflow(workflow_id: str, text: str):
    """Execute the conditional workflow"""
    
    print(f"Analyzing text: '{text}'")
    print("This workflow will:")
    print("  1. Analyze sentiment")
    print("  2. Route to appropriate responder")
    print("  3. Generate tailored response\n")
    
    execution_request = {
        "workflow_id": workflow_id,
        "inputs": {
            "text": text
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
        print(f"  Status: {execution_data['status']}\n")
        
        # Show which path was taken
        print("Execution Path:")
        print("-" * 60)
        for node_id, node_state in execution_data.get('node_states', {}).items():
            status_icon = "✓" if node_state['status'] == 'completed' else "✗"
            print(f"{status_icon} {node_id}: {node_state['status']}")
        print("-" * 60)
        print()
        
        # Print result
        if execution_data['result']:
            print("Final Response:")
            print("=" * 60)
            print(execution_data['result'])
            print("=" * 60)
        
        return execution_data


async def main():
    """Main function"""
    print("=" * 60)
    print("Agentic Workflow Engine - Conditional Workflow Example")
    print("=" * 60)
    print()
    
    # Create workflow
    workflow_id = await create_conditional_workflow()
    
    # Test with positive text
    print("\n" + "=" * 60)
    print("TEST 1: Positive Text")
    print("=" * 60 + "\n")
    await execute_workflow(
        workflow_id,
        "I absolutely love this product! It exceeded all my expectations and made my life so much easier."
    )
    
    # Test with negative text
    print("\n" + "=" * 60)
    print("TEST 2: Negative Text")
    print("=" * 60 + "\n")
    await execute_workflow(
        workflow_id,
        "I'm really disappointed with this service. It didn't work as advertised and caused me a lot of frustration."
    )
    
    print("\n✓ Example completed!")
    print("The workflow successfully routed to different agents based on sentiment!")


if __name__ == "__main__":
    asyncio.run(main())

