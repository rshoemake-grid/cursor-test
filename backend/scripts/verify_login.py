"""Verify login works by testing password directly with bcrypt"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import UserDB
import bcrypt

async def verify_login(email: str, password: str):
    """Test login with bcrypt directly"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(UserDB).where(UserDB.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User with email '{email}' not found")
            return False
        
        print(f"Found user: {user.username} ({user.email})")
        print(f"Password hash: {user.hashed_password[:60]}...")
        
        # Test with bcrypt directly
        try:
            is_valid = bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8'))
            if is_valid:
                print(f"✅ Password '{password}' is CORRECT (verified with bcrypt)")
                return True
            else:
                print(f"❌ Password '{password}' is INCORRECT")
                print(f"\nResetting password...")
                
                # Reset password
                salt = bcrypt.gensalt()
                user.hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
                await db.commit()
                
                # Verify again
                is_valid = bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8'))
                if is_valid:
                    print(f"✅ Password reset and verified successfully!")
                    return True
                else:
                    print(f"❌ Password reset failed verification")
                    return False
        except Exception as e:
            print(f"❌ Error verifying password: {e}")
            print(f"\nResetting password with fresh hash...")
            
            # Reset password
            salt = bcrypt.gensalt()
            user.hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            await db.commit()
            
            # Verify again
            is_valid = bcrypt.checkpw(password.encode('utf-8'), user.hashed_password.encode('utf-8'))
            if is_valid:
                print(f"✅ Password reset and verified successfully!")
                return True
            else:
                print(f"❌ Password reset failed verification")
                return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python backend/scripts/verify_login.py <email> <password>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    asyncio.run(verify_login(email, password))

