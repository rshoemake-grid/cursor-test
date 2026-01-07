"""Quick script to check templates in database"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import WorkflowTemplateDB

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(WorkflowTemplateDB))
        templates = result.scalars().all()
        print(f'Found {len(templates)} templates')
        for t in templates:
            print(f'  - {t.name} ({t.category})')

if __name__ == "__main__":
    asyncio.run(check())

