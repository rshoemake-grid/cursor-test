"""
Workflow like/unlike service (SRP/DIP).
Extracts like business logic from marketplace routes.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from ..database.models import WorkflowDB, WorkflowLikeDB
from ..exceptions import LikeNotFoundError


class WorkflowLikeService:
    """Service for workflow like/unlike operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def like_workflow(
        self,
        workflow_id: str,
        user_id: str,
        workflow,
    ) -> dict:
        """
        Like a workflow. Caller must ensure workflow is readable (owner or public).
        Returns {"message": "Liked successfully"} or {"message": "Already liked"}.
        """
        result = await self.db.execute(
            select(WorkflowLikeDB).where(
                and_(
                    WorkflowLikeDB.workflow_id == workflow_id,
                    WorkflowLikeDB.user_id == user_id,
                )
            )
        )
        existing_like = result.scalar_one_or_none()

        if existing_like:
            return {"message": "Already liked"}

        like = WorkflowLikeDB(
            id=str(uuid.uuid4()),
            workflow_id=workflow_id,
            user_id=user_id,
        )
        workflow.likes_count += 1
        self.db.add(like)
        await self.db.commit()
        return {"message": "Liked successfully"}

    async def unlike_workflow(self, workflow_id: str, user_id: str) -> None:
        """
        Unlike a workflow. Raises LikeNotFoundError if like not found.
        """
        result = await self.db.execute(
            select(WorkflowLikeDB).where(
                and_(
                    WorkflowLikeDB.workflow_id == workflow_id,
                    WorkflowLikeDB.user_id == user_id,
                )
            )
        )
        like = result.scalar_one_or_none()

        if not like:
            raise LikeNotFoundError(workflow_id, user_id)

        workflow_result = await self.db.execute(
            select(WorkflowDB).where(WorkflowDB.id == workflow_id)
        )
        workflow = workflow_result.scalar_one_or_none()
        if workflow:
            workflow.likes_count = max(0, workflow.likes_count - 1)

        await self.db.delete(like)
        await self.db.commit()
