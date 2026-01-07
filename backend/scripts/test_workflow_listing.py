"""Test workflow listing for a user"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB, WorkflowDB
from backend.services.workflow_service import WorkflowService

async def test_listing(username: str):
    """Test workflow listing for a user"""
    async with AsyncSessionLocal() as db:
        # Get user
        result = await db.execute(
            select(UserDB).where(UserDB.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return
        
        print(f"✅ User: {user.username} (ID: {user.id})\n")
        
        # Test workflow service listing
        service = WorkflowService(db)
        
        # Test with user_id (authenticated)
        print("Testing with user_id (authenticated):")
        workflows = await service.list_workflows(user_id=user.id, include_public=True)
        print(f"  Found {len(workflows)} workflow(s)")
        for w in workflows:
            print(f"    - {w.name} (owner: {w.owner_id})")
        
        # Test without user_id (unauthenticated)
        print("\nTesting without user_id (unauthenticated):")
        workflows = await service.list_workflows(user_id=None, include_public=True)
        print(f"  Found {len(workflows)} workflow(s)")
        for w in workflows:
            print(f"    - {w.name} (owner: {w.owner_id}, public: {w.is_public})")

if __name__ == "__main__":
    username = sys.argv[1] if len(sys.argv) > 1 else "rshoemake"
    asyncio.run(test_listing(username))

