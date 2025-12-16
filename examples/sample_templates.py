"""Sample workflow templates for Phase 4"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
        "name": "Write & Edit Pipeline",
        "description": "Two-stage content pipeline: first agent writes, second agent edits and improves.",
        "category": TemplateCategory.CONTENT_CREATION,
        "tags": ["writing", "editing", "pipeline", "beginner"],
        "difficulty": TemplateDifficulty.BEGINNER,
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
                    "id": "writer",
                    "type": "agent",
                    "position": {"x": 250, "y": 200},
                    "data": {
                        "label": "Writer",
                        "name": "Writer",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "You are a creative writer. Write engaging content about the given topic.",
                            "temperature": 0.8
                        },
                        "inputs": [{"name": "topic", "source_field": "topic"}]
                    }
                },
                {
                    "id": "editor",
                    "type": "agent",
                    "position": {"x": 250, "y": 300},
                    "data": {
                        "label": "Editor",
                        "name": "Editor",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "You are a professional editor. Improve the grammar, clarity, and style. Return only the edited version.",
                            "temperature": 0.3
                        },
                        "inputs": [{"name": "content", "source_node": "writer", "source_field": "output"}]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 400},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "writer"},
                {"id": "e2", "source": "writer", "target": "editor"},
                {"id": "e3", "source": "editor", "target": "end"}
            ],
            "variables": {"topic": ""}
        }
    },
    {
        "name": "Research Assistant",
        "description": "Multi-agent research workflow: researcher, analyzer, and summarizer.",
        "category": TemplateCategory.RESEARCH,
        "tags": ["research", "analysis", "intermediate"],
        "difficulty": TemplateDifficulty.INTERMEDIATE,
        "estimated_time": "10 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 250, "y": 50},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "researcher",
                    "type": "agent",
                    "position": {"x": 250, "y": 150},
                    "data": {
                        "label": "Researcher",
                        "name": "Researcher",
                        "agent_config": {
                            "model": "gpt-4o",
                            "system_prompt": "You are a research assistant. Gather comprehensive information about the given topic.",
                            "temperature": 0.5
                        },
                        "inputs": [{"name": "topic", "source_field": "topic"}]
                    }
                },
                {
                    "id": "analyzer",
                    "type": "agent",
                    "position": {"x": 250, "y": 250},
                    "data": {
                        "label": "Analyzer",
                        "name": "Analyzer",
                        "agent_config": {
                            "model": "gpt-4o",
                            "system_prompt": "You are an analyst. Analyze the research data and identify key insights and patterns.",
                            "temperature": 0.4
                        },
                        "inputs": [{"name": "research", "source_node": "researcher", "source_field": "output"}]
                    }
                },
                {
                    "id": "summarizer",
                    "type": "agent",
                    "position": {"x": 250, "y": 350},
                    "data": {
                        "label": "Summarizer",
                        "name": "Summarizer",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "You are a summarizer. Create a clear, concise summary of the analysis.",
                            "temperature": 0.3
                        },
                        "inputs": [{"name": "analysis", "source_node": "analyzer", "source_field": "output"}]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 450},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "researcher"},
                {"id": "e2", "source": "researcher", "target": "analyzer"},
                {"id": "e3", "source": "analyzer", "target": "summarizer"},
                {"id": "e4", "source": "summarizer", "target": "end"}
            ],
            "variables": {"topic": ""}
        }
    },
    {
        "name": "Customer Support Bot",
        "description": "Automated customer support workflow with sentiment analysis and response generation.",
        "category": TemplateCategory.CUSTOMER_SERVICE,
        "tags": ["support", "chatbot", "intermediate"],
        "difficulty": TemplateDifficulty.INTERMEDIATE,
        "estimated_time": "8 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 250, "y": 50},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "sentiment",
                    "type": "agent",
                    "position": {"x": 250, "y": 150},
                    "data": {
                        "label": "Sentiment Analyzer",
                        "name": "Sentiment Analyzer",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "Analyze the sentiment of this customer message. Respond with: positive, negative, or neutral.",
                            "temperature": 0.1
                        },
                        "inputs": [{"name": "message", "source_field": "customer_message"}]
                    }
                },
                {
                    "id": "responder",
                    "type": "agent",
                    "position": {"x": 250, "y": 250},
                    "data": {
                        "label": "Response Generator",
                        "name": "Response Generator",
                        "agent_config": {
                            "model": "gpt-4o",
                            "system_prompt": "You are a helpful customer support agent. Generate an empathetic, professional response to this customer message.",
                            "temperature": 0.6
                        },
                        "inputs": [
                            {"name": "message", "source_field": "customer_message"},
                            {"name": "sentiment", "source_node": "sentiment", "source_field": "output"}
                        ]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 250, "y": 350},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "sentiment"},
                {"id": "e2", "source": "sentiment", "target": "responder"},
                {"id": "e3", "source": "responder", "target": "end"}
            ],
            "variables": {"customer_message": ""}
        }
    },
    {
        "name": "Marketing Campaign Generator",
        "description": "Generate complete marketing campaigns with taglines, copy, and social media posts.",
        "category": TemplateCategory.MARKETING,
        "tags": ["marketing", "advertising", "advanced"],
        "difficulty": TemplateDifficulty.ADVANCED,
        "estimated_time": "15 minutes",
        "is_official": True,
        "definition": {
            "nodes": [
                {
                    "id": "start",
                    "type": "start",
                    "position": {"x": 400, "y": 50},
                    "data": {"label": "Start", "name": "Start"}
                },
                {
                    "id": "strategist",
                    "type": "agent",
                    "position": {"x": 400, "y": 150},
                    "data": {
                        "label": "Campaign Strategist",
                        "name": "Campaign Strategist",
                        "agent_config": {
                            "model": "gpt-4o",
                            "system_prompt": "You are a marketing strategist. Create a campaign strategy including target audience, key messages, and approach.",
                            "temperature": 0.7
                        },
                        "inputs": [
                            {"name": "product", "source_field": "product"},
                            {"name": "goals", "source_field": "goals"}
                        ]
                    }
                },
                {
                    "id": "copywriter",
                    "type": "agent",
                    "position": {"x": 200, "y": 250},
                    "data": {
                        "label": "Copywriter",
                        "name": "Copywriter",
                        "agent_config": {
                            "model": "gpt-4o",
                            "system_prompt": "You are a creative copywriter. Write compelling taglines and ad copy based on the strategy.",
                            "temperature": 0.8
                        },
                        "inputs": [{"name": "strategy", "source_node": "strategist", "source_field": "output"}]
                    }
                },
                {
                    "id": "social",
                    "type": "agent",
                    "position": {"x": 600, "y": 250},
                    "data": {
                        "label": "Social Media Creator",
                        "name": "Social Media Creator",
                        "agent_config": {
                            "model": "gpt-4o-mini",
                            "system_prompt": "Create engaging social media posts (Twitter, LinkedIn, Instagram) based on the strategy.",
                            "temperature": 0.7
                        },
                        "inputs": [{"name": "strategy", "source_node": "strategist", "source_field": "output"}]
                    }
                },
                {
                    "id": "end",
                    "type": "end",
                    "position": {"x": 400, "y": 350},
                    "data": {"label": "End", "name": "End"}
                }
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "strategist"},
                {"id": "e2", "source": "strategist", "target": "copywriter"},
                {"id": "e3", "source": "strategist", "target": "social"},
                {"id": "e4", "source": "copywriter", "target": "end"},
                {"id": "e5", "source": "social", "target": "end"}
            ],
            "variables": {"product": "", "goals": ""}
        }
    }
]


async def seed_templates():
    """Seed the database with sample templates"""
    # Initialize database first
    await init_db()
    
    async with AsyncSessionLocal() as db:
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


if __name__ == "__main__":
    print("🌱 Seeding workflow templates...")
    asyncio.run(seed_templates())
    print("✨ Done!")

