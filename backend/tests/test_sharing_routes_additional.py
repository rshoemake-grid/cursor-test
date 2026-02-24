"""
Additional tests for sharing_routes.py - covering more paths
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException
from backend.api.sharing_routes import (
    share_workflow,
    get_shared_workflows,
    get_my_shares,
    revoke_share,
    get_workflow_versions,
    restore_workflow_version
)
from backend.models.schemas import WorkflowShareCreate, WorkflowVersionCreate
from backend.database.models import WorkflowDB, WorkflowShareDB, WorkflowVersionDB, UserDB
from datetime import datetime


@pytest.mark.asyncio
async def test_share_workflow_update_existing(db_session):
    """Test share_workflow updating existing share (lines 60-65)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    workflow_id = str(uuid4())
    shared_with_user_id = str(uuid4())
    
    user = MagicMock()
    user.id = user_id
    
    workflow = WorkflowDB(
        id=workflow_id,
        name="Test",
        definition={},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    shared_with_user = UserDB(
        id=shared_with_user_id,
        username="shareduser",
        email="shared@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    existing_share = WorkflowShareDB(
        id=str(uuid4()),
        workflow_id=workflow_id,
        shared_with_user_id=shared_with_user_id,
        permission="read",
        shared_by=user_id,
        created_at=datetime.utcnow()
    )
    
    share_data = WorkflowShareCreate(
        workflow_id=workflow_id,
        shared_with_username="shareduser",
        permission="edit"
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        def execute_side_effect(query):
            mock_result = MagicMock()
            if "workflows" in str(query) and "users" not in str(query):
                mock_result.scalar_one_or_none.return_value = workflow
            elif "users" in str(query):
                mock_result.scalar_one_or_none.return_value = shared_with_user
            else:
                mock_result.scalar_one_or_none.return_value = existing_share
            return mock_result
        
        mock_execute.side_effect = execute_side_effect
        
        result = await share_workflow(
            share_data=share_data,
            current_user=user,
            db=db_session
        )
        
        assert result.permission == "write"
        assert existing_share.permission == "write"


@pytest.mark.asyncio
async def test_get_shared_workflows_success(db_session):
    """Test get_shared_workflows success (lines 95-112)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    user = MagicMock()
    user.id = user_id
    
    share = WorkflowShareDB(
        id=str(uuid4()),
        workflow_id="wf-123",
        shared_with_user_id=user_id,
        permission="read",
        shared_by="other-user",
        created_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [share]
        mock_execute.return_value = mock_result
        
        result = await get_shared_workflows(current_user=user, db=db_session)
        
        assert len(result) == 1
        assert result[0].workflow_id == "wf-123"


@pytest.mark.asyncio
async def test_get_my_shares_success(db_session):
    """Test get_my_shares success (lines 121-138)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    user = MagicMock()
    user.id = user_id
    
    share = WorkflowShareDB(
        id=str(uuid4()),
        workflow_id="wf-123",
        shared_with_user_id="other-user",
        permission="read",
        shared_by=user_id,
        created_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [share]
        mock_execute.return_value = mock_result
        
        result = await get_my_shares(current_user=user, db=db_session)
        
        assert len(result) == 1
        assert result[0].shared_by == user_id


@pytest.mark.asyncio
async def test_revoke_share_success(db_session):
    """Test revoke_share success (lines 148-166)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    workflow_id = str(uuid4())
    
    user = MagicMock()
    user.id = user_id
    
    share = WorkflowShareDB(
        id="share-123",
        workflow_id=workflow_id,
        shared_with_user_id="other-user",
        permission="read",
        shared_by=user_id,
        created_at=datetime.utcnow()
    )
    
    workflow = WorkflowDB(
        id=workflow_id,
        name="Test",
        definition={},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        def execute_side_effect(query):
            mock_result = MagicMock()
            if "workflow_shares" in str(query):
                mock_result.scalar_one_or_none.return_value = share
            else:
                mock_result.scalar_one_or_none.return_value = workflow
            return mock_result
        
        mock_execute.side_effect = execute_side_effect
        
        # Should not raise exception
        await revoke_share(share_id="share-123", current_user=user, db=db_session)
        
        # Verify share was deleted
        db_session.delete.assert_called_once()
        db_session.commit.assert_called_once()


@pytest.mark.asyncio
async def test_get_workflow_versions_owner_path(db_session):
    """Test get_workflow_versions as owner (lines 235-275)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    workflow_id = str(uuid4())
    
    user = MagicMock()
    user.id = user_id
    
    workflow = WorkflowDB(
        id=workflow_id,
        name="Test",
        definition={},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    version = WorkflowVersionDB(
        id=str(uuid4()),
        workflow_id=workflow_id,
        version_number=1,
        definition={},
        change_notes="Test",
        created_by=user_id,
        created_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        def execute_side_effect(query):
            mock_result = MagicMock()
            if "workflows" in str(query):
                mock_result.scalar_one_or_none.return_value = workflow
            else:
                mock_result.scalars.return_value.all.return_value = [version]
            return mock_result
        
        mock_execute.side_effect = execute_side_effect
        
        result = await get_workflow_versions(
            workflow_id=workflow_id,
            current_user=user,
            db=db_session
        )
        
        assert len(result) == 1
        assert result[0].version_number == 1


@pytest.mark.asyncio
async def test_restore_workflow_version_success(db_session):
    """Test restore_workflow_version success (lines 306-310)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    workflow_id = str(uuid4())
    version_id = str(uuid4())
    
    user = MagicMock()
    user.id = user_id
    
    version = WorkflowVersionDB(
        id=version_id,
        workflow_id=workflow_id,
        version_number=2,
        definition={"nodes": [], "edges": []},
        change_notes="Restore point",
        created_by=user_id,
        created_at=datetime.utcnow()
    )
    
    workflow = WorkflowDB(
        id=workflow_id,
        name="Test",
        definition={"nodes": [{"id": "current"}], "edges": []},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        def execute_side_effect(query):
            mock_result = MagicMock()
            if "workflow_versions" in str(query):
                mock_result.scalar_one_or_none.return_value = version
            else:
                mock_result.scalar_one_or_none.return_value = workflow
            return mock_result
        
        mock_execute.side_effect = execute_side_effect
        
        result = await restore_workflow_version(
            version_id=version_id,
            current_user=user,
            db=db_session
        )
        
        assert "message" in result
        assert workflow.definition == version.definition
