"""
Additional tests for template_routes.py - covering more paths
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.api.template_routes import create_template, list_templates, get_template
from backend.models.schemas import WorkflowTemplateCreate, TemplateCategory, TemplateDifficulty
from backend.database.models import WorkflowTemplateDB, UserDB
from datetime import datetime


@pytest.mark.asyncio
async def test_create_template_success(db_session):
    """Test create_template success (lines 30-65)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    user = UserDB(
        id=user_id,
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False,
        created_at=datetime.utcnow()
    )
    
    template_data = WorkflowTemplateCreate(
        name="New Template",
        description="Description",
        category=TemplateCategory.AUTOMATION,
        tags=["tag1"],
        definition={"nodes": [], "edges": []},
        difficulty=TemplateDifficulty.BEGINNER,
        estimated_time="5 minutes"
    )
    
    result = await create_template(
        template_data=template_data,
        current_user=user,
        db=db_session
    )
    
    assert result.name == template_data.name
    assert result.is_official is False  # Non-admin
    db_session.add.assert_called_once()
    db_session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_list_templates_with_difficulty_filter(db_session):
    """Test list_templates with difficulty filter (lines 88-89)"""
    template = WorkflowTemplateDB(
        id="template-1",
        name="Test",
        category=TemplateCategory.AUTOMATION.value,
        difficulty=TemplateDifficulty.BEGINNER.value,
        definition={"nodes": []},
        tags=[],
        is_official=False,
        uses_count=0,
        likes_count=0,
        rating=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    user = UserDB(
        id="user-123",
        username="author",
        email="author@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.all.return_value = [(template, user.username)]
        mock_execute.return_value = mock_result
        
        result = await list_templates(
            difficulty="beginner",
            db=db_session
        )
        
        assert len(result) == 1


@pytest.mark.asyncio
async def test_get_template_with_author(db_session):
    """Test get_template with author lookup (lines 165-191)"""
    from uuid import uuid4
    
    author_id = str(uuid4())
    template = WorkflowTemplateDB(
        id="template-1",
        name="Test",
        category=TemplateCategory.AUTOMATION.value,
        definition={"nodes": []},
        tags=[],
        author_id=author_id,
        is_official=False,
        difficulty="beginner",
        uses_count=0,
        likes_count=0,
        rating=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        def execute_side_effect(query):
            mock_result = MagicMock()
            if "workflow_templates" in str(query):
                mock_result.scalar_one_or_none.return_value = template
            else:
                mock_result.scalar_one_or_none.return_value = "author-username"
            return mock_result
        
        mock_execute.side_effect = execute_side_effect
        
        result = await get_template(template_id="template-1", db=db_session)
        
        assert result.id == template.id
        assert result.author_name == "author-username"
