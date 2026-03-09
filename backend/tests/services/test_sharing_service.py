"""
Unit tests for SharingService.
"""
import pytest
import uuid
from datetime import datetime

from backend.services.sharing_service import SharingService
from backend.exceptions import UserNotFoundError, VersionNotFoundError
from backend.database.models import (
    WorkflowDB,
    WorkflowShareDB,
    WorkflowVersionDB,
    UserDB,
)


@pytest.fixture
async def test_user(db_session):
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
async def other_user(db_session):
    user = UserDB(
        id=str(uuid.uuid4()),
        username="otheruser",
        email="other@example.com",
        hashed_password="hashed",
        is_active=True,
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
async def test_workflow(db_session, test_user):
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=test_user.id,
        is_public=False,
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.fixture
def sharing_service(db_session):
    return SharingService(db_session)


@pytest.mark.asyncio
async def test_share_workflow_success(sharing_service, test_workflow, test_user, other_user):
    """Share workflow with another user."""
    share = await sharing_service.share_workflow(
        workflow_id=test_workflow.id,
        shared_with_username=other_user.username,
        permission="edit",
        shared_by=test_user.id,
    )
    assert share.workflow_id == test_workflow.id
    assert share.shared_with_user_id == other_user.id
    assert share.permission == "edit"
    assert share.shared_by == test_user.id


@pytest.mark.asyncio
async def test_share_workflow_user_not_found(sharing_service, test_workflow, test_user):
    """Share with non-existent user raises UserNotFoundError."""
    with pytest.raises(UserNotFoundError):
        await sharing_service.share_workflow(
            workflow_id=test_workflow.id,
            shared_with_username="nonexistent",
            permission="view",
            shared_by=test_user.id,
        )


@pytest.mark.asyncio
async def test_share_workflow_update_existing(sharing_service, test_workflow, test_user, other_user):
    """Share again updates permission."""
    share1 = await sharing_service.share_workflow(
        workflow_id=test_workflow.id,
        shared_with_username=other_user.username,
        permission="view",
        shared_by=test_user.id,
    )
    share2 = await sharing_service.share_workflow(
        workflow_id=test_workflow.id,
        shared_with_username=other_user.username,
        permission="edit",
        shared_by=test_user.id,
    )
    assert share1.id == share2.id
    assert share2.permission == "edit"


@pytest.mark.asyncio
async def test_get_shared_with_me(sharing_service, test_workflow, test_user, other_user):
    """Get shares where user is recipient."""
    await sharing_service.share_workflow(
        workflow_id=test_workflow.id,
        shared_with_username=other_user.username,
        permission="view",
        shared_by=test_user.id,
    )
    shares = await sharing_service.get_shared_with_me(other_user.id)
    assert len(shares) == 1
    assert shares[0].shared_with_user_id == other_user.id


@pytest.mark.asyncio
async def test_get_shared_by_me(sharing_service, test_workflow, test_user, other_user):
    """Get shares where user is sharer."""
    await sharing_service.share_workflow(
        workflow_id=test_workflow.id,
        shared_with_username=other_user.username,
        permission="view",
        shared_by=test_user.id,
    )
    shares = await sharing_service.get_shared_by_me(test_user.id)
    assert len(shares) == 1
    assert shares[0].shared_by == test_user.id


@pytest.mark.asyncio
async def test_get_share_by_id(sharing_service, test_workflow, test_user, other_user):
    """Get share by ID."""
    share = await sharing_service.share_workflow(
        workflow_id=test_workflow.id,
        shared_with_username=other_user.username,
        permission="view",
        shared_by=test_user.id,
    )
    found = await sharing_service.get_share_by_id(share.id)
    assert found is not None
    assert found.id == share.id
    assert await sharing_service.get_share_by_id("nonexistent") is None


@pytest.mark.asyncio
async def test_revoke_share(sharing_service, test_workflow, test_user, other_user):
    """Revoke a share."""
    share = await sharing_service.share_workflow(
        workflow_id=test_workflow.id,
        shared_with_username=other_user.username,
        permission="view",
        shared_by=test_user.id,
    )
    await sharing_service.revoke_share(share)
    assert await sharing_service.get_share_by_id(share.id) is None


@pytest.mark.asyncio
async def test_create_workflow_version(sharing_service, test_workflow, test_user):
    """Create a workflow version."""
    version = await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition=test_workflow.definition,
        change_notes="Initial",
        created_by=test_user.id,
    )
    assert version.workflow_id == test_workflow.id
    assert version.version_number == 1
    assert version.change_notes == "Initial"


@pytest.mark.asyncio
async def test_create_workflow_version_increments(sharing_service, test_workflow, test_user):
    """Second version has version_number 2."""
    await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition=test_workflow.definition,
        change_notes="v1",
        created_by=test_user.id,
    )
    v2 = await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition={"nodes": [], "edges": [], "variables": {}},
        change_notes="v2",
        created_by=test_user.id,
    )
    assert v2.version_number == 2


@pytest.mark.asyncio
async def test_get_version_by_id(sharing_service, test_workflow, test_user):
    """Get version by ID."""
    version = await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition=test_workflow.definition,
        change_notes="Initial",
        created_by=test_user.id,
    )
    found = await sharing_service.get_version_by_id(version.id)
    assert found.id == version.id


@pytest.mark.asyncio
async def test_get_version_by_id_not_found(sharing_service):
    """Version not found raises VersionNotFoundError."""
    with pytest.raises(VersionNotFoundError):
        await sharing_service.get_version_by_id("nonexistent")


@pytest.mark.asyncio
async def test_get_workflow_versions(sharing_service, test_workflow, test_user):
    """Get all versions of a workflow."""
    await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition=test_workflow.definition,
        change_notes="v1",
        created_by=test_user.id,
    )
    await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition=test_workflow.definition,
        change_notes="v2",
        created_by=test_user.id,
    )
    versions = await sharing_service.get_workflow_versions(test_workflow.id)
    assert len(versions) == 2
    assert versions[0].version_number == 2
    assert versions[1].version_number == 1


@pytest.mark.asyncio
async def test_restore_workflow_version(sharing_service, test_workflow, test_user):
    """Restore workflow to previous version."""
    v1_def = {"nodes": [{"id": "n1"}], "edges": [], "variables": {}}
    v1 = await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition=v1_def,
        change_notes="v1",
        created_by=test_user.id,
    )
    v2_def = {"nodes": [{"id": "n2"}], "edges": [], "variables": {}}
    await sharing_service.create_workflow_version(
        workflow_id=test_workflow.id,
        definition=v2_def,
        change_notes="v2",
        created_by=test_user.id,
    )
    test_workflow.definition = v2_def
    await sharing_service.db.commit()
    version_num = await sharing_service.restore_workflow_version(v1.id, test_workflow)
    assert version_num == 1
    await sharing_service.db.refresh(test_workflow)
    assert test_workflow.definition == v1_def


@pytest.mark.asyncio
async def test_restore_workflow_version_not_found(sharing_service, test_workflow):
    """Restore with non-existent version raises VersionNotFoundError."""
    with pytest.raises(VersionNotFoundError):
        await sharing_service.restore_workflow_version("nonexistent", test_workflow)
