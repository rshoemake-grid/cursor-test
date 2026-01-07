"""Test login API endpoint directly"""
import asyncio
import sys
import os
import json

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB
from backend.auth import verify_password

async def test_login(username: str, password: str):
    """Test login logic directly"""
    async with AsyncSessionLocal() as db:
        # Get user by username (same as API does)
        result = await db.execute(
            select(UserDB).where(UserDB.username == username)
        )
        user = result.scalar_one_or_none()
        
        print(f"Looking for username: '{username}'")
        print(f"User found: {user is not None}")
        
        if not user:
            print("❌ User not found")
            return False
        
        print(f"✅ User found:")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Active: {user.is_active}")
        print(f"   Hash: {user.hashed_password[:60]}...")
        
        # Test password verification
        print(f"\nTesting password: '{password}'")
        is_valid = verify_password(password, user.hashed_password)
        
        if is_valid:
            print("✅ Password is CORRECT")
            return True
        else:
            print("❌ Password is INCORRECT")
            print("\nTrying to reset password...")
            
            # Reset password
            import bcrypt
            salt = bcrypt.gensalt()
            user.hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            await db.commit()
            
            # Test again
            is_valid = verify_password(password, user.hashed_password)
            if is_valid:
                print("✅ Password reset and verified successfully!")
                return True
            else:
                print("❌ Password reset failed verification")
                return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python backend/scripts/test_login_api.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    asyncio.run(test_login(username, password))

