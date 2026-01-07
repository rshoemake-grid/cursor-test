"""
API routes module - organizes routes into separate files for better maintainability.
"""
from .workflow_routes import router as workflow_router
from .execution_routes import router as execution_router

# Combine all routers
from fastapi import APIRouter

router = APIRouter()
router.include_router(workflow_router, tags=["workflows"])
router.include_router(execution_router, tags=["executions"])

__all__ = ["router"]

