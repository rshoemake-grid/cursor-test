"""
Simple API Test Script
Tests basic API functionality without executing workflows
"""

import asyncio
import httpx


BASE_URL = "http://localhost:8000"


async def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print(f"✓ Health check passed: {response.json()}")
                return True
            else:
                print(f"✗ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Could not connect to API: {e}")
            print("  Make sure the server is running: python main.py")
            return False


async def test_root():
    """Test root endpoint"""
    print("\nTesting root endpoint...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Root endpoint passed")
                print(f"  API: {data.get('message')}")
                print(f"  Version: {data.get('version')}")
                return True
            else:
                print(f"✗ Root endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {e}")
            return False


async def test_workflow_list():
    """Test listing workflows"""
    print("\nTesting workflow list endpoint...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/api/workflows")
            if response.status_code == 200:
                workflows = response.json()
                print(f"✓ Workflow list endpoint passed")
                print(f"  Found {len(workflows)} workflow(s)")
                return True
            else:
                print(f"✗ Workflow list failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {e}")
            return False


async def test_create_simple_workflow():
    """Test creating a simple workflow"""
    print("\nTesting workflow creation...")
    
    workflow = {
        "name": "API Test Workflow",
        "description": "Simple workflow for testing",
        "nodes": [
            {
                "id": "test_agent",
                "type": "agent",
                "name": "Test Agent",
                "agent_config": {
                    "model": "gpt-4o-mini",
                    "system_prompt": "You are a test agent. Respond with 'Test successful!'",
                    "temperature": 0.5
                },
                "inputs": [
                    {
                        "name": "input",
                        "source_field": "test_input"
                    }
                ],
                "position": {"x": 100, "y": 100}
            }
        ],
        "edges": [],
        "variables": {}
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/workflows",
                json=workflow
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Workflow creation passed")
                print(f"  Created: {data.get('name')}")
                print(f"  ID: {data.get('id')}")
                return True, data.get('id')
            else:
                print(f"✗ Workflow creation failed: {response.status_code}")
                print(f"  Response: {response.text}")
                return False, None
        except Exception as e:
            print(f"✗ Error: {e}")
            return False, None


async def test_get_workflow(workflow_id):
    """Test getting a workflow by ID"""
    print(f"\nTesting workflow retrieval...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/api/workflows/{workflow_id}")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Workflow retrieval passed")
                print(f"  Name: {data.get('name')}")
                print(f"  Nodes: {len(data.get('nodes', []))}")
                return True
            else:
                print(f"✗ Workflow retrieval failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {e}")
            return False


async def test_delete_workflow(workflow_id):
    """Test deleting a workflow"""
    print(f"\nTesting workflow deletion...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(f"{BASE_URL}/api/workflows/{workflow_id}")
            if response.status_code == 200:
                print(f"✓ Workflow deletion passed")
                return True
            else:
                print(f"✗ Workflow deletion failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error: {e}")
            return False


async def main():
    """Run all tests"""
    print("=" * 60)
    print("Agentic Workflow Engine - API Tests")
    print("=" * 60)
    
    # Test basic connectivity
    health_ok = await test_health()
    if not health_ok:
        print("\n" + "=" * 60)
        print("✗ Cannot connect to API. Please start the server first:")
        print("  python main.py")
        print("=" * 60)
        return
    
    # Test endpoints
    await test_root()
    await test_workflow_list()
    
    # Test CRUD operations
    success, workflow_id = await test_create_simple_workflow()
    
    if success and workflow_id:
        await test_get_workflow(workflow_id)
        await test_delete_workflow(workflow_id)
    
    print("\n" + "=" * 60)
    print("✓ API tests completed!")
    print("\nTo test workflow execution:")
    print("  python examples/simple_workflow.py")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

