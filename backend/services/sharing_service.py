"""
Sharing and versioning service (SRP/DIP).
Extracts share and version business logic from sharing routes.
"""
import uuid
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..database.models import (
    WorkflowDB,
    WorkflowShareDB,
    WorkflowVersionDB,
    UserDB,
)
from ..exceptions import UserNotFoundError, VersionNotFoundError


class SharingService:
    """Service for workflow sharing and versioning operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def share_workflow(
        self,
        workflow_id: str,
        shared_with_username: str,
        permission: str,
        shared_by: str,
    ) -> WorkflowShareDB:
        """
        Share a workflow with another user. Caller must assert workflow ownership.
        Creates new share or updates existing. Raises UserNotFoundError if user not found.
        """
        result = await self.db.execute(
            select(UserDB).where(UserDB.username == shared_with_username)
        )
        shared_with_user = result.scalar_one_or_none()
        if not shared_with_user:
            raise UserNotFoundError(shared_with_username)

        result = await self.db.execute(
            select(WorkflowShareDB).where(
                and_(
                    WorkflowShareDB.workflow_id == workflow_id,
                    WorkflowShareDB.shared_with_user_id == shared_with_user.id,
                )
            )
        )
        existing_share = result.scalar_one_or_none()

        if existing_share:
            existing_share.permission = permission
            await self.db.commit()
            await self.db.refresh(existing_share)
            return existing_share

        share = WorkflowShareDB(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            shared_with_user_id=shared_with_user.id,
            permission=permission,
            shared_by=shared_by,
        )
        self.db.add(share)
        await self.db.commit()
        await self.db.refresh(share)
        return share

    async def get_shared_with_me(self, user_id: str) -> List[WorkflowShareDB]:
        """Get shares where user is the recipient."""
        result = await self.db.execute(
            select(WorkflowShareDB).where(
                WorkflowShareDB.shared_with_user_id == user_id
            )
        )
        return list(result.scalars().all())

    async def get_shared_by_me(self, user_id: str) -> List[WorkflowShareDB]:
        """Get shares where user is the sharer."""
        result = await self.db.execute(
            select(WorkflowShareDB).where(WorkflowShareDB.shared_by == user_id)
        )
        return list(result.scalars().all())

    async def get_share_by_id(self, share_id: str) -> WorkflowShareDB | None:
        """Get a share by ID. Returns None if not found."""
        result = await self.db.execute(
            select(WorkflowShareDB).where(WorkflowShareDB.id == share_id)
        )
        return result.scalar_one_or_none()

    async def revoke_share(self, share: WorkflowShareDB) -> None:
        """Revoke a share. Caller must assert workflow ownership."""
        await self.db.delete(share)
        await self.db.commit()

    async def create_workflow_version(
        self,
        workflow_id: str,
        definition: dict,
        change_notes: str | None,
        created_by: str,
    ) -> WorkflowVersionDB:
        """
        Create a new workflow version. Caller must assert workflow ownership.
        """
        result = await self.db.execute(
            select(WorkflowVersionDB)
            .where(WorkflowVersionDB.workflow_id == workflow_id)
            .order_by(WorkflowVersionDB.version_number.desc())
            .limit(1)
        )
        latest_version = result.scalar_one_or_none()
        next_version_number = (
            (latest_version.version_number + 1) if latest_version else 1
        )

        version = WorkflowVersionDB(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            version_number=next_version_number,
            definition=definition,
            change_notes=change_notes,
            created_by=created_by,
        )
        self.db.add(version)
        await self.db.commit()
        await self.db.refresh(version)
        return version

    async def get_version_by_id(self, version_id: str) -> WorkflowVersionDB:
        """Get a version by ID. Raises VersionNotFoundError if not found."""
        result = await self.db.execute(
            select(WorkflowVersionDB).where(WorkflowVersionDB.id == version_id)
        )
        version = result.scalar_one_or_none()
        if not version:
            raise VersionNotFoundError(version_id)
        return version

    async def get_workflow_versions(
        self, workflow_id: str
    ) -> List[WorkflowVersionDB]:
        """Get all versions of a workflow. Caller must assert read access."""
        result = await self.db.execute(
            select(WorkflowVersionDB)
            .where(WorkflowVersionDB.workflow_id == workflow_id)
            .order_by(WorkflowVersionDB.version_number.desc())
        )
        return list(result.scalars().all())

    async def restore_workflow_version(
        self, version_id: str, workflow: WorkflowDB
    ) -> int:
        """
        Restore workflow to a previous version. Caller must assert workflow ownership.
        Returns the restored version number. Raises VersionNotFoundError if version not found.
        """
        result = await self.db.execute(
            select(WorkflowVersionDB).where(WorkflowVersionDB.id == version_id)
        )
        version = result.scalar_one_or_none()
        if not version:
            raise VersionNotFoundError(version_id)

        workflow.definition = version.definition
        await self.db.commit()
        return version.version_number
