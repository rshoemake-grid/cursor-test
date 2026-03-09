"""
Unit tests for WorkflowLikeService.
"""
import pytest
import uuid
from datetime import datetime

from backend.services.workflow_like_service import WorkflowLikeService
from backend.exceptions import LikeNotFoundError
from backend.database.models import WorkflowDB, WorkflowLikeDB, UserDB


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
async def public_workflow(db_session, test_user):
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Public Workflow",
        definition={"nodes": [], "edges": [], "variables": {}},
        owner_id=test_user.id,
        is_public=True,
        likes_count=0,
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.fixture
def like_service(db_session):
    return WorkflowLikeService(db_session)


@pytest.mark.asyncio
async def test_like_workflow_success(like_service, public_workflow, test_user):
    """Like a workflow for the first time."""
    result = await like_service.like_workflow(
        public_workflow.id, test_user.id, public_workflow
    )
    assert result["message"] == "Liked successfully"
    await like_service.db.refresh(public_workflow)
    assert public_workflow.likes_count == 1


@pytest.mark.asyncio
async def test_like_workflow_already_liked(like_service, public_workflow, test_user):
    """Like again returns Already liked."""
    await like_service.like_workflow(
        public_workflow.id, test_user.id, public_workflow
    )
    result = await like_service.like_workflow(
        public_workflow.id, test_user.id, public_workflow
    )
    assert result["message"] == "Already liked"
    await like_service.db.refresh(public_workflow)
    assert public_workflow.likes_count == 1


@pytest.mark.asyncio
async def test_unlike_workflow_success(like_service, public_workflow, test_user):
    """Unlike a workflow."""
    await like_service.like_workflow(
        public_workflow.id, test_user.id, public_workflow
    )
    await like_service.unlike_workflow(public_workflow.id, test_user.id)
    await like_service.db.refresh(public_workflow)
    assert public_workflow.likes_count == 0


@pytest.mark.asyncio
async def test_unlike_workflow_not_found(like_service, public_workflow, test_user):
    """Unlike when not liked raises LikeNotFoundError."""
    with pytest.raises(LikeNotFoundError):
        await like_service.unlike_workflow(public_workflow.id, test_user.id)


@pytest.mark.asyncio
async def test_unlike_decrements_likes_count(like_service, public_workflow, test_user):
    """Unlike decrements likes_count, never below 0."""
    await like_service.like_workflow(
        public_workflow.id, test_user.id, public_workflow
    )
    await like_service.like_workflow(
        public_workflow.id, test_user.id, public_workflow
    )  # Already liked, count stays 1
    public_workflow.likes_count = 1
    await like_service.db.commit()
    await like_service.unlike_workflow(public_workflow.id, test_user.id)
    await like_service.db.refresh(public_workflow)
    assert public_workflow.likes_count == 0
