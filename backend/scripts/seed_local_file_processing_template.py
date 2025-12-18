"""Seed script to add the Local File Processing template to the marketplace"""
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

from backend.database.models import WorkflowTemplateDB, Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./workflows.db")

engine = create_async_engine(DATABASE_URL, echo=True, future=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed_local_file_processing_template():
    """Create the Local File Processing template in the database"""
    
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Template definition matching the frontend structure
    template_definition = {
        "nodes": [
            {
                "id": "start-1",
                "type": "start",
                "name": "Start",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Start",
                    "name": "Start"
                }
            },
            {
                "id": "local_filesystem-read",
                "type": "local_filesystem",
                "name": "Read File",
                "description": "Read file from local filesystem",
                "position": {"x": 400, "y": 100},
                "input_config": {
                    "mode": "read",
                    "file_path": "",
                    "encoding": "utf-8"
                },
                "data": {
                    "label": "Read File",
                    "name": "Read File",
                    "description": "Read file from local filesystem",
                    "input_config": {
                        "mode": "read",
                        "file_path": "",
                        "encoding": "utf-8"
                    }
                }
            },
            {
                "id": "loop-1",
                "type": "loop",
                "name": "Process Lines",
                "description": "Iterate through file line by line",
                "position": {"x": 700, "y": 100},
                "loop_config": {
                    "loop_type": "for_each",
                    "max_iterations": 1000
                },
                "data": {
                    "label": "Process Lines",
                    "name": "Process Lines",
                    "description": "Iterate through file line by line",
                    "loop_config": {
                        "loop_type": "for_each",
                        "max_iterations": 1000
                    }
                }
            },
            {
                "id": "condition-1",
                "type": "condition",
                "name": "Check Missing Data",
                "description": "Check if data is missing in the line",
                "position": {"x": 1000, "y": 100},
                "condition_config": {
                    "field": "data",
                    "value": "",
                    "condition_type": "is_empty"
                },
                "data": {
                    "label": "Check Missing Data",
                    "name": "Check Missing Data",
                    "description": "Check if data is missing in the line",
                    "condition_config": {
                        "field": "data",
                        "value": "",
                        "condition_type": "is_empty"
                    }
                }
            },
            {
                "id": "agent-generate",
                "type": "agent",
                "name": "Generate Missing Data",
                "description": "Generate missing data using LLM",
                "position": {"x": 1300, "y": -50},
                "agent_config": {
                    "model": "gpt-4",
                    "system_prompt": "You are a data generation assistant. Generate the missing data fields based on the context provided.",
                    "max_tokens": 500
                },
                "data": {
                    "label": "Generate Missing Data",
                    "name": "Generate Missing Data",
                    "description": "Generate missing data using LLM",
                    "agent_config": {
                        "model": "gpt-4",
                        "system_prompt": "You are a data generation assistant. Generate the missing data fields based on the context provided.",
                        "max_tokens": 500
                    }
                }
            },
            {
                "id": "agent-write",
                "type": "agent",
                "name": "Prepare for Write",
                "description": "Process and prepare line for writing",
                "position": {"x": 1300, "y": 250},
                "agent_config": {
                    "model": "gpt-4",
                    "system_prompt": "Format and prepare the data line for writing to the output file.",
                    "max_tokens": 500
                },
                "data": {
                    "label": "Prepare for Write",
                    "name": "Prepare for Write",
                    "description": "Process and prepare line for writing",
                    "agent_config": {
                        "model": "gpt-4",
                        "system_prompt": "Format and prepare the data line for writing to the output file.",
                        "max_tokens": 500
                    }
                }
            },
            {
                "id": "local_filesystem-write",
                "type": "local_filesystem",
                "name": "Write File",
                "description": "Write processed file to local filesystem",
                "position": {"x": 1600, "y": 100},
                "input_config": {
                    "mode": "write",
                    "file_path": "",
                    "encoding": "utf-8"
                },
                "data": {
                    "label": "Write File",
                    "name": "Write File",
                    "description": "Write processed file to local filesystem",
                    "input_config": {
                        "mode": "write",
                        "file_path": "",
                        "encoding": "utf-8"
                    }
                }
            },
            {
                "id": "end-1",
                "type": "end",
                "name": "End",
                "position": {"x": 1900, "y": 100},
                "data": {
                    "label": "End",
                    "name": "End"
                }
            }
        ],
        "edges": [
            {
                "id": "e-start-read",
                "source": "start-1",
                "target": "local_filesystem-read"
            },
            {
                "id": "e-read-loop",
                "source": "local_filesystem-read",
                "target": "loop-1"
            },
            {
                "id": "e-loop-condition",
                "source": "loop-1",
                "target": "condition-1"
            },
            {
                "id": "e-condition-generate",
                "source": "condition-1",
                "target": "agent-generate",
                "sourceHandle": "true"
            },
            {
                "id": "e-condition-write",
                "source": "condition-1",
                "target": "agent-write",
                "sourceHandle": "false"
            },
            {
                "id": "e-generate-write-file",
                "source": "agent-generate",
                "target": "local_filesystem-write"
            },
            {
                "id": "e-write-write-file",
                "source": "agent-write",
                "target": "local_filesystem-write"
            },
            {
                "id": "e-write-file-end",
                "source": "local_filesystem-write",
                "target": "end-1"
            }
        ],
        "variables": {}
    }
    
    async with AsyncSessionLocal() as session:
        try:
            # Check if template already exists
            result = await session.execute(
                select(WorkflowTemplateDB).where(
                    WorkflowTemplateDB.name == "Local File Processing Workflow"
                )
            )
            existing = result.scalar_one_or_none()
            
            if existing:
                print("Template 'Local File Processing Workflow' already exists. Skipping.")
                return
            
            # Create new template
            template = WorkflowTemplateDB(
                id=str(uuid.uuid4()),
                name="Local File Processing Workflow",
                description="Process local file line by line, generate missing data, and write to output file",
                category="automation",
                tags=["local-filesystem", "file-processing", "data-generation", "automation"],
                definition=template_definition,
                is_official=True,
                difficulty="intermediate",
                estimated_time="15 minutes",
                author_id=None  # System template
            )
            
            session.add(template)
            await session.commit()
            print(f"Successfully created template: {template.name} (ID: {template.id})")
            
        except Exception as e:
            print(f"Error creating template: {e}")
            await session.rollback()
            raise
        finally:
            await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_local_file_processing_template())

