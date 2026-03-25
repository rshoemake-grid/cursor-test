"""
Additional tests for sharing_routes.py coverage gaps - versioning
"""
import pytest
from uuid import uuid4
from datetime import datetime

from backend.api.sharing_routes import create_workflow_version
from backend.models.schemas import WorkflowVersionCreate
from backend.database.models import WorkflowDB, UserDB
from backend.services.sharing_service import SharingService
from backend.services.workflow_ownership_service import WorkflowOwnershipService


@pytest.mark.asyncio
async def test_create_workflow_version_first_version(db_session):
    """Test create_workflow_version for first version"""
    user_id = str(uuid4())
    workflow_id = str(uuid4())

    user = UserDB(
        id=user_id,
        username="versionowner",
        email="versionowner@example.com",
        hashed_password="hashed",
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db_session.add(user)

    workflow = WorkflowDB(
        id=workflow_id,
        name="Test Workflow",
        description="Test",
        version="1.0.0",
        definition={"nodes": [], "edges": []},
        owner_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(workflow)
    await db_session.commit()

    version_data = WorkflowVersionCreate(
        workflow_id=workflow_id,
        change_notes="Initial version",
    )

    ownership = WorkflowOwnershipService(db_session)
    sharing = SharingService(db_session)

    result = await create_workflow_version(
        version_data=version_data,
        current_user=user,
        ownership_service=ownership,
        sharing_service=sharing,
    )

    assert result.workflow_id == workflow_id
    assert result.version_number == 1
