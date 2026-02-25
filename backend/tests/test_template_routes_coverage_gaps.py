"""
Additional tests for template_routes.py coverage gaps
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from backend.api.template_routes import use_template, delete_template
from backend.database.models import WorkflowTemplateDB, UserDB


@pytest.mark.asyncio
async def test_use_template_success(db_session):
    """Test use_template success"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    user = MagicMock()
    user.id = user_id
    
    template = WorkflowTemplateDB(
        id="template-1",
        name="Test Template",
        definition={"nodes": [], "edges": []},
        category="automation",
        uses_count=5
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = template
        mock_execute.return_value = mock_result
        
        result = await use_template(
            template_id=template.id,
            name=None,
            description=None,
            current_user=user,
            db=db_session
        )
        
        assert result.name == f"{template.name} (from template)"
        assert template.uses_count == 6


@pytest.mark.asyncio
async def test_use_template_not_found(db_session):
    """Test use_template when template not found"""
    user = MagicMock()
    user.id = "user-123"
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await use_template(
                template_id="nonexistent",
                name=None,
                description=None,
                current_user=user,
                db=db_session
            )
        
        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_template_not_authorized(db_session):
    """Test delete_template by non-author non-admin"""
    user = MagicMock()
    user.id = "user-123"
    user.is_admin = False
    
    template = WorkflowTemplateDB(
        id="template-1",
        name="Test",
        category="automation",
        definition={"nodes": []},
        author_id="other-user-id"
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = template
        mock_execute.return_value = mock_result
        
        with pytest.raises(HTTPException) as exc_info:
            await delete_template(
                template_id=template.id,
                current_user=user,
                db=db_session
            )
        
        assert exc_info.value.status_code == 403
