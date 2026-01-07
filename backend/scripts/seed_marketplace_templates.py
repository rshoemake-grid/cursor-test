"""
Seed script to populate the marketplace with sample templates.
Run this to populate the marketplace with example templates.
"""
import asyncio
import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from backend.database.db import AsyncSessionLocal, init_db
from backend.database.models import WorkflowTemplateDB
from backend.models.schemas import TemplateCategory, TemplateDifficulty
import uuid


SAMPLE_TEMPLATES = [
    {
        "name": "Content Writer",
        "description": "A simple content generation workflow with a single AI writer agent.",
        "category": TemplateCategory.CONTENT_CREATION,
        "tags": ["writing", "content", "beginner"],
        "difficulty": TemplateDifficulty.BEGINNER,
        "estimated_time": "2 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 250, "y": 100},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "writer",
                    "type": "agent",
                    "position": {"x": 250, "y": 200},
                    "data": {
                        "label": "Content Writer",
                        "name": "Content Writer",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "You are a professional content writer. Create engaging, well-structured content based on the given topic.",
                            "temperature": 0.7
                        },
                        "inputs": [
                            {"name": "topic", "source_field": "topic"}
                        ]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "writer"},
                {"id": "e2", "source": "writer", "target": "end"}
            ],
            "variables": {"topic": ""}
        }
    },
    {
        "name": "Email Draft Generator",
        "description": "Generate professional email drafts with customizable tone and style.",
        "category": TemplateCategory.AUTOMATION,
        "tags": ["email", "communication", "productivity"],
        "difficulty": TemplateDifficulty.BEGINNER,
        "estimated_time": "3 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 250, "y": 100},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "email_writer",
                    "type": "agent",
                    "position": {"x": 250, "y": 200},
                    "data": {
                        "label": "Email Writer",
                        "name": "Email Writer",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "You are a professional email writer. Create clear, concise, and professional email drafts.",
                            "temperature": 0.7
                        },
                        "inputs": [
                            {"name": "recipient", "source_field": "recipient"},
                            {"name": "subject", "source_field": "subject"},
                            {"name": "tone", "source_field": "tone"}
                        ]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "email_writer"},
                {"id": "e2", "source": "email_writer", "target": "end"}
            ],
            "variables": {
                "recipient": "",
                "subject": "",
                "tone": "professional"
            }
        }
    },
    {
        "name": "Code Review Assistant",
        "description": "Review code snippets and provide feedback on style, bugs, and improvements.",
        "category": TemplateCategory.DEVELOPMENT,
        "tags": ["code", "review", "development"],
        "difficulty": TemplateDifficulty.INTERMEDIATE,
        "estimated_time": "5 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 250, "y": 100},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "reviewer",
                    "type": "agent",
                    "position": {"x": 250, "y": 200},
                    "data": {
                        "label": "Code Reviewer",
                        "name": "Code Reviewer",
                        "agent_config": {
                            "model": "gpt-4",
                            "system_prompt": "You are an expert code reviewer. Analyze code for bugs, style issues, performance problems, and suggest improvements.",
                            "temperature": 0.3
                        },
                        "inputs": [
                            {"name": "code", "source_field": "code"},
                            {"name": "language", "source_field": "language"}
                        ]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "reviewer"},
                {"id": "e2", "source": "reviewer", "target": "end"}
            ],
            "variables": {
                "code": "",
                "language": "python"
            }
        }
    },
    {
        "name": "Social Media Post Creator",
        "description": "Create engaging social media posts for multiple platforms with different tones.",
        "category": TemplateCategory.CONTENT_CREATION,
        "tags": ["social-media", "marketing", "content"],
        "difficulty": TemplateDifficulty.BEGINNER,
        "estimated_time": "3 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 250, "y": 100},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "content_creator",
                    "type": "agent",
                    "position": {"x": 250, "y": 200},
                    "data": {
                        "label": "Social Media Creator",
                        "name": "Social Media Creator",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "You are a social media content creator. Create engaging, platform-appropriate posts that capture attention.",
                            "temperature": 0.8
                        },
                        "inputs": [
                            {"name": "topic", "source_field": "topic"},
                            {"name": "platform", "source_field": "platform"},
                            {"name": "tone", "source_field": "tone"}
                        ]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "content_creator"},
                {"id": "e2", "source": "content_creator", "target": "end"}
            ],
            "variables": {
                "topic": "",
                "platform": "twitter",
                "tone": "casual"
            }
        }
    },
    {
        "name": "Data Analysis Assistant",
        "description": "Analyze data and generate insights with structured reporting.",
        "category": TemplateCategory.DATA_ANALYSIS,
        "tags": ["data", "analysis", "insights"],
        "difficulty": TemplateDifficulty.INTERMEDIATE,
        "estimated_time": "10 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 250, "y": 100},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "analyst",
                    "type": "agent",
                    "position": {"x": 250, "y": 200},
                    "data": {
                        "label": "Data Analyst",
                        "name": "Data Analyst",
                        "agent_config": {
                            "model": "gpt-4",
                            "system_prompt": "You are a data analyst. Analyze provided data and generate clear, actionable insights with visualizations suggestions.",
                            "temperature": 0.5
                        },
                        "inputs": [
                            {"name": "data", "source_field": "data"},
                            {"name": "analysis_type", "source_field": "analysis_type"}
                        ]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "analyst"},
                {"id": "e2", "source": "analyst", "target": "end"}
            ],
            "variables": {
                "data": "",
                "analysis_type": "summary"
            }
        }
    }
]


async def seed_templates():
    """Seed the database with sample templates"""
    # Initialize database first
    await init_db()
    
    async with AsyncSessionLocal() as db:
        # Check if templates already exist
        from sqlalchemy import select, func
        result = await db.execute(select(func.count(WorkflowTemplateDB.id)))
        existing_count = result.scalar()
        
        if existing_count > 0:
            print(f"⚠️  Found {existing_count} existing templates. Skipping seed.")
            print("   To re-seed, delete existing templates first or modify this script.")
            return
        
        # Add templates
        for template_data in SAMPLE_TEMPLATES:
            template = WorkflowTemplateDB(
                id=str(uuid.uuid4()),
                name=template_data["name"],
                description=template_data["description"],
                category=template_data["category"].value,
                tags=template_data["tags"],
                definition=template_data["definition"],
                difficulty=template_data["difficulty"].value,
                estimated_time=template_data["estimated_time"],
                is_official=template_data["is_official"],
                author_id=None  # System templates
            )
            
            db.add(template)
        
        await db.commit()
        print(f"✅ Seeded {len(SAMPLE_TEMPLATES)} workflow templates")
        print("\nTemplates added:")
        for template_data in SAMPLE_TEMPLATES:
            print(f"  - {template_data['name']} ({template_data['category'].value})")


if __name__ == "__main__":
    print("🌱 Seeding workflow templates for marketplace...")
    asyncio.run(seed_templates())
    print("\n✨ Done! The marketplace should now be populated.")

