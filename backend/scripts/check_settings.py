"""Check settings in database and cache"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from sqlalchemy import select
from backend.database.db import AsyncSessionLocal
from backend.database.models import SettingsDB, UserDB
from backend.api.settings_routes import _settings_cache, get_active_llm_config

async def check_settings():
    async with AsyncSessionLocal() as db:
        # Check users
        result = await db.execute(select(UserDB))
        users = result.scalars().all()
        print("Users in database:")
        for u in users:
            print(f"  - {u.username} (ID: {u.id})")
        
        print("\nSettings in database:")
        result = await db.execute(select(SettingsDB))
        settings_list = result.scalars().all()
        for s in settings_list:
            print(f"  - user_id: {s.user_id}")
            if s.settings_data:
                providers = s.settings_data.get('providers', [])
                print(f"    Providers: {len(providers)}")
                for p in providers:
                    print(f"      - {p.get('name')}: enabled={p.get('enabled')}, has_key={bool(p.get('apiKey'))}")
            else:
                print(f"    No settings data")
        
        print(f"\nSettings cache keys: {list(_settings_cache.keys())}")
        print(f"Cache size: {len(_settings_cache)}")
        
        # Test get_active_llm_config for different user IDs
        print("\nTesting get_active_llm_config:")
        for u in users:
            config = get_active_llm_config(u.id)
            print(f"  User {u.username} ({u.id}): {config is not None}")
            if config:
                print(f"    Config: {config.get('type')} - {config.get('model')}")
        
        # Test anonymous
        config = get_active_llm_config(None)
        print(f"  Anonymous (None): {config is not None}")
        if config:
            print(f"    Config: {config.get('type')} - {config.get('model')}")

if __name__ == "__main__":
    asyncio.run(check_settings())

