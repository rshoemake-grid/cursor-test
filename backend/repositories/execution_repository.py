"""
Repository for execution data access operations.
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database.models import ExecutionDB
from .base import BaseRepository


class ExecutionRepository(BaseRepository[ExecutionDB]):
    """Repository for execution operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, ExecutionDB)
    
    async def get_by_workflow_id(self, workflow_id: str, limit: Optional[int] = None) -> List[ExecutionDB]:
        """Get executions by workflow ID"""
        query = select(ExecutionDB).where(ExecutionDB.workflow_id == workflow_id).order_by(ExecutionDB.started_at.desc())
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_by_user_id(self, user_id: str, limit: Optional[int] = None) -> List[ExecutionDB]:
        """Get executions by user ID"""
        query = select(ExecutionDB).where(ExecutionDB.user_id == user_id).order_by(ExecutionDB.started_at.desc())
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_running_executions(self) -> List[ExecutionDB]:
        """Get all running executions"""
        result = await self.db.execute(
            select(ExecutionDB).where(ExecutionDB.status == 'running')
        )
        return list(result.scalars().all())

