"""
Execution Orchestrator Service - SRP Refactoring
Extracts workflow execution orchestration logic from routes into a service layer.
"""
from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from ..models.schemas import (
    WorkflowDefinition,
    ExecutionStatus,
    ExecutionResponse
)
from ..database.models import ExecutionDB
from ..database.db import AsyncSessionLocal
from ..engine import WorkflowExecutor
from ..utils.logger import get_logger
from ..utils.workflow_reconstruction import reconstruct_workflow_definition
from .settings_service import ISettingsService
from ..exceptions import WorkflowNotFoundError

if TYPE_CHECKING:
    from .workflow_service import WorkflowService
    from ..database.models import WorkflowDB

logger = get_logger(__name__)

# HTTP Status Code Constants - DRY: Single source of truth
HTTP_STATUS_NOT_FOUND = 404
HTTP_STATUS_BAD_REQUEST = 400
HTTP_STATUS_UNPROCESSABLE_ENTITY = 422
HTTP_STATUS_INTERNAL_SERVER_ERROR = 500


class ExecutionOrchestrator:
    """
    Orchestrates workflow execution following SRP.
    
    Responsibilities:
    - Coordinate workflow execution setup
    - Manage execution lifecycle
    - Handle execution state persistence
    """
    
    def __init__(
        self,
        db: AsyncSession,
        settings_service: ISettingsService,
        workflow_service: "WorkflowService"
    ):
        """
        Initialize execution orchestrator
        
        Args:
            db: Database session
            settings_service: Settings service for LLM config
            workflow_service: Workflow service for retrieving workflows
        """
        self.db = db
        self.settings_service = settings_service
        self.workflow_service = workflow_service
    
    async def prepare_execution(
        self,
        workflow_id: str,
        user_id: Optional[str],
        execution_request: Optional[Any] = None
    ) -> tuple[str, WorkflowDefinition, Dict[str, Any], Any]:
        """
        Prepare workflow execution: validate workflow, get LLM config, create executor.
        
        Args:
            workflow_id: Workflow identifier
            user_id: User identifier (optional)
            execution_request: Execution request with inputs (optional)
            
        Returns:
            Tuple of (execution_id, workflow_definition, inputs, executor)
            
        Raises:
            HTTPException: If workflow not found, LLM config missing, or validation fails
        """
        # Get workflow
        workflow_db = await self._get_workflow(workflow_id)
        
        # Get LLM config
        llm_config = await self._get_llm_config(user_id)
        
        # Reconstruct workflow definition
        workflow_def = await self._reconstruct_workflow_definition(workflow_db)
        
        # Create executor
        executor = self._create_executor(workflow_def, llm_config, user_id)
        execution_id = executor.execution_id
        
        # Extract inputs
        inputs = self._extract_inputs(execution_request)
        
        return execution_id, workflow_def, inputs, executor
    
    async def _get_workflow(self, workflow_id: str) -> "WorkflowDB":
        """
        Get workflow from service (DRY - extracted error handling).
        
        Args:
            workflow_id: Workflow identifier
            
        Returns:
            Workflow database record
            
        Raises:
            HTTPException: If workflow not found
        """
        try:
            workflow_db = await self.workflow_service.get_workflow(workflow_id)
            logger.debug(f"Retrieved workflow: {workflow_db.name} (id={workflow_db.id})")
            return workflow_db
        except WorkflowNotFoundError as e:
            logger.warning(f"Workflow not found: {workflow_id}")
            raise HTTPException(status_code=HTTP_STATUS_NOT_FOUND, detail=str(e))
    
    async def _get_llm_config(self, user_id: Optional[str]) -> Dict[str, Any]:
        """
        Get LLM config for execution, loading from DB if not in cache.
        
        Args:
            user_id: User identifier (optional)
            
        Returns:
            LLM config dictionary
            
        Raises:
            HTTPException: If LLM config not found
        """
        llm_config = self.settings_service.get_active_llm_config(user_id)
        
        # If not found in cache, try loading from database
        if not llm_config:
            logger.info(f"LLM config not found in cache for user_id={user_id}, loading from database...")
            await self.settings_service.load_settings_into_cache(self.db)
            llm_config = self.settings_service.get_active_llm_config(user_id)
        
        if not llm_config:
            error_msg = self._build_llm_config_error_message(user_id)
            logger.warning(error_msg)
            raise HTTPException(status_code=HTTP_STATUS_BAD_REQUEST, detail=error_msg)
        
        logger.info(f"Using LLM config: type={llm_config.get('type')}, model={llm_config.get('model')}")
        return llm_config
    
    def _build_llm_config_error_message(self, user_id: Optional[str]) -> str:
        """
        Build error message for missing LLM config (DRY - extracted error message building).
        
        Args:
            user_id: User identifier (optional)
            
        Returns:
            Error message string
        """
        return (
            f"No LLM provider configured for user_id={user_id}. "
            "Please configure an LLM provider in Settings before executing workflows."
        )
    
    def _build_workflow_definition_dict(self, workflow_db: Any) -> Dict[str, Any]:
        """
        Build workflow definition dictionary from database record (DRY - extracted dict building).
        
        Args:
            workflow_db: Workflow database record
            
        Returns:
            Workflow definition dictionary
        """
        return {
            "id": workflow_db.id,
            "name": workflow_db.name,
            "description": workflow_db.description,
            **workflow_db.definition
        }
    
    async def _reconstruct_workflow_definition(self, workflow_db: Any) -> WorkflowDefinition:
        """
        Reconstruct workflow definition from database record.
        
        Refactored to use extracted dict building helper (DRY).
        
        Args:
            workflow_db: Workflow database record
            
        Returns:
            Reconstructed WorkflowDefinition
            
        Raises:
            HTTPException: If reconstruction fails
        """
        try:
            logger.debug(f"Reconstructing workflow definition for workflow_id={workflow_db.id}")
            workflow_def_dict = self._build_workflow_definition_dict(workflow_db)
            logger.debug(f"Workflow definition keys: {list(workflow_def_dict.keys())}")
            workflow_def = reconstruct_workflow_definition(workflow_def_dict)
            logger.info(f"Successfully reconstructed workflow definition with {len(workflow_def.nodes)} nodes")
            return workflow_def
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"Error reconstructing workflow definition for workflow_id={workflow_db.id}: {e}",
                exc_info=True
            )
            raise HTTPException(
                status_code=HTTP_STATUS_UNPROCESSABLE_ENTITY,
                detail=f"Invalid workflow definition: {str(e)}"
            )
    
    def _create_executor(
        self,
        workflow_def: WorkflowDefinition,
        llm_config: Dict[str, Any],
        user_id: Optional[str]
    ) -> WorkflowExecutor:
        """
        Create workflow executor (DRY - extracted executor creation).
        
        Args:
            workflow_def: Workflow definition
            llm_config: LLM configuration
            user_id: User identifier (optional)
            
        Returns:
            WorkflowExecutor instance
        """
        executor = WorkflowExecutor(
            workflow_def,
            stream_updates=True,
            llm_config=llm_config,
            user_id=user_id
        )
        logger.info(f"Created executor with execution_id={executor.execution_id}")
        return executor
    
    def _extract_inputs(self, execution_request: Optional[Any]) -> Dict[str, Any]:
        """
        Extract inputs from execution request (DRY - extracted input extraction).
        
        Args:
            execution_request: Execution request object or None
            
        Returns:
            Inputs dictionary
        """
        inputs = execution_request.inputs if execution_request else {}
        logger.debug(f"Execution inputs: {inputs}")
        return inputs
    
    async def create_execution_record(
        self,
        execution_id: str,
        workflow_id: str,
        user_id: Optional[str]
    ) -> None:
        """
        Create initial execution record in database.
        
        Args:
            execution_id: Execution identifier
            workflow_id: Workflow identifier
            user_id: User identifier (optional)
            
        Raises:
            HTTPException: If record creation fails
        """
        try:
            logger.info(f"Creating execution record in database with execution_id={execution_id}")
            db_execution = ExecutionDB(
                id=execution_id,
                workflow_id=workflow_id,
                user_id=user_id,
                status=ExecutionStatus.RUNNING.value,
                state={},
                started_at=datetime.utcnow(),
                completed_at=None
            )
            self.db.add(db_execution)
            await self.db.commit()
        except Exception as e:
            logger.error(f"Error creating execution record: {e}", exc_info=True)
            raise HTTPException(
                status_code=HTTP_STATUS_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create execution record: {str(e)}"
            )
    
    async def update_execution_status(
        self,
        execution_id: str,
        status: ExecutionStatus,
        state: Optional[Dict[str, Any]] = None,
        completed_at: Optional[datetime] = None
    ) -> None:
        """
        Update execution status in database (for background tasks).
        
        Uses a new database session since this is called from background tasks.
        Refactored to use extracted session management helper.
        
        Args:
            execution_id: Execution identifier
            status: New execution status
            state: Execution state dictionary (optional)
            completed_at: Completion timestamp (optional)
        """
        try:
            async with AsyncSessionLocal() as db_session:
                db_exec = await self._get_execution_from_db(db_session, execution_id)
                if db_exec:
                    await self._update_execution_fields(db_exec, status, state, completed_at)
                    await db_session.commit()
                    logger.debug(f"Execution record updated successfully")
                else:
                    logger.warning(f"Execution record not found in database for execution_id={execution_id}")
        except Exception as e:
            logger.error(f"Error updating execution status: {e}", exc_info=True)
    
    async def _get_execution_from_db(
        self,
        db_session: AsyncSession,
        execution_id: str
    ) -> Optional[ExecutionDB]:
        """
        Get execution from database (DRY - extracted database query).
        
        Args:
            db_session: Database session
            execution_id: Execution identifier
            
        Returns:
            ExecutionDB instance or None if not found
        """
        result = await db_session.execute(
            select(ExecutionDB).where(ExecutionDB.id == execution_id)
        )
        return result.scalar_one_or_none()
    
    def _update_execution_fields(
        self,
        db_exec: ExecutionDB,
        status: ExecutionStatus,
        state: Optional[Dict[str, Any]],
        completed_at: Optional[datetime]
    ) -> None:
        """
        Update execution fields (DRY - extracted field update logic).
        
        Args:
            db_exec: Execution database record
            status: New execution status
            state: Execution state dictionary (optional)
            completed_at: Completion timestamp (optional)
        """
        logger.debug(f"Updating execution {db_exec.id} status to {status.value}")
        db_exec.status = status.value
        if state is not None:
            db_exec.state = state
        if completed_at is not None:
            db_exec.completed_at = completed_at
    
    async def run_execution_in_background(
        self,
        executor: WorkflowExecutor,
        execution_id: str,
        inputs: Dict[str, Any]
    ) -> None:
        """
        Run workflow execution in background and update database.
        
        Refactored to use extracted error handling helper.
        
        Args:
            executor: Workflow executor instance
            execution_id: Execution identifier
            inputs: Execution inputs
        """
        try:
            logger.info(f"Starting background execution for execution_id={execution_id}")
            execution_state = await executor.execute(inputs)
            logger.info(f"Execution completed: status={execution_state.status}")
            
            # Update execution in database
            await self.update_execution_status(
                execution_id=execution_id,
                status=execution_state.status,
                state=execution_state.model_dump(mode='json'),
                completed_at=execution_state.completed_at
            )
        except Exception as e:
            logger.error(f"Background execution {execution_id} failed: {e}", exc_info=True)
            # Update execution status to failed
            await self._handle_execution_failure(execution_id)
    
    async def _handle_execution_failure(self, execution_id: str) -> None:
        """
        Handle execution failure by updating status (DRY - extracted failure handling).
        
        Args:
            execution_id: Execution identifier
        """
        await self.update_execution_status(
            execution_id=execution_id,
            status=ExecutionStatus.FAILED,
            completed_at=datetime.utcnow()
        )
    
    def create_response(
        self,
        execution_id: str,
        workflow_id: str
    ) -> ExecutionResponse:
        """
        Create execution response for API.
        
        Args:
            execution_id: Execution identifier
            workflow_id: Workflow identifier
            
        Returns:
            ExecutionResponse object
        """
        return ExecutionResponse(
            execution_id=execution_id,
            workflow_id=workflow_id,
            status=ExecutionStatus.RUNNING,
            started_at=datetime.utcnow()
        )
