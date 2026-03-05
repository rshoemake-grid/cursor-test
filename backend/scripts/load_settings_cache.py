"""Load settings into cache"""
import asyncio
import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.database.db import AsyncSessionLocal
from backend.services.settings_service import SettingsService

async def load():
    async with AsyncSessionLocal() as db:
        settings_service = SettingsService()
        await settings_service.load_settings_into_cache(db)
        from backend.utils.settings_cache import get_settings_cache
        cache = get_settings_cache()
        print(f"Loaded {len(cache)} settings into cache")
        print(f"Cache keys: {list(cache.keys())}")

if __name__ == "__main__":
    asyncio.run(load())

