"""
Script to set password for a user by email.
Also creates the user if they don't exist.
Usage: python backend/scripts/set_password.py <email> <password> [username]
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

async def set_password(email: str, password: str, username: str = None):
    """Set password for user with given email, create user if doesn't exist"""
    async with AsyncSessionLocal() as db:
        # Find user by email
        result = await db.execute(
            select(UserDB).where(UserDB.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # Create user if doesn't exist
            if not username:
                # Extract username from email
                username = email.split('@')[0]
            
            # Check if username already taken
            result = await db.execute(
                select(UserDB).where(UserDB.username == username)
            )
            if result.scalar_one_or_none():
                username = f"{username}_{uuid.uuid4().hex[:8]}"
            
            print(f"Creating new user: {username} ({email})")
            user = UserDB(
                id=str(uuid.uuid4()),
                username=username,
                email=email,
                hashed_password="",  # Will set below
                is_active=True,
                is_admin=False
            )
            db.add(user)
            await db.flush()  # Get the user ID
        
        # Hash password using bcrypt directly (avoiding passlib version issues)
        try:
            import bcrypt
            salt = bcrypt.gensalt()
            user.hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        except ImportError:
            # Fallback to passlib if bcrypt not available
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            user.hashed_password = pwd_context.hash(password)
        
        await db.commit()
        
        print(f"✅ Password set successfully for user: {user.username} ({user.email})")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python backend/scripts/set_password.py <email> <password> [username]")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    username = sys.argv[3] if len(sys.argv) > 3 else None
    
    print(f"Setting password for {email}...")
    asyncio.run(set_password(email, password, username))
