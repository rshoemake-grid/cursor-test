"""
Additional tests for sharing_routes.py coverage gaps - versioning
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from backend.api.sharing_routes import create_workflow_version
from backend.models.schemas import WorkflowVersionCreate
from backend.database.models import WorkflowDB, WorkflowVersionDB


@pytest.mark.asyncio
async def test_create_workflow_version_first_version(db_session):
    """Test create_workflow_version for first version"""
    from uuid import uuid4
    from datetime import datetime
    
    user_id = str(uuid4())
    workflow_id = str(uuid4())
    
    workflow = WorkflowDB(
        id=workflow_id,
        name="Test Workflow",
        description="Test",
        version="1.0.0",
        definition={"nodes": [], "edges": []},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    user = MagicMock()
    user.id = user_id
    
    version_data = WorkflowVersionCreate(
        workflow_id=workflow_id,
        change_notes="Initial version"
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_workflow_result = MagicMock()
        mock_workflow_result.scalar_one_or_none.return_value = workflow
        
        mock_version_result = MagicMock()
        mock_version_result.scalar_one_or_none.return_value = None
        
        def execute_side_effect(query):
            if "workflows" in str(query):
                return mock_workflow_result
            return mock_version_result
        
        mock_execute.side_effect = execute_side_effect
        
        result = await create_workflow_version(
            version_data=version_data,
            current_user=user,
            db=db_session
        )
        
        assert result.workflow_id == workflow_id
        assert result.version_number == 1
