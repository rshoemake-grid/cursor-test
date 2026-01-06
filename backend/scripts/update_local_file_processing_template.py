"""Update script to fix the Local File Processing template edge connections"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from dotenv import load_dotenv

load_dotenv()

from backend.database.models import WorkflowTemplateDB, Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./workflows.db")

engine = create_async_engine(DATABASE_URL, echo=True, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def update_local_file_processing_template():
    """Update the Local File Processing template to fix edge connections"""
    
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        try:
            # Find the existing template
            result = await session.execute(
                select(WorkflowTemplateDB).where(
                    WorkflowTemplateDB.name == "Local File Processing Workflow"
                )
            )
            template = result.scalar_one_or_none()
            
            if not template:
                print("Template 'Local File Processing Workflow' not found. Nothing to update.")
                return
            
            print(f"Found template: {template.name} (ID: {template.id})")
            
            # Get the current definition
            definition = template.definition
            
            # Update the edges to ensure sourceHandle is set correctly
            edges = definition.get("edges", [])
            updated = False
            
            for edge in edges:
                # Fix the condition -> generate edge (should be "true")
                if edge.get("source") == "condition-1" and edge.get("target") == "agent-generate":
                    if edge.get("sourceHandle") != "true":
                        edge["sourceHandle"] = "true"
                        updated = True
                        print(f"Updated edge {edge.get('id')}: Set sourceHandle to 'true'")
                
                # Fix the condition -> write edge (should be "false")
                if edge.get("source") == "condition-1" and edge.get("target") == "agent-write":
                    if edge.get("sourceHandle") != "false":
                        edge["sourceHandle"] = "false"
                        updated = True
                        print(f"Updated edge {edge.get('id')}: Set sourceHandle to 'false'")
            
            if updated:
                # Update the definition
                template.definition = definition
                await session.commit()
                print(f"✅ Successfully updated template: {template.name}")
            else:
                print("Template edges are already correct. No updates needed.")
            
        except Exception as e:
            print(f"Error updating template: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(update_local_file_processing_template())

