"""Verify workflow ownership"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB, WorkflowDB

async def verify_ownership(username: str):
    """Verify all workflows belong to the specified user"""
    async with AsyncSessionLocal() as db:
        # Get user by username
        result = await db.execute(
            select(UserDB).where(UserDB.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return
        
        print(f"✅ User: {user.username} (ID: {user.id})\n")
        
        # Get all workflows
        result = await db.execute(select(WorkflowDB))
        workflows = result.scalars().all()
        
        print(f"Total workflows: {len(workflows)}\n")
        
        # Check ownership
        owned_by_user = []
        unowned = []
        owned_by_other = []
        
        for workflow in workflows:
            if workflow.owner_id == user.id:
                owned_by_user.append(workflow)
            elif workflow.owner_id is None:
                unowned.append(workflow)
            else:
                owned_by_other.append(workflow)
        
        print(f"✅ Owned by {username}: {len(owned_by_user)}")
        if owned_by_user:
            for w in owned_by_user:
                print(f"   - {w.name} (ID: {w.id[:8]}...)")
        
        if unowned:
            print(f"\n⚠️  Unowned workflows: {len(unowned)}")
            for w in unowned:
                print(f"   - {w.name} (ID: {w.id[:8]}...)")
        
        if owned_by_other:
            print(f"\n❌ Owned by other users: {len(owned_by_other)}")
            for w in owned_by_other:
                print(f"   - {w.name} (ID: {w.id[:8]}..., owner: {w.owner_id})")
        
        if len(owned_by_user) == len(workflows):
            print(f"\n✅ All {len(workflows)} workflow(s) belong to {username}")
        else:
            print(f"\n⚠️  Not all workflows belong to {username}")

if __name__ == "__main__":
    username = sys.argv[1] if len(sys.argv) > 1 else "rshoemake"
    asyncio.run(verify_ownership(username))

