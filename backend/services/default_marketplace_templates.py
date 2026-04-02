"""
Bundled workflow templates for an empty marketplace (idempotent seeding).

Templates are listed in GET /api/v1/templates and shown on the Marketplace page.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import WorkflowDB, WorkflowTemplateDB
from backend.models.schemas import TemplateCategory, TemplateDifficulty

# Shape matches rows inserted by the historical seed script (author_id=None = system templates).
BUNDLED_MARKETPLACE_TEMPLATES: List[Dict[str, Any]] = [
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
                    "data": {"label": "Start", "name": "Start"},
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
                            "temperature": 0.7,
                        },
                        "inputs": [{"name": "topic", "source_field": "topic"}],
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "writer"},
                {"id": "e2", "source": "writer", "target": "end"},
            ],
            "variables": {"topic": ""},
        },
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
                    "data": {"label": "Start", "name": "Start"},
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
                            "temperature": 0.7,
                        },
                        "inputs": [
                            {"name": "recipient", "source_field": "recipient"},
                            {"name": "subject", "source_field": "subject"},
                            {"name": "tone", "source_field": "tone"},
                        ],
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "email_writer"},
                {"id": "e2", "source": "email_writer", "target": "end"},
            ],
            "variables": {"recipient": "", "subject": "", "tone": "professional"},
        },
    },
    {
        "name": "Code Review Assistant",
        "description": "Review code snippets and provide feedback on style, bugs, and improvements.",
        "category": TemplateCategory.AUTOMATION,
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
                    "data": {"label": "Start", "name": "Start"},
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
                            "temperature": 0.3,
                        },
                        "inputs": [
                            {"name": "code", "source_field": "code"},
                            {"name": "language", "source_field": "language"},
                        ],
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "reviewer"},
                {"id": "e2", "source": "reviewer", "target": "end"},
            ],
            "variables": {"code": "", "language": "python"},
        },
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
                    "data": {"label": "Start", "name": "Start"},
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
                            "temperature": 0.8,
                        },
                        "inputs": [
                            {"name": "topic", "source_field": "topic"},
                            {"name": "platform", "source_field": "platform"},
                            {"name": "tone", "source_field": "tone"},
                        ],
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "content_creator"},
                {"id": "e2", "source": "content_creator", "target": "end"},
            ],
            "variables": {"topic": "", "platform": "twitter", "tone": "casual"},
        },
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
                    "data": {"label": "Start", "name": "Start"},
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
                            "temperature": 0.5,
                        },
                        "inputs": [
                            {"name": "data", "source_field": "data"},
                            {"name": "analysis_type", "source_field": "analysis_type"},
                        ],
                    },
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 300},
                    "data": {"label": "End", "name": "End"},
                },
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "analyst"},
                {"id": "e2", "source": "analyst", "target": "end"},
            ],
            "variables": {"data": "", "analysis_type": "summary"},
        },
    },
]

BUNDLED_TEMPLATE_COUNT = len(BUNDLED_MARKETPLACE_TEMPLATES)


async def ensure_default_marketplace_templates(db: AsyncSession) -> int:
    """
    If workflow_templates has no rows, insert bundled official templates.

    Returns the number of templates inserted (0 if the table was already non-empty).
    """
    result = await db.execute(select(func.count(WorkflowTemplateDB.id)))
    existing_count = result.scalar() or 0
    if existing_count > 0:
        return 0

    for template_data in BUNDLED_MARKETPLACE_TEMPLATES:
        category = template_data["category"]
        difficulty = template_data["difficulty"]
        db.add(
            WorkflowTemplateDB(
                id=str(uuid.uuid4()),
                name=template_data["name"],
                description=template_data["description"],
                category=category.value if hasattr(category, "value") else str(category),
                tags=template_data["tags"],
                definition=template_data["definition"],
                difficulty=difficulty.value if hasattr(difficulty, "value") else str(difficulty),
                estimated_time=template_data["estimated_time"],
                is_official=template_data["is_official"],
                author_id=None,
            )
        )

    await db.commit()
    return BUNDLED_TEMPLATE_COUNT


async def ensure_default_marketplace_workflows(db: AsyncSession) -> int:
    """
    If no discoverable workflows exist yet, insert bundled rows on ``workflows``.

    Discover APIs (e.g. ``GET /marketplace/discover``) use ``WorkflowDB`` with
    ``is_public`` or ``is_template``. Repository templates use ``workflow_templates``
    separately; this keeps both catalogs populated on a fresh install.
    """
    result = await db.execute(
        select(func.count(WorkflowDB.id)).where(
            or_(
                WorkflowDB.is_public == True,
                WorkflowDB.is_template == True,
            )
        )
    )
    if (result.scalar() or 0) > 0:
        return 0

    for template_data in BUNDLED_MARKETPLACE_TEMPLATES:
        category = template_data["category"]
        db.add(
            WorkflowDB(
                id=str(uuid.uuid4()),
                name=template_data["name"],
                description=template_data["description"],
                version="1.0.0",
                definition=template_data["definition"],
                owner_id=None,
                is_public=True,
                is_template=False,
                category=category.value if hasattr(category, "value") else str(category),
                tags=list(template_data["tags"]),
            )
        )

    await db.commit()
    return BUNDLED_TEMPLATE_COUNT
