"""
Service layer for execution business logic.
Handles execution CRUD operations and business rules following SOLID principles.
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.schemas import ExecutionResponse, ExecutionStatus
from ..database.models import ExecutionDB
from ..repositories.execution_repository import ExecutionRepository
from ..exceptions import ExecutionNotFoundError
from ..utils.logger import get_logger

logger = get_logger(__name__)


class ExecutionService:
    """Service for execution operations following Single Responsibility Principle"""
    
    def __init__(self, db: AsyncSession):
        """
        Initialize execution service with dependency injection
        
        Args:
            db: Database session (injected dependency)
        """
        self.db = db
        self.repository = ExecutionRepository(db)
    
    def _db_to_response(self, execution: ExecutionDB) -> ExecutionResponse:
        """
        Convert database model to response model (DRY principle)
        
        Args:
            execution: Database execution entity
            
        Returns:
            ExecutionResponse model
        """
        state_data = execution.state if execution.state else {}
        
        return ExecutionResponse(
            execution_id=execution.id,
            workflow_id=execution.workflow_id,
            status=execution.status,
            current_node=state_data.get('current_node'),
            result=state_data.get('result'),
            error=state_data.get('error'),
            started_at=execution.started_at if execution.started_at else datetime.utcnow(),
            completed_at=execution.completed_at,
            logs=state_data.get('logs', [])
        )
    
    async def get_execution(self, execution_id: str) -> ExecutionResponse:
        """
        Get execution by ID
        
        Args:
            execution_id: Execution ID
            
        Returns:
            ExecutionResponse model
            
        Raises:
            ExecutionNotFoundError: If execution not found
        """
        execution = await self.repository.get_by_id(execution_id)
        if not execution:
            raise ExecutionNotFoundError(execution_id)
        
        logger.debug(f"Retrieved execution {execution_id}")
        return self._db_to_response(execution)
    
    async def list_executions(
        self,
        workflow_id: Optional[str] = None,
        user_id: Optional[str] = None,
        status: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[ExecutionResponse]:
        """
        List executions with filtering and pagination
        
        Args:
            workflow_id: Optional workflow ID filter
            user_id: Optional user ID filter
            status: Optional status filter
            limit: Optional limit on number of results
            offset: Offset for pagination
            
        Returns:
            List of ExecutionResponse models
        """
        executions = await self.repository.list_executions(
            workflow_id=workflow_id,
            user_id=user_id,
            status=status,
            limit=limit,
            offset=offset
        )
        
        logger.debug(f"Retrieved {len(executions)} executions (workflow_id={workflow_id}, user_id={user_id}, status={status})")
        return [self._db_to_response(execution) for execution in executions]
    
    async def get_executions_by_workflow(
        self,
        workflow_id: str,
        limit: Optional[int] = None
    ) -> List[ExecutionResponse]:
        """
        Get executions by workflow ID
        
        Args:
            workflow_id: Workflow ID
            limit: Optional limit on number of results
            
        Returns:
            List of ExecutionResponse models
        """
        executions = await self.repository.get_by_workflow_id(workflow_id, limit=limit)
        logger.debug(f"Retrieved {len(executions)} executions for workflow {workflow_id}")
        return [self._db_to_response(execution) for execution in executions]
    
    async def get_executions_by_user(
        self,
        user_id: str,
        limit: Optional[int] = None
    ) -> List[ExecutionResponse]:
        """
        Get executions by user ID
        
        Args:
            user_id: User ID
            limit: Optional limit on number of results
            
        Returns:
            List of ExecutionResponse models
        """
        executions = await self.repository.get_by_user_id(user_id, limit=limit)
        logger.debug(f"Retrieved {len(executions)} executions for user {user_id}")
        return [self._db_to_response(execution) for execution in executions]
    
    async def get_running_executions(self) -> List[ExecutionResponse]:
        """
        Get all running executions
        
        Returns:
            List of ExecutionResponse models with status 'running'
        """
        executions = await self.repository.get_running_executions()
        logger.debug(f"Retrieved {len(executions)} running executions")
        return [self._db_to_response(execution) for execution in executions]
