"""
Tests for dependency injection.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from backend.dependencies import (
    get_workflow_service,
    get_workflow_repository,
    get_execution_repository
)
from backend.services.workflow_service import WorkflowService
from backend.repositories.workflow_repository import WorkflowRepository
from backend.repositories.execution_repository import ExecutionRepository


@pytest.mark.asyncio
async def test_get_workflow_service(db_session):
    """Test that workflow service dependency works"""
    service = get_workflow_service(db_session)
    assert isinstance(service, WorkflowService)
    assert service.db == db_session


@pytest.mark.asyncio
async def test_get_workflow_repository(db_session):
    """Test that workflow repository dependency works"""
    repo = get_workflow_repository(db_session)
    assert isinstance(repo, WorkflowRepository)
    assert repo.db == db_session


@pytest.mark.asyncio
async def test_get_execution_repository(db_session):
    """Test that execution repository dependency works"""
    repo = get_execution_repository(db_session)
    assert isinstance(repo, ExecutionRepository)
    assert repo.db == db_session

