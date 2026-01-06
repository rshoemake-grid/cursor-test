"""Reseed script to delete and recreate the Local File Processing template with correct edge connections"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, delete
from dotenv import load_dotenv

load_dotenv()

from backend.database.models import WorkflowTemplateDB, Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./workflows.db")

engine = create_async_engine(DATABASE_URL, echo=True, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def reseed_local_file_processing_template():
    """Delete existing template and recreate with correct edge connections"""
    
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        try:
            # Delete existing template
            result = await session.execute(
                select(WorkflowTemplateDB).where(
                    WorkflowTemplateDB.name == "Local File Processing Workflow"
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print(f"Deleting existing template: {existing.name} (ID: {existing.id})")
                await session.delete(existing)
                await session.commit()
                print("✅ Template deleted")
            else:
                print("No existing template found to delete")
            
            # Now import and run the seed script
            from backend.scripts.seed_local_file_processing_template import seed_local_file_processing_template
            await seed_local_file_processing_template()
            
        except Exception as e:
            print(f"Error reseeding template: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(reseed_local_file_processing_template())

