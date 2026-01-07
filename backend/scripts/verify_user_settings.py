"""Verify user settings are correctly stored"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import SettingsDB, UserDB

async def verify():
    async with AsyncSessionLocal() as db:
        # Get rshoemake user
        result = await db.execute(
            select(UserDB).where(UserDB.username == "rshoemake")
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ User rshoemake not found")
            return
        
        print(f"✅ User: {user.username} (ID: {user.id})")
        
        # Get user settings
        result = await db.execute(
            select(SettingsDB).where(SettingsDB.user_id == user.id)
        )
        user_settings = result.scalar_one_or_none()
        
        if user_settings and user_settings.settings_data:
            providers = user_settings.settings_data.get('providers', [])
            print(f"✅ User has {len(providers)} providers configured")
            for p in providers:
                print(f"   - {p.get('name')}: enabled={p.get('enabled')}")
        else:
            print("❌ User has no settings")
        
        # Check anonymous settings still exist
        result = await db.execute(
            select(SettingsDB).where(SettingsDB.user_id == "anonymous")
        )
        anonymous_settings = result.scalar_one_or_none()
        
        if anonymous_settings:
            print(f"✅ Anonymous settings still exist ({len(anonymous_settings.settings_data.get('providers', []))} providers)")

if __name__ == "__main__":
    asyncio.run(verify())

