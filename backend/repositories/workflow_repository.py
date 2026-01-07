"""
Repository for workflow data access operations.
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database.models import WorkflowDB
from .base import BaseRepository


class WorkflowRepository(BaseRepository[WorkflowDB]):
    """Repository for workflow operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, WorkflowDB)
    
    async def get_by_name(self, name: str) -> Optional[WorkflowDB]:
        """Get workflow by name"""
        result = await self.db.execute(
            select(WorkflowDB).where(WorkflowDB.name == name)
        )
        return result.scalar_one_or_none()
    
    async def get_by_owner(self, owner_id: str, limit: Optional[int] = None) -> List[WorkflowDB]:
        """Get workflows by owner ID"""
        query = select(WorkflowDB).where(WorkflowDB.owner_id == owner_id)
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_public_workflows(self, limit: Optional[int] = None) -> List[WorkflowDB]:
        """Get public workflows"""
        query = select(WorkflowDB).where(WorkflowDB.is_public == True)
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_templates(self, limit: Optional[int] = None) -> List[WorkflowDB]:
        """Get workflow templates"""
        query = select(WorkflowDB).where(WorkflowDB.is_template == True)
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_anonymous_workflows(self, limit: Optional[int] = None) -> List[WorkflowDB]:
        """Get workflows with no owner (anonymous workflows)"""
        query = select(WorkflowDB).where(WorkflowDB.owner_id == None)
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_anonymous_and_public_workflows(self, limit: Optional[int] = None) -> List[WorkflowDB]:
        """Get workflows that are either anonymous (no owner) or public"""
        from sqlalchemy import or_
        query = select(WorkflowDB).where(
            or_(
                WorkflowDB.owner_id == None,
                WorkflowDB.is_public == True
            )
        )
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

