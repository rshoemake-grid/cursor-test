"""Assign ownership of all workflows to a specific user"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select, update
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB, WorkflowDB

async def assign_ownership(username: str):
    """Assign all workflows to the specified user"""
    async with AsyncSessionLocal() as db:
        # Get user by username
        result = await db.execute(
            select(UserDB).where(UserDB.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return
        
        print(f"✅ Found user: {user.username} (ID: {user.id})")
        
        # Get all workflows
        result = await db.execute(select(WorkflowDB))
        workflows = result.scalars().all()
        
        print(f"\nFound {len(workflows)} workflow(s)")
        
        # Update workflows that don't have an owner or have a different owner
        updated_count = 0
        for workflow in workflows:
            if workflow.owner_id != user.id:
                old_owner = workflow.owner_id or "None"
                workflow.owner_id = user.id
                updated_count += 1
                print(f"  - '{workflow.name}' (ID: {workflow.id[:8]}...): {old_owner} → {user.id}")
        
        if updated_count > 0:
            await db.commit()
            print(f"\n✅ Successfully assigned ownership of {updated_count} workflow(s) to {user.username}")
        else:
            print(f"\n✅ All workflows already belong to {user.username}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/assign_workflow_ownership.py <username>")
        print("Example: python backend/scripts/assign_workflow_ownership.py rshoemake")
        sys.exit(1)
    
    username = sys.argv[1]
    asyncio.run(assign_ownership(username))

