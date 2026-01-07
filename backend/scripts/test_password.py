"""Test password verification for a user"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB
from backend.auth import verify_password

async def test_password(email: str, password: str):
    """Test if password works for user"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(UserDB).where(UserDB.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User with email '{email}' not found")
            return False
        
        print(f"Found user: {user.username} ({user.email})")
        print(f"Password hash: {user.hashed_password[:50]}...")
        
        # Test password verification
        is_valid = verify_password(password, user.hashed_password)
        
        if is_valid:
            print(f"✅ Password '{password}' is CORRECT")
        else:
            print(f"❌ Password '{password}' is INCORRECT")
            print(f"\nLet's reset it...")
            
            # Reset password
            import bcrypt
            salt = bcrypt.gensalt()
            user.hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            await db.commit()
            
            # Test again
            is_valid = verify_password(password, user.hashed_password)
            if is_valid:
                print(f"✅ Password reset and verified successfully!")
            else:
                print(f"❌ Password reset failed verification")
        
        return is_valid

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python backend/scripts/test_password.py <email> <password>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    asyncio.run(test_password(email, password))

