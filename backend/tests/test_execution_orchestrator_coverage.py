"""
Tests for execution_orchestrator coverage gaps.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.execution_orchestrator import ExecutionOrchestrator
from backend.models.schemas import ExecutionStatus, WorkflowDefinition
from backend.exceptions import WorkflowNotFoundError


@pytest.mark.asyncio
async def test_reconstruct_workflow_definition_general_exception(db_session: AsyncSession):
    """Test _reconstruct_workflow_definition with general exception (lines 209-214)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    # Create a workflow_db that will cause a general exception
    mock_workflow_db = MagicMock()
    mock_workflow_db.id = "test-workflow"
    mock_workflow_db.name = "Test"
    mock_workflow_db.description = "Test workflow"
    mock_workflow_db.definition = None  # This will cause an error
    
    with patch('backend.services.execution_orchestrator.reconstruct_workflow_definition') as mock_reconstruct:
        mock_reconstruct.side_effect = ValueError("Invalid workflow definition")
        
        with pytest.raises(HTTPException) as exc_info:
            await orchestrator._reconstruct_workflow_definition(mock_workflow_db)
        
        assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_create_execution_record_exception(db_session: AsyncSession):
    """Test create_execution_record with database exception (lines 289-291)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    # Mock db.add to raise an exception
    with patch.object(db_session, 'add', side_effect=Exception("Database error")):
        with pytest.raises(HTTPException) as exc_info:
            await orchestrator.create_execution_record(
                execution_id="test-exec",
                workflow_id="test-workflow",
                user_id="test-user"
            )
        
        assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_update_execution_status_not_found(db_session: AsyncSession):
    """Test update_execution_status when execution not found (lines 318-325)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    # Mock _get_execution_from_db to return None
    with patch.object(orchestrator, '_get_execution_from_db', return_value=None):
        # Should not raise exception, just log warning
        await orchestrator.update_execution_status(
            execution_id="non-existent",
            status=ExecutionStatus.COMPLETED
        )


@pytest.mark.asyncio
async def test_update_execution_status_exception(db_session: AsyncSession):
    """Test update_execution_status with exception (lines 324-325)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    # Mock AsyncSessionLocal to raise exception
    with patch('backend.services.execution_orchestrator.AsyncSessionLocal') as mock_session_local:
        mock_session_local.side_effect = Exception("Session error")
        
        # Should not raise exception, just log error
        await orchestrator.update_execution_status(
            execution_id="test-exec",
            status=ExecutionStatus.COMPLETED
        )


@pytest.mark.asyncio
async def test_update_execution_fields_with_none_values(db_session: AsyncSession):
    """Test _update_execution_fields with None values (line 345)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    mock_exec = MagicMock()
    mock_exec.id = "test-exec"
    
    # Test with None state and completed_at
    orchestrator._update_execution_fields(
        db_exec=mock_exec,
        status=ExecutionStatus.RUNNING,
        state=None,
        completed_at=None
    )
    
    assert mock_exec.status == ExecutionStatus.RUNNING.value
    # When completed_at is None, method doesn't set it (checks if not None)
    # Just verify status was set correctly


@pytest.mark.asyncio
async def test_update_execution_fields_with_completed_at(db_session: AsyncSession):
    """Test _update_execution_fields with completed_at (line 368)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    mock_exec = MagicMock()
    mock_exec.id = "test-exec"
    completed_time = datetime.utcnow()
    
    orchestrator._update_execution_fields(
        db_exec=mock_exec,
        status=ExecutionStatus.COMPLETED,
        state={"result": "success"},
        completed_at=completed_time
    )
    
    assert mock_exec.status == ExecutionStatus.COMPLETED.value
    assert mock_exec.state == {"result": "success"}
    assert mock_exec.completed_at == completed_time


@pytest.mark.asyncio
async def test_run_execution_in_background_exception(db_session: AsyncSession):
    """Test run_execution_in_background with exception (lines 398-401)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    mock_executor = AsyncMock()
    mock_executor.execution_id = "test-exec"
    mock_executor.execute = AsyncMock(side_effect=Exception("Execution failed"))
    
    with patch.object(orchestrator, 'update_execution_status', new_callable=AsyncMock) as mock_update:
        await orchestrator.run_execution_in_background(
            executor=mock_executor,
            execution_id="test-exec",
            inputs={}
        )
        
        # Should call _handle_execution_failure which calls update_execution_status
        assert mock_update.called


@pytest.mark.asyncio
async def test_handle_execution_failure(db_session: AsyncSession):
    """Test _handle_execution_failure (line 410)"""
    mock_settings_service = MagicMock()
    mock_workflow_service = MagicMock()
    
    orchestrator = ExecutionOrchestrator(db_session, mock_settings_service, mock_workflow_service)
    
    with patch.object(orchestrator, 'update_execution_status', new_callable=AsyncMock) as mock_update:
        await orchestrator._handle_execution_failure("test-exec")
        
        mock_update.assert_called_once()
        call_args = mock_update.call_args
        assert call_args[1]['execution_id'] == "test-exec"
        assert call_args[1]['status'] == ExecutionStatus.FAILED
        assert call_args[1]['completed_at'] is not None
