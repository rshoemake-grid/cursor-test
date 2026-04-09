"""
Service layer for execution business logic.
Handles execution CRUD operations and business rules following SOLID principles.
"""
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.schemas import ExecutionResponse, ExecutionStatus, ExecutionLogsResponse, ExecutionLogEntry
from ..database.models import ExecutionDB
from ..repositories.execution_repository import ExecutionRepository
from ..exceptions import ExecutionNotFoundError, ExecutionForbiddenError
from ..utils.logger import get_logger

logger = get_logger(__name__)

_TERMINAL_STATUSES = frozenset(
    {
        ExecutionStatus.COMPLETED.value,
        ExecutionStatus.FAILED.value,
        ExecutionStatus.CANCELLED.value,
        ExecutionStatus.PAUSED.value,
    }
)


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

    @staticmethod
    def _normalize_status_token(value: object) -> str:
        """Lowercase API status token; map US spelling to cancelled."""
        if value is None:
            return ""
        if isinstance(value, ExecutionStatus):
            return value.value
        if isinstance(value, str):
            s = value.strip().lower()
            return "cancelled" if s == "canceled" else s
        if isinstance(value, dict) and value.get("value") is not None:
            return ExecutionService._normalize_status_token(value.get("value"))
        inner = getattr(value, "value", None)
        if isinstance(inner, str):
            return ExecutionService._normalize_status_token(inner)
        return ""

    @staticmethod
    def _effective_status(execution: ExecutionDB, state_data: dict) -> ExecutionStatus:
        """
        Column `status` can lag `state` (e.g. error + completed_at while still running).
        Prefer explicit terminal values from column or JSON state, then infer failed.
        """
        col = ExecutionService._normalize_status_token(execution.status)
        inner = ExecutionService._normalize_status_token(state_data.get("status"))
        completed_at = execution.completed_at
        err_raw = state_data.get("error")
        has_err = err_raw is not None and str(err_raw).strip() != ""

        if col in _TERMINAL_STATUSES:
            return ExecutionStatus(col)
        if inner in _TERMINAL_STATUSES:
            return ExecutionStatus(inner)
        if completed_at is not None and has_err:
            if col in ("", ExecutionStatus.PENDING.value, ExecutionStatus.RUNNING.value):
                return ExecutionStatus.FAILED
        for token in (col, inner):
            if token:
                try:
                    return ExecutionStatus(token)
                except ValueError:
                    pass
        return ExecutionStatus.PENDING

    def _db_to_response(
        self, execution: ExecutionDB, *, include_logs: bool = True
    ) -> ExecutionResponse:
        """
        Convert database model to response model (DRY principle).

        List endpoints set include_logs=False so responses stay small; full logs
        are available via GET /executions/{id} or /executions/{id}/logs.
        """
        state_data = execution.state if execution.state else {}
        logs = state_data.get("logs", []) if include_logs else []

        return ExecutionResponse(
            execution_id=execution.id,
            workflow_id=execution.workflow_id,
            status=self._effective_status(execution, state_data),
            current_node=state_data.get('current_node'),
            result=state_data.get('result'),
            error=state_data.get('error'),
            started_at=execution.started_at if execution.started_at else datetime.now(timezone.utc),
            completed_at=execution.completed_at,
            logs=logs,
        )
    
    def _check_execution_ownership(self, execution: ExecutionDB, user_id: str) -> None:
        """C-2: Ensure user is authorized to access execution. Raises ExecutionForbiddenError if not."""
        if execution.user_id is None or execution.user_id != user_id:
            raise ExecutionForbiddenError(execution.id)

    async def get_execution(self, execution_id: str, user_id: Optional[str] = None) -> ExecutionResponse:
        """
        Get execution by ID
        
        Args:
            execution_id: Execution ID
            user_id: If provided, enforce ownership (C-2)
            
        Returns:
            ExecutionResponse model
            
        Raises:
            ExecutionNotFoundError: If execution not found
            ExecutionForbiddenError: If user_id provided and user does not own execution
        """
        execution = await self.repository.get_by_id(execution_id)
        if not execution:
            raise ExecutionNotFoundError(execution_id)
        if user_id is not None:
            self._check_execution_ownership(execution, user_id)
        
        logger.debug(f"Retrieved execution {execution_id}")
        return self._db_to_response(execution)

    async def get_execution_db(self, execution_id: str, user_id: str) -> ExecutionDB:
        """
        Get raw ExecutionDB by ID with ownership check. For debug routes that need state/timeline.
        Raises ExecutionNotFoundError or ExecutionForbiddenError.
        """
        execution = await self.repository.get_by_id(execution_id)
        if not execution:
            raise ExecutionNotFoundError(execution_id)
        self._check_execution_ownership(execution, user_id)
        return execution

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
        return [
            self._db_to_response(execution, include_logs=False)
            for execution in executions
        ]
    
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
        return [
            self._db_to_response(execution, include_logs=False)
            for execution in executions
        ]
    
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
        return [
            self._db_to_response(execution, include_logs=False)
            for execution in executions
        ]
    
    async def get_running_executions(self, user_id: Optional[str] = None) -> List[ExecutionResponse]:
        """
        Get running executions, optionally filtered by user (C-2)
        
        Args:
            user_id: If provided, only return executions owned by this user
            
        Returns:
            List of ExecutionResponse models with status 'running'
        """
        executions = await self.repository.get_running_executions()
        if user_id is not None:
            executions = [e for e in executions if e.user_id == user_id]
        logger.debug(f"Retrieved {len(executions)} running executions")
        return [
            self._db_to_response(execution, include_logs=False)
            for execution in executions
        ]
    
    async def get_execution_logs(
        self,
        execution_id: str,
        level: Optional[str] = None,
        node_id: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0,
        user_id: Optional[str] = None
    ) -> ExecutionLogsResponse:
        """
        Get execution logs with filtering and pagination
        
        Args:
            execution_id: Execution ID
            level: Optional log level filter (INFO, WARNING, ERROR)
            node_id: Optional node ID filter
            limit: Maximum number of logs to return
            offset: Offset for pagination
            user_id: If provided, enforce ownership (C-2)
            
        Returns:
            ExecutionLogsResponse with filtered logs
            
        Raises:
            ExecutionNotFoundError: If execution not found
            ExecutionForbiddenError: If user_id provided and user does not own execution
        """
        execution = await self.repository.get_by_id(execution_id)
        if not execution:
            raise ExecutionNotFoundError(execution_id)
        if user_id is not None:
            self._check_execution_ownership(execution, user_id)
        
        state_data = execution.state if execution.state else {}
        all_logs = state_data.get('logs', [])
        
        # Convert log dicts to ExecutionLogEntry objects for filtering
        log_entries = []
        for log_dict in all_logs:
            try:
                if isinstance(log_dict, dict):
                    # Handle timestamp conversion (might be string or datetime)
                    log_data = log_dict.copy()
                    if 'timestamp' in log_data:
                        timestamp = log_data['timestamp']
                        if isinstance(timestamp, str):
                            try:
                                # Try parsing ISO format
                                log_data['timestamp'] = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                            except:
                                try:
                                    # Try parsing other common formats
                                    log_data['timestamp'] = datetime.fromisoformat(timestamp)
                                except:
                                    # If all parsing fails, use current time as fallback
                                    logger.warning(f"Could not parse timestamp: {timestamp}, using current time")
                                    log_data['timestamp'] = datetime.now(timezone.utc)
                        elif isinstance(timestamp, datetime):
                            log_data['timestamp'] = timestamp
                        else:
                            log_data['timestamp'] = datetime.now(timezone.utc)
                    else:
                        log_data['timestamp'] = datetime.now(timezone.utc)
                    
                    log_entry = ExecutionLogEntry(**log_data)
                elif isinstance(log_dict, ExecutionLogEntry):
                    log_entry = log_dict
                else:
                    continue
                log_entries.append(log_entry)
            except Exception as e:
                logger.warning(f"Failed to parse log entry: {e}, skipping entry: {log_dict}")
                continue
        
        # Apply filters
        filtered_logs = log_entries
        if level:
            filtered_logs = [log for log in filtered_logs if log.level.upper() == level.upper()]
        if node_id:
            filtered_logs = [log for log in filtered_logs if log.node_id == node_id]
        
        # Sort by timestamp (newest first)
        filtered_logs.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Apply pagination
        total = len(filtered_logs)
        paginated_logs = filtered_logs[offset:offset + limit]
        
        logger.debug(f"Retrieved {len(paginated_logs)} logs for execution {execution_id} (total: {total})")
        
        return ExecutionLogsResponse(
            execution_id=execution_id,
            logs=paginated_logs,
            total=total,
            limit=limit,
            offset=offset
        )
    
    async def cancel_execution(self, execution_id: str, user_id: Optional[str] = None) -> ExecutionResponse:
        """
        Cancel a running execution
        
        Args:
            execution_id: Execution ID to cancel
            user_id: If provided, enforce ownership (C-2)
            
        Returns:
            ExecutionResponse with cancelled status
            
        Raises:
            ExecutionNotFoundError: If execution not found
            ExecutionForbiddenError: If user_id provided and user does not own execution
            ValueError: If execution is not in a cancellable state
        """
        execution = await self.repository.get_by_id(execution_id)
        if not execution:
            raise ExecutionNotFoundError(execution_id)
        if user_id is not None:
            self._check_execution_ownership(execution, user_id)
        
        # Check if execution is cancellable
        if execution.status not in [ExecutionStatus.PENDING, ExecutionStatus.RUNNING]:
            raise ValueError(f"Execution {execution_id} is not in a cancellable state (current status: {execution.status})")
        
        # Update execution status to cancelled
        execution.status = ExecutionStatus.CANCELLED
        execution.completed_at = datetime.now(timezone.utc)
        
        # Update state with cancellation log
        state_data = execution.state if execution.state else {}
        logs = state_data.get('logs', [])
        logs.append({
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'level': 'INFO',
            'node_id': None,
            'message': 'Execution cancelled by user'
        })
        state_data['status'] = ExecutionStatus.CANCELLED
        state_data['logs'] = logs
        execution.state = state_data
        
        await self.db.commit()
        await self.db.refresh(execution)
        
        logger.info(f"Cancelled execution {execution_id}")
        return self._db_to_response(execution)
