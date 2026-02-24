"""
Repository for execution data access operations.
Follows Repository Pattern and DRY principles.
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from ..database.models import ExecutionDB
from .base import BaseRepository


class ExecutionRepository(BaseRepository[ExecutionDB]):
    """Repository for execution operations following Single Responsibility Principle"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(db, ExecutionDB)
    
    async def list_executions(
        self,
        workflow_id: Optional[str] = None,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[ExecutionDB]:
        """
        List executions with filtering and pagination (DRY - single method for all list operations)
        
        Args:
            workflow_id: Optional workflow ID filter
            user_id: Optional user ID filter
            status: Optional status filter
            limit: Optional limit on number of results
            offset: Offset for pagination
            
        Returns:
            List of execution database entities
        """
        query = select(ExecutionDB)
        
        # Build filters (DRY - reusable filter building)
        filters = []
        if workflow_id:
            filters.append(ExecutionDB.workflow_id == workflow_id)
        if user_id:
            filters.append(ExecutionDB.user_id == user_id)
        if status:
            filters.append(ExecutionDB.status == status)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Order by most recent first
        query = query.order_by(ExecutionDB.started_at.desc())
        
        # Apply pagination
        query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_by_workflow_id(self, workflow_id: str, limit: Optional[int] = None) -> List[ExecutionDB]:
        """
        Get executions by workflow ID (delegates to list_executions for DRY)
        
        Args:
            workflow_id: Workflow ID
            limit: Optional limit on number of results
            
        Returns:
            List of execution database entities
        """
        return await self.list_executions(workflow_id=workflow_id, limit=limit)
    
    async def get_by_user_id(self, user_id: str, limit: Optional[int] = None) -> List[ExecutionDB]:
        """
        Get executions by user ID (delegates to list_executions for DRY)
        
        Args:
            user_id: User ID
            limit: Optional limit on number of results
            
        Returns:
            List of execution database entities
        """
        return await self.list_executions(user_id=user_id, limit=limit)
    
    async def get_running_executions(self) -> List[ExecutionDB]:
        """
        Get all running executions (delegates to list_executions for DRY)
        
        Returns:
            List of execution database entities with status 'running'
        """
        from ..models.schemas import ExecutionStatus
        return await self.list_executions(status=ExecutionStatus.RUNNING.value)

