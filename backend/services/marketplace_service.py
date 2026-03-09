"""
Marketplace service - SRP: business logic for workflow discovery and likes.
"""
from typing import List, Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc

from ..database.models import WorkflowDB, WorkflowLikeDB, UserDB, WorkflowTemplateDB


class MarketplaceService:
    """Service for marketplace and discovery operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def discover_workflows(
        self,
        category: Optional[str] = None,
        tags: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "popular",
        limit: int = 20,
        offset: int = 0,
    ) -> List[WorkflowDB]:
        """Discover public workflows and templates with filters and pagination."""
        query = select(WorkflowDB).where(
            or_(
                WorkflowDB.is_public == True,
                WorkflowDB.is_template == True
            )
        )
        filters = []
        if category:
            filters.append(WorkflowDB.category == category)
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            for tag in tag_list:
                filters.append(WorkflowDB.tags.contains([tag]))
        if search:
            filters.append(
                or_(
                    WorkflowDB.name.ilike(f"%{search}%"),
                    WorkflowDB.description.ilike(f"%{search}%")
                )
            )
        if filters:
            query = query.where(and_(*filters))
        if sort_by == "popular":
            query = query.order_by(desc(WorkflowDB.uses_count))
        elif sort_by == "recent":
            query = query.order_by(desc(WorkflowDB.created_at))
        elif sort_by == "likes":
            query = query.order_by(desc(WorkflowDB.likes_count))
        query = query.limit(limit).offset(offset)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_trending_workflows(self, limit: int = 10) -> List[WorkflowDB]:
        """Get trending workflows based on recent activity."""
        query = (
            select(WorkflowDB)
            .where(
                or_(
                    WorkflowDB.is_public == True,
                    WorkflowDB.is_template == True
                )
            )
            .order_by(desc(WorkflowDB.uses_count + WorkflowDB.likes_count * 2))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_marketplace_stats(self) -> Dict[str, Any]:
        """Get marketplace statistics."""
        result = await self.db.execute(
            select(func.count(WorkflowDB.id)).where(WorkflowDB.is_public == True)
        )
        public_count = result.scalar()
        result = await self.db.execute(select(func.count(WorkflowTemplateDB.id)))
        template_count = result.scalar()
        result = await self.db.execute(select(func.count(UserDB.id)))
        user_count = result.scalar()
        result = await self.db.execute(select(func.sum(WorkflowDB.uses_count)))
        total_executions = result.scalar() or 0
        return {
            "public_workflows": public_count,
            "templates": template_count,
            "total_users": user_count,
            "total_executions": total_executions,
        }

    async def get_my_liked_workflows(self, user_id: str) -> List[WorkflowDB]:
        """Get workflows liked by the given user."""
        result = await self.db.execute(
            select(WorkflowLikeDB.workflow_id).where(
                WorkflowLikeDB.user_id == user_id
            )
        )
        workflow_ids = [row[0] for row in result.all()]
        if not workflow_ids:
            return []
        result = await self.db.execute(
            select(WorkflowDB).where(WorkflowDB.id.in_(workflow_ids))
        )
        return list(result.scalars().all())
