"""List all users in the database"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB

async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UserDB))
        users = result.scalars().all()
        
        if not users:
            print("No users found in database")
            return
        
        print(f"Found {len(users)} user(s):\n")
        for user in users:
            print(f"  - Username: {user.username}")
            print(f"    Email: {user.email}")
            print(f"    ID: {user.id}")
            print(f"    Active: {user.is_active}")
            print()

if __name__ == "__main__":
    asyncio.run(list_users())

