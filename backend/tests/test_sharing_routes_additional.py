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

from backend.services.sharing_service import SharingService
from backend.services.workflow_ownership_service import WorkflowOwnershipService


@pytest.mark.asyncio
async def test_share_workflow_update_existing(db_session):
    """Test share_workflow updating existing share (lines 60-65)"""
    from uuid import uuid4
    
    user_id = str(uuid4())
    workflow_id = str(uuid4())
    shared_with_user_id = str(uuid4())
    
    owner = UserDB(
        id=user_id,
        username="owner",
        email="owner@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow()
    )
    shared_with_user = UserDB(
        id=shared_with_user_id,
        username="shareduser",
        email="shared@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow()
    )
    db_session.add(owner)
    db_session.add(shared_with_user)
    
    workflow = WorkflowDB(
        id=workflow_id,
        name="Test",
        definition={},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_session.add(workflow)
    
    existing_share = WorkflowShareDB(
        id=str(uuid4()),
        workflow_id=workflow_id,
        shared_with_user_id=shared_with_user_id,
        permission="view",
        shared_by=user_id,
        created_at=datetime.utcnow()
    )
    db_session.add(existing_share)
    await db_session.commit()
    await db_session.refresh(owner)
    await db_session.refresh(shared_with_user)
    await db_session.refresh(workflow)
    await db_session.refresh(existing_share)
    
    share_data = WorkflowShareCreate(
        workflow_id=workflow_id,
        shared_with_username="shareduser",
        permission="edit"
    )
    
    sharing = SharingService(db_session)
    ownership = WorkflowOwnershipService(db_session)

    result = await share_workflow(
        share_data=share_data,
        current_user=owner,
        ownership_service=ownership,
        sharing_service=sharing,
    )
    
    assert result.permission == "edit"
    await db_session.refresh(existing_share)
    assert existing_share.permission == "edit"


@pytest.mark.asyncio
async def test_get_shared_workflows_success(db_session):
    """Test get_shared_workflows success (lines 95-112)"""
    from uuid import uuid4

    user_id = str(uuid4())
    user = UserDB(
        id=user_id,
        username="viewer",
        email="viewer@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    share = WorkflowShareDB(
        id=str(uuid4()),
        workflow_id="wf-123",
        shared_with_user_id=user_id,
        permission="read",
        shared_by="other-user",
        created_at=datetime.utcnow(),
    )
    db_session.add(share)
    await db_session.commit()

    sharing = SharingService(db_session)
    result = await get_shared_workflows(current_user=user, sharing_service=sharing)

    assert len(result) == 1
    assert result[0].workflow_id == "wf-123"


@pytest.mark.asyncio
async def test_get_my_shares_success(db_session):
    """Test get_my_shares success (lines 121-138)"""
    from uuid import uuid4

    user_id = str(uuid4())
    user = UserDB(
        id=user_id,
        username="sharer",
        email="sharer@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)
    share = WorkflowShareDB(
        id=str(uuid4()),
        workflow_id="wf-123",
        shared_with_user_id="other-user",
        permission="read",
        shared_by=user_id,
        created_at=datetime.utcnow(),
    )
    db_session.add(share)
    await db_session.commit()

    sharing = SharingService(db_session)
    result = await get_my_shares(current_user=user, sharing_service=sharing)

    assert len(result) == 1
    assert result[0].shared_by == user_id


@pytest.mark.asyncio
async def test_revoke_share_success(db_session):
    """Test revoke_share success (lines 148-166)"""
    from uuid import uuid4
    from sqlalchemy import select
    
    user_id = str(uuid4())
    workflow_id = str(uuid4())
    share_id = str(uuid4())
    
    owner = UserDB(
        id=user_id,
        username="owner",
        email="owner@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow()
    )
    db_session.add(owner)
    
    workflow = WorkflowDB(
        id=workflow_id,
        name="Test",
        definition={},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_session.add(workflow)
    
    share = WorkflowShareDB(
        id=share_id,
        workflow_id=workflow_id,
        shared_with_user_id="other-user",
        permission="read",
        shared_by=user_id,
        created_at=datetime.utcnow()
    )
    db_session.add(share)
    await db_session.commit()
    
    ownership = WorkflowOwnershipService(db_session)
    sharing = SharingService(db_session)
    await revoke_share(
        share_id=share_id,
        current_user=owner,
        ownership_service=ownership,
        sharing_service=sharing,
    )
    
    result = await db_session.execute(select(WorkflowShareDB).where(WorkflowShareDB.id == share_id))
    assert result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_get_workflow_versions_owner_path(db_session):
    """Test get_workflow_versions as owner (lines 235-275)"""
    from uuid import uuid4

    user_id = str(uuid4())
    workflow_id = str(uuid4())

    user = MagicMock()
    user.id = user_id

    version = WorkflowVersionDB(
        id=str(uuid4()),
        workflow_id=workflow_id,
        version_number=1,
        definition={},
        change_notes="Test",
        created_by=user_id,
        created_at=datetime.utcnow(),
    )

    mock_ownership = MagicMock()
    mock_ownership.get_workflow_and_assert_can_read_or_share = AsyncMock()
    mock_sharing = MagicMock()
    mock_sharing.get_workflow_versions = AsyncMock(return_value=[version])

    result = await get_workflow_versions(
        workflow_id=workflow_id,
        current_user=user,
        ownership_service=mock_ownership,
        sharing_service=mock_sharing,
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
        created_at=datetime.utcnow(),
    )

    workflow = WorkflowDB(
        id=workflow_id,
        name="Test",
        definition={"nodes": [{"id": "current"}], "edges": []},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    mock_ownership = MagicMock()
    mock_ownership.get_workflow_and_assert_owner = AsyncMock(return_value=workflow)
    mock_sharing = MagicMock()
    mock_sharing.get_version_by_id = AsyncMock(return_value=version)

    async def _restore(vid, wf):
        wf.definition = version.definition
        return version.version_number

    mock_sharing.restore_workflow_version = AsyncMock(side_effect=_restore)

    result = await restore_workflow_version(
        version_id=version_id,
        current_user=user,
        ownership_service=mock_ownership,
        sharing_service=mock_sharing,
    )

    assert "message" in result
    assert workflow.definition == version.definition
