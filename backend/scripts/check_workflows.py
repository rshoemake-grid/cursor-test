"""Quick script to check workflows in database"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import WorkflowDB

async def check():
    async with AsyncSessionLocal() as db:
        # Check all workflows
        result = await db.execute(select(WorkflowDB))
        all_workflows = result.scalars().all()
        print(f'Total workflows: {len(all_workflows)}')
        
        # Check public workflows
        result = await db.execute(select(WorkflowDB).where(WorkflowDB.is_public == True))
        public_workflows = result.scalars().all()
        print(f'Public workflows: {len(public_workflows)}')
        
        # Check workflows with no owner
        result = await db.execute(select(WorkflowDB).where(WorkflowDB.owner_id == None))
        no_owner_workflows = result.scalars().all()
        print(f'Workflows with no owner: {len(no_owner_workflows)}')
        
        print('\nSample workflows:')
        for w in all_workflows[:10]:
            print(f'  - {w.name} (public={w.is_public}, owner={w.owner_id})')

if __name__ == "__main__":
    asyncio.run(check())

