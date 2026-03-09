"""
Centralized workflow ownership and access checks.
DRY: Prevents IDOR - users can only access workflows they own or have share access to.
Mirrors Java WorkflowOwnershipService.
"""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..database.models import WorkflowDB, WorkflowShareDB
from ..exceptions import WorkflowNotFoundError, WorkflowForbiddenError
from ..repositories.workflow_repository import WorkflowRepository


class WorkflowOwnershipService:
    """Service for workflow ownership and access checks."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._workflow_repo = WorkflowRepository(db)

    async def get_workflow_and_assert_owner(
        self, workflow_id: str, user_id: Optional[str], action: str = "access"
    ) -> WorkflowDB:
        """Get workflow by ID and assert user owns it. Raises if not found or not owner."""
        workflow = await self._workflow_repo.get_by_id(workflow_id)
        self._require_workflow_exists(workflow, workflow_id)
        self.assert_owner(workflow, user_id, action)
        return workflow

    async def get_workflow_and_assert_can_read(
        self, workflow_id: str, user_id: Optional[str]
    ) -> WorkflowDB:
        """Get workflow by ID and assert user can read it (owner or public)."""
        workflow = await self._workflow_repo.get_by_id(workflow_id)
        self._require_workflow_exists(workflow, workflow_id)
        self.assert_can_read(workflow, user_id)
        return workflow

    async def get_workflow_and_assert_can_read_or_share(
        self, workflow_id: str, user_id: Optional[str]
    ) -> WorkflowDB:
        """Get workflow by ID and assert user can read it (owner, public, or shared)."""
        workflow = await self._workflow_repo.get_by_id(workflow_id)
        self._require_workflow_exists(workflow, workflow_id)
        await self.assert_can_read_or_share(workflow, user_id)
        return workflow

    def assert_owner(self, workflow: Optional[WorkflowDB], user_id: Optional[str], action: str = "access") -> None:
        """
        Assert that the user owns the workflow.
        Raises WorkflowForbiddenError if not owner. Anonymous workflows (owner_id is None) have no owner.
        """
        self._require_workflow_exists(workflow, getattr(workflow, "id", None) or "")
        owner_id = getattr(workflow, "owner_id", None)
        if owner_id is None:
            raise WorkflowForbiddenError(workflow.id, action)
        if user_id != owner_id:
            raise WorkflowForbiddenError(workflow.id, action)

    def assert_can_read(self, workflow: Optional[WorkflowDB], user_id: Optional[str]) -> None:
        """
        Assert user can read workflow (owner or public).
        Anonymous workflows (owner_id is None): only unauthenticated (user_id is None) can read.
        """
        self._require_workflow_exists(workflow, getattr(workflow, "id", None) or "")
        if getattr(workflow, "is_public", False):
            return
        owner_id = getattr(workflow, "owner_id", None)
        if owner_id is None:
            if user_id is not None:
                raise WorkflowForbiddenError(workflow.id, "access")
            return
        if user_id == owner_id:
            return
        raise WorkflowForbiddenError(workflow.id, "access")

    async def assert_can_read_or_share(self, workflow: Optional[WorkflowDB], user_id: Optional[str]) -> None:
        """
        Assert user can read workflow (owner, public, or shared with user).
        """
        self._require_workflow_exists(workflow, getattr(workflow, "id", None) or "")
        if getattr(workflow, "is_public", False):
            return
        owner_id = getattr(workflow, "owner_id", None)
        if owner_id is None:
            if user_id is not None:
                raise WorkflowForbiddenError(workflow.id, "access")
            return
        if user_id == owner_id:
            return
        if user_id and await self._has_share_access(workflow.id, user_id):
            return
        raise WorkflowForbiddenError(workflow.id, "access")

    async def _has_share_access(self, workflow_id: str, user_id: str) -> bool:
        """Check if user has share access to workflow."""
        result = await self.db.execute(
            select(WorkflowShareDB).where(
                and_(
                    WorkflowShareDB.workflow_id == workflow_id,
                    WorkflowShareDB.shared_with_user_id == user_id,
                )
            )
        )
        return result.scalar_one_or_none() is not None

    def _require_workflow_exists(self, workflow: Optional[WorkflowDB], workflow_id: str = "") -> None:
        if workflow is None:
            raise WorkflowNotFoundError(workflow_id or "unknown")
