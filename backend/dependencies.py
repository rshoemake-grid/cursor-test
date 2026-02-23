"""
Dependency injection for FastAPI routes.
Provides services and repositories as dependencies.
"""
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .services.workflow_service import WorkflowService
from .services.execution_service import ExecutionService
from .services.settings_service import ISettingsService, SettingsService
from .services.llm_client_factory import ILLMClientFactory, LLMClientFactory
from .repositories.workflow_repository import WorkflowRepository
from .repositories.execution_repository import ExecutionRepository


# Database session dependency (already exists, re-exported for clarity)
DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


# Service dependencies
def get_workflow_service(db: DatabaseSession) -> WorkflowService:
    """Get workflow service instance"""
    return WorkflowService(db)


WorkflowServiceDep = Annotated[WorkflowService, Depends(get_workflow_service)]


def get_execution_service(db: DatabaseSession) -> ExecutionService:
    """Get execution service instance"""
    return ExecutionService(db)


ExecutionServiceDep = Annotated[ExecutionService, Depends(get_execution_service)]


def get_settings_service() -> ISettingsService:
    """Get settings service instance (uses global cache)"""
    return SettingsService()


SettingsServiceDep = Annotated[ISettingsService, Depends(get_settings_service)]


def get_llm_client_factory(
    settings_service: SettingsServiceDep
) -> ILLMClientFactory:
    """Get LLM client factory instance"""
    return LLMClientFactory(settings_service)


LLMClientFactoryDep = Annotated[ILLMClientFactory, Depends(get_llm_client_factory)]


# Repository dependencies (for direct repository access if needed)
def get_workflow_repository(db: DatabaseSession) -> WorkflowRepository:
    """Get workflow repository instance"""
    return WorkflowRepository(db)


def get_execution_repository(db: DatabaseSession) -> ExecutionRepository:
    """Get execution repository instance"""
    return ExecutionRepository(db)


WorkflowRepositoryDep = Annotated[WorkflowRepository, Depends(get_workflow_repository)]
ExecutionRepositoryDep = Annotated[ExecutionRepository, Depends(get_execution_repository)]

