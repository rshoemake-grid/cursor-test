"""Copy settings from anonymous to a specific user"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import SettingsDB, UserDB

async def copy_settings_to_user(username: str):
    """Copy anonymous settings to a specific user"""
    async with AsyncSessionLocal() as db:
        # Get user
        result = await db.execute(
            select(UserDB).where(UserDB.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"❌ User '{username}' not found")
            return
        
        print(f"✅ Found user: {username} (ID: {user.id})")
        
        # Get anonymous settings
        result = await db.execute(
            select(SettingsDB).where(SettingsDB.user_id == "anonymous")
        )
        anonymous_settings = result.scalar_one_or_none()
        
        if not anonymous_settings or not anonymous_settings.settings_data:
            print("❌ No anonymous settings found")
            return
        
        print(f"✅ Found anonymous settings with {len(anonymous_settings.settings_data.get('providers', []))} providers")
        
        # Check if user already has settings
        result = await db.execute(
            select(SettingsDB).where(SettingsDB.user_id == user.id)
        )
        user_settings = result.scalar_one_or_none()
        
        if user_settings:
            # Update existing settings
            user_settings.settings_data = anonymous_settings.settings_data
            print(f"✅ Updated existing settings for user {username}")
        else:
            # Create new settings
            user_settings = SettingsDB(
                user_id=user.id,
                settings_data=anonymous_settings.settings_data
            )
            db.add(user_settings)
            print(f"✅ Created new settings for user {username}")
        
        await db.commit()
        
        # Update cache if it exists
        try:
            from backend.api.settings_routes import _settings_cache
            from backend.api.settings_routes import LLMSettings
            settings_obj = LLMSettings(**user_settings.settings_data)
            _settings_cache[user.id] = settings_obj
            print(f"✅ Updated settings cache")
        except Exception as e:
            print(f"⚠️  Could not update cache: {e}")
        
        print(f"\n✅ Successfully copied anonymous settings to user {username}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/scripts/copy_settings_to_user.py <username>")
        print("Example: python backend/scripts/copy_settings_to_user.py rshoemake")
        sys.exit(1)
    
    username = sys.argv[1]
    asyncio.run(copy_settings_to_user(username))

