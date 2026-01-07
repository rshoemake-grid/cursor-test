"""
Script to set password for a user by email.
Usage: python backend/scripts/set_password.py <email> <password>
"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB
from backend.auth import get_password_hash

async def set_password(email: str, password: str):
    """Set password for user with given email"""
    async with AsyncSessionLocal() as db:
        # Find user by email
        result = await db.execute(
            select(UserDB).where(UserDB.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User with email '{email}' not found")
            return False
        
        # Update password
        user.hashed_password = get_password_hash(password)
        await db.commit()
        
        print(f"✅ Password updated successfully for user: {user.username} ({user.email})")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python backend/scripts/set_password.py <email> <password>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    print(f"Setting password for {email}...")
    asyncio.run(set_password(email, password))

