"""
Utility script to remove duplicate workflow templates from the database.
Run this if you see duplicate templates in the marketplace.

Usage:
    python3 backend/scripts/cleanup_duplicate_templates.py
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

# Import models (adjust import path as needed)
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.database.models import WorkflowTemplateDB


async def remove_duplicate_templates():
    """Remove duplicate templates, keeping the oldest version of each unique name."""
    engine = create_async_engine('sqlite+aiosqlite:///./workflows.db', echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Get all templates ordered by creation date
        result = await session.execute(
            select(WorkflowTemplateDB).order_by(WorkflowTemplateDB.created_at)
        )
        templates = result.scalars().all()
        
        print(f"Found {len(templates)} total templates\n")
        
        # Track seen templates by name
        seen_names = set()
        duplicates_to_delete = []
        
        for template in templates:
            if template.name in seen_names:
                duplicates_to_delete.append(template)
                print(f"❌ Duplicate found: {template.name} (ID: {template.id[:8]}...)")
            else:
                seen_names.add(template.name)
                print(f"✅ Keeping: {template.name} (ID: {template.id[:8]}...)")
        
        if not duplicates_to_delete:
            print("\n✨ No duplicates found! Database is clean.")
            await engine.dispose()
            return
        
        # Delete duplicates
        for template in duplicates_to_delete:
            await session.delete(template)
        
        await session.commit()
        
        print(f"\n{'='*50}")
        print(f"✅ Successfully removed {len(duplicates_to_delete)} duplicate templates")
        print(f"📊 Remaining templates: {len(seen_names)}")
        print(f"{'='*50}")
    
    await engine.dispose()


if __name__ == "__main__":
    print("🧹 Cleaning up duplicate workflow templates...\n")
    asyncio.run(remove_duplicate_templates())

