"""
Script to create a user with email and password.
Usage: python backend/scripts/create_user.py <email> <username> <password>
"""
import asyncio
import sys
import os
import uuid

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB
from backend.auth import get_password_hash

async def create_user(email: str, username: str, password: str):
    """Create a new user"""
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(
            select(UserDB).where(
                (UserDB.email == email) | (UserDB.username == username)
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"❌ User already exists: {existing.username} ({existing.email})")
            return False
        
        # Create new user
        user = UserDB(
            id=str(uuid.uuid4()),
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_admin=False
        )
        
        db.add(user)
        await db.commit()
        
        print(f"✅ User created successfully:")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   ID: {user.id}")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python backend/scripts/create_user.py <email> <username> <password>")
        sys.exit(1)
    
    email = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]
    
    print(f"Creating user {username} ({email})...")
    asyncio.run(create_user(email, username, password))

